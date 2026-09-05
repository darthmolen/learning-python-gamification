/**
 * The meeting that had not happened: `apps/web/src/fixtures` against what `apps/api` answers.
 *
 * Everything in the SPA's fixture file is shaped like the contract and parsed by it, so the two
 * have always agreed about *types*. Nothing had ever compared a fixture to a real response for
 * the same request, which leaves the interesting question open — the SPA could be built against a
 * shape the API is type-correct about and never sends. A seeded household is what makes the
 * comparison possible, so this suite seeds one and asks.
 *
 * **Only the household-independent half is compared, and that is the point rather than a
 * shortcut.** The fixture describes an invented player, so its `cleared` counts and its unlocked
 * bosses are simply a different person's progress and no disagreement at all. What must agree is
 * everything that comes from *content*: which areas exist, which of them carry an `identity` and
 * what is in it, the denominator `progress.total` and whether it is an estimate, the constant in
 * `boss.required`, and the ids of the quests an Area screen lists.
 *
 * **Where they disagree, this suite records the disagreement and does not settle it.** Deciding
 * which side is right is a contract question and belongs to whoever owns the contract, not to the
 * plan that seeded a database. `KNOWN_DISAGREEMENTS` is that record: the list is asserted whole,
 * so a fixture repaired on one side or content changed on the other fails here and sends whoever
 * did it back to this comment rather than leaving a stale note in a plan nobody re-reads.
 */

import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AreaViewSchema, CampaignViewSchema, type AreaCard } from '@pyquest/contract';
import { SEEDED_PLAYERS, seedHousehold } from '@pyquest/db';
import { checkContent, contentRootsFrom } from '@pyquest/content';
import type { FastifyInstance } from 'fastify';
import { loadContentRoot } from '../src/content.ts';
import { buildServer } from '../src/server.ts';
import { HAVE_DATABASE, useMigratedDatabase } from './support/database.ts';
import { inject as authed, signIn } from './support/authed.ts';
import { campaign as campaignFixture, areaView as areaViewFixture } from '../../web/src/fixtures/index.ts';

if (!HAVE_DATABASE) {
  throw new Error('no database: start the stack, or set TEST_DATABASE_URL');
}

const REPO_ROOT = fileURLToPath(new URL('../../../..', import.meta.url));
/** The signed-in player these suites drive routes as. See `support/authed.ts`. */
let TOKEN: string;

const CONTENT = loadContentRoot(REPO_ROOT);
const ITEMS = checkContent(contentRootsFrom(REPO_ROOT)).items;

/** Pinned, so the seeded dates are arithmetic rather than a race with the wall clock. */
const NOW = new Date('2026-08-31T09:00:00.000Z');

const scratch = useMigratedDatabase('fixtures_agree');
let app: FastifyInstance;

beforeAll(async () => {
  await seedHousehold(scratch().client, { now: NOW, items: ITEMS });
  app = buildServer({ content: CONTENT, db: scratch().client, clock: () => NOW });
  await app.ready();
  TOKEN = (await signIn(scratch().client, { handle: 'fixtures' })).token;
}, 60_000);

afterAll(async () => {
  await app?.close();
});

const PEER = SEEDED_PLAYERS.peer.id;

const get = async (url: string): Promise<unknown> => {
  const response = await authed(app, TOKEN, { method: 'GET', url });
  expect(response.statusCode).toBe(200);
  return response.json();
};

/* -------------------------------------------------------------------------------------------
 * The seeded household is somebody
 * ----------------------------------------------------------------------------------------- */

