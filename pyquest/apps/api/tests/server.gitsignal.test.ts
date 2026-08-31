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
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { medalDelta } from '@pyquest/engine';
import type { FastifyInstance } from 'fastify';
import { loadContentRoot } from '../src/content.ts';
import { gitea, type Gitea } from '../src/gitea.ts';
import { buildServer } from '../src/server.ts';
import { HAVE_DATABASE, useMigratedDatabase } from './support/database.ts';
import { HAVE_GITEA, useGiteaRepo } from './support/gitea.ts';

if (!HAVE_DATABASE) {
  throw new Error('no database: start the stack, or set TEST_DATABASE_URL');
}

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
    app.inject({
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
    /** An attempt a moment ago, so nothing already in the repository counts as new evidence. */
    await db.query(
      `INSERT INTO attempts (player_id, quest_id, passed, attempted_at)
       VALUES ($1, $2, false, now())`,
      [ADA, PUSH_QUEST],
    );

    const response = await submit(PUSH_QUEST);
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ state: 'failed' });

    const attempts = await db.query(
      `SELECT passed FROM attempts WHERE quest_id = $1 ORDER BY id`,
      [PUSH_QUEST],
    );
    expect(attempts.rows).toHaveLength(2);
    expect(attempts.rows.every((row) => (row as { passed: boolean }).passed === false)).toBe(true);

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
    const response = await app.inject({
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
    const response = await unconfigured.inject({
      method: 'POST',
      url: `/api/players/${ADA}/quests/${COMMIT_QUEST}/submit`,
      payload: { type: 'git-signal' },
    });
    expect(response.json()).toMatchObject({ code: 'internal' });
    await noScar();
  });

  it('refuses when no repository is configured for the player, and records nothing', async () => {
    const response = await unmapped.inject({
      method: 'POST',
      url: `/api/players/${ADA}/quests/${COMMIT_QUEST}/submit`,
      payload: { type: 'git-signal' },
    });
    expect(response.json()).toMatchObject({ code: 'internal' });
    await noScar();
  });
});
