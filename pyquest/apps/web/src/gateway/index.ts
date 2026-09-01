import {
  ApiErrorSchema,
  AccountSchema,
  AreaViewSchema,
  CampaignViewSchema,
  DueInvasionsSchema,
  PartyViewSchema,
  PendingSignoffsSchema,
  QuestViewSchema,
  SignoffAwardSchema,
  SignoffRequestSchema,
  TokenGrantSchema,
  TomeSchema,
  type Account,
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
import { Unauthenticated, forgetToken, rememberToken, storedToken } from './session.ts';

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
/**
 * `accept`, plus the token when there is one.
 *
 * `authorization` is not a safelisted header, so sending it makes every request preflighted —
 * which is why `server.ts` names it in `access-control-allow-headers`. Without that line the
 * browser refuses *before* the request is made, and the screen shows what looks like the api
 * being down.
 */
function authHeaders(): Record<string, string> {
  const token = storedToken();
  return token === undefined
    ? { accept: 'application/json' }
    : { accept: 'application/json', authorization: `Bearer ${token}` };
}

/**
 * A POST that does not need a token, for the only two routes that do not have one yet.
 *
 * It does not fall back to fixtures. With no `VITE_API_URL` the app is running on fixtures and
 * nobody has to sign in at all, so reaching here without an api is a caller bug rather than an
 * offline mode — and inventing a token would let a screen believe it was signed in.
 */
async function postOpen<T>(
  path: string,
  body: unknown,
  schema: { parse: (raw: unknown) => T },
): Promise<T> {
  const base = apiBase();
  if (base === undefined) throw new Error(`${path} needs an api, and VITE_API_URL is not set`);

  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (response.status === 401) throw new Unauthenticated();
  if (!response.ok) throw new Error(`${path} answered ${response.status}`);
  return schema.parse(await response.json());
}

async function get<T>(path: string, schema: { parse: (raw: unknown) => T }, stub: () => unknown): Promise<T> {
  const base = apiBase();
  if (base === undefined) return schema.parse(stub());

  const response = await fetch(`${base}${path}`, { headers: authHeaders() });

  /*
   * A 401 is not a failed resource, and telling them apart is the whole reason this case is
   * separate. `Awaiting` renders a failed resource as "something went wrong, try again", which is
   * false and useless here: nothing went wrong, the session ended, and pressing the button again
   * will end it again. `Unauthenticated` is what lets a screen say "sign in" instead.
   */
  if (response.status === 401) {
    forgetToken();
    throw new Unauthenticated();
  }

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
 * Is there an api at all?
 *
 * With no `VITE_API_URL` the app answers from fixtures, and **nobody signs in** — there is no
 * server to hold a credential and no token to get. `SessionProvider` reads this so that the
 * fixture app is signed in *synchronously*, rather than flashing a sign-in screen it would then
 * dismiss on the next tick.
 */
export const usesApi = (): boolean => apiBase() !== undefined;

/**
 * Who the fixture app is, without asking anybody.
 *
 * Synchronous because the offline app has no sign-in step at all, and an asynchronous answer
 * would make every screen wait one tick for a fact that is a constant. It lives in the gateway
 * because the fixtures do: `boundary.test.ts` forbids anything outside this directory from
 * importing one, which is the rule that keeps a screen from reading data the gateway should have
 * handed it.
 */
export const offlineAccount = (): Account => AccountSchema.parse(fixtures.me);

/**
 * Exchange a handle and password for a token, and remember it.
 *
 * The one call that carries a password, and the only one that works before there is a token.
 */
export async function signIn(handle: string, password: string): Promise<Account> {
  const grant = await postOpen('/api/session', { handle, password }, TokenGrantSchema);
  rememberToken(grant.token);
  return grant.account;
}

/** Spend the printed bootstrap secret, claim the DM seat, and be signed in as it. */
export async function claimBootstrap(claim: {
  secret: string;
  handle: string;
  displayName: string;
  password: string;
}): Promise<Account> {
  const grant = await postOpen('/api/session/bootstrap', claim, TokenGrantSchema);
  rememberToken(grant.token);
  return grant.account;
}

/**
 * Who this browser's token belongs to, or nothing.
 *
 * **This is what replaced `PLAYER_ID`.** Every screen that needs a player id now waits for this
 * answer rather than importing a constant, which is why the app has a signed-out state at all.
 */
export async function getMe(): Promise<Account | undefined> {
  const base = apiBase();
  if (base === undefined) return fixtures.me as Account;
  if (storedToken() === undefined) return undefined;
  try {
    return await get('/api/me', AccountSchema, () => fixtures.me);
  } catch (error) {
    if (error instanceof Unauthenticated) return undefined;
    throw error;
  }
}

/* -------------------------------------------------------------------------------------------
 * The Console's account acts — §6.8. Every one of these is dm-only at the api.
 * ----------------------------------------------------------------------------------------- */

/**
 * A write that carries the token and reads nothing back but a status.
 *
 * Separate from `postOpen` because these need the credential, and separate from `get` because a
 * 409 has to survive as a 409: the create form says "that handle is taken" and can only do so if
 * the status reaches it.
 */
async function send(path: string, body: unknown): Promise<Response> {
  const base = apiBase();
  if (base === undefined) throw new Error(`${path} needs an api, and VITE_API_URL is not set`);

  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { ...authHeaders(), 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (response.status === 401) {
    forgetToken();
    throw new Unauthenticated();
  }
  return response;
}

/** Everybody in the household, for the Console's roster. */
export const getRoster = (): Promise<Account[]> =>
  get('/api/players', AccountSchema.array(), () => [fixtures.me]);

/** Thrown when a handle is taken, so the form can say which thing went wrong. */
export class HandleTaken extends Error {
  constructor(handle: string) {
    super(`${handle} is already somebody's handle`);
    this.name = 'HandleTaken';
  }
}

export async function createPlayer(input: {
  handle: string;
  displayName: string;
  password: string;
}): Promise<Account> {
  const response = await send('/api/players', input);
  if (response.status === 409) throw new HandleTaken(input.handle);
  if (!response.ok) throw new Error(`creating ${input.handle} answered ${response.status}`);
  return AccountSchema.parse(await response.json());
}

/** Replace a password. The api signs that player out; the screen says so before it is pressed. */
export async function resetPassword(playerId: string, password: string): Promise<void> {
  const response = await send(`/api/players/${playerId}/password`, { password });
  if (!response.ok) throw new Error(`resetting that password answered ${response.status}`);
}

/**
 * Grant or remove a role.
 *
 * A 403 here is the api refusing a DM who is removing their own seat, and it carries a sentence
 * worth showing. Everything else is a failure with a status.
 */
export async function setRole(
  playerId: string,
  role: 'player' | 'dm',
  held: boolean,
): Promise<string[]> {
  const response = await send(`/api/players/${playerId}/roles`, { role, held });
  if (response.status === 403) {
    const body = ApiErrorSchema.safeParse(await response.json().catch(() => undefined));
    throw new Error(body.success ? body.data.message : 'that role change was refused');
  }
  if (!response.ok) throw new Error(`that role change answered ${response.status}`);
  return (await response.json()).roles as string[];
}

/** Sign out. The token is revoked server-side and forgotten here, in that order. */
export async function signOut(): Promise<void> {
  const base = apiBase();
  const token = storedToken();
  if (base !== undefined && token !== undefined) {
    await fetch(`${base}/api/session/end`, { method: 'POST', headers: authHeaders() }).catch(
      () => undefined,
    );
  }
  forgetToken();
}


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