describe('the API over a seeded household', () => {
  it('answers a campaign view that is not empty', async () => {
    const view = CampaignViewSchema.parse(await get(`/api/players/${PEER}/campaign`));

    expect(view.playerId).toBe(PEER);
    expect(view.areas.length).toBeGreaterThan(0);
    expect(view.areas.map((card) => card.area)).toEqual(
      [...view.areas].map((card) => card.area).sort((a, b) => a - b),
    );
  });

  it('draws the four states the seed exists to produce', async () => {
    const view = CampaignViewSchema.parse(await get(`/api/players/${PEER}/campaign`));
    const byArea = new Map(view.areas.map((card) => [card.area, card]));

    const finished = byArea.get(0);
    const boundary = byArea.get(1);
    const started = byArea.get(2);
    const untouched = byArea.get(7);

    // Cleared: every authored quest, so the boss reads unlocked.
    expect(finished?.progress.cleared).toBe(finished?.progress.total);
    expect(finished?.boss.unlocked).toBe(true);
    // §5.2's threshold, exactly: three unlocks, and a fourth would stop testing the boundary.
    expect(boundary?.progress.cleared).toBe(3);
    expect(boundary?.boss).toEqual({ cleared: 3, required: 3, unlocked: true });
    // One. The state that caught the Map drawing an area locked while its label read `1 of ~5`.
    expect(started?.progress.cleared).toBe(1);
    expect(started?.boss.unlocked).toBe(false);
    // Untouched, and still drawn: an area with a manifest and nothing done in it.
    expect(untouched?.progress.cleared).toBe(0);
    expect(untouched?.boss.unlocked).toBe(false);
  });

  it('returns a non-empty invasion queue under the §5.4 cap of five', async () => {
    const queue = (await get(`/api/players/${PEER}/defend`)) as {
      conceptId: string;
      source: string;
      overdueDays: number;
    }[];

    expect(queue.length).toBeGreaterThan(0);
    expect(queue.length).toBeLessThanOrEqual(5);
    for (const entry of queue) expect(entry.overdueDays).toBeGreaterThanOrEqual(0);
    // §5.5 merges a concept due from the ladder *and* from a Datamine into one entry.
    expect(queue.map((entry) => entry.source)).toContain('both');
  });

  it('lists the quests of an area, with one still locked behind the one that was cleared', async () => {
    const view = AreaViewSchema.parse(await get(`/api/players/${PEER}/areas/2`));
    const statuses = new Set(view.quests.map((quest) => quest.status));
    expect(statuses).toContain('cleared');
    expect(statuses).toContain('available');
    expect(statuses).toContain('locked');
  });
});

/* -------------------------------------------------------------------------------------------
 * The comparison
 * ----------------------------------------------------------------------------------------- */

/**
 * What the SPA's fixtures and the API say differently about content, as of 2026-08-31.
 *
 * Recorded, not fixed. See this file's header: the plan that found these seeded a database, and
 * a seed script does not get to decide whether the SPA's stubs or the manifests are right.
 */
const KNOWN_DISAGREEMENTS: readonly string[] = [
  // The fixture's `estimatedQuests` is stale. `area-0.yml` moved 5 -> 10 on 2026-08-31, when
  // session 3's six broken sigils were promoted to fix-it quests, and the stub did not follow.
  'area 0: progress.total — fixture 5, API 10',
  // The fixture's own comment says areas 0 and 2 "carry a title and no weeks or blurb", and that
  // stopped being true: both manifests now have both fields, so both get an identity on the wire.
  'area 0: the fixture sends no identity, the API sends one',
  'area 2: the fixture sends no identity, the API sends one',
  // Four blurbs are paraphrases rather than the manifests' text — the same comment claims
  // "Nothing here invents content", and for these four it does. Areas 3 and 5 match exactly.
  'area 1: identity.blurb — fixture "Loops and conditions, and the shapes they draw.", API "Turtle becomes generative art. Loops repeat and conditions choose."',
  // The fixture's order was shuffled on purpose on 2026-09-03, and the change is recorded here
  // rather than smoothed over: the Area screen sorts by DC now, so a fixture that arrived in DC
  // order could not tell a screen that sorts from one that does not. The disagreement itself is
  // unchanged — area 3 has no authored quests, so the API sends none.
  'area 3: quests — fixture [a3-the-trading-hall, a3-recipe-book, a3-the-enchanter, a3-inventory-lists, a3-the-smelter], API []',
  'area 4: identity.blurb — fixture "Naming a thing is how you stop repeating it.", API "Pygame Zero and a game loop. A long script becomes functions worth naming."',
  'area 6: identity.blurb — fixture "Files, APIs, and data that did not come from you.", API "Save the world, share a seed, call a live API. Data outlives the program."',
  'area 7: identity.blurb — fixture "Tests, review, and code somebody else can read.", API "Tests, types and the debugger. Read unfamiliar code, then open a pull request."',
].sort();

