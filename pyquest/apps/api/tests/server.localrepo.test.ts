/**
 * `POST /submit` on a `local-repo` quest, against a real Postgres and a real Gitea.
 *
 * **`checkout.test.ts` proves the git half and proves nothing about this one.** It knows that
 * `syncCheckout` fetches and that `exportTree` writes a tar; it does not know whether Submit ever
 * calls either, what lands in `runner_jobs.payload`, or what the api does with the verdict that
 * comes back. Those are the seams a `local-repo` submission actually travels through, and until
 * this file existed each of them was a line of code nothing had ever run.
 *
 * **The runner is not here, deliberately** — same reasoning as `dispatcher.test.ts`. Its half of
 * the protocol is attacked in `apps/runner/tests/`, inside the container that supplies the limits.
 * The two halves meet at two files on disk, and this suite writes the one the runner writes.
 *
 * The sharp assertions are the three the plan names as mutants worth seeding: that Submit exports
 * *what was pushed* rather than the clone it already had, that a failing verdict still writes a
 * scar, and that a verifier which never ran writes none.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { medalDelta } from '@pyquest/engine';
import type { FastifyInstance } from 'fastify';
import { loadContentRoot } from '../src/content.ts';
import { Spool, collectVerdicts, dispatchOne } from '../src/dispatcher.ts';
import { gitea, type Gitea } from '../src/gitea.ts';
import { buildServer } from '../src/server.ts';
import { HAVE_DATABASE, useMigratedDatabase } from './support/database.ts';
import { HAVE_GITEA, useGiteaRepo } from './support/gitea.ts';

if (!HAVE_DATABASE) {
  throw new Error('no database: start the stack, or set TEST_DATABASE_URL');
}

const CONTENT = loadContentRoot(fileURLToPath(new URL('../../../../content', import.meta.url)));

const ADA = '11111111-1111-1111-1111-111111111111';
const NOW = new Date('2026-08-25T09:00:00.000Z');

/** Both `local-repo` quests in the campaign, and Area 2b's first is the one used throughout. */
const QUEST = 'a2-where-the-file-lives';

/** The row as Submit writes it. Read back rather than trusted, because it crosses the queue. */
interface QueuedRow {
  id: string;
  status: string;
  payload: {
    verifier?: string;
    tests?: string;
    repoTar?: string;
    ref?: string;
    sha?: string;
    code?: string;
  };
}

