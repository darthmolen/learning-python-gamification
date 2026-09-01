/**
 * The routes, against the real content root and a real Postgres.
 *
 * Nothing here is mocked, which the plan requires and which is also the only way these assertions
 * mean anything: the sign-off tests turn on a role stored in `player_roles`, the medal test turns
 * on a primary-key conflict, and the quest-view test greps a serialised HTTP body for a string
 * that lives in a YAML file on disk.
 *
 * The one injected thing is the clock, and it is injected at the api's own boundary rather than
 * exposed on a route. §5.4's schedule is not negotiable by the person it is scheduling; a `?now=`
 * would let a player ask for yesterday and skip a session's invasions, so the seam is here and
 * the wire has none.
 */

import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  ApiErrorSchema,
  CampaignViewSchema,
  QuestViewSchema,
  TomeSchema,
  type JournalEntry,
} from '@pyquest/contract';
import { medalDelta, nextRung } from '@pyquest/engine';
import type { FastifyInstance } from 'fastify';
import { loadContentRoot } from '../src/content.ts';
import { buildServer, jobStateFor } from '../src/server.ts';
import type { Gitea } from '../src/gitea.ts';
import { HAVE_DATABASE, useMigratedDatabase } from './support/database.ts';
import { inject as authed, signIn } from './support/authed.ts';

if (!HAVE_DATABASE) {
  throw new Error('no database: start the stack, or set TEST_DATABASE_URL');
}

/** The signed-in player these suites drive routes as. See `support/authed.ts`. */
let TOKEN: string;

const CONTENT = loadContentRoot(fileURLToPath(new URL('../../../..', import.meta.url)));

const ADA = '11111111-1111-1111-1111-111111111111';
const GRACE = '22222222-2222-2222-2222-222222222222';
const NOBODY = '33333333-3333-3333-3333-333333333333';

/** A Tuesday, pinned. Every date this suite asserts on is derived from it. */
const NOW = new Date('2026-08-25T09:00:00.000Z');

/**
 * A Gitea that serves one file and refuses everything else.
 *
 * The only stub in this suite, and it earns the exception the header claims for nothing else:
 * the alternative is a live Gitea in CI to prove that markdown reaches a payload. What is being
 * tested here is the *join* — ledger rows against parsed sections — and that logic is entirely
 * this side of the network. `journal.ts`'s own suite tests the parsing against strings, and
 * `journal-path.test.ts` checks the one string this could get wrong against the curriculum.
 */
const stubGitea = (journal: string): Gitea => ({
  settings: {
    baseUrl: 'http://gitea.invalid',
    token: 'stub',
    repos: new Map([['grace', { owner: 'grace', name: 'quests' }]]),
    journalPath: 'journal.md',
  },
  repoFor: (handle) => (handle.toLowerCase() === 'grace' ? { owner: 'grace', name: 'quests' } : undefined),
  cloneUrl: () => 'http://gitea.invalid/grace/quests.git',
  commits: async () => [],
  tags: async () => [],
  readFile: async (_repo, path) => (path === 'journal.md' ? journal : undefined),
});

const scratch = useMigratedDatabase('server');
let app: FastifyInstance;

beforeAll(async () => {
  const { client } = scratch();
  await client.query(
    `INSERT INTO players (id, handle, display_name) VALUES ($1, 'ada', 'Ada'), ($2, 'grace', 'Grace')`,
    [ADA, GRACE],
  );
  await client.query(
    `INSERT INTO player_roles (player_id, role) VALUES ($1, 'player'), ($1, 'dm'), ($2, 'player')`,
    [ADA, GRACE],
  );
  app = buildServer({ content: CONTENT, db: client, clock: () => NOW });
  await app.ready();
  /* Ada already exists with both roles; sign her in rather than making a third player. */
  TOKEN = (await signIn(client, { id: ADA, handle: 'ada', dm: true })).token;
});

afterAll(async () => {
  await app?.close();
});

beforeEach(async () => {
  const { client } = scratch();
  await client.query('DELETE FROM runner_jobs');
  await client.query('DELETE FROM attempts');
  await client.query('DELETE FROM quest_medals');
  await client.query('DELETE FROM concept_reviews');
  await client.query('DELETE FROM forced_reviews');
});

/* -------------------------------------------------------------------------------------------
 * Boot and shape
 * ----------------------------------------------------------------------------------------- */

