import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCampaign, getDefend, getJob, getSignoffs, postDrill, postSignoff, submitQuest } from './index.ts';
import { Unauthenticated } from './session.ts';
import { PLAYER_ID } from '../fixtures/index.ts';

/**
 * The path Phase 5 exists to build, and the one nothing was testing.
 *
 * Every other gateway test runs against fixtures, which are valid by construction — so removing
 * `.parse()` entirely changed nothing they could see, and a seeded mutant that did exactly that
 * survived. The fixtures prove the shapes; only a real response proves the gateway.
 *
 * `vi.stubEnv` works because the base URL is read per call rather than at module load. That is
 * the only reason this file can exist, and it is why the read stayed a function.
 */
const withApi = (): void => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:8080');
};

const answers = (body: unknown, init: { ok?: boolean; status?: number } = {}): void => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      Promise.resolve({
        ok: init.ok ?? true,
        status: init.status ?? 200,
        json: async () => Promise.resolve(body),
      }),
    ),
  );
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  /*
   * The token is real browser state, not a stub, so `unstubAllGlobals` does not touch it. A
   * leaked one would put an `authorization` header on the tests above that assert the exact
   * header object — which would fail them for a reason that has nothing to do with what they
   * are checking.
   */
  window.localStorage.clear();
});

describe('when an API is configured', () => {
  it('asks it, at the path the contract names', async () => {
    withApi();
    answers({ playerId: PLAYER_ID, areas: [] });

    await getCampaign(PLAYER_ID);

    expect(fetch).toHaveBeenCalledWith(
      `http://localhost:8080/api/players/${PLAYER_ID}/campaign`,
      expect.objectContaining({ headers: { accept: 'application/json' } }),
    );
  });

  /**
   * The mutant that survived: a gateway that hands the response straight back typechecks, works
   * against every fixture, and lets a payload the contract forbids reach a screen. Only a
   * response that is *wrong* can tell the difference.
   */
  it('rejects a payload the contract forbids, rather than passing it on', async () => {
    withApi();
    // Correctly shaped and still wrong: §5.2 says `unlocked` must agree with the counts.
    answers({
      playerId: PLAYER_ID,
      areas: [
        {
          area: 3,
          progress: { cleared: 0, total: 5, estimated: true },
          boss: { cleared: 0, required: 3, unlocked: true },
        },
      ],
    });

    await expect(getCampaign(PLAYER_ID)).rejects.toThrow();
  });

  it('rejects a queue that breaks the §5.4 cap', async () => {
    withApi();
    // Six entries. The cap is five, and the rule lives on the collection rather than the entry.
    answers(
      Array.from({ length: 6 }, (_, i) => ({
        conceptId: 'dict',
        area: 3,
        lastSeen: '2026-08-20',
        overdueDays: i,
        source: 'ladder',
      })),
    );

    await expect(getDefend(PLAYER_ID)).rejects.toThrow();
  });

  /**
   * The other survivor. A non-2xx that fell through to `.json()` would try to parse an error
   * body as a campaign and fail with a shape complaint — burying "the server said 500" under a
   * list of missing fields.
   */
  it('reports the status when the request fails, rather than parsing the error body', async () => {
    withApi();
    answers({ code: 'not_found', message: 'no such player' }, { ok: false, status: 404 });

    await expect(getCampaign(PLAYER_ID)).rejects.toThrow(/404/);
  });

  it('falls back to fixtures when no API is configured', async () => {
    // No `withApi()`. Nothing is fetched, and the screens still have something to draw — which
    // is how the app runs with no stack behind it and how this suite stays hermetic.
    answers({ never: 'used' });

    const campaign = await getCampaign(PLAYER_ID);

    expect(fetch).not.toHaveBeenCalled();
    expect(campaign.areas).toHaveLength(8);
  });
});


/* -----------------------------------------------------------------------------------------
 * Submit and the job queue — §6.3, §6.6
 * --------------------------------------------------------------------------------------- */