describe.skipIf(!HAVE_GITEA)('submitting a local-repo quest', () => {
  const scratch = useMigratedDatabase('localrepo');
  const fixture = useGiteaRepo('serverrepo');

  let app: FastifyInstance;
  let client: Gitea;
  let spool: Spool;
  let spoolRoot: string;
  let workspaceRoot: string;

  beforeAll(async () => {
    const { client: db } = scratch();
    await db.query(`INSERT INTO players (id, handle, display_name) VALUES ($1, 'ada', 'Ada')`, [
      ADA,
    ]);
    await db.query(`INSERT INTO player_roles (player_id, role) VALUES ($1, 'player')`, [ADA]);

    spoolRoot = mkdtempSync(join(tmpdir(), 'pyquest-lr-spool-'));
    workspaceRoot = mkdtempSync(join(tmpdir(), 'pyquest-lr-work-'));
    spool = new Spool(spoolRoot);
    spool.ensure();

    client = gitea({
      baseUrl: fixture().baseUrl,
      token: fixture().token,
      repos: new Map([['ada', { owner: fixture().owner, name: fixture().repo }]]),
      journalPath: 'journal.md',
    });

    app = buildServer({ content: CONTENT, db, clock: () => NOW, gitea: client, spool, workspaceRoot });
    await app.ready();
  }, 180_000);

  afterAll(async () => {
    await app?.close();
    rmSync(spoolRoot, { recursive: true, force: true });
    rmSync(workspaceRoot, { recursive: true, force: true });
  });

  beforeEach(async () => {
    const { client: db } = scratch();
    /** `runner_jobs.attempt_id` references `attempts`, so the queue is emptied first. */
    await db.query('DELETE FROM runner_jobs');
    await db.query('DELETE FROM attempts');
    await db.query('DELETE FROM quest_medals');
  });

  const submit = async (): Promise<ReturnType<FastifyInstance['inject']>> =>
    app.inject({
      method: 'POST',
      url: `/api/players/${ADA}/quests/${QUEST}/submit`,
      payload: { type: 'local-repo' },
    });

  const queued = async (): Promise<QueuedRow> => {
    const { rows } = await scratch().client.query(
      `SELECT id::text AS "id", status, payload FROM runner_jobs ORDER BY id DESC LIMIT 1`,
    );
    return rows[0] as QueuedRow;
  };

  /**
   * What the exported tar actually holds, by name and by content. `tar -t` and `tar -O` in one
   * pass, without needing tar on the host — the api runs on Windows and the DM's machine has no
   * guarantee of one.
   */
  const entriesIn = (tarPath: string): Map<string, string> => {
    const bytes = readFileSync(tarPath);
    const entries = new Map<string, string>();
    for (let offset = 0; offset + 512 <= bytes.length; offset += 512) {
      const header = bytes.subarray(offset, offset + 512);
      if (header.subarray(257, 262).toString('ascii') !== 'ustar') continue;
      const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
      const octal = header.subarray(124, 136).toString('ascii').replace(/\0.*$/, '').trim();
      const size = Number.parseInt(octal, 8);
      const bounded = Number.isNaN(size) ? 0 : size;
      if (name !== '' && !name.endsWith('/')) {
        entries.set(name, bytes.subarray(offset + 512, offset + 512 + bounded).toString('utf8'));
      }
      offset += Math.ceil(bounded / 512) * 512;
    }
    return entries;
  };

  const namesIn = (tarPath: string): string[] => [...entriesIn(tarPath).keys()];

  /**
   * One new file per push. Gitea's contents endpoint refuses a path that already exists, and a
   * suite that reused one would fail on its own bookkeeping rather than on anything it asserts.
   */
  let pushed = 0;
  const push = async (): Promise<{ sha: string; name: string }> => {
    pushed += 1;
    const name = `where-the-file-lives/step_${pushed}.py`;
    const sha = await fixture().commit(name, `print(${pushed})
`, `pushed step ${pushed}`);
    return { sha, name };
  };

  it('queues a job carrying the exported tree, the ref and the commit it was taken at', async () => {
    const sha = await fixture().commit(
      'where-the-file-lives/run_me.py',
      'print("I am running from a file.")\n',
      'the project directory',
    );

    const response = await submit();
    expect(response.statusCode).toBe(202);
    expect(response.json()).toMatchObject({ state: 'queued' });

    const row = await queued();
    expect(row.status).toBe('queued');
    expect(row.payload.verifier).toBe('local-repo');
    expect(row.payload.ref).toBe('main');
    /** The commit the medal will be granted against, recorded before anything runs (§3.5). */
    expect(row.payload.sha).toBe(sha);
    expect(row.payload.repoTar).toMatch(/^repos\/[0-9a-f-]{36}\.tar$/);
    expect(existsSync(join(spoolRoot, row.payload.repoTar as string))).toBe(true);
  });

  /**
   * §6.3 again, on the verifier that had no test for it: the row holds the *path* to the
   * specification and never the specification.
   *
   * A copy of the hidden tests in `runner_jobs.payload` would be content in Postgres — the mixing
   * §6.7 forbids outright — and it would also be stale the moment somebody edited the file in git.
   */
  it('stores the path to the tests and not one line of them (§6.3, §6.7)', async () => {
    await push();
    await submit();

    const row = await queued();
    expect(row.payload.tests).toBe('tests/a2-where-the-file-lives_test.py');
    const source = CONTENT.read('tests/a2-where-the-file-lives_test.py');
    expect(JSON.stringify(row.payload)).not.toContain('MIN_NOTES_CHARACTERS');
    expect(JSON.stringify(row.payload)).not.toContain(source.slice(0, 60));
  });

  /**
   * The mutant this exists for: a `local-repo` that exports the clone it already has.
   *
   * `checkout.test.ts` proves `syncCheckout` fetches. It cannot prove Submit calls it — a handler
   * that cloned once and exported the cached tree afterwards would pass that suite and grade last
   * week's work as though it were tonight's. §6.4's whole sentence is that pushing is what makes
   * it real, and a Submit that never fetches makes pushing optional.
   */
  it('exports what was pushed, not the checkout it already had (§6.4)', async () => {
    await push();
    await submit();
    const first = await queued();

    const { sha, name } = await push();
    await submit();
    const second = await queued();

    expect(second.payload.sha).toBe(sha);
    expect(second.payload.sha).not.toBe(first.payload.sha);
    expect(namesIn(join(spoolRoot, second.payload.repoTar as string))).toContain(name);
  });

  /**
   * A working tree is not evidence (§6.4), asserted on the bytes that reach the sandbox.
   *
   * The clone lives on the parent's machine and the parent has a shell. A file edited there — or
   * dropped there — and exported into the runner would be a medal for work that is on no server
   * anywhere, and neither the learner nor the parent would have any way to see it happen.
   *
   * **What this test can and cannot prove, established by seeding both mutants rather than by
   * reasoning about it.** Reading the file's *content* back out of the tar is the half that bites:
   * it dies against a checkout that does not fetch and against one that resets to the local branch
   * instead of to `origin/main`, because either leaves the tar without this push in it at all.
   *
   * The planted-file half proves less than it looks. `exportTree` runs `git archive <sha>`, which
   * reads the object database, so an untracked file cannot enter the tar however badly the
   * checkout is managed — and an export rewritten to archive the *index* survives this suite
   * untouched, because `syncCheckout` resets and cleans before the export runs and the two trees
   * are then identical. Checkout hygiene is `checkout.test.ts`'s to assert, and it does; this
   * assertion is a regression guard on the shape of the handoff, not a live filter. Recorded
   * rather than dressed up, because a test believed to be stronger than it is, is worse than one
   * known to be weak.
   */
  it('exports the pushed bytes, not the ones sitting in the api’s own checkout', async () => {
    const { name } = await push();
    const pushedBytes = `print(${name.replace(/\D+/g, '')})\n`;
    await submit();

    writeFileSync(join(workspaceRoot, 'ada', name), 'print("tampered")\n', 'utf8');
    writeFileSync(
      join(workspaceRoot, 'ada', 'where-the-file-lives', 'planted.py'),
      'print("planted")\n',
      'utf8',
    );
    await submit();

    const row = await queued();
    const entries = entriesIn(join(spoolRoot, row.payload.repoTar as string));
    expect(entries.get(name)).toBe(pushedBytes);
    expect([...entries.keys()]).not.toContain('where-the-file-lives/planted.py');
  });

  /**
   * The dispatcher's `local-repo` branch, which differs from `hidden-tests` in exactly one way
   * that matters: the job carries a tree and no code. A handler requiring both would refuse every
   * repository submission before it ran — the failure a learner experiences as the button doing
   * nothing.
   */
  it('hands the runner the tree and the tests’ source, and no solution file', async () => {
    await push();
    await submit();
    const row = await queued();

    const jobId = await dispatchOne(scratch().client, CONTENT, spool);
    expect(jobId).toBe(row.id);

    const written = readdirSync(spool.incoming).filter((name) => name.endsWith('.json'));
    expect(written).toEqual([`${row.id}.json`]);
    const handed = JSON.parse(readFileSync(join(spool.incoming, written[0] as string), 'utf8')) as {
      repo_tar?: string;
      tests: string;
      code: string;
    };
    expect(handed.repo_tar).toBe(row.payload.repoTar);
    expect(handed.tests).toContain('def test_the_project_directory_exists');
    /** No code was submitted, so nothing may appear pretending one was. */
    expect(handed.code).toBe('');
  });

  const publish = (jobId: string, status: string, passed: boolean): void => {
    writeFileSync(
      join(spool.done, `${jobId}.json`),
      JSON.stringify({
        jobId,
        status,
        result: { passed, stdout: 'out', stderr: '', truncated: false, durationMs: 12 },
      }),
      'utf8',
    );
  };

  it('records the commit it graded on the attempt, and pays exactly what the engine returned', async () => {
    await push();
    await submit();
    const row = await queued();
    await dispatchOne(scratch().client, CONTENT, spool);
    publish(row.id, 'passed', true);

    expect(await collectVerdicts(scratch().client, CONTENT, spool, () => NOW)).toBe(1);

    const { client: db } = scratch();
    const attempts = await db.query(`SELECT passed, detail FROM attempts WHERE quest_id = $1`, [
      QUEST,
    ]);
    expect(attempts.rows).toHaveLength(1);
    const attempt = attempts.rows[0] as {
      passed: boolean;
      detail: { localRepo?: { ref: string; sha: string } };
    };
    expect(attempt.passed).toBe(true);
    /** Which push earned this, answerable a month later — the point of keeping attempts (§3.5). */
    expect(attempt.detail.localRepo).toEqual({ ref: 'main', sha: row.payload.sha });

    const item = CONTENT.item(QUEST);
    const medals = await db.query(
      `SELECT medal, xp_awarded AS "xp" FROM quest_medals WHERE quest_id = $1`,
      [QUEST],
    );
    expect(medals.rows).toEqual([{ medal: 'cleared', xp: medalDelta('quest', item?.dc ?? 0, [], 'cleared') }]);
  });

  /**
   * §5.10 pays the difference, once — and on a fresh quest that difference happens to equal
   * `dc * 2`, which is why the test above cannot tell `medalDelta` from that arithmetic. With
   * Ironman already held the delta is zero and `dc * 2` is not.   *
   * **`dc * 2` is the quest rate and only the quest rate.** §5.1 pays a boss `dc * 20`, and
   * `medalDelta` takes the kind precisely so nothing infers one from the other. Anybody reaching
   * for this reasoning while writing a boss test wants `dc * 20`.
   */
  it('pays the difference and not the price, when a better medal is already held', async () => {
    const { client: db } = scratch();
    await db.query(
      `INSERT INTO quest_medals (player_id, quest_id, medal, earned_at, xp_awarded)
       VALUES ($1, $2, 'ironman', $3::date, 0)`,
      [ADA, QUEST, '2026-08-24'],
    );
    await push();
    await submit();
    const row = await queued();
    await dispatchOne(db, CONTENT, spool);
    publish(row.id, 'passed', true);
    await collectVerdicts(db, CONTENT, spool, () => NOW);

    const item = CONTENT.item(QUEST);
    const { rows } = await db.query(
      `SELECT xp_awarded AS "xp" FROM quest_medals WHERE quest_id = $1 AND medal = 'cleared'`,
      [QUEST],
    );
    expect(rows).toEqual([{ xp: medalDelta('quest', item?.dc ?? 0, ['ironman'], 'cleared') }]);
    expect((rows[0] as { xp: number }).xp).toBe(0);
  });

  /**
   * The mutant this exists for: a failing verifier that records nothing.
   *
   * A failed attempt is a scar §5.3 counts and the Boss screen renders, and §3.5 is why they are
   * never deleted — a record that only remembers successes teaches that failure is the thing you
   * hide. `killed` is here beside `failed` because running out of room is a different lesson and
   * must still leave a row.
   */
  it.each([
    ['failed', 'verifier-failed'],
    ['timed-out', 'runner-timeout'],
    ['killed', 'runner-killed'],
  ])('writes a scar for a %s local-repo job and pays nothing', async (status, code) => {
    await push();
    await submit();
    const row = await queued();
    await dispatchOne(scratch().client, CONTENT, spool);
    publish(row.id, status, false);
    await collectVerdicts(scratch().client, CONTENT, spool, () => NOW);

    const { client: db } = scratch();
    const attempts = await db.query(
      `SELECT passed, detail FROM attempts WHERE quest_id = $1`,
      [QUEST],
    );
    expect(attempts.rows).toHaveLength(1);
    const attempt = attempts.rows[0] as {
      passed: boolean;
      detail: { runner: string; localRepo?: { sha: string } };
    };
    expect(attempt.passed).toBe(false);
    expect(attempt.detail.runner).toBe(status);
    /** The scar names the commit too, or "which push failed" is unanswerable. */
    expect(attempt.detail.localRepo?.sha).toBe(row.payload.sha);

    const job = await db.query(`SELECT error_code AS "code" FROM runner_jobs WHERE id = $1::bigint`, [
      row.id,
    ]);
    expect((job.rows[0] as { code: string }).code).toBe(code);

    const medals = await db.query(`SELECT 1 FROM quest_medals WHERE quest_id = $1`, [QUEST]);
    expect(medals.rows).toHaveLength(0);
  });

  /**
   * The tar goes whatever the verdict was, and the failing case is the one that matters.
   *
   * A tar left behind by a *failing* job is the one holding a whole repository, and the spool is
   * a volume the api shares — so keeping them is the disk fill §6.6's tmpfs exists to contain,
   * one directory further out.
   */
  it.each(['passed', 'failed'])('removes the exported tree once a %s verdict is recorded', async (status) => {
    await push();
    await submit();
    const row = await queued();
    const tar = join(spoolRoot, row.payload.repoTar as string);
    expect(existsSync(tar)).toBe(true);

    await dispatchOne(scratch().client, CONTENT, spool);
    publish(row.id, status, status === 'passed');
    await collectVerdicts(scratch().client, CONTENT, spool, () => NOW);

    expect(existsSync(tar)).toBe(false);
  });

  it('refuses a body whose type disagrees with the quest, and queues nothing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/players/${ADA}/quests/${QUEST}/submit`,
      payload: { type: 'hidden-tests', code: 'print(1)' },
    });
    expect(response.json()).toMatchObject({ code: 'verifier-failed' });
    const { rows } = await scratch().client.query('SELECT 1 FROM runner_jobs');
    expect(rows).toHaveLength(0);
  });

  /**
   * A ref that is not on the server is the api failing to check out, not the learner failing a
   * test. It must not become a scar, and it must not leave a tar behind either.
   */
  it('refuses a ref the server does not have, and records nothing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/players/${ADA}/quests/${QUEST}/submit`,
      payload: { type: 'local-repo', ref: 'no-such-branch' },
    });
    expect(response.json()).toMatchObject({ code: 'internal' });

    const { client: db } = scratch();
    expect((await db.query('SELECT 1 FROM attempts')).rows).toHaveLength(0);
    expect((await db.query('SELECT 1 FROM runner_jobs')).rows).toHaveLength(0);
  });

  /**
   * The token is on a command line here and nowhere else in the api. `git` echoes the remote back
   * in most of what it says, so an error that reached the client would hand a working credential
   * to anyone on the LAN — and the response body is the one place it would be most visible.
   */
  it('never puts the token in the error it sends back', async () => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/players/${ADA}/quests/${QUEST}/submit`,
      payload: { type: 'local-repo', ref: 'no-such-branch' },
    });
    expect(response.body).not.toContain(fixture().token);
  });
});

/**
 * A verifier that never ran leaves no scar, and there are three ways for it not to run.
 *
 * Gitea unconfigured, the player's repository unmapped, and the api having nowhere to put the
 * export are all the parent's problem rather than the learner's. Recording an attempt for any of
 * them would be a lie in the one record §3.5 says is never edited — and the learner would be
 * looking at a failure for work he did correctly.
 */
describe.skipIf(!HAVE_DATABASE)('a local-repo submission the api cannot even attempt', () => {
  const scratch = useMigratedDatabase('localrepounconfigured');
  let unconfigured: FastifyInstance;
  let unmapped: FastifyInstance;
  let unspooled: FastifyInstance;
  let workspaceRoot: string;

  beforeAll(async () => {
    const { client: db } = scratch();
    await db.query(`INSERT INTO players (id, handle, display_name) VALUES ($1, 'ada', 'Ada')`, [
      ADA,
    ]);
    workspaceRoot = mkdtempSync(join(tmpdir(), 'pyquest-lr-none-'));

    const configured = gitea({
      baseUrl: 'http://localhost:3080',
      token: 'irrelevant',
      repos: new Map(),
      journalPath: 'journal.md',
    });

    unconfigured = buildServer({ content: CONTENT, db, clock: () => NOW });
    unmapped = buildServer({ content: CONTENT, db, clock: () => NOW, gitea: configured, workspaceRoot });
    /** Configured and mapped, but the api has no spool — so there is nowhere to put the export. */
    unspooled = buildServer({
      content: CONTENT,
      db,
      clock: () => NOW,
      gitea: gitea({
        baseUrl: 'http://localhost:3080',
        token: 'irrelevant',
        repos: new Map([['ada', { owner: 'nobody', name: 'nothing' }]]),
        journalPath: 'journal.md',
      }),
    });
    await Promise.all([unconfigured.ready(), unmapped.ready(), unspooled.ready()]);
  }, 60_000);

  afterAll(async () => {
    await unconfigured?.close();
    await unmapped?.close();
    await unspooled?.close();
    rmSync(workspaceRoot, { recursive: true, force: true });
  });

  beforeEach(async () => {
    await scratch().client.query('DELETE FROM runner_jobs');
    await scratch().client.query('DELETE FROM attempts');
  });

  const refused = async (app: FastifyInstance): Promise<void> => {
    const response = await app.inject({
      method: 'POST',
      url: `/api/players/${ADA}/quests/${QUEST}/submit`,
      payload: { type: 'local-repo' },
    });
    expect(response.json()).toMatchObject({ code: 'internal' });
    const { client: db } = scratch();
    expect((await db.query('SELECT 1 FROM attempts')).rows).toHaveLength(0);
    expect((await db.query('SELECT 1 FROM runner_jobs')).rows).toHaveLength(0);
  };

  it('refuses without Gitea at all', async () => {
    await refused(unconfigured);
  });

  it('refuses when no repository is configured for the player', async () => {
    await refused(unmapped);
  });

  it('refuses when the api has nowhere to put the exported tree', async () => {
    await refused(unspooled);
  });
});

/** `git` has to be on the path for any of this to work, and a missing one must say so. */
describe('the api’s own prerequisites', () => {
  it('has git, which local-repo shells out to', () => {
    expect(execFileSync('git', ['--version'], { encoding: 'utf8' })).toContain('git version');
  });
});
