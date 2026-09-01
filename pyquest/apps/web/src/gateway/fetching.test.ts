import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCampaign, getDefend, getSignoffs, postSignoff } from './index.ts';
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
