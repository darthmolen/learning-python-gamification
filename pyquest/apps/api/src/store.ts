/**
 * Every statement the api sends to Postgres, in one file.
 *
 * **This is a deviation from the plan, and it is deliberate rather than convenient.** Phase 4
 * says "every write goes through the repository layer", but `packages/db`'s repository is
 * readers only — twelve functions, all `SELECT` — and that package belongs to the `db` track,
 * which this one may not edit. Writing the inserts in a handler was the alternative, and that is
 * how SQL ends up in eleven places. So the seam the plan asks for still exists; it lives here
 * until the `db` track adopts it, and the move is a file rename plus an import change because
 * nothing above this line knows a column name.
 *
 * What the plan's rule is actually protecting is unchanged and is enforced here: **the engine
 * decides, this file records.** Nothing below computes XP, an effective DC or a rung. `xpAwarded`
 * arrives from `medalDelta` and is written verbatim; `rung` arrives from `nextRung` and is
 * stored. A `SUM` over `quest_medals` is a read (§5.10 prices once and totals are derived) and a
 * cached total would be the second source of truth the db plan already refuses.
 *
 * Reads that already exist in `@pyquest/db` are called from there, not reimplemented here.
 */

import type { Medal } from '@pyquest/content';
import { RunnerJobSchema, type ApiErrorCode, type JobResult, type PlayerRole, type RunnerJob } from '@pyquest/contract';

/**
 * What this module needs of a database handle: a `query` that also reports how many rows it
 * touched.
 *
 * `Queryable` in `@pyquest/db` is reads-only and stops at `{ rows }`, which is all a `SELECT`
 * needs. Three writes below turn `rowCount` into a return value a caller acts on — "the medal was
 * already held", "there was no pending sign-off under that id" — and a structural type is how
 * this file states that without asking another track to widen theirs. `pg`'s `Client` and `Pool`
 * both satisfy it.
 */
export interface Writable {
  query(
    queryText: string,
    values?: unknown[],
  ): Promise<{ rows: unknown[]; rowCount?: number | null }>;
}

/**
 * `pg` returns `int8` as a string because the range does not fit a JavaScript number, and the
 * contract types every `bigserial` id as one. Every id below is selected `::text` for that
 * reason rather than reconfiguring the driver's parser globally.
 */
const JOB_COLUMNS = `id::text            AS "id",
       player_id::text     AS "playerId",
       quest_id            AS "questId",
       attempt_id::text    AS "attemptId",
       status              AS "status",
       payload             AS "payload",
       result              AS "result",
       error_code          AS "errorCode",
       to_char(created_at       AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "createdAt",
       to_char(claimed_at       AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "claimedAt",
       claimed_by          AS "claimedBy",
       to_char(lease_expires_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "leaseExpiresAt",
       attempts_made       AS "attemptsMade"`;

/**
 * The queue's retry ceiling, which is also `runner_jobs`' `attempts_made <= 3` CHECK.
 *
 * A job that kills its worker three times is not a job that a fourth attempt fixes; it is either
 * a bug here or a submission doing something the sandbox is right to refuse. Looping on it would
 * take every worker down in turn, which is worse for the learner than one job stuck at `claimed`.
 */
export const MAX_JOB_ATTEMPTS = 3;

/** The submitted code plus identifiers — never test content. See `0005-runner-jobs.sql`. */
export interface JobPayload {
  readonly [key: string]: unknown;
}

export async function enqueueJob(
  client: Writable,
  input: { playerId: string; questId: string; payload: JobPayload },
): Promise<string> {
  const { rows } = await client.query(
    `INSERT INTO runner_jobs (player_id, quest_id, status, payload)
     VALUES ($1, $2, 'queued', $3::jsonb)
     RETURNING id::text AS id`,
    [input.playerId, input.questId, JSON.stringify(input.payload)],
  );
  return (rows[0] as { id: string }).id;
}

export async function job(client: Writable, jobId: string): Promise<RunnerJob | undefined> {
  const { rows } = await client.query(
    `SELECT ${JOB_COLUMNS} FROM runner_jobs WHERE id = $1::bigint`,
    [jobId],
  );
  if (rows.length === 0) return undefined;
  return RunnerJobSchema.parse(rows[0]);
}

/**
 * Take the oldest job that is waiting, or one whose worker died.
 *
 * `FOR UPDATE SKIP LOCKED` is what makes a second worker safe, and it is here now rather than
 * later because retrofitting it means finding the day two workers ran the same submission twice.
 * The lease is the other half: a worker that died mid-job would otherwise park a submission
 * forever, which an 11–14-year-old experiences as "the button did nothing."
 *
 * `attempts_made` increments on every claim, including a reclaim, and the ceiling is what stops a
 * job that crashes workers from taking them all down one at a time.
 */
