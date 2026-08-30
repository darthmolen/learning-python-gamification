/**
 * Every write the api makes, against a real Postgres.
 *
 * The plan forbids mocking the database, and these are the tests that would be worthless if it
 * were mocked: the queue's claim is a `FOR UPDATE SKIP LOCKED` statement whose correctness is
 * entirely Postgres's, the medal award is a primary-key conflict, and the lease is a comparison
 * against `now()`. A fake would pass all three while the real one did something else.
 *
 * Two of these are the failures an 11-14-year-old actually experiences. A worker that dies
 * mid-job parks a submission forever, which he reads as "the button did nothing"; a medal that
 * pays twice makes §5.10's "once" a comment rather than a rule.
 */

import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { RunnerJobSchema } from '@pyquest/contract';
import {
  attemptDetail,
  awardMedal,
  claimJob,
  enqueueJob,
  finishJob,
  job,
  pendingSignoffs,
  playerRoles,
  recordAttempt,
  recordReview,
  resolveSignoff,
} from '../src/store.ts';
import { HAVE_DATABASE, useMigratedDatabase, type Scratch } from './support/database.ts';

if (!HAVE_DATABASE) {
  throw new Error(
    'no database: set TEST_DATABASE_URL, or create infra/.env from infra/.env.example and start the stack',
  );
}

const scratch = useMigratedDatabase('store');

/** `runner_jobs.attempt_id` references `attempts`, so the queue clears first or the delete fails. */
async function clearAttempts(client: Scratch['client']): Promise<void> {
  await client.query('DELETE FROM runner_jobs');
  await client.query('DELETE FROM attempts');
}

const ADA = '11111111-1111-1111-1111-111111111111';
const GRACE = '22222222-2222-2222-2222-222222222222';

beforeAll(async () => {
  const { client } = scratch();
  await client.query(
    `INSERT INTO players (id, handle, display_name)
     VALUES ($1, 'ada', 'Ada'), ($2, 'grace', 'Grace')`,
    [ADA, GRACE],
  );
  await client.query(
    `INSERT INTO player_roles (player_id, role)
     VALUES ($1, 'player'), ($1, 'dm'), ($2, 'player')`,
    [ADA, GRACE],
  );
});

/* -------------------------------------------------------------------------------------------
 * The queue
 * ----------------------------------------------------------------------------------------- */