describe('submitting', () => {
  it('posts to the one route, at the path the contract names', async () => {
    withApi();
    window.localStorage.setItem('pyquest.token', 'tok-1');
    answers({ jobId: '41', state: 'queued' }, { status: 202 });

    await submitQuest(PLAYER_ID, 'a3-recipe-book', { type: 'hidden-tests', code: 'x = 1' });

    expect(fetch).toHaveBeenCalledWith(
      `http://localhost:8080/api/players/${PLAYER_ID}/quests/a3-recipe-book/submit`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ type: 'hidden-tests', code: 'x = 1' }),
        headers: expect.objectContaining({ authorization: 'Bearer tok-1' }),
      }),
    );
  });

  /**
   * A 200 and a 202 are both accepted answers here and mean different things: 202 is a job
   * queued, 200 is a `git-signal` that resolved on the spot. A gateway that only took 202 would
   * turn the fastest-working verifier into an error.
   */
  it('accepts the 200 a git-signal answers with, not only the 202 a queued job does', async () => {
    withApi();
    answers({ jobId: 'att-4c07ab', state: 'passed' }, { status: 200 });

    await expect(
      submitQuest(PLAYER_ID, 'a3-the-trading-hall', { type: 'git-signal' }),
    ).resolves.toEqual({ jobId: 'att-4c07ab', state: 'passed' });
  });

  /** A state outside `JOB_STATES` is a server this client does not understand. Refuse it. */
  it('rejects a state the contract does not have', async () => {
    withApi();
    answers({ jobId: '41', state: 'pending' }, { status: 202 });

    await expect(
      submitQuest(PLAYER_ID, 'a3-recipe-book', { type: 'hidden-tests', code: 'x = 1' }),
    ).rejects.toThrow();
  });
});

describe('polling a job', () => {
  it('asks the path the contract names', async () => {
    withApi();
    answers({
      jobId: '41',
      playerId: PLAYER_ID,
      questId: 'a3-recipe-book',
      state: 'running',
      result: null,
      errorCode: null,
      attemptId: null,
    });

    await getJob('41');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/jobs/41',
      expect.objectContaining({ headers: expect.objectContaining({ accept: 'application/json' }) }),
    );
  });

  /**
   * The mutant this catches is dropping `.parse()`. `durationMs` is a `CountSchema` and a count
   * is not negative — a screen rendering "-4 ms" is the cheap version of a screen rendering a
   * result the engine never produced.
   */
  it('rejects a result the contract forbids rather than rendering it', async () => {
    withApi();
    answers({
      jobId: '41',
      playerId: PLAYER_ID,
      questId: 'a3-recipe-book',
      state: 'passed',
      result: { passed: true, stdout: '', stderr: '', truncated: false, durationMs: -4 },
      errorCode: null,
      attemptId: 'att-1',
    });

    await expect(getJob('41')).rejects.toThrow();
  });
});

/* -----------------------------------------------------------------------------------------
 * The Defend drill — §5.4
 * --------------------------------------------------------------------------------------- */

describe('recording a drill', () => {
  it('posts the one boolean to the concept, at the path the contract names', async () => {
    withApi();
    answers({ conceptId: 'dict', rung: 3, dueOn: '2026-09-08', xpAwarded: 5 });

    await postDrill(PLAYER_ID, 'dict', { repelled: true });

    expect(fetch).toHaveBeenCalledWith(
      `http://localhost:8080/api/players/${PLAYER_ID}/defend/dict`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ repelled: true }) }),
    );
  });

  /**
   * §5.4's ladder is a schedule the learner does not get to negotiate, and `DrillResultSchema`
   * is `.strict()` so that the obvious next field — the date — cannot be added by a client.
   * Parsing on the way *out* is what makes that a fact here rather than only at the server.
   */
  it('refuses to send anything but the boolean', async () => {
    withApi();
    answers({ conceptId: 'dict', rung: 3, dueOn: '2026-09-08', xpAwarded: 5 });

    await expect(
      postDrill(PLAYER_ID, 'dict', { repelled: true, now: 'yesterday' } as never),
    ).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects an outcome the contract forbids rather than rendering it', async () => {
    withApi();
    // `dueOn` is a calendar date. "soon" is not one, and a row saying "back on soon" is worse
    // than a row saying nothing.
    answers({ conceptId: 'dict', rung: 3, dueOn: 'soon', xpAwarded: 5 });

    await expect(postDrill(PLAYER_ID, 'dict', { repelled: true })).rejects.toThrow();
  });
});

/* -----------------------------------------------------------------------------------------
 * Sign-offs. The Console's half of §6.3, and the first gateway call that writes.
 * --------------------------------------------------------------------------------------- */

const pending = (over: Record<string, unknown> = {}) => ({
  attemptId: 'att-8f21c0',
  playerId: 'dm',
  questId: 'a3-the-enchanter',
  questTitle: 'The Enchanter',
  by: 'peer', // the seat that must sign; SignoffRequest.by below is the player id
  submittedAt: '2026-08-29T18:04:00.000Z',
  ...over,
});

describe('the sign-off queue', () => {
  it('asks the path the contract names', async () => {
    withApi();
    answers([]);

    await getSignoffs();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/signoffs',
      expect.objectContaining({ headers: { accept: 'application/json' } }),
    );
  });

  /**
   * The lexicon is not decoration. `by` is `peer` or `dm`, and a server that sent `parent`
   * would be reintroducing a word the whole system spent a spec removing — so the queue must
   * refuse it rather than render a role that does not exist.
   */
  it('rejects a role the lexicon does not have', async () => {
    withApi();
    answers([pending({ by: 'parent' })]);

    await expect(getSignoffs()).rejects.toThrow();
  });

  it('rejects a row missing the title the queue is read by', async () => {
    withApi();
    const { questTitle, ...untitled } = pending();
    void questTitle;
    answers([untitled]);

    await expect(getSignoffs()).rejects.toThrow();
  });
});

