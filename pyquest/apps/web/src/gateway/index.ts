import {
  ApiErrorSchema,
  AreaViewSchema,
  CampaignViewSchema,
  DueInvasionsSchema,
  PartyViewSchema,
  PendingSignoffsSchema,
  QuestViewSchema,
  SignoffAwardSchema,
  SignoffRequestSchema,
  TomeSchema,
  type AreaView,
  type CampaignView,
  type DueInvasion,
  type PartyView,
  type PendingSignoff,
  type QuestView,
  type SignoffAward,
  type SignoffRequest,
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


/* -------------------------------------------------------------------------------------------
 * Sign-offs — §6.3, §5.11. The Console's half, and the only gateway calls that write.
 * ----------------------------------------------------------------------------------------- */

/**
 * The queue, household-wide and deliberately unfiltered.
 *
 * `PendingSignoffsSchema` says why: "a queue filtered to sign-offs you can grant would hide the
 * parent's own pending teach-back from the screen whose entire job is to show it." So this asks
 * for everything and the screen renders the rows the caller may not act on, rather than the
 * gateway quietly deciding which ones exist.
 */
export const getSignoffs = (): Promise<PendingSignoff[]> =>
  get('/api/signoffs', PendingSignoffsSchema, () => fixtures.pendingSignoffs);

/**
 * Grant or refuse one sign-off.
 *
 * **A refusal is not a failure, and the transport cannot tell you which one you have.**
 * `server.ts` records the denial and *then* throws `signoff-denied`, which is a 403 — so the
 * DM pressing "not yet" and the server falling over arrive on the same wire in the same shape.
 * What separates them is what was asked: a 403 answering `granted: false` is the refusal
 * landing, and a 403 answering `granted: true` is the API refusing the caller (they are the
 * submitter, or they do not hold the seat the quest names) and must not read as recorded.
 *
 * Hence an outcome rather than a bare award. A screen that had to catch an exception to draw
 * its own deliberate "sent back" would be treating the working path as the broken one.
 */
export type SignoffOutcome =
  | { granted: true; award: SignoffAward }
  | { granted: false; reason: string };

export async function postSignoff(attemptId: string, request: SignoffRequest): Promise<SignoffOutcome> {
  /*
   * Parsed on the way out, not only on the way in. `by` is a player id and `granted` is not
   * optional; a request assembled wrong should fail here, where the stack trace names this
   * module, rather than as a 403 that reads exactly like a rule the household broke.
   */
  const body = SignoffRequestSchema.parse(request);
  const path = `/api/signoffs/${attemptId}`;
  const base = apiBase();

  if (base === undefined) {
    return body.granted
      ? { granted: true, award: SignoffAwardSchema.parse(fixtures.signoffAward(attemptId)) }
      : { granted: false, reason: body.note ?? 'the sign-off was not granted' };
  }

  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (response.ok) return { granted: true, award: SignoffAwardSchema.parse(await response.json()) };

  /*
   * The one place a client reads an error body, and it is read through the contract rather than
   * trusted: anything that is not exactly `ApiErrorSchema` with `signoff-denied` falls through
   * to the status, which is what a proxy or a crashed process answers with.
   */
  const failure = ApiErrorSchema.safeParse(await response.json().catch(() => undefined));
  if (!body.granted && failure.success && failure.data.code === 'signoff-denied') {
    return { granted: false, reason: failure.data.message };
  }

  throw new Error(`${path} answered ${response.status}`);
}
