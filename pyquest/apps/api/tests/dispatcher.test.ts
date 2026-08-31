/**
 * The api's half of the handoff, and Phase 4's awarding sequence.
 *
 * Real Postgres, real content root, real files on disk. What is *not* here is the runner: its half
 * of the same protocol is attacked in `apps/runner/tests/`, inside the container that supplies the
 * limits, and running it from here would test a boundary that is not the one production uses. So
 * this suite writes the verdict file the runner writes and asserts on what the api does with it —
 * the two halves meet at a JSON file whose shape both suites pin.
 *
 * The sharpest assertions are the ones about what happens when a job does *not* pass. A record
 * that only remembers successes teaches that failure is the thing you hide (§3.5), so every
 * outcome writes a row and only one of them pays.
 */

import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { medalDelta } from '@pyquest/engine';
import { loadContentRoot } from '../src/content.ts';
import { Spool, collectVerdicts, dispatchOne, pump } from '../src/dispatcher.ts';
import { enqueueJob, job as readJob } from '../src/store.ts';
import { HAVE_DATABASE, useMigratedDatabase } from './support/database.ts';

if (!HAVE_DATABASE) throw new Error('no database: start the stack, or set TEST_DATABASE_URL');

const CONTENT = loadContentRoot(fileURLToPath(new URL('../../../..', import.meta.url)));
const ADA = '11111111-1111-1111-1111-111111111111';
const NOW = new Date('2026-08-25T09:00:00.000Z');

const scratch = useMigratedDatabase('dispatcher');
let spool: Spool;
let spoolRoot: string;

beforeAll(async () => {
  await scratch().client.query(
    `INSERT INTO players (id, handle, display_name) VALUES ($1, 'ada', 'Ada')`,
    [ADA],
  );
});

beforeEach(async () => {
  const { client } = scratch();
  await client.query('DELETE FROM runner_jobs');
  await client.query('DELETE FROM attempts');
  await client.query('DELETE FROM quest_medals');
  spoolRoot = mkdtempSync(join(tmpdir(), 'pyquest-spool-'));
  spool = new Spool(spoolRoot);
  spool.ensure();
});

afterAll(() => {
  rmSync(spoolRoot, { recursive: true, force: true });
});

async function queueOne(questId = 'a0-name-tag', code = 'print("hi")'): Promise<string> {
  const item = CONTENT.item(questId);
  const tests = item?.verifier.type === 'hidden-tests' ? item.verifier.tests : 'tests/none.py';
  return enqueueJob(scratch().client, {
    playerId: ADA,
    questId,
    payload: { verifier: 'hidden-tests', questId, tests, code },
  });
}

function publishVerdict(jobId: string, status: string, passed: boolean): void {
  spool.ensure();
  writeFileSync(
    join(spool.done, `${jobId}.json`),
    JSON.stringify({
      jobId,
      status,
      result: { passed, stdout: 'out', stderr: '', truncated: false, durationMs: 42 },
    }),
    'utf8',
  );
}

/* -------------------------------------------------------------------------------------------
 * Dispatch
 * ----------------------------------------------------------------------------------------- */

describe('dispatch', () => {
  it('hands nothing over when the queue is empty', async () => {
    expect(await dispatchOne(scratch().client, CONTENT, spool)).toBeUndefined();
  });

  it('writes the job with the tests’ source, which the row only held a path to', async () => {
    const jobId = await queueOne();
    expect(await dispatchOne(scratch().client, CONTENT, spool)).toBe(jobId);

    const written = JSON.parse(readFileSync(join(spool.incoming, `${jobId}.json`), 'utf8'));
    expect(written).toMatchObject({ job_id: jobId, quest_id: 'a0-name-tag', code: 'print("hi")' });
    /** The source, read from git at dispatch time — never a copy that was sitting in Postgres. */
    expect(written.tests).toContain('_run_with_input');
  });

  it('leaves nothing half-written for the runner to claim', async () => {
    await queueOne();
    await dispatchOne(scratch().client, CONTENT, spool);
    expect(readdirSync(spool.incoming).filter((name) => name.startsWith('.'))).toEqual([]);
  });

  it('marks the job claimed, so a second dispatcher does not run it twice', async () => {
    const jobId = await queueOne();
    await dispatchOne(scratch().client, CONTENT, spool);
    expect((await readJob(scratch().client, jobId))?.status).toBe('claimed');
    expect(await dispatchOne(scratch().client, CONTENT, spool)).toBeUndefined();
  });

  it('kills a job whose quest is no longer in content rather than parking it forever', async () => {
    const jobId = await enqueueJob(scratch().client, {
      playerId: ADA,
      questId: 'a0-renamed-away',
      payload: { verifier: 'hidden-tests', questId: 'a0-renamed-away', tests: 'x.py', code: 'x' },
    });
    await dispatchOne(scratch().client, CONTENT, spool);

    const row = await readJob(scratch().client, jobId);
    expect(row?.status).toBe('killed');
    expect(row?.errorCode).toBe('content-invalid');
    expect(readdirSync(spool.incoming)).toEqual([]);
  });
});

/* -------------------------------------------------------------------------------------------
 * Awarding — Phase 4's sequence
 * ----------------------------------------------------------------------------------------- */

