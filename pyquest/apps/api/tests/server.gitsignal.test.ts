/**
 * `POST /submit` on a `git-signal` quest, against a real Postgres and a real Gitea.
 *
 * **The verifier resolves through Submit, not through a route of its own.** Which verifier runs is
 * a property of the quest and not of the URL the client picked, which is also what lets the button
 * say Submit on every quest. So the assertions here are about what Submit *records*, because
 * recording is the api's whole job in Phase 4: the engine decides, the api records.
 *
 * **Every outcome writes an `attempts` row — and a verifier that never ran writes none.** Those
 * are two different rules and both are tested below. A signal the history does not support is a
 * failure, and §3.5 keeps failures forever. Gitea being unconfigured or the repository being
 * missing is not the learner failing at anything, and a scar recorded for it would be a lie in
 * the one record the spec says is never edited.
 */

import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { medalDelta } from '@pyquest/engine';
import type { FastifyInstance } from 'fastify';
import { loadContentRoot } from '../src/content.ts';
import { gitea, type Gitea } from '../src/gitea.ts';
import { buildServer } from '../src/server.ts';
import { HAVE_DATABASE, useMigratedDatabase } from './support/database.ts';
import { HAVE_GITEA, useGiteaRepo } from './support/gitea.ts';
import { inject as authed, signIn } from './support/authed.ts';

/**
 * These tests drive a real Gitea container over HTTP — create a user, mint a token, push a
 * commit, clone it back — and vitest's default `testTimeout` is 5000ms, which was never enough.
 *
 * Measured per test on an idle machine, `checkout.test.ts`: 631ms, 1484ms, 1611ms, 2411ms,
 * 2829ms, 3177ms, 3319ms. The worst case spends two thirds of the default budget with nothing
 * else running, so under the parallel load of a full run they went over at 5437ms, 5553ms and
 * 6220ms. That is the same work taking the time it takes, not a race: every file passes its own
 * label to `useGiteaRepo` and gets its own account and repository.
 *
 * `useGiteaRepo` already gives its `beforeAll` 120 seconds. Somebody measured this setup and
 * budgeted for it — for the hook, and not for the tests it sets up. This finishes that thought.
 *
 * The ceiling is not a duration. A suite that passes in eighteen seconds still passes in
 * eighteen seconds; the number only decides when vitest gives up. Deliberately not `retry`,
 * which would hide a real failure the moment there is one.
 */
vi.setConfig({ testTimeout: 30_000, hookTimeout: 120_000 });


if (!HAVE_DATABASE) {
  throw new Error('no database: start the stack, or set TEST_DATABASE_URL');
}

/** The signed-in player these suites drive routes as. See `support/authed.ts`. */
let TOKEN: string;

const CONTENT = loadContentRoot(fileURLToPath(new URL('../../../..', import.meta.url)));

const ADA = '11111111-1111-1111-1111-111111111111';
const NOW = new Date('2026-08-25T09:00:00.000Z');

/** `a2-the-first-commit` is `git-signal: commit`; `a2-it-is-somewhere-else` is `git-signal: push`. */
const COMMIT_QUEST = 'a2-the-first-commit';
const PUSH_QUEST = 'a2-it-is-somewhere-else';