describe('resolving a sign-off', () => {
  it('posts the decision to the attempt, as a player id rather than a role', async () => {
    withApi();
    answers({ attemptId: 'att-8f21c0', questId: 'a3-the-enchanter', medal: 'cleared', xpAwarded: 36 });

    await postSignoff('att-8f21c0', { by: PLAYER_ID, granted: true });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/signoffs/att-8f21c0',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ by: PLAYER_ID, granted: true }),
      }),
    );
  });

  /**
   * The defect this test was written for, found 2026-09-01 by reading rather than by failing.
   *
   * `postSignoff` built its own headers — `accept` and `content-type` and nothing else — while
   * every route but `POST /api/session` and `POST /api/session/bootstrap` sits behind the
   * `onRequest` guard in `server.ts`. So granting a sign-off against a live api answered 401,
   * and the Console reported the DM's decision as "could not record it".
   *
   * Nothing caught it because the Console has only ever been exercised against fixtures, and the
   * test above asserts `objectContaining({ method, body })` — which is true of a request with no
   * credential at all. Asserting the header is the only thing that can tell the difference.
   */
  it('carries the token, because a sign-off is not one of the two open routes', async () => {
    withApi();
    window.localStorage.setItem('pyquest.token', 'tok-console-1');
    answers({ attemptId: 'att-8f21c0', questId: 'a3-the-enchanter', medal: 'cleared', xpAwarded: 36 });

    await postSignoff('att-8f21c0', { by: PLAYER_ID, granted: true });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/signoffs/att-8f21c0',
      expect.objectContaining({
        headers: expect.objectContaining({ authorization: 'Bearer tok-console-1' }),
      }),
    );
  });

  /**
   * A 401 is a session that ended, not a sign-off that failed. `send()` maps it to
   * `Unauthenticated` and forgets the token; a `postSignoff` that threw a bare "answered 401"
   * would leave the app holding a credential the api has already refused.
   */
  it('reports an expired session as an ended session, not as a failed sign-off', async () => {
    withApi();
    window.localStorage.setItem('pyquest.token', 'tok-stale');
    answers({ code: 'not-found', message: 'no usable token' }, { ok: false, status: 401 });

    await expect(postSignoff('att-8f21c0', { by: PLAYER_ID, granted: true })).rejects.toThrow(
      Unauthenticated,
    );
    expect(window.localStorage.getItem('pyquest.token')).toBeNull();
  });

  it('parses the award rather than handing the response back', async () => {
    withApi();
    // Correctly shaped and still wrong: `xpAwarded` is a count, and a count is not negative.
    answers({ attemptId: 'att-8f21c0', questId: 'a3-the-enchanter', medal: 'cleared', xpAwarded: -5 });

    await expect(postSignoff('att-8f21c0', { by: PLAYER_ID, granted: true })).rejects.toThrow();
  });

  /**
   * A refusal is the API's *normal* answer to `granted: false` — `server.ts` records the
   * denial and then throws `signoff-denied`, which is a 403. A client that treated that as a
   * failure would report the one action that certainly worked as a lost connection.
   */
  it('reads a 403 on a refusal as the refusal landing, not as a failure', async () => {
    withApi();
    answers(
      { code: 'signoff-denied', message: 'the sign-off was not granted', retryable: false },
      { ok: false, status: 403 },
    );

    const outcome = await postSignoff('att-8f21c0', { by: PLAYER_ID, granted: false, note: 'go deeper' });

    expect(outcome).toEqual({ granted: false, reason: 'the sign-off was not granted' });
  });

  /**
   * The same code, the same status, and the opposite meaning. Asked to *grant*, `signoff-denied`
   * means the API refused the caller — they are the submitter, or they do not hold the seat —
   * and swallowing that would show a sign-off as recorded when nothing was written.
   */
  it('throws when a grant is refused, because that is the API saying no to the caller', async () => {
    withApi();
    answers(
      { code: 'signoff-denied', message: 'a player cannot sign off their own submission', retryable: false },
      { ok: false, status: 403 },
    );

    await expect(postSignoff('att-8f21c0', { by: PLAYER_ID, granted: true })).rejects.toThrow(/403/);
  });

  it('reports a server failure by status, whatever was asked of it', async () => {
    withApi();
    answers({ code: 'internal', message: 'something went wrong on the server', retryable: true }, { ok: false, status: 500 });

    await expect(postSignoff('att-8f21c0', { by: PLAYER_ID, granted: false })).rejects.toThrow(/500/);
  });
});