describe('recording a verdict', () => {
  it('writes an attempts row and pays exactly what the engine returned', async () => {
    const { client } = scratch();
    const jobId = await queueOne();
    await dispatchOne(client, CONTENT, spool);
    publishVerdict(jobId, 'passed', true);

    expect(await collectVerdicts(client, CONTENT, spool, () => NOW)).toBe(1);

    const quest = CONTENT.item('a0-name-tag');
    const { rows } = await client.query('SELECT medal, xp_awarded, earned_at::text AS d FROM quest_medals');
    expect(rows).toEqual([
      { medal: 'cleared', xp_awarded: medalDelta('quest', quest?.dc ?? 0, [], 'cleared'), d: '2026-08-25' },
    ]);

    const attempts = await client.query('SELECT passed FROM attempts');
    expect(attempts.rows).toEqual([{ passed: true }]);
  });

  it('pays the delta and not the base price, when a medal is already held', async () => {
    /**
     * The test that makes "the engine decides" checkable.
     *
     * On a fresh **quest** `medalDelta('quest', dc, [], 'cleared')` is exactly `dc * 2`, so a
     * dispatcher that priced the medal itself passed every assertion in this file — a mutant
     * survived on that arithmetic and this is the fix. With Ironman already held the two answers
     * separate: §5.10 pays the *difference* between two totals, and the difference here is
     * nothing. A zero payout is legal and reads as a brag; `dc * 2` would be paying for the quest
     * twice.
     *
     * **`dc * 2` is the quest rate and only the quest rate.** §5.1 pays a boss `dc * 20`, and
     * `medalDelta` takes the kind precisely so nothing infers one from the other. Anybody
     * reaching for this reasoning while writing a boss test wants `dc * 20`.
     */
    const { client } = scratch();
    const quest = CONTENT.item('a0-name-tag');
    await client.query(
      `INSERT INTO quest_medals (player_id, quest_id, medal, earned_at, xp_awarded)
       VALUES ($1, 'a0-name-tag', 'ironman', '2026-08-20', 20)`,
      [ADA],
    );

    const jobId = await queueOne();
    await dispatchOne(client, CONTENT, spool);
    publishVerdict(jobId, 'passed', true);
    await collectVerdicts(client, CONTENT, spool, () => NOW);

    const expected = medalDelta('quest', quest?.dc ?? 0, ['ironman'], 'cleared');
    expect(expected).not.toBe((quest?.dc ?? 0) * 2);

    const { rows } = await client.query(
      `SELECT xp_awarded FROM quest_medals WHERE medal = 'cleared'`,
    );
    expect(rows).toEqual([{ xp_awarded: expected }]);
  });

  it('links the attempt to the job, so a scar can be traced to what produced it', async () => {
    const { client } = scratch();
    const jobId = await queueOne();
    await dispatchOne(client, CONTENT, spool);
    publishVerdict(jobId, 'passed', true);
    await collectVerdicts(client, CONTENT, spool, () => NOW);

    const row = await readJob(client, jobId);
    expect(row?.status).toBe('passed');
    expect(row?.attemptId).not.toBeNull();
  });

  it.each([
    ['failed', 'verifier-failed'],
    ['timed-out', 'runner-timeout'],
    ['killed', 'runner-killed'],
  ])('writes a scar for a %s job and pays nothing', async (status, errorCode) => {
    const { client } = scratch();
    const jobId = await queueOne();
    await dispatchOne(client, CONTENT, spool);
    publishVerdict(jobId, status, false);
    await collectVerdicts(client, CONTENT, spool, () => NOW);

    const attempts = await client.query('SELECT passed FROM attempts');
    expect(attempts.rows).toEqual([{ passed: false }]);
    expect((await client.query('SELECT * FROM quest_medals')).rows).toEqual([]);

    const row = await readJob(client, jobId);
    expect(row?.status).toBe(status);
    expect(row?.errorCode).toBe(errorCode);
  });

  it('keeps killed apart from failed all the way into the row', async () => {
    const { client } = scratch();
    const jobId = await queueOne();
    await dispatchOne(client, CONTENT, spool);
    publishVerdict(jobId, 'killed', false);
    await collectVerdicts(client, CONTENT, spool, () => NOW);
    expect((await readJob(client, jobId))?.status).toBe('killed');
  });

  it('pays once when the same verdict arrives twice', async () => {
    const { client } = scratch();
    const jobId = await queueOne();
    await dispatchOne(client, CONTENT, spool);

    publishVerdict(jobId, 'passed', true);
    await collectVerdicts(client, CONTENT, spool, () => NOW);
    publishVerdict(jobId, 'passed', true);
    await collectVerdicts(client, CONTENT, spool, () => NOW);

    const quest = CONTENT.item('a0-name-tag');
    const { rows } = await client.query('SELECT xp_awarded FROM quest_medals');
    expect(rows).toEqual([{ xp_awarded: medalDelta('quest', quest?.dc ?? 0, [], 'cleared') }]);
  });

  it('discards a verdict file it cannot parse rather than stalling on it', async () => {
    const { client } = scratch();
    spool.ensure();
    writeFileSync(join(spool.done, '404.json'), '{not json', 'utf8');
    expect(await collectVerdicts(client, CONTENT, spool, () => NOW)).toBe(0);
    expect(readdirSync(spool.done)).toEqual([]);
  });

  it('removes the verdict only after it is recorded', async () => {
    const { client } = scratch();
    const jobId = await queueOne();
    await dispatchOne(client, CONTENT, spool);
    publishVerdict(jobId, 'failed', false);
    await collectVerdicts(client, CONTENT, spool, () => NOW);
    expect(readdirSync(spool.done)).toEqual([]);
  });

  it('pumps both directions in one turn', async () => {
    const { client } = scratch();
    const jobId = await queueOne();
    const first = await pump(client, CONTENT, spool, () => NOW);
    expect(first).toEqual({ dispatched: 1, recorded: 0 });

    publishVerdict(jobId, 'passed', true);
    const second = await pump(client, CONTENT, spool, () => NOW);
    expect(second).toEqual({ dispatched: 0, recorded: 1 });
  });
});
