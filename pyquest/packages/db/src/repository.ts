/**
 * The repository — thin functions returning the shapes `@pyquest/contract` declares.
 *
 * No business logic lives here. The engine owns that, and a rule the SQL knows but the engine
 * does not is a rule with two homes (§6.7). What these functions do is read rows and hand back
 * the contract's shapes: the mapping from `concept_id` to `conceptId`, from `date` to an ISO
 * calendar string, and nothing else.
 *
 * **Two conversions happen here rather than being left to the driver, and both are deliberate.**
 *
 * *Dates.* `pg` turns a `DATE` into a JavaScript `Date` at local midnight, which in any timezone
 * west of UTC is the previous day. The contract types `earnedAt`, `dueOn`, `lastReviewedAt` and
 * `sessionDate` as ISO calendar strings, so the cast to `text` happens in SQL where Postgres —
 * which knows the value is a calendar date and not an instant — does it exactly.
 *
 * *Instants.* `timestamptz::text` renders `2026-08-29 12:00:00+00`, which is not ISO 8601 and is
 * not what `z.string().datetime()` accepts. `to_char(... AT TIME ZONE 'UTC', ...)` is written out
 * so the narrowing is visible instead of being a surprise at the first failing parse.
 *
 * **Every row is parsed on the way out.** The criterion this satisfies is the database's half of
 * the check the engine already makes: a repository that hands the engine a malformed row defeats
 * the whole reason §6.7 keeps the engine pure. The parse is a boundary, not an assertion, so it
 * runs in production too — and `medal`, which deliberately carries no SQL CHECK because medal
 * names are content, is validated by exactly this and nothing else.
 */

import {
  AttemptSchema,
  BountySchema,
  CampaignSchema,
  ConceptReviewSchema,
  DatamineSchema,
  ForcedReviewSchema,
  JournalEntryRecordSchema,
  PlayerProgressSchema,
  PlayerSchema,
  QuestMedalRecordSchema,
  SessionSchema,
  type Attempt,
  type Bounty,
  type Campaign,
  type ConceptReview,
  type Datamine,
  type ForcedReview,
  type JournalEntryRecord,
  type Player,
  type PlayerProgress,
  type QuestMedalRecord,
  type Session,
} from '@pyquest/contract';
import type { ZodType } from 'zod';
import type { Queryable } from './migrate.ts';

/**
 * A row that came out of Postgres and did not match the shape the contract declares for it.
 *
 * Named rather than left as a raw `ZodError` because the interesting fact is *which table*, and a
 * stack trace full of zod internals does not say. The cause is chained, never swallowed.
 */
export class RowShapeError extends Error {
  constructor(
    readonly table: string,
    options: { cause: unknown },
  ) {
    super(`a ${table} row does not match its @pyquest/contract shape`, options);
    this.name = 'RowShapeError';
  }
}

function parseRows<T>(table: string, schema: ZodType<T>, rows: unknown[]): T[] {
  return rows.map((row) => {
    const result = schema.safeParse(row);
    if (!result.success) throw new RowShapeError(table, { cause: result.error });
    return result.data;
  });
}

/**
 * Render a `timestamptz` as an ISO 8601 instant in UTC.
 *
 * Takes a literal column reference written in this file and nothing else — there is no path from
 * a caller's input to this argument, which is why it can be interpolated.
 */