describe.skipIf(!HAVE_GITEA)('submitting a git-signal quest', () => {
  const scratch = useMigratedDatabase('gitsignal');
  const fixture = useGiteaRepo('servergit');

  let app: FastifyInstance;
  let client: Gitea;

  beforeAll(async () => {
    const { client: db } = scratch();
    await db.query(
      `INSERT INTO players (id, handle, display_name) VALUES ($1, 'ada', 'Ada')`,
      [ADA],
    );
    await db.query(`INSERT INTO player_roles (player_id, role) VALUES ($1, 'player')`, [ADA]);

    client = gitea({
      baseUrl: fixture().baseUrl,
      token: fixture().token,
      repos: new Map([['ada', { owner: fixture().owner, name: fixture().repo }]]),
      journalPath: 'journal.md',
    });

    app = buildServer({ content: CONTENT, db, clock: () => NOW, gitea: client });
    await app.ready();
    TOKEN = (await signIn(db, { id: ADA, handle: 'ada' })).token;
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(async () => {
    const { client: db } = scratch();
    await db.query('DELETE FROM attempts');
    await db.query('DELETE FROM quest_medals');
  });

  const submit = async (questId: string): Promise<ReturnType<FastifyInstance['inject']>> =>
    authed(app, TOKEN, {
      method: 'POST',
      url: `/api/players/${ADA}/quests/${questId}/submit`,
      payload: { type: 'git-signal' },
    });

  it('passes when the history carries the signal, and prices the medal from the engine', async () => {
    await fixture().commit('hello.py', 'print("hi")\n', 'the first commit');

    const response = await submit(COMMIT_QUEST);
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ state: 'passed' });

    const { client: db } = scratch();
    const attempts = await db.query(
      `SELECT passed, detail FROM attempts WHERE quest_id = $1`,
      [COMMIT_QUEST],
    );
    expect(attempts.rows).toHaveLength(1);
    expect((attempts.rows[0] as { passed: boolean }).passed).toBe(true);
    /** The sha the medal was granted against, so the record can be checked later (§3.5). */
    expect((attempts.rows[0] as { detail: { gitSignal: { sha: string } } }).detail.gitSignal.sha)
      .toMatch(/^[0-9a-f]{40}$/);

    const item = CONTENT.item(COMMIT_QUEST);
    const medals = await db.query(
      `SELECT medal, xp_awarded AS "xp" FROM quest_medals WHERE quest_id = $1`,
      [COMMIT_QUEST],
    );
    expect(medals.rows).toEqual([
      { medal: 'cleared', xp: medalDelta('quest', item?.dc ?? 0, [], 'cleared') },
    ]);
  });

  /**
   * The mutant this exists for: a verifier that fails and records nothing.
   *
   * A failed attempt is a scar §5.3 counts and the Boss screen renders, and §3.5 is why they are
   * never deleted — a record that only remembers successes teaches that failure is the thing you
   * hide. The medal check is the other half: a failure must not pay.
   */
  it('records a scar and pays nothing when the history does not carry the signal', async () => {
    const { client: db } = scratch();

    /*
     * The precondition, named rather than timed.
     *
     * This used to seed an attempt at `now()` and rely on the repository's commits being older —
     * a comparison between a Postgres clock and a git clock on another machine, which is the bug
     * this phase removed. The claim is now the sha itself: this quest has already been paid
     * against the tip, so the tip is not new evidence and nothing under it is either.
     */
    const head = await fixture().commit('claimed.py', 'print("claimed")\n', 'already paid for');
    await db.query(
      `INSERT INTO attempts (player_id, quest_id, passed, detail)
       VALUES ($1, $2, true, $3::jsonb)`,
      [
        ADA,
        PUSH_QUEST,
        JSON.stringify({ gitSignal: { signal: 'push', satisfied: true, reason: 'seeded', sha: head } }),
      ],
    );

    const response = await submit(PUSH_QUEST);
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ state: 'failed' });

    const attempts = await db.query(
      `SELECT passed FROM attempts WHERE quest_id = $1 ORDER BY id`,
      [PUSH_QUEST],
    );
    /* The seeded claim, then the scar this submission earned. Both kept — §3.5 deletes neither. */
    expect(attempts.rows).toEqual([{ passed: true }, { passed: false }]);

    const medals = await db.query(`SELECT 1 FROM quest_medals WHERE quest_id = $1`, [PUSH_QUEST]);
    expect(medals.rows).toHaveLength(0);
  });

  /**
   * "Commits since the last recorded attempt", end to end.
   *
   * The first Submit is paid for history that had not been claimed. The second, with nothing new
   * pushed, is not — otherwise a learner told to go and do something could take the medal by
   * pressing the button twice.
   */
  it('does not pass a second time on history it has already been shown', async () => {
    await fixture().commit('again.py', 'print("again")\n', 'more work');

    expect((await submit(PUSH_QUEST)).json()).toMatchObject({ state: 'passed' });
    expect((await submit(PUSH_QUEST)).json()).toMatchObject({ state: 'failed' });
  });

  /**
   * §5.10 pays the difference, once — and on a fresh quest the difference happens to equal
   * `dc * 2`, which is why the test above cannot tell `medalDelta` from that arithmetic. With
   * Ironman already held the delta is zero and `dc * 2` is not, so this is the case that can.
   * A zero payout reads as a brag rather than as a refusal, and that sentence is the UI's.   *
   * **`dc * 2` is the quest rate and only the quest rate.** §5.1 pays a boss `dc * 20`, and
   * `medalDelta` takes the kind precisely so nothing infers one from the other. Anybody reaching
   * for this reasoning while writing a boss test wants `dc * 20`.
   */
  it('pays the difference and not the price, when a better medal is already held', async () => {
    const { client: db } = scratch();
    await db.query(
      `INSERT INTO quest_medals (player_id, quest_id, medal, earned_at, xp_awarded)
       VALUES ($1, $2, 'ironman', $3::date, 0)`,
      [ADA, COMMIT_QUEST, '2026-08-24'],
    );
    await fixture().commit('third.py', 'print(3)\n', 'a third commit');

    expect((await submit(COMMIT_QUEST)).json()).toMatchObject({ state: 'passed' });

    const item = CONTENT.item(COMMIT_QUEST);
    const { rows } = await db.query(
      `SELECT xp_awarded AS "xp" FROM quest_medals WHERE quest_id = $1 AND medal = 'cleared'`,
      [COMMIT_QUEST],
    );
    expect(rows).toEqual([{ xp: medalDelta('quest', item?.dc ?? 0, ['ironman'], 'cleared') }]);
    expect((rows[0] as { xp: number }).xp).toBe(0);
  });

  it('refuses a body whose type disagrees with the quest', async () => {
    const response = await authed(app, TOKEN, {
      method: 'POST',
      url: `/api/players/${ADA}/quests/${COMMIT_QUEST}/submit`,
      payload: { type: 'hidden-tests', code: 'print(1)' },
    });
    expect(response.json()).toMatchObject({ code: 'verifier-failed' });
  });
});

