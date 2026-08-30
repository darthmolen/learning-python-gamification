/**
 * The api's half of the job handoff, and Phase 4's awarding.
 *
 * **Why a spool and not a database connection in the runner.** The plan requires `--network none`
 * at the runner container, which is the strongest form of §6.6: no interface to bind, no resolver
 * to ask. A container with no network cannot poll Postgres, so either the isolation weakens or the
 * handoff changes. The isolation is the part the plan spends a section defending, so this is the
 * part that moved. The queue is still `runner_jobs` — this process claims from it with
 * `FOR UPDATE SKIP LOCKED`, and the api remains the only thing holding a database connection.
 *
 * **The tests travel with the job, and the path travels in the row.** `runner_jobs.payload` carries
 * the submitted code, the quest id, the verifier type and the repository-relative path to the
 * tests, and never the tests themselves — a copy of them in Postgres would be content in the
 * database (§6.7) and stale the moment somebody edited the file. The source is read here, from the
 * content root the api already mounts, at the moment the job is dispatched.
 *
 * **Awarding is a sequence, and the order is the whole of it.**
 *
 * 1. Every outcome writes an `attempts` row. `failed`, `timed-out` and `killed` each produce one
 *    with `passed = false` and stop — no medal, no XP, no rung. Those rows are the scars §5.3
 *    counts and the Boss screen renders, and §3.5 is why they are never deleted: a record that
 *    only remembers successes teaches that failure is the thing you hide.
 * 2. On a pass, `medalDelta` is called and the number it returns is written. Not a number computed
 *    here — §5.10 prices the delta once, and an api that re-prices history reports a figure the
 *    player was never paid.
 * 3. Totals are never written. §5.10 prices once and totals are a `SUM`.
 */

import type { ApiErrorCode, JobResult, RunnerJobStatus } from '@pyquest/contract';
import { medalDelta } from '@pyquest/engine';
import { mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { playerProgress } from '@pyquest/db';
import type { ContentRoot } from './content.ts';
import {
  awardMedal,
  claimJob,
  finishJob,
  recordAttempt,
  type Writable,
} from './store.ts';

/** How long a worker may hold a job before another may take it. The plan's stuck-job guard. */
export const LEASE_SECONDS = 120;

/** The four directories, mirrored from `apps/runner/src/pyquest_runner/worker.py`. */
export class Spool {
  /** Declared, not a parameter property — see `ContentRootError` for why that matters here. */
  readonly root: string;

  constructor(root: string) {
    this.root = root;
  }

  get incoming(): string {
    return join(this.root, 'incoming');
  }

  get done(): string {
    return join(this.root, 'done');
  }

  /**
   * Where a `local-repo` submission's exported tree waits.
   *
   * One tar per job, written by `POST /submit` and removed once the verdict is recorded. A tar
   * rather than an unpacked tree: one file appears atomically, the runner unpacks it onto its own
   * tmpfs, and the learner's files never land on the disk the api writes to — which is the disk
   * fill §6.6's tmpfs exists to contain.
   */
  get repos(): string {
    return join(this.root, 'repos');
  }

  ensure(): void {
    for (const path of [
      this.incoming,
      join(this.root, 'running'),
      this.done,
      this.repos,
      join(this.root, 'work'),
    ]) {
      mkdirSync(path, { recursive: true });
    }
  }
}

/** The verdict shape the runner writes. Parsed defensively: it crosses a process boundary. */
interface RunnerVerdict {
  jobId: string;
  status: RunnerJobStatus;
  result: JobResult;
}

const VERDICT_STATUSES: ReadonlySet<string> = new Set(['passed', 'failed', 'timed-out', 'killed']);

function parseVerdict(raw: string): RunnerVerdict | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (typeof parsed !== 'object' || parsed === null) return undefined;
  const candidate = parsed as Record<string, unknown>;
  if (typeof candidate['jobId'] !== 'string') return undefined;
  if (typeof candidate['status'] !== 'string' || !VERDICT_STATUSES.has(candidate['status'])) {
    return undefined;
  }
  const result = candidate['result'];
  if (typeof result !== 'object' || result === null) return undefined;
  return {
    jobId: candidate['jobId'],
    status: candidate['status'] as RunnerJobStatus,
    result: result as JobResult,
  };
}

/** The error code that goes with each non-passing outcome. `passed` carries none. */
const ERROR_CODES: Record<RunnerJobStatus, ApiErrorCode | null> = {
  queued: null,
  claimed: null,
  passed: null,
  failed: 'verifier-failed',
  'timed-out': 'runner-timeout',
  killed: 'runner-killed',
};

/**
 * Hand one claimed job to the runner. Returns its id, or `undefined` when the queue was empty.
 *
 * A job whose quest has vanished from content — renamed, or the api restarted against a different
 * root — is finished as `killed` rather than left in the queue. A submission that can never be
 * answered is the failure an 11–14-year-old experiences as the button doing nothing, and the lease
 * would otherwise hand it round three workers before giving up silently.
 */