describe('the runner queue', () => {
  it('enqueues a job in the state a client sees as queued', async () => {
    const { client } = scratch();
    const id = await enqueueJob(client, {
      playerId: ADA,
      questId: 'a0-name-tag',
      payload: { verifier: 'hidden-tests', questId: 'a0-name-tag', tests: 'tests/x_test.py', code: 'print(1)' },
    });

    const row = await job(client, id);
    expect(row?.status).toBe('queued');
    expect(row?.attemptsMade).toBe(0);
    expect(RunnerJobSchema.safeParse(row).success).toBe(true);
  });

  it('claims the oldest queued job and stamps the worker on it', async () => {
    const { client } = scratch();
    await client.query('DELETE FROM runner_jobs');
    const first = await enqueueJob(client, { playerId: ADA, questId: 'a0-name-tag', payload: { n: 1 } });
    await enqueueJob(client, { playerId: ADA, questId: 'a0-name-tag', payload: { n: 2 } });

    const claimed = await claimJob(client, { workerId: 'worker-1', leaseSeconds: 60 });
    expect(claimed?.id).toBe(first);
    expect(claimed?.status).toBe('claimed');
    expect(claimed?.claimedBy).toBe('worker-1');
    expect(claimed?.leaseExpiresAt).not.toBeNull();
    expect(claimed?.attemptsMade).toBe(1);
  });

  it('hands back nothing when the queue is empty rather than blocking', async () => {
    const { client } = scratch();
    await client.query('DELETE FROM runner_jobs');
    expect(await claimJob(client, { workerId: 'worker-1', leaseSeconds: 60 })).toBeUndefined();
  });

  it('does not hand a live claim to a second worker', async () => {
    const { client } = scratch();
    await client.query('DELETE FROM runner_jobs');
    await enqueueJob(client, { playerId: ADA, questId: 'a0-name-tag', payload: {} });

    expect(await claimJob(client, { workerId: 'worker-1', leaseSeconds: 60 })).toBeDefined();
    expect(await claimJob(client, { workerId: 'worker-2', leaseSeconds: 60 })).toBeUndefined();
  });

  it('reclaims a job whose worker died, because a parked submission is the button doing nothing', async () => {
    const { client } = scratch();
    await client.query('DELETE FROM runner_jobs');
    const id = await enqueueJob(client, { playerId: ADA, questId: 'a0-name-tag', payload: {} });

    await claimJob(client, { workerId: 'worker-1', leaseSeconds: 60 });
    await client.query(`UPDATE runner_jobs SET lease_expires_at = now() - interval '1 minute'`);

    const reclaimed = await claimJob(client, { workerId: 'worker-2', leaseSeconds: 60 });
    expect(reclaimed?.id).toBe(id);
    expect(reclaimed?.claimedBy).toBe('worker-2');
    expect(reclaimed?.attemptsMade).toBe(2);
  });

  it('stops reclaiming after three tries rather than looping on a job that kills workers', async () => {
    const { client } = scratch();
    await client.query('DELETE FROM runner_jobs');
    await enqueueJob(client, { playerId: ADA, questId: 'a0-name-tag', payload: {} });

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      expect(await claimJob(client, { workerId: `worker-${attempt}`, leaseSeconds: 60 })).toBeDefined();
      await client.query(`UPDATE runner_jobs SET lease_expires_at = now() - interval '1 minute'`);
    }
    expect(await claimJob(client, { workerId: 'worker-4', leaseSeconds: 60 })).toBeUndefined();
  });

  it('records a verdict with its output and its error code', async () => {
    const { client } = scratch();
    await client.query('DELETE FROM runner_jobs');
    const id = await enqueueJob(client, { playerId: ADA, questId: 'a0-name-tag', payload: {} });
    await claimJob(client, { workerId: 'worker-1', leaseSeconds: 60 });

    const attemptId = await recordAttempt(client, {
      playerId: ADA,
      questId: 'a0-name-tag',
      passed: false,
      detail: { stderr: 'AssertionError' },
    });
    await finishJob(client, {
      jobId: id,
      status: 'failed',
      result: { passed: false, stdout: 'F', stderr: '', truncated: false, durationMs: 12 },
      errorCode: 'verifier-failed',
      attemptId,
    });

    const row = await job(client, id);
    expect(row?.status).toBe('failed');
    expect(row?.errorCode).toBe('verifier-failed');
    expect(row?.attemptId).toBe(attemptId);
    expect(row?.result).toMatchObject({ passed: false });
  });
});

/* -------------------------------------------------------------------------------------------
 * Attempts and medals — §5.3, §5.10
 * ----------------------------------------------------------------------------------------- */

describe('attempts and medals', () => {
  it('writes a scar that nothing deletes', async () => {
    const { client } = scratch();
    const id = await recordAttempt(client, {
      playerId: GRACE,
      questId: 'a0-name-tag',
      passed: false,
      detail: null,
    });
    const { rows } = await client.query('SELECT passed FROM attempts WHERE id = $1', [id]);
    expect(rows[0]).toEqual({ passed: false });
  });

  it('pays a medal once, and the second award changes nothing', async () => {
    const { client } = scratch();
    const award = {
      playerId: GRACE,
      questId: 'a0-the-type-lab',
      medal: 'cleared' as const,
      earnedAt: '2026-08-29',
      xpAwarded: 10,
    };
    expect(await awardMedal(client, award)).toBe(true);
    expect(await awardMedal(client, { ...award, xpAwarded: 999 })).toBe(false);

    const { rows } = await client.query(
      'SELECT xp_awarded FROM quest_medals WHERE player_id = $1 AND quest_id = $2 AND medal = $3',
      [award.playerId, award.questId, award.medal],
    );
    expect(rows).toEqual([{ xp_awarded: 10 }]);
  });

  it('stores a zero payout rather than refusing it, because at the DC floor a medal pays nothing', async () => {
    const { client } = scratch();
    expect(
      await awardMedal(client, {
        playerId: GRACE,
        questId: 'a0-the-perimeter',
        medal: 'conjured',
        earnedAt: '2026-08-29',
        xpAwarded: 0,
      }),
    ).toBe(true);
  });

  it('upserts a concept onto the rung the engine returned', async () => {
    const { client } = scratch();
    await recordReview(client, {
      playerId: ADA,
      conceptId: 'variables',
      lastReviewedAt: '2026-08-20',
      rung: 1,
    });
    await recordReview(client, {
      playerId: ADA,
      conceptId: 'variables',
      lastReviewedAt: '2026-08-29',
      rung: 2,
    });
    const { rows } = await client.query(
      'SELECT rung, last_reviewed_at::text AS d FROM concept_reviews WHERE player_id = $1 AND concept_id = $2',
      [ADA, 'variables'],
    );
    expect(rows).toEqual([{ rung: 2, d: '2026-08-29' }]);
  });
});