export async function claimJob(
  client: Writable,
  input: { workerId: string; leaseSeconds: number },
): Promise<RunnerJob | undefined> {
  const { rows } = await client.query(
    `UPDATE runner_jobs
        SET status           = 'claimed',
            claimed_at       = now(),
            claimed_by       = $1,
            lease_expires_at = now() + make_interval(secs => $2),
            attempts_made    = attempts_made + 1
      WHERE id = (
        SELECT id
          FROM runner_jobs
         WHERE attempts_made < $3
           AND (status = 'queued' OR (status = 'claimed' AND lease_expires_at < now()))
         ORDER BY created_at, id
           FOR UPDATE SKIP LOCKED
         LIMIT 1
      )
      RETURNING ${JOB_COLUMNS}`,
    [input.workerId, input.leaseSeconds, MAX_JOB_ATTEMPTS],
  );
  if (rows.length === 0) return undefined;
  return RunnerJobSchema.parse(rows[0]);
}

/**
 * The verdict, in the storage vocabulary.
 *
 * `status` is a `runner_jobs.status` value, not a `JobState`: the translation to `running` is on
 * the way out and belongs to the handler, and writing a client word into the column would put the
 * two vocabularies in one place, which is the confusion `endpoints.ts` and `progress.ts` were
 * split to prevent.
 */
export async function finishJob(
  client: Writable,
  input: {
    jobId: string;
    status: 'passed' | 'failed' | 'timed-out' | 'killed';
    result: JobResult | null;
    errorCode: ApiErrorCode | null;
    attemptId: string | null;
  },
): Promise<void> {
  await client.query(
    `UPDATE runner_jobs
        SET status     = $2,
            result     = $3::jsonb,
            error_code = $4,
            attempt_id = $5::bigint
      WHERE id = $1::bigint`,
    [
      input.jobId,
      input.status,
      input.result === null ? null : JSON.stringify(input.result),
      input.errorCode,
      input.attemptId,
    ],
  );
}

/* -------------------------------------------------------------------------------------------
 * Attempts — §5.3, §3.5
 * ----------------------------------------------------------------------------------------- */

/**
 * The shapes the api puts in `attempts.detail`, named so that two handlers cannot disagree about
 * the spelling of a key the sign-off queue then reads back out.
 *
 * A pending sign-off is an attempt awaiting one, rather than a table of its own: `attempts`
 * already records every submit, and `feature_progress-schema` shipped no signoffs table for this
 * track to write to. It is also the truer model — the attempt genuinely has not passed until
 * somebody presses the button.
 */
export const attemptDetail = {
  awaitingSignoff: (by: 'peer' | 'dm'): Record<string, unknown> => ({ awaitingSignoff: by }),
  /**
   * What the history said, and which commit it said it about.
   *
   * The sha is stored because §3.5 keeps attempts forever and an attempt that says "passed"
   * without saying what it passed against is a record nobody can check — which is the same as no
   * record. It is also what makes a wrongly-awarded medal findable a month later.
   */
  gitSignal: (
    signal: string,
    evidence: { satisfied: boolean; reason: string; sha: string | null },
  ): Record<string, unknown> => ({
    gitSignal: { signal, satisfied: evidence.satisfied, reason: evidence.reason, sha: evidence.sha },
  }),
  /** The commit the checkout was reset to, for the same reason. */
  localRepo: (evidence: { ref: string; sha: string }): Record<string, unknown> => ({
    localRepo: { ref: evidence.ref, sha: evidence.sha },
  }),
} as const;

/**
 * When this player last attempted this quest, or `undefined` if never.
 *
 * `git-signal` is "evidence since the last recorded attempt", and this is the last recorded
 * attempt. A quest with no attempts has no baseline, so anything in the history counts — which is
 * right: none of it has been claimed yet.
 */
export async function lastAttemptAt(
  client: Writable,
  playerId: string,
  questId: string,
): Promise<string | undefined> {
  const { rows } = await client.query(
    `SELECT to_char(attempted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "at"
       FROM attempts
      WHERE player_id = $1::uuid AND quest_id = $2
      ORDER BY attempted_at DESC, id DESC
      LIMIT 1`,
    [playerId, questId],
  );
  return (rows[0] as { at: string } | undefined)?.at;
}

/**
 * Every runner outcome writes one of these, not only a pass.
 *
 * `failed`, `timed-out` and `killed` each produce a row with `passed = false` and stop: no medal,
 * no XP, no rung. Those rows are the scars §5.3 counts and the Boss screen renders, and §3.5 is
 * why they are never deleted — a record that only remembers successes teaches that failure is the
 * thing you hide.
 */
export async function recordAttempt(
  client: Writable,
  input: {
    playerId: string;
    questId: string;
    passed: boolean;
    detail: Record<string, unknown> | null;
  },
): Promise<string> {
  const { rows } = await client.query(
    `INSERT INTO attempts (player_id, quest_id, passed, detail)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING id::text AS id`,
    [
      input.playerId,
      input.questId,
      input.passed,
      input.detail === null ? null : JSON.stringify(input.detail),
    ],
  );
  return (rows[0] as { id: string }).id;
}

/* -------------------------------------------------------------------------------------------
 * Medals and rungs — the engine decides, this records
 * ----------------------------------------------------------------------------------------- */

