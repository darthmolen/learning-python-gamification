import {
  AreaViewSchema,
  CampaignViewSchema,
  DueInvasionsSchema,
  PartyViewSchema,
  QuestViewSchema,
  TomeSchema,
  type AreaView,
  type CampaignView,
  type DueInvasion,
  type PartyView,
  type QuestView,
  type Tome,
} from '@pyquest/contract';
import * as fixtures from '../fixtures/index.ts';

/**
 * The one module that knows where data comes from.
 *
 * **It is endpoint-shaped, not surface-shaped, because the API is.** One screen, one request:
 * `endpoints.ts` puts the whole map in `/campaign` on the grounds that "a map that costs eight
 * shows seven eighths of itself on a slow LAN, and the eighth that is missing is the area he
 * was about to open." A gateway that fanned out into eight calls would be undoing that.
 *
 * **Everything is async, and that is what Phase 5 actually cost.** The plan claimed one module
 * would change. That was wrong, and not because the contract failed — a synchronous function
 * cannot become an asynchronous one without every caller noticing. It is the internet; async is
 * the default and the fixtures were the anomaly.
 *
 * **Everything still parses.** The schemas hold rules the type system cannot see — the §5.4
 * queue cap, one entry per area, `into + toNext === need` — and `.parse()` is the only thing
 * that runs them. A payload that breaks one must not reach a screen just because the server
 * sent it.
 */

/**
 * Where the API lives, or nothing.
 *
 * With no `VITE_API_URL` the gateway answers from fixtures, which is how the app runs with no
 * stack behind it and how `vitest run --project web` stays hermetic. It is not a mock layer
 * pretending to be a server: the fixtures go through the same parsers, so a fixture that drifts
 * from the contract fails a test rather than rendering.
 */
const apiBase = (): string | undefined => {
  const configured = import.meta.env['VITE_API_URL'] as string | undefined;
  return configured === undefined || configured === '' ? undefined : configured;
};

/**
 * `stub` is a thunk, not a value. A fixture that throws — asking for an area outside the
 * campaign, say — must fail the *promise*, not the call that built it: a synchronous throw here
 * escapes before there is anything to catch it, and takes the render down instead of becoming a
 * failed resource the screen can report.
 */
async function get<T>(path: string, schema: { parse: (raw: unknown) => T }, stub: () => unknown): Promise<T> {
  const base = apiBase();
  if (base === undefined) return schema.parse(stub());

  const response = await fetch(`${base}${path}`, { headers: { accept: 'application/json' } });

  if (!response.ok) {
    /*
     * The status, not the body. `ApiErrorSchema` exists and the API sends it, but a failed
     * request is the one place a client cannot assume the shape it hoped for — a proxy, a
     * crashed process or a wrong URL all answer here, and none of them read `endpoints.ts`.
     */
    throw new Error(`${path} answered ${response.status}`);
  }

  return schema.parse(await response.json());
}

/** The whole map: every area with its progress, its boss, and its name where content has one. */
export const getCampaign = (playerId: string): Promise<CampaignView> =>
  get(`/api/players/${playerId}/campaign`, CampaignViewSchema, () => fixtures.campaign);

/** One area, with its quests. */
export const getArea = (playerId: string, area: number): Promise<AreaView> =>
  get(`/api/players/${playerId}/areas/${area}`, AreaViewSchema, () => fixtures.areaView(area));

/** One quest: the brief, the medal slots and what each would pay, and the starter. */
export const getQuest = (playerId: string, questId: string): Promise<QuestView> =>
  get(`/api/players/${playerId}/quests/${questId}`, QuestViewSchema, () => fixtures.questView(questId));

/** The session's invasions (§5.4): at most five, one entry per concept. */
export const getDefend = (playerId: string): Promise<DueInvasion[]> =>
  get(`/api/players/${playerId}/defend`, DueInvasionsSchema, () => fixtures.dueInvasions);

/** The completion board, XP provenance, and open bounties. */
export const getParty = (playerId: string): Promise<PartyView> =>
  get(`/api/players/${playerId}/party`, PartyViewSchema, () => fixtures.party);

/**
 * The syllabus. Not player-scoped and carrying no unlocked state — the syllabus is the same for
 * everyone, and what is open is derived from the campaign the SPA already holds.
 */
export const getTome = (): Promise<Tome> => get('/api/tome', TomeSchema, () => fixtures.tome);

/**
 * Kitchen Table mode is one household (§5.11), and the seats are roles rather than people. Until
 * the Console can name a player, every request is made as this one.
 *
 * There is nothing behind it yet: the database has thirteen tables and no rows, and nothing in
 * the repository creates a household. See
 * `planning/backlog/feature_seed-a-household_2026-08-30.md`.
 */
export const PLAYER_ID = 'peer';