describe('the server', () => {
  it('answers health without touching the database', async () => {
    const response = await authed(app, TOKEN, { method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok' });
  });

  it('returns the one error shape for an unknown route', async () => {
    const response = await authed(app, TOKEN, { method: 'GET', url: '/api/nonsense' });
    expect(response.statusCode).toBe(404);
    expect(ApiErrorSchema.safeParse(response.json()).success).toBe(true);
  });

  it('returns the one error shape for an unknown player', async () => {
    const response = await authed(app, TOKEN, { method: 'GET', url: `/api/players/${NOBODY}/campaign` });
    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ code: 'not-found', retryable: false });
  });
});

/* -------------------------------------------------------------------------------------------
 * The map, the area, the quest
 * ----------------------------------------------------------------------------------------- */

describe('the reads', () => {
  it('draws the whole map in one request', async () => {
    const response = await authed(app, TOKEN, { method: 'GET', url: `/api/players/${ADA}/campaign` });
    expect(response.statusCode).toBe(200);
    const view = CampaignViewSchema.parse(response.json());
    expect(view.areas).toHaveLength(8);
    expect(view.areas.map((card) => card.area)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  // An area with no manifest must still draw a card, without an identity and without failing
  // (§5.1a). That test lived here and was asserted against authored content: it needed a real
  // area to have no identity, and when the area-0 track gave area 0 a title and weeks, every
  // area had one and the case lost its representative. Deleted rather than repaired, because a
  // fixture root is a design decision and this is not the branch for it —
  // `planning/backlog/feature_area-card-without-a-manifest_2026-08-31.md` holds the code.

  it('gives the area screen its quests and its progress together', async () => {
    const response = await authed(app, TOKEN, { method: 'GET', url: `/api/players/${ADA}/areas/0` });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.quests.length).toBeGreaterThan(0);
    expect(body.boss).toMatchObject({ required: 3, unlocked: false });
  });

  it('refuses an area outside 0–7', async () => {
    expect((await authed(app, TOKEN, { method: 'GET', url: `/api/players/${ADA}/areas/9` })).statusCode).toBe(404);
  });

  it('prices every unearned medal slot from the engine, never from arithmetic here', async () => {
    const response = await authed(app, TOKEN, {
      method: 'GET',
      url: `/api/players/${ADA}/quests/a0-name-tag`,
    });
    const quest = QuestViewSchema.parse(response.json());
    const cleared = quest.medalSlots.find((slot) => slot.medal === 'cleared');
    expect(cleared?.xp).toBe(medalDelta('quest', quest.dc, [], 'cleared'));
  });

  it('prices a boss slot at the boss rate, because the screen quotes it before the attempt', async () => {
    /**
     * The display half of the same bug, and the half that reached the player first.
     *
     * `medalSlots` prices every *unearned* slot for the quest screen, so before the kind was
     * threaded through, a boss card quoted `dc * 2` to whoever was deciding whether to attempt
     * it — a tenth of what §5.1 actually pays. They would have read the number, judged the boss
     * not worth the evening, and been wrong because of an argument nobody passed.
     *
     * Awarding and quoting are separate call sites and this is the one the award test cannot
     * reach, so it gets its own assertion rather than being assumed to follow.
     */
    const response = await authed(app, TOKEN, {
      method: 'GET',
      url: `/api/players/${ADA}/quests/a0-first-light`,
    });
    const boss = QuestViewSchema.parse(response.json());
    const cleared = boss.medalSlots.find((slot) => slot.medal === 'cleared');

    expect(CONTENT.item('a0-first-light')?.kind).toBe('boss');
    expect(cleared?.xp).toBe(medalDelta('boss', boss.dc, [], 'cleared'));
    expect(cleared?.xp).toBe(boss.dc * 20);
  });

  it('never ships the hidden tests, nor the path to them (§6.3)', async () => {
    const response = await authed(app, TOKEN, {
      method: 'GET',
      url: `/api/players/${ADA}/quests/a0-name-tag`,
    });
    /**
     * The raw body, not the parsed one: a leak in a field nobody typed still travels as text.
     *
     * The strings are from the hidden test file's *source* — its helper name and the module it
     * imports. An earlier version of this test grepped for `Welcome, Steve!`, which the brief
     * publishes on purpose: the specification is meant to be readable, and only the assertions
     * are secret. A §6.3 test that cannot tell those apart fails on correct content.
     */
    expect(response.body).not.toContain('a0-name-tag_test.py');
    expect(response.body).not.toContain('tests/');
    expect(response.body).not.toContain('_run_with_input');
    expect(response.body).not.toContain('runpy');
    expect(QuestViewSchema.parse(response.json()).verifier).toEqual({ type: 'hidden-tests' });
  });

  it('ships the starter, because Run happens in the browser', async () => {
    const response = await authed(app, TOKEN, {
      method: 'GET',
      url: `/api/players/${ADA}/quests/a0-name-tag`,
    });
    expect(QuestViewSchema.parse(response.json()).starter).toContain('def main');
  });

  it('returns the syllabus with no unlocked state at all (plan v3)', async () => {
    const response = await authed(app, TOKEN, { method: 'GET', url: '/api/tome' });
    expect(response.statusCode).toBe(200);
    const tome = TomeSchema.parse(response.json());
    expect(tome.areas.map((a) => a.area)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(response.body).not.toContain('unlocked');
  });

  it('serves the party with an empty xpSources rather than an absent one', async () => {
    const response = await authed(app, TOKEN, { method: 'GET', url: `/api/players/${ADA}/party` });
    expect(response.statusCode).toBe(200);
    expect(response.json().xpSources).toEqual([]);
  });
});

/* -------------------------------------------------------------------------------------------
 * The Journal — §5.6, ADR 0004
 * ----------------------------------------------------------------------------------------- */

describe('the Journal routes', () => {
  /**
   * There is no writing route, and its absence is the design rather than a gap.
   *
   * He writes `journal.md` and commits it, and that *is* the post (§6.4). This asserts the 404 at
   * the wire, where `endpoints.test.ts` asserts the route is not in the table — two halves of one
   * claim, because a route table without a server is a document and a server without a table is
   * an accident.
   */
  it('has no POST, because committing an entry is how one is written', async () => {
    const response = await authed(app, TOKEN, { method: 'POST', url: `/api/players/${ADA}/journal` });
    expect(response.statusCode).toBe(404);
    expect(ApiErrorSchema.safeParse(response.json()).success).toBe(true);
  });

  /**
   * **An empty list, not a 404, and not an error.** §5.6 starts the Journal in week 1 as plain
   * markdown and only commits it at Area 2a, so for the first eight weeks of the campaign there
   * is genuinely nothing to read. This suite builds the server with no Gitea at all, which is the
   * same shape as "no repository yet" and the state the app spends its first two months in.
   *
   * The distinction matters on the screen: `Awaiting`'s failed state says something is broken,
   * and nothing is. He simply has not got there yet.
   */
  it('answers an empty journal with an empty list rather than a failure', async () => {
    const response = await authed(app, TOKEN, { method: 'GET', url: `/api/players/${ADA}/journal` });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });

  it('404s for a player who does not exist, like every other player-scoped read', async () => {
    const response = await authed(app, TOKEN, { method: 'GET', url: `/api/players/${NOBODY}/journal` });
    expect(response.statusCode).toBe(404);
  });

  /**
   * The ledger decides which entries exist, and this is the assertion that says so.
   *
   * A paid row with no Gitea behind it yields nothing — not a row with empty text. An entry with
   * a date and no words reads as "you wrote nothing" on the one screen §5.6 says must never say
   * that to somebody who did write.
   */
  it('does not invent an entry for a paid row it cannot read the text of', async () => {
    const { client } = scratch();
    await client.query(
      `INSERT INTO journal_entries (player_id, session_date, commit_sha, xp_awarded)
       VALUES ($1, '2026-08-22', 'a1b2c3d', 10)`,
      [ADA],
    );

    const response = await authed(app, TOKEN, { method: 'GET', url: `/api/players/${ADA}/journal` });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
  });

  /**
   * The whole path, end to end: two paid rows, one file, and a third heading nobody paid for.
   *
   * The unpaid heading is the assertion that carries the design. `journal.md` is his and he may
   * write in it whenever he likes; a `## <date>` with no ledger row behind it was never verified
   * by a push (§6.4) and never paid, so rendering it would show him XP he did not earn beside
   * writing he did. **The ledger decides which entries exist; the file only decides what they
   * say.**
   */
  it('joins each paid row to its own section, and ignores writing nobody paid for', async () => {
    const { client } = scratch();
    await client.query(
      `INSERT INTO journal_entries (player_id, session_date, commit_sha, xp_awarded)
       VALUES ($1, '2026-08-10', 'aaaaaaa', 10), ($1, '2026-08-17', 'bbbbbbb', 10)`,
      [GRACE],
    );

    const journal = [
      '# Journal',
      '',
      '## 2026-08-10 — Session 01',
      '',
      '### What I built',
      '<!-- Specific. Names of files. -->',
      'A hexagon, with a loop instead of six lines.',
      '',
      '### DM reply',
      'Which side did you count first?',
      '',
      '## 2026-08-17 — Session 02',
      '',
      '### What I built',
      'A spiral.',
      '',
      '### DM reply',
      '<!-- Dad writes here. -->',
      '',
      '## 2026-08-24 — Session 03',
      '',
      'Written tonight, not yet paid for.',
    ].join('\n');

    const withGitea = buildServer({
      content: CONTENT,
      db: client,
      clock: () => NOW,
      gitea: stubGitea(journal),
    });
    await withGitea.ready();

    try {
      const response = await authed(withGitea, TOKEN, {
        method: 'GET',
        url: `/api/players/${GRACE}/journal`,
      });
      expect(response.statusCode).toBe(200);

      const entries = response.json() as JournalEntry[];
      expect(entries.map((e) => e.sessionDate)).toEqual(['2026-08-10', '2026-08-17']);

      const [first, second] = entries;
      expect(first?.body).toContain('A hexagon');
      expect(first?.body).not.toContain('<!--');
      expect(first?.reply).toBe('Which side did you count first?');
      expect(first?.commitSha).toBe('aaaaaaa');

      /* The template's coaching is not an answer, so this entry is unanswered. */
      expect(second?.body).toContain('A spiral.');
      expect(second?.reply).toBeUndefined();
    } finally {
      await withGitea.close();
    }
  });
});

/* -------------------------------------------------------------------------------------------
 * Submit — §6.3
 * ----------------------------------------------------------------------------------------- */

describe('submit', () => {
  it('enqueues a hidden-tests job and hands back an id to poll', async () => {
    const response = await authed(app, TOKEN, {
      method: 'POST',
      url: `/api/players/${ADA}/quests/a0-name-tag/submit`,
      payload: { type: 'hidden-tests', code: 'print("hi")' },
    });
    expect(response.statusCode).toBe(202);
    const { jobId, state } = response.json();
    expect(state).toBe('queued');

    const polled = await authed(app, TOKEN, { method: 'GET', url: `/api/jobs/${jobId}` });
    expect(polled.statusCode).toBe(200);
    expect(polled.json()).toMatchObject({ state: 'queued', questId: 'a0-name-tag', result: null });
  });

  it('keeps the hidden tests out of the queued payload as content, storing only the path', async () => {
    const { client } = scratch();
    await authed(app, TOKEN, {
      method: 'POST',
      url: `/api/players/${ADA}/quests/a0-name-tag/submit`,
      payload: { type: 'hidden-tests', code: 'print("hi")' },
    });
    const { rows } = await client.query('SELECT payload FROM runner_jobs');
    const payload = (rows[0] as { payload: Record<string, unknown> }).payload;
    expect(payload['tests']).toBe('area-0/exercises/name-tag/hidden/test.py');
    expect(JSON.stringify(payload)).not.toContain('Welcome, Steve!');
  });

  it('refuses a submission whose verifier is not the quest’s', async () => {
    const response = await authed(app, TOKEN, {
      method: 'POST',
      url: `/api/players/${ADA}/quests/a0-name-tag/submit`,
      payload: { type: 'peer-signoff' },
    });
    expect(response.json()).toMatchObject({ code: 'verifier-failed' });
  });

  it('refuses a hidden-tests submission with no code', async () => {
    const response = await authed(app, TOKEN, {
      method: 'POST',
      url: `/api/players/${ADA}/quests/a0-name-tag/submit`,
      payload: { type: 'hidden-tests' },
    });
    expect(response.json()).toMatchObject({ code: 'verifier-failed' });
  });

  it('translates a claimed job to running, and never shows the storage word', async () => {
    const { client } = scratch();
    const submitted = await authed(app, TOKEN, {
      method: 'POST',
      url: `/api/players/${ADA}/quests/a0-name-tag/submit`,
      payload: { type: 'hidden-tests', code: 'print("hi")' },
    });
    const { jobId } = submitted.json();
    await client.query(`UPDATE runner_jobs SET status = 'claimed' WHERE id = $1::bigint`, [jobId]);

    const polled = await authed(app, TOKEN, { method: 'GET', url: `/api/jobs/${jobId}` });
    expect(polled.json().state).toBe('running');
    expect(polled.body).not.toContain('claimed');
  });

  it('maps every storage state, and keeps killed apart from failed', () => {
    expect(jobStateFor('claimed')).toBe('running');
    expect(jobStateFor('killed')).toBe('killed');
    expect(jobStateFor('timed-out')).toBe('timed-out');
    expect(jobStateFor('failed')).toBe('failed');
  });
});

/* -------------------------------------------------------------------------------------------
 * peer-signoff — §6.3, §5.11
 * ----------------------------------------------------------------------------------------- */

async function submitForSignoff(): Promise<string> {
  const response = await authed(app, TOKEN, {
    method: 'POST',
    url: `/api/players/${ADA}/quests/a0-first-light/submit`,
    payload: { type: 'peer-signoff' },
  });
  return response.json().jobId as string;
}

describe('peer sign-off', () => {
  it('queues a submission for a person, household-wide', async () => {
    const attemptId = await submitForSignoff();
    const queue = await authed(app, TOKEN, { method: 'GET', url: '/api/signoffs?state=pending' });
    expect(queue.json()).toEqual([
      expect.objectContaining({ attemptId, playerId: ADA, questId: 'a0-first-light', by: 'peer' }),
    ]);
  });

  it('refuses a player signing off their own submission', async () => {
    const attemptId = await submitForSignoff();
    const response = await authed(app, TOKEN, {
      method: 'POST',
      url: `/api/signoffs/${attemptId}`,
      payload: { by: ADA, granted: true },
    });
    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({ code: 'signoff-denied' });
  });

  it('awards exactly the number the engine returned, and takes it off the queue', async () => {
    const attemptId = await submitForSignoff();
    const response = await authed(app, TOKEN, {
      method: 'POST',
      url: `/api/signoffs/${attemptId}`,
      payload: { by: GRACE, granted: true },
    });
    expect(response.statusCode).toBe(200);

    /**
     * `a0-first-light` is **Area 0's boss**, not a quest, and that is the whole point of this
     * assertion. Peer sign-off is the boss path (§5.11) — the parent's gap detector — so this is
     * precisely where the missing kind was costing real XP: a DC 8 boss paid 16 where §5.1 says
     * 160. Pass the fixture's own kind rather than a literal, so renaming the fixture cannot
     * quietly restore the bug.
     */
    const boss = CONTENT.item('a0-first-light');
    expect(boss?.kind).toBe('boss');
    const expected = medalDelta('boss', boss?.dc ?? 0, [], 'cleared');
    expect(expected).toBe((boss?.dc ?? 0) * 20);

    expect(response.json()).toMatchObject({
      questId: 'a0-first-light',
      medal: 'cleared',
      xpAwarded: expected,
    });

    const { rows } = await scratch().client.query(
      `SELECT xp_awarded FROM quest_medals WHERE player_id = $1 AND quest_id = 'a0-first-light'`,
      [ADA],
    );
    expect(rows).toEqual([{ xp_awarded: expected }]);
    expect((await authed(app, TOKEN, { method: 'GET', url: '/api/signoffs' })).json()).toEqual([]);
  });

  it('pays the delta and not the base price, when a medal is already held', async () => {
    /**
     * On a fresh item the delta and the base price are the same number, so an api that priced the
     * medal itself would pass the test above. With Ironman already held they separate, and
     * §5.10's "pays the difference, once" becomes something a suite can check.
     *
     * The fixture is Area 0's **boss**, so the base price here is `dc * 20` (§5.1) and not the
     * `dc * 2` a quest pays. The rate is named rather than assumed on purpose: `medalDelta` takes
     * the kind precisely so that no test infers one rate from the other, which is the mistake
     * that let a boss pay a tenth of the spec for as long as it did.
     */
    const { client } = scratch();
    await client.query(
      `INSERT INTO quest_medals (player_id, quest_id, medal, earned_at, xp_awarded)
       VALUES ($1, 'a0-first-light', 'ironman', '2026-08-20', 26)`,
      [ADA],
    );
    const attemptId = await submitForSignoff();
    const response = await authed(app, TOKEN, {
      method: 'POST',
      url: `/api/signoffs/${attemptId}`,
      payload: { by: GRACE, granted: true },
    });

    const boss = CONTENT.item('a0-first-light');
    expect(boss?.kind).toBe('boss');
    const expected = medalDelta('boss', boss?.dc ?? 0, ['ironman'], 'cleared');
    expect(expected).not.toBe((boss?.dc ?? 0) * 20);
    expect(response.json()).toMatchObject({ xpAwarded: expected });
  });

  it('leaves a denied sign-off as a scar and pays nothing', async () => {
    const attemptId = await submitForSignoff();
    const response = await authed(app, TOKEN, {
      method: 'POST',
      url: `/api/signoffs/${attemptId}`,
      payload: { by: GRACE, granted: false },
    });
    expect(response.json()).toMatchObject({ code: 'signoff-denied' });

    const { rows } = await scratch().client.query('SELECT passed FROM attempts WHERE id = $1::bigint', [
      attemptId,
    ]);
    expect(rows).toEqual([{ passed: false }]);
    expect((await scratch().client.query('SELECT * FROM quest_medals')).rows).toEqual([]);
  });

  it('refuses a sign-off on an attempt that is not pending one', async () => {
    const response = await authed(app, TOKEN, {
      method: 'POST',
      url: '/api/signoffs/999999',
      payload: { by: GRACE, granted: true },
    });
    expect(response.statusCode).toBe(404);
  });
});

/* -------------------------------------------------------------------------------------------
 * Defend — §5.4
 * ----------------------------------------------------------------------------------------- */

describe('defend', () => {
  beforeEach(async () => {
    await scratch().client.query(
      /**
       * Rung 3, not rung 1, and the choice is load-bearing.
       *
       * From rung 1 the ladder and the naive `rung + 1 : 0` agree on both answers, so a suite
       * seeded there passes against an api that walks the ladder itself — which is exactly the
       * §6.7 crossing these tests exist to catch. It was seeded at 1, a mutant survived, and this
       * is the fix. From rung 3 a miss steps back to 2 and the naive version resets to zero,
       * which is §5.4's whole argument: one miss costs one repel to undo, and no more.
       */
      `INSERT INTO concept_reviews (player_id, concept_id, last_reviewed_at, rung)
       VALUES ($1, 'variables', '2026-08-01', 3)`,
      [ADA],
    );
  });

  it('queues an overdue concept against the api’s own clock', async () => {
    const response = await authed(app, TOKEN, { method: 'GET', url: `/api/players/${ADA}/defend` });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      expect.objectContaining({ conceptId: 'variables', source: 'ladder' }),
    ]);
  });

  it('takes no date from the caller, on the query string or in the body', async () => {
    const repelled = await authed(app, TOKEN, {
      method: 'POST',
      url: `/api/players/${ADA}/defend/variables`,
      payload: { repelled: true, now: '2020-01-01' },
    });
    expect(repelled.json()).toMatchObject({ code: 'verifier-failed' });
  });

  it('stores the rung the engine returned and the date the api read', async () => {
    const response = await authed(app, TOKEN, {
      method: 'POST',
      url: `/api/players/${ADA}/defend/variables`,
      payload: { repelled: true },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ conceptId: 'variables', rung: nextRung(3, true) });

    const { rows } = await scratch().client.query(
      `SELECT rung, last_reviewed_at::text AS d FROM concept_reviews WHERE player_id = $1`,
      [ADA],
    );
    expect(rows).toEqual([{ rung: nextRung(3, true), d: '2026-08-25' }]);
  });

  it('stops at the top rung rather than climbing off the ladder', async () => {
    await scratch().client.query(
      `UPDATE concept_reviews SET rung = 4 WHERE player_id = $1 AND concept_id = 'variables'`,
      [ADA],
    );
    const response = await authed(app, TOKEN, {
      method: 'POST',
      url: `/api/players/${ADA}/defend/variables`,
      payload: { repelled: true },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ rung: nextRung(4, true) });
  });

  it('steps back exactly one rung when the invasion is not repelled', async () => {
    const response = await authed(app, TOKEN, {
      method: 'POST',
      url: `/api/players/${ADA}/defend/variables`,
      payload: { repelled: false },
    });
    expect(response.json()).toMatchObject({ rung: nextRung(3, false), xpAwarded: 0 });
  });

  it('refuses a concept that is not on this player’s ladder', async () => {
    const response = await authed(app, TOKEN, {
      method: 'POST',
      url: `/api/players/${ADA}/defend/for`,
      payload: { repelled: true },
    });
    expect(response.statusCode).toBe(404);
  });
});