const instant = (column: string): string =>
  `to_char(${column} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;

/* -------------------------------------------------------------------------------------------
 * The three the engine reads
 * ----------------------------------------------------------------------------------------- */

export async function questMedals(client: Queryable, playerId: string): Promise<QuestMedalRecord[]> {
  const { rows } = await client.query(
    `SELECT player_id::text  AS "playerId",
            quest_id         AS "questId",
            medal            AS "medal",
            earned_at::text  AS "earnedAt",
            xp_awarded       AS "xpAwarded"
       FROM quest_medals
      WHERE player_id = $1
      ORDER BY earned_at, quest_id, medal`,
    [playerId],
  );
  return parseRows('quest_medals', QuestMedalRecordSchema, rows);
}

export async function conceptReviews(client: Queryable, playerId: string): Promise<ConceptReview[]> {
  const { rows } = await client.query(
    `SELECT player_id::text         AS "playerId",
            concept_id              AS "conceptId",
            last_reviewed_at::text  AS "lastReviewedAt",
            rung                    AS "rung"
       FROM concept_reviews
      WHERE player_id = $1
      ORDER BY concept_id`,
    [playerId],
  );
  return parseRows('concept_reviews', ConceptReviewSchema, rows);
}

export async function forcedReviews(client: Queryable, playerId: string): Promise<ForcedReview[]> {
  const { rows } = await client.query(
    `SELECT player_id::text AS "playerId",
            concept_id      AS "conceptId",
            due_on::text    AS "dueOn"
       FROM forced_reviews
      WHERE player_id = $1
      ORDER BY due_on, concept_id`,
    [playerId],
  );
  return parseRows('forced_reviews', ForcedReviewSchema, rows);
}

/**
 * The whole of what the API hands the engine alongside content and `now`.
 *
 * Parsed as a bundle as well as row by row, because `PlayerProgressSchema` refuses a mixed one —
 * every row must carry the named player's id. That is cheap to check here and expensive to find
 * later, on the row of the completion board where one player's medals appeared under another's
 * name.
 */
export async function playerProgress(client: Queryable, playerId: string): Promise<PlayerProgress> {
  const bundle = {
    playerId,
    questMedals: await questMedals(client, playerId),
    conceptReviews: await conceptReviews(client, playerId),
    forcedReviews: await forcedReviews(client, playerId),
  };

  const result = PlayerProgressSchema.safeParse(bundle);
  if (!result.success) throw new RowShapeError('player_progress', { cause: result.error });
  return result.data;
}

/* -------------------------------------------------------------------------------------------
 * The rest of the roster and the record
 * ----------------------------------------------------------------------------------------- */

/** Every player, with their roles folded in. `COALESCE` because a player with no role is legal. */
export async function players(client: Queryable): Promise<Player[]> {
  const { rows } = await client.query(
    `SELECT p.id::text        AS "id",
            p.handle::text    AS "handle",
            p.display_name    AS "displayName",
            COALESCE(
              ARRAY(SELECT r.role FROM player_roles r WHERE r.player_id = p.id ORDER BY r.role),
              '{}'
            )                 AS "roles",
            ${instant('p.created_at')} AS "createdAt"
       FROM players p
      ORDER BY p.handle`,
  );
  return parseRows('players', PlayerSchema, rows);
}

/**
 * Every attempt for one player, oldest first.
 *
 * Oldest first because scars are a sequence and §5.3 cares about the order of them — the shape of
 * a struggle is "failed, failed, passed", and reversing that tells the opposite story.
 */
export async function attempts(client: Queryable, playerId: string): Promise<Attempt[]> {
  const { rows } = await client.query(
    `SELECT id::text        AS "id",
            player_id::text AS "playerId",
            quest_id        AS "questId",
            passed          AS "passed",
            ${instant('attempted_at')} AS "attemptedAt",
            detail          AS "detail"
       FROM attempts
      WHERE player_id = $1
      ORDER BY attempted_at, id`,
    [playerId],
  );
  return parseRows('attempts', AttemptSchema, rows);
}

export async function datamines(client: Queryable, playerId: string): Promise<Datamine[]> {
  const { rows } = await client.query(
    `SELECT player_id::text AS "playerId",
            quest_id        AS "questId",
            ${instant('unlocked_at')} AS "unlockedAt",
            attempts_before AS "attemptsBefore",
            note            AS "note"
       FROM datamines
      WHERE player_id = $1
      ORDER BY unlocked_at, quest_id`,
    [playerId],
  );
  return parseRows('datamines', DatamineSchema, rows);
}

export async function journalEntries(
  client: Queryable,
  playerId: string,
): Promise<JournalEntryRecord[]> {
  const { rows } = await client.query(
    `SELECT player_id::text      AS "playerId",
            session_date::text   AS "sessionDate",
            commit_sha           AS "commitSha",
            xp_awarded           AS "xpAwarded"
       FROM journal_entries
      WHERE player_id = $1
      ORDER BY session_date`,
    [playerId],
  );
  return parseRows('journal_entries', JournalEntryRecordSchema, rows);
}

/** The household's sessions. Not player-scoped: §5.9's streak is the campaign's, not a player's. */
export async function sessions(client: Queryable): Promise<Session[]> {
  const { rows } = await client.query(
    `SELECT id::text            AS "id",
            scheduled_for::text AS "scheduledFor",
            attended            AS "attended",
            forgiven_by::text   AS "forgivenBy",
            note                AS "note"
       FROM sessions
      ORDER BY scheduled_for`,
  );
  return parseRows('sessions', SessionSchema, rows);
}

/** Bounties, newest first — §5.8's board reads top-down and the newest posting is the live one. */
export async function bounties(client: Queryable): Promise<Bounty[]> {
  const { rows } = await client.query(
    `SELECT id::text         AS "id",
            posted_by::text  AS "postedBy",
            claimed_by::text AS "claimedBy",
            title            AS "title",
            xp               AS "xp",
            state            AS "state",
            ${instant('posted_at')}  AS "postedAt",
            ${instant('claimed_at')} AS "claimedAt"
       FROM bounties
      ORDER BY posted_at DESC, id DESC`,
  );
  return parseRows('bounties', BountySchema, rows);
}

/**
 * The campaign's single row, or `undefined` before anyone has started one.
 *
 * It returns `startedOn` and stops. The current week is whole weeks between that date and a `now`
 * the caller supplies (§6.7), and nothing here derives, stores, or offers it — per
 * `docs/decisions/0002-weeks-are-road-markers.md` the number is a road marker and this table's
 * job is to hold the marker's origin.
 */
export async function campaign(client: Queryable): Promise<Campaign | undefined> {
  const { rows } = await client.query(
    `SELECT started_on::text AS "startedOn",
            ${instant('created_at')} AS "createdAt"
       FROM campaign
      WHERE id`,
  );
  if (rows.length === 0) return undefined;
  const [row] = parseRows('campaign', CampaignSchema, rows);
  return row;
}
