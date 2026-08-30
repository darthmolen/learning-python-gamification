import { afterEach, describe, expect, it, vi } from 'vitest';
import { PLAYER_ID, getCampaign, getDefend } from './index.ts';

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
    answers({ playerId: 'peer', areas: [] });

    await getCampaign(PLAYER_ID);

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/players/peer/campaign',
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
      playerId: 'peer',
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