describe.skipIf(!HAVE_GITEA)('submitting when the verifier cannot run at all', () => {
  const scratch = useMigratedDatabase('gitsignalunconfigured');
  let unconfigured: FastifyInstance;
  let unmapped: FastifyInstance;

  beforeAll(async () => {
    const { client: db } = scratch();
    await db.query(
      `INSERT INTO players (id, handle, display_name) VALUES ($1, 'ada', 'Ada')`,
      [ADA],
    );
    unconfigured = buildServer({ content: CONTENT, db, clock: () => NOW });
    /** Configured, but nobody has said which repository is Ada's. */
    unmapped = buildServer({
      content: CONTENT,
      db,
      clock: () => NOW,
      gitea: gitea({
        baseUrl: 'http://localhost:3080',
        token: 'irrelevant',
        repos: new Map(),
        journalPath: 'journal.md',
      }),
    });
    await unconfigured.ready();
    await unmapped.ready();
    /* Its own scratch database, so its own token — the one above belongs to another. */
    TOKEN = (await signIn(db, { id: ADA, handle: 'ada' })).token;
  }, 120_000);

  afterAll(async () => {
    await unconfigured?.close();
    await unmapped?.close();
  });

  beforeEach(async () => {
    await scratch().client.query('DELETE FROM attempts');
  });

  const noScar = async (): Promise<void> => {
    const { rows } = await scratch().client.query('SELECT 1 FROM attempts');
    expect(rows).toHaveLength(0);
  };

  it('refuses without Gitea, and records nothing — a verifier that never ran leaves no scar', async () => {
    const response = await authed(unconfigured, TOKEN, {
      method: 'POST',
      url: `/api/players/${ADA}/quests/${COMMIT_QUEST}/submit`,
      payload: { type: 'git-signal' },
    });
    expect(response.json()).toMatchObject({ code: 'internal' });
    await noScar();
  });

  it('refuses when no repository is configured for the player, and records nothing', async () => {
    const response = await authed(unmapped, TOKEN, {
      method: 'POST',
      url: `/api/players/${ADA}/quests/${COMMIT_QUEST}/submit`,
      payload: { type: 'git-signal' },
    });
    expect(response.json()).toMatchObject({ code: 'internal' });
    await noScar();
  });
});