export async function dispatchOne(
  db: Writable,
  content: ContentRoot,
  spool: Spool,
  workerId = 'api',
): Promise<string | undefined> {
  const claimed = await claimJob(db, { workerId, leaseSeconds: LEASE_SECONDS });
  if (claimed === undefined) return undefined;

  const payload = claimed.payload as { tests?: unknown; code?: unknown; repoTar?: unknown };
  const item = content.item(claimed.questId);

  /**
   * A `local-repo` job carries a tree and no code; a `hidden-tests` job carries code and no tree.
   * Requiring both would refuse every repository submission before it ran, which is the failure a
   * learner experiences as the button doing nothing.
   */
  const repoTar = typeof payload.repoTar === 'string' ? payload.repoTar : undefined;
  const code = typeof payload.code === 'string' ? payload.code : undefined;

  if (
    item === undefined ||
    typeof payload.tests !== 'string' ||
    (code === undefined && repoTar === undefined)
  ) {
    await finishJob(db, {
      jobId: claimed.id,
      status: 'killed',
      result: null,
      errorCode: 'content-invalid',
      attemptId: null,
    });
    return claimed.id;
  }

  spool.ensure();
  const staging = join(spool.incoming, `.${claimed.id}.partial`);
  writeFileSync(
    staging,
    JSON.stringify({
      job_id: claimed.id,
      quest_id: claimed.questId,
      code: code ?? '',
      /** Read from git at dispatch time. The row held the path; the sandbox gets the source. */
      tests: content.read(payload.tests),
      ...(repoTar === undefined ? {} : { repo_tar: repoTar }),
    }),
    'utf8',
  );
  /** Renamed into place, so the runner can never claim a half-written file. */
  renameSync(staging, join(spool.incoming, `${claimed.id}.json`));

  return claimed.id;
}

/**
 * Record every verdict the runner has published. Returns how many it recorded.
 *
 * The verdict file is removed only after the database write, and that order is deliberate: a crash
 * between the two replays the verdict, and every write it makes is idempotent — `awardMedal` is a
 * primary-key conflict and `finishJob` sets the same row to the same values. A crash the other way
 * round would lose the answer entirely.
 */
export async function collectVerdicts(
  db: Writable,
  content: ContentRoot,
  spool: Spool,
  clock: () => Date = () => new Date(),
): Promise<number> {
  spool.ensure();
  let recorded = 0;

  for (const name of readdirSync(spool.done)) {
    if (!name.endsWith('.json')) continue;
    const path = join(spool.done, name);
    const verdict = parseVerdict(readFileSync(path, 'utf8'));
    if (verdict === undefined) {
      rmSync(path, { force: true });
      continue;
    }

    await record(db, content, spool, verdict, clock);
    rmSync(path, { force: true });
    recorded += 1;
  }

  return recorded;
}

async function record(
  db: Writable,
  content: ContentRoot,
  spool: Spool,
  verdict: RunnerVerdict,
  clock: () => Date,
): Promise<void> {
  const { rows } = await db.query(
    `SELECT player_id::text AS "playerId", quest_id AS "questId", payload FROM runner_jobs WHERE id = $1::bigint`,
    [verdict.jobId],
  );
  const owner = rows[0] as
    | { playerId: string; questId: string; payload: Record<string, unknown> }
    | undefined;
  if (owner === undefined) return;

  /**
   * A `local-repo` verdict records the commit it was graded against.
   *
   * §3.5 keeps attempts forever, and an attempt that says "passed" without saying what it passed
   * against is a record nobody can check — which is the same as no record. It is also the only
   * way to answer "which push earned this" a month later.
   */
  const sha = typeof owner.payload['sha'] === 'string' ? owner.payload['sha'] : undefined;
  const ref = typeof owner.payload['ref'] === 'string' ? owner.payload['ref'] : undefined;

  /** Step 1: every outcome writes an attempts row, not only a pass (§5.3, §3.5). */
  const attemptId = await recordAttempt(db, {
    playerId: owner.playerId,
    questId: owner.questId,
    passed: verdict.status === 'passed',
    detail: {
      runner: verdict.status,
      ...(verdict.result as unknown as Record<string, unknown>),
      ...(sha === undefined ? {} : { localRepo: { ref: ref ?? 'main', sha } }),
    },
  });

  /**
   * The exported tree goes as soon as the verdict is recorded, whatever the verdict was.
   *
   * Unconditional for the same reason the runner's workspace cleanup is: a tar left behind by a
   * *failing* job is the one holding a whole repository, and the spool is a volume the api shares.
   */
  const repoTar = owner.payload['repoTar'];
  if (typeof repoTar === 'string' && !repoTar.includes('..')) {
    rmSync(join(spool.root, repoTar), { force: true });
  }

  await finishJob(db, {
    jobId: verdict.jobId,
    status: verdict.status as 'passed' | 'failed' | 'timed-out' | 'killed',
    result: verdict.result,
    errorCode: ERROR_CODES[verdict.status],
    attemptId,
  });

  if (verdict.status !== 'passed') return;

  const item = content.item(owner.questId);
  if (item === undefined) return;

  /** Step 2: the engine prices it, and exactly that number is stored. */
  const progress = await playerProgress(db, owner.playerId);
  const held = progress.questMedals.filter((row) => row.questId === item.id).map((row) => row.medal);
  await awardMedal(db, {
    playerId: owner.playerId,
    questId: item.id,
    medal: 'cleared',
    earnedAt: clock().toISOString().split('T')[0] as string,
    xpAwarded: medalDelta(item.dc, held, 'cleared'),
  });
}

/**
 * One turn of the loop: hand out what is waiting, record what came back.
 *
 * Called on an interval from `main.ts` rather than run as a second process. There is one api, one
 * runner and two players; a job queue with its own daemon would be infrastructure this household
 * does not have a use for, and the lease already covers the case where this process dies holding a
 * claim.
 */
export async function pump(
  db: Writable,
  content: ContentRoot,
  spool: Spool,
  clock?: () => Date,
): Promise<{ dispatched: number; recorded: number }> {
  let dispatched = 0;
  while ((await dispatchOne(db, content, spool)) !== undefined) dispatched += 1;
  const recorded = await collectVerdicts(db, content, spool, clock);
  return { dispatched, recorded };
}
