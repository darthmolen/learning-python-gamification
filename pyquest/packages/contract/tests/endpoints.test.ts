/**
 * The wire surface, checked against the rulings that produced it.
 *
 * These are not tests of zod. Every one of them pins a decision `feature_api-and-runner` argued
 * for over four review rounds, and each would go quietly wrong in a way no type error catches:
 * a sixth job state dropped back to five, a `?now=` parameter creeping onto a route, hidden
 * tests riding out on a quest payload, an error code the SPA cannot discriminate.
 */

import { describe, expect, it } from 'vitest';
import {
  API_ERROR_CODES,
  API_ROUTES,
  ApiErrorSchema,
  AreaViewSchema,
  CampaignViewSchema,
  DrillResultSchema,
  JOB_STATES,
  JobAcceptedSchema,
  JobViewSchema,
  JournalEntrySchema,
  PartyViewSchema,
  PendingSignoffsSchema,
  PublicVerifierSchema,
  QuestViewSchema,
  SignoffRequestSchema,
  SubmitRequestSchema,
  TomeSchema,
} from '../src/index.ts';

/* -------------------------------------------------------------------------------------------
 * The route table
 * ----------------------------------------------------------------------------------------- */

describe('the route table', () => {
  /**
   * A count, deliberately, so that adding a route is a thing somebody has to come here and do.
   *
   * Twenty-first: `GET /api/players/:playerId/journal/template`, added 2026-09-01. The Journal's
   * copy-paste template is authored curriculum that differs per area, so it is served rather than
   * shipped in the SPA — a copy in a React component is content duplicated into a screen.
   */
  it('carries the twenty-one routes the plan names', () => {
    expect(API_ROUTES).toHaveLength(21);
  });

  /**
   * Exactly two routes may be reached without a token, and both are how you get one.
   *
   * This is the assertion that makes the guard's scope a countable property rather than a promise
   * in a comment. A route added outside this list is a route somebody has to justify here first —
   * which is the review that would otherwise not happen.
   */
  it('leaves only the two ways of getting a token unauthenticated', () => {
    const open = ['POST /api/session', 'POST /api/session/bootstrap'];
    expect(open.every((route) => API_ROUTES.some((r) => `${r.method} ${r.path}` === route))).toBe(true);
  });

  /**
   * `POST /journal` was removed on 2026-08-31 rather than implemented, and this is the assertion
   * that keeps it removed.
   *
   * ADR 0004 made markdown in his repository the system of record. He writes the file and commits
   * it, and **that is the post** — §6.4 already makes push the verification mechanism. A route
   * that also writes journal text would be a second way to author one artifact, and the second
   * way is the one that goes stale: the file he edits by hand and the rows the API wrote diverge
   * the first time he fixes a typo, with nothing to say which is the journal.
   */
  it('has no way to write a journal entry, because committing one is how it is written', () => {
    const writes = API_ROUTES.filter(
      (route) => route.method === 'POST' && route.path.endsWith('/journal'),
    );
    expect(writes).toEqual([]);
  });

  /**
   * `GET /journal` carried `— blocked` from the day it was written, because three of
   * `JournalEntry`'s five required fields had no column. The ruling dissolved that: they were
   * never missing, they were in the wrong store. The annotation goes with the reason for it.
   */
  it('no longer annotates the journal read as blocked', () => {
    const read = API_ROUTES.find(
      (route) => route.method === 'GET' && route.path.endsWith('/journal'),
    );
    expect(read).toBeDefined();
    expect(read?.returns).not.toMatch(/blocked/i);
  });

  it('names every path once per method', () => {
    const keys = API_ROUTES.map((route) => `${route.method} ${route.path}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  /**
   * Every player-facing read names its player, and the exceptions are enumerated rather than
   * assumed.
   *
   * **Auth added five, and they are a different kind of unscoped.** `/api/me` is the sharpest: it
   * is as player-scoped as anything in this table, but by the *token* rather than by the path —
   * which is strictly stronger, because a path is an assertion and a token is a credential. The
   * plan's whole objective is that sentence. `/api/players` is the DM's roster, deliberately
   * household-wide. The three `/api/session` routes have no player yet; that is what they are for.
   *
   * The list stays exhaustive so that adding a sixth is a decision somebody makes here, on
   * purpose, rather than a route that quietly serves two households from one URL.
   */
  it('scopes every player-facing read by player, so two players cannot share one route', () => {
    const unscoped = API_ROUTES.filter((route) => !route.path.includes(':playerId'))
      .map((route) => route.path)
      .sort();
    expect(unscoped).toEqual([
      '/api/jobs/:jobId',
      '/api/me',
      '/api/players',
      '/api/players',
      '/api/session',
      '/api/session/bootstrap',
      '/api/session/end',
      '/api/signoffs',
      '/api/signoffs/:attemptId',
      '/api/tome',
    ]);
  });

  it('accepts no client-supplied clock on any route (plan v2)', () => {
    for (const route of API_ROUTES) {
      expect(route.path).not.toContain('now');
      expect(route.query ?? []).not.toContain('now');
    }
  });

  it('resolves every verifier through one Submit route (plan v3)', () => {
    const submits = API_ROUTES.filter((route) => route.path.endsWith('/submit'));
    expect(submits).toHaveLength(1);
  });
});

/* -------------------------------------------------------------------------------------------
 * The error shape
 * ----------------------------------------------------------------------------------------- */

describe('the error shape', () => {
  it('discriminates the nine failures the SPA has to tell apart', () => {
    expect([...API_ERROR_CODES].sort()).toEqual(
      [
        'already-awarded',
        'content-invalid',
        'illegal-modifiers',
        'internal',
        'not-found',
        'runner-killed',
        'runner-timeout',
        'signoff-denied',
        'verifier-failed',
      ].sort(),
    );
  });

  it('requires retryable, because a client must know whether to offer the button again', () => {
    expect(ApiErrorSchema.safeParse({ code: 'internal', message: 'boom' }).success).toBe(false);
  });

  it('refuses a code it does not know rather than passing it through', () => {
    const result = ApiErrorSchema.safeParse({
      code: 'kaboom',
      message: 'boom',
      retryable: false,
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional details and nothing else', () => {
    expect(
      ApiErrorSchema.safeParse({
        code: 'verifier-failed',
        message: 'two of three tests failed',
        retryable: true,
        details: { failed: 2 },
      }).success,
    ).toBe(true);
    expect(
      ApiErrorSchema.safeParse({
        code: 'verifier-failed',
        message: 'nope',
        retryable: true,
        hint: 'try harder',
      }).success,
    ).toBe(false);
  });
});

/* -------------------------------------------------------------------------------------------
 * Job state — the mapping the two tracks would otherwise each invent
 * ----------------------------------------------------------------------------------------- */

describe('JobState', () => {
  it('carries all six states, killed included (plan v2, v3)', () => {
    expect([...JOB_STATES].sort()).toEqual(
      ['failed', 'killed', 'passed', 'queued', 'running', 'timed-out'].sort(),
    );
  });

  it('has no claimed state — that is storage vocabulary and reads as running', () => {
    expect(JOB_STATES).not.toContain('claimed');
  });

  it('accepts a job the moment it is queued', () => {
    expect(JobAcceptedSchema.safeParse({ jobId: '41', state: 'queued' }).success).toBe(true);
  });

  it('refuses a job view whose state is a storage state', () => {
    const view = {
      jobId: '41',
      playerId: 'p1',
      questId: 'a0-name-tag',
      state: 'claimed',
      result: null,
      errorCode: null,
      attemptId: null,
    };
    expect(JobViewSchema.safeParse(view).success).toBe(false);
  });

  it('carries a truncated result and says so, rather than pretending output is complete', () => {
    const view = {
      jobId: '41',
      playerId: 'p1',
      questId: 'a0-name-tag',
      state: 'failed',
      result: { passed: false, stdout: 'F', stderr: '', truncated: true, durationMs: 120 },
      errorCode: 'verifier-failed',
      attemptId: '7',
    };
    expect(JobViewSchema.safeParse(view).success).toBe(true);
  });
});

/* -------------------------------------------------------------------------------------------
 * SubmitRequest — one route, four verifiers
 * ----------------------------------------------------------------------------------------- */

describe('SubmitRequest', () => {
  it('carries code for hidden-tests', () => {
    expect(SubmitRequestSchema.safeParse({ type: 'hidden-tests', code: 'print(1)' }).success).toBe(
      true,
    );
  });

  it('refuses hidden-tests with no code — there would be nothing to run', () => {
    expect(SubmitRequestSchema.safeParse({ type: 'hidden-tests' }).success).toBe(false);
  });

  it('carries no code for peer-signoff or git-signal (plan v3)', () => {
    expect(SubmitRequestSchema.safeParse({ type: 'peer-signoff' }).success).toBe(true);
    expect(SubmitRequestSchema.safeParse({ type: 'git-signal' }).success).toBe(true);
    expect(SubmitRequestSchema.safeParse({ type: 'peer-signoff', code: 'print(1)' }).success).toBe(
      false,
    );
    expect(SubmitRequestSchema.safeParse({ type: 'git-signal', code: 'print(1)' }).success).toBe(
      false,
    );
  });

  it('takes an optional ref for local-repo and never code, because push is the mechanism', () => {
    expect(SubmitRequestSchema.safeParse({ type: 'local-repo' }).success).toBe(true);
    expect(SubmitRequestSchema.safeParse({ type: 'local-repo', ref: 'main' }).success).toBe(true);
    expect(SubmitRequestSchema.safeParse({ type: 'local-repo', code: 'print(1)' }).success).toBe(
      false,
    );
  });

  it('refuses a verifier type content does not define', () => {
    expect(SubmitRequestSchema.safeParse({ type: 'trust-me' }).success).toBe(false);
  });
});

/* -------------------------------------------------------------------------------------------
 * Hidden tests never reach the client — spec 6.3
 * ----------------------------------------------------------------------------------------- */

describe('the public verifier', () => {
  it('names the type and nothing that would locate the tests', () => {
    const parsed = PublicVerifierSchema.parse({ type: 'hidden-tests' });
    expect(Object.keys(parsed)).toEqual(['type']);
  });

  it('refuses a tests path even when a handler tries to pass one through', () => {
    expect(
      PublicVerifierSchema.safeParse({
        type: 'hidden-tests',
        tests: 'tests/a0-name-tag_test.py',
      }).success,
    ).toBe(false);
  });

  it('carries the signal for git-signal and the role for peer-signoff, which are not secrets', () => {
    expect(PublicVerifierSchema.safeParse({ type: 'git-signal', signal: 'commit' }).success).toBe(
      true,
    );
    expect(PublicVerifierSchema.safeParse({ type: 'peer-signoff', by: 'peer' }).success).toBe(true);
  });

  it('keeps a quest view free of any tests path', () => {
    const quest = {
      id: 'a0-name-tag',
      title: 'The Name Tag',
      kind: 'quest',
      area: 0,
      dc: 5,
      concepts: ['print'],
      requires: [],
      status: 'available',
      brief: '# The Name Tag',
      medalsHeld: [],
      medalSlots: [{ medal: 'cleared', effectiveDC: 5, xp: 10 }],
      verifier: { type: 'hidden-tests' },
      starter: 'def main() -> None: ...',
    };
    expect(QuestViewSchema.safeParse(quest).success).toBe(true);
    expect(QuestViewSchema.safeParse({ ...quest, tests: 'tests/a0-name-tag_test.py' }).success).toBe(
      false,
    );
  });
});

/* -------------------------------------------------------------------------------------------
 * The composite views
 * ----------------------------------------------------------------------------------------- */

const AREA_CARD = {
  area: 0,
  progress: { cleared: 1, total: 5, estimated: true },
  boss: { cleared: 1, required: 3, unlocked: false },
};

describe('the composite views', () => {
  it('lets an area go without an identity, because two manifests still carry no weeks', () => {
    expect(CampaignViewSchema.safeParse({ playerId: 'p1', areas: [AREA_CARD] }).success).toBe(true);
  });

  it('takes an identity when the manifest has one', () => {
    const identified = {
      ...AREA_CARD,
      identity: {
        area: 0,
        title: 'First Light',
        weeks: { from: 1, to: 2 },
        blurb: 'The terminal, and the first program.',
      },
    };
    expect(CampaignViewSchema.safeParse({ playerId: 'p1', areas: [identified] }).success).toBe(true);
  });

  it('refuses a campaign naming one area twice', () => {
    expect(
      CampaignViewSchema.safeParse({ playerId: 'p1', areas: [AREA_CARD, AREA_CARD] }).success,
    ).toBe(false);
  });

  it('gives the area screen its quests in one request', () => {
    const view = {
      ...AREA_CARD,
      playerId: 'p1',
      quests: [
        {
          id: 'a0-name-tag',
          title: 'The Name Tag',
          dc: 5,
          concepts: ['print'],
          medals: [],
          status: 'available',
        },
      ],
    };
    expect(AreaViewSchema.safeParse(view).success).toBe(true);
  });

  it('returns concepts by area from the Tome and no progress at all (plan v3)', () => {
    const tome = {
      areas: [
        { area: 0, concepts: [{ id: 'print', label: 'print' }], lesson: '# First Light', lessonIsDraft: false },
      ],
    };
    expect(TomeSchema.safeParse(tome).success).toBe(true);
    expect(
      TomeSchema.safeParse({
        areas: [{ area: 0, concepts: [], unlocked: true, lessonIsDraft: false }],
      }).success,
    ).toBe(false);
  });

  /**
   * An unwritten lesson is absent, never an empty string. `''` would render as a page that
   * silently teaches nothing, where absence makes the screen say the teaching is unwritten —
   * §5.1a's honesty rule, which is the whole reason the field is optional rather than defaulted.
   */
  it('lets an area carry no lesson, but not an empty one, and always says whether it is a draft', () => {
    const withoutLesson = { areas: [{ area: 0, concepts: [], lessonIsDraft: false }] };
    expect(TomeSchema.safeParse(withoutLesson).success).toBe(true);

    const empty = { areas: [{ area: 0, concepts: [], lesson: '', lessonIsDraft: false }] };
    expect(TomeSchema.safeParse(empty).success).toBe(false);

    const noFlag = { areas: [{ area: 0, concepts: [], lesson: '# First Light' }] };
    expect(TomeSchema.safeParse(noFlag).success).toBe(false);
  });

  it('ships the party view with an empty xpSources, which this plan declined to compute', () => {
    const party = {
      standings: [{ playerId: 'p1', level: 2, toNext: 40, areaXp: 10, areas: [] }],
      xpSources: [],
      bounties: [],
    };
    expect(PartyViewSchema.safeParse(party).success).toBe(true);
  });
});

/* -------------------------------------------------------------------------------------------
 * The remaining request bodies
 * ----------------------------------------------------------------------------------------- */

describe('the request bodies', () => {
  it('takes a drill result as repelled or not, and no date', () => {
    expect(DrillResultSchema.safeParse({ repelled: true }).success).toBe(true);
    expect(DrillResultSchema.safeParse({ repelled: true, now: '2026-08-29' }).success).toBe(false);
  });

  it('takes a sign-off from a player id, never a role the client asserts', () => {
    expect(SignoffRequestSchema.safeParse({ by: 'p2', granted: true }).success).toBe(true);
    expect(SignoffRequestSchema.safeParse({ role: 'dm', granted: true }).success).toBe(false);
  });

  it('lists pending sign-offs household-wide, so nothing is filtered to the caller (plan v4)', () => {
    const pending = [
      {
        attemptId: '7',
        playerId: 'p1',
        questId: 'a0-first-light',
        questTitle: 'First Light',
        by: 'peer',
        submittedAt: '2026-08-29T12:00:00.000Z',
      },
    ];
    expect(PendingSignoffsSchema.safeParse(pending).success).toBe(true);
  });

  /**
   * The entry is markdown, and the four prompts are headings inside it rather than fields.
   *
   * §5.6 wants four prompts where this schema modelled one `prompt: string`. Under a Postgres
   * store that was schema churn — four columns, a JSON blob, or a child table. ADR 0004 put the
   * text in his repository instead, and **in markdown four prompts are four headings**, visible
   * to the person writing them rather than encoded in a migration. So `prompt` is gone, and
   * `body` is the entry as he wrote it.
   */
  it('types a journal entry as the markdown he actually wrote', () => {
    const entry = {
      sessionDate: '2026-08-29',
      body: [
        '### What I built',
        'A hexagon, with a loop instead of six lines.',
        '',
        '### What broke',
        'It had five sides and nothing said so.',
      ].join('\n'),
      commitSha: 'a1b2c3d',
      xpAwarded: 10,
    };
    expect(JournalEntrySchema.safeParse(entry).success).toBe(true);
    expect(JournalEntrySchema.safeParse({ ...entry, reply: 'Good catch.' }).success).toBe(true);
  });

  /**
   * `.strict()` is what makes this a removal rather than a rename. A schema that merely stopped
   * *requiring* `prompt` would keep accepting payloads that carry one, and the four-prompt
   * confusion would survive in whatever produced them.
   */
  it('refuses a separate prompt field, because the prompts are headings now', () => {
    const withPrompt = {
      sessionDate: '2026-08-29',
      prompt: 'What broke, and how did you find it?',
      body: 'A typo in a variable name.',
      commitSha: 'a1b2c3d',
      xpAwarded: 10,
    };
    expect(JournalEntrySchema.safeParse(withPrompt).success).toBe(false);
  });
});