/**
 * Write the medal and the number the engine returned. `false` means it was already held.
 *
 * "Once" is the primary key's job, not a caller's: `ON CONFLICT DO NOTHING` means a double
 * submit, a retried job and a race all resolve to one row paying one price. `xpAwarded` is
 * `medalDelta`'s return value written verbatim — an api that recomputed it would be pricing
 * history, and history was priced at the moment it happened.
 */
export async function awardMedal(
  client: Writable,
  input: {
    playerId: string;
    questId: string;
    medal: Medal;
    earnedAt: string;
    xpAwarded: number;
  },
): Promise<boolean> {
  const { rowCount } = await client.query(
    `INSERT INTO quest_medals (player_id, quest_id, medal, earned_at, xp_awarded)
     VALUES ($1, $2, $3, $4::date, $5)
     ON CONFLICT (player_id, quest_id, medal) DO NOTHING`,
    [input.playerId, input.questId, input.medal, input.earnedAt, input.xpAwarded],
  );
  return (rowCount ?? 0) > 0;
}

/** Store the rung `nextRung` returned. The ladder is §5.4's arithmetic and lives in the engine. */
export async function recordReview(
  client: Writable,
  input: { playerId: string; conceptId: string; lastReviewedAt: string; rung: number },
): Promise<void> {
  await client.query(
    `INSERT INTO concept_reviews (player_id, concept_id, last_reviewed_at, rung)
     VALUES ($1, $2, $3::date, $4)
     ON CONFLICT (player_id, concept_id)
     DO UPDATE SET last_reviewed_at = EXCLUDED.last_reviewed_at, rung = EXCLUDED.rung`,
    [input.playerId, input.conceptId, input.lastReviewedAt, input.rung],
  );
}

/** Clear a §5.5 forced review once its concept has been drilled. */
export async function clearForcedReviews(
  client: Writable,
  input: { playerId: string; conceptId: string; upTo: string },
): Promise<void> {
  await client.query(
    `DELETE FROM forced_reviews WHERE player_id = $1 AND concept_id = $2 AND due_on <= $3::date`,
    [input.playerId, input.conceptId, input.upTo],
  );
}

/* -------------------------------------------------------------------------------------------
 * Roles and sign-offs — §5.11
 * ----------------------------------------------------------------------------------------- */

/** The roles a player holds. A role check, never a name check (§6.3). */
export async function playerRoles(client: Writable, playerId: string): Promise<PlayerRole[]> {
  const { rows } = await client.query(
    `SELECT role FROM player_roles WHERE player_id = $1::uuid ORDER BY role`,
    [playerId],
  );
  return (rows as { role: PlayerRole }[]).map((row) => row.role);
}

export interface PendingSignoffRow {
  readonly attemptId: string;
  readonly playerId: string;
  readonly questId: string;
  readonly by: 'peer' | 'dm';
  readonly submittedAt: string;
}

/**
 * The Console's queue: every attempt still waiting on a person, household-wide.
 *
 * Not filtered by caller, and that is §5.11 rather than laziness. Teach-back runs both
 * directions, so a queue narrowed to "sign-offs you can grant" would hide the parent's own
 * pending teach-back from the screen that exists to show it.
 */
export async function pendingSignoffs(client: Writable): Promise<PendingSignoffRow[]> {
  const { rows } = await client.query(
    `SELECT id::text        AS "attemptId",
            player_id::text AS "playerId",
            quest_id        AS "questId",
            detail->>'awaitingSignoff' AS "by",
            to_char(attempted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "submittedAt"
       FROM attempts
      WHERE detail ? 'awaitingSignoff'
      ORDER BY attempted_at, id`,
  );
  return rows as PendingSignoffRow[];
}

/**
 * Resolve one pending sign-off. `false` means there was nothing pending under that id.
 *
 * A grant flips `passed` to true and records who pressed the button. A denial leaves `passed`
 * false, which is correct rather than harsh: the attempt did not pass, and §3.5's whole argument
 * is that the record keeps the ones that did not.
 *
 * The `WHERE detail ? 'awaitingSignoff'` clause is what makes this idempotent — a second grant
 * matches nothing, so a double-clicked button cannot pay twice.
 */
export async function resolveSignoff(
  client: Writable,
  input: { attemptId: string; by: string; granted: boolean; note?: string },
): Promise<boolean> {
  const { rowCount } = await client.query(
    `UPDATE attempts
        SET passed = $2,
            detail = (detail - 'awaitingSignoff') || $3::jsonb
      WHERE id = $1::bigint
        AND detail ? 'awaitingSignoff'`,
    [
      input.attemptId,
      input.granted,
      JSON.stringify({
        signoff: {
          by: input.by,
          granted: input.granted,
          ...(input.note === undefined ? {} : { note: input.note }),
        },
      }),
    ],
  );
  return (rowCount ?? 0) > 0;
}

/** One pending sign-off by id, for the role and self-approval checks the api makes before granting. */
export async function pendingSignoff(
  client: Writable,
  attemptId: string,
): Promise<PendingSignoffRow | undefined> {
  return (await pendingSignoffs(client)).find((row) => row.attemptId === attemptId);
}