/* -------------------------------------------------------------------------------------------
 * Sign-offs — §6.3, §5.11
 * ----------------------------------------------------------------------------------------- */

describe('sign-offs', () => {
  it('reads the roles a player actually holds, rather than the one they claim', async () => {
    const { client } = scratch();
    expect((await playerRoles(client, ADA)).sort()).toEqual(['dm', 'player']);
    expect(await playerRoles(client, GRACE)).toEqual(['player']);
    expect(await playerRoles(client, randomUUID())).toEqual([]);
  });

  it('queues a submission awaiting sign-off, household-wide', async () => {
    const { client } = scratch();
    await clearAttempts(client);
    const attemptId = await recordAttempt(client, {
      playerId: ADA,
      questId: 'a0-first-light',
      passed: false,
      detail: attemptDetail.awaitingSignoff('peer'),
    });

    const queue = await pendingSignoffs(client);
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ attemptId, playerId: ADA, questId: 'a0-first-light', by: 'peer' });
  });

  it('leaves an ordinary failure out of the queue', async () => {
    const { client } = scratch();
    await clearAttempts(client);
    await recordAttempt(client, {
      playerId: ADA,
      questId: 'a0-name-tag',
      passed: false,
      detail: { stderr: 'AssertionError' },
    });
    expect(await pendingSignoffs(client)).toHaveLength(0);
  });

  it('turns a granted sign-off into a pass and takes it off the queue', async () => {
    const { client } = scratch();
    await clearAttempts(client);
    const attemptId = await recordAttempt(client, {
      playerId: ADA,
      questId: 'a0-first-light',
      passed: false,
      detail: attemptDetail.awaitingSignoff('peer'),
    });

    expect(await resolveSignoff(client, { attemptId, by: GRACE, granted: true })).toBe(true);
    expect(await pendingSignoffs(client)).toHaveLength(0);

    const { rows } = await client.query('SELECT passed FROM attempts WHERE id = $1', [attemptId]);
    expect(rows[0]).toEqual({ passed: true });
  });

  it('leaves a denied sign-off as the scar it is, and off the queue', async () => {
    const { client } = scratch();
    await clearAttempts(client);
    const attemptId = await recordAttempt(client, {
      playerId: ADA,
      questId: 'a0-first-light',
      passed: false,
      detail: attemptDetail.awaitingSignoff('peer'),
    });

    expect(await resolveSignoff(client, { attemptId, by: GRACE, granted: false })).toBe(true);
    expect(await pendingSignoffs(client)).toHaveLength(0);

    const { rows } = await client.query('SELECT passed FROM attempts WHERE id = $1', [attemptId]);
    expect(rows[0]).toEqual({ passed: false });
  });

  it('refuses to resolve the same sign-off twice', async () => {
    const { client } = scratch();
    await clearAttempts(client);
    const attemptId = await recordAttempt(client, {
      playerId: ADA,
      questId: 'a0-first-light',
      passed: false,
      detail: attemptDetail.awaitingSignoff('peer'),
    });
    expect(await resolveSignoff(client, { attemptId, by: GRACE, granted: true })).toBe(true);
    expect(await resolveSignoff(client, { attemptId, by: GRACE, granted: true })).toBe(false);
  });
});