interface FixtureCard {
  area: number;
  identity?: unknown;
  progress: { cleared: number; total: number; estimated: boolean };
  boss: { cleared: number; required: number; unlocked: boolean };
}

describe('the SPA fixtures and the API', () => {
  it('agree about which areas exist', async () => {
    const view = CampaignViewSchema.parse(await get(`/api/players/${PEER}/campaign`));
    const fixture = campaignFixture as { areas: FixtureCard[] };

    expect(fixture.areas.map((card) => card.area)).toEqual(view.areas.map((card) => card.area));
  });

  it('agree about every content-derived field, except where the record below says otherwise', async () => {
    const view = CampaignViewSchema.parse(await get(`/api/players/${PEER}/campaign`));
    const fixture = campaignFixture as { areas: FixtureCard[] };
    const served = new Map<number, AreaCard>(view.areas.map((card) => [card.area, card]));

    const found: string[] = [];
    for (const card of fixture.areas) {
      const real = served.get(card.area);
      if (real === undefined) {
        found.push(`area ${card.area}: the fixture has it, the API does not`);
        continue;
      }

      const fixtureHasIdentity = card.identity !== undefined;
      const apiHasIdentity = real.identity !== undefined;
      if (fixtureHasIdentity !== apiHasIdentity) {
        found.push(
          `area ${card.area}: the fixture sends ${fixtureHasIdentity ? 'an' : 'no'} identity, ` +
            `the API sends ${apiHasIdentity ? 'one' : 'none'}`,
        );
      } else if (apiHasIdentity) {
        // Field by field, because "the identities differ" is a sentence nobody can act on and
        // two JSON blobs side by side is worse: the whole finding here is *which* field.
        const mine = card.identity as Record<string, unknown>;
        const theirs = real.identity as unknown as Record<string, unknown>;
        for (const field of ['title', 'weeks', 'blurb']) {
          if (JSON.stringify(mine[field]) !== JSON.stringify(theirs[field])) {
            found.push(
              `area ${card.area}: identity.${field} — fixture ${JSON.stringify(mine[field])}, ` +
                `API ${JSON.stringify(theirs[field])}`,
            );
          }
        }
      }

      // The denominator is content's, not the household's: `estimatedQuests` and the count of
      // authored quests decide it, and a fixture that disagrees is describing a different corpus.
      if (card.progress.total !== real.progress.total) {
        found.push(`area ${card.area}: progress.total — fixture ${card.progress.total}, API ${real.progress.total}`);
      }
      if (card.progress.estimated !== real.progress.estimated) {
        found.push(
          `area ${card.area}: progress.estimated — fixture ${card.progress.estimated}, API ${real.progress.estimated}`,
        );
      }
      // §5.2's constant. Not per-household, and not negotiable by a stub.
      if (card.boss.required !== real.boss.required) {
        found.push(`area ${card.area}: boss.required — fixture ${card.boss.required}, API ${real.boss.required}`);
      }
    }

    // Area 3 is the only area the fixture lists quests for, so it is the only one to compare.
    const fixtureArea3 = areaViewFixture(3) as { quests: { id: string }[] };
    const realArea3 = AreaViewSchema.parse(await get(`/api/players/${PEER}/areas/3`));
    const fixtureIds = fixtureArea3.quests.map((quest) => quest.id);
    const realIds = realArea3.quests.map((quest) => quest.id);
    if (JSON.stringify(fixtureIds) !== JSON.stringify(realIds)) {
      found.push(`area 3: quests — fixture [${fixtureIds.join(', ')}], API [${realIds.join(', ')}]`);
    }

    // Sorted, so the record below reads as a list rather than as an order of discovery.
    expect([...found].sort()).toEqual(KNOWN_DISAGREEMENTS);
  });
});
