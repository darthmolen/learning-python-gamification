/**
 * The wire surface — routes, request bodies, and the error shape. Owned by the `api` track.
 *
 * `payloads.ts` says what a quest card and an area's progress look like. This file says which
 * URL returns them, what a client posts to get there, and what comes back when it goes wrong.
 * Those three were missing when `feature_api-and-runner` started, which is why "every endpoint
 * in `@pyquest/contract`" was not a criterion anybody could have met, and why they are written
 * here before the first Fastify route exists: the SPA stubs against this file today.
 *
 * ## What this file will not do
 *
 * **It ships no clock.** Not a `?now=`, not a `now` field on a request body. §5.4's schedule is
 * not negotiable by the person it is scheduling, and a client that supplies the date can ask for
 * yesterday and skip a session's invasions. The API reads its own clock and passes the date to
 * the engine, which takes it as a parameter because §6.7 forbids it one of its own.
 *
 * **It ships nothing that locates a hidden test.** `PublicVerifierSchema` is the whole of what a
 * client learns about a verifier, and it is `.strict()` so a handler cannot widen it by spreading
 * a content object into a response. §6.3: anything shipped to the browser is readable.
 *
 * **It computes nothing.** The composite views below are containers for shapes the engine
 * returned. A field here that could only be produced by adding two numbers together would be the
 * contract inviting the API across §6.7.
 *
 * Imports run one way, as they do in the sibling modules: this file reads `primitives.ts` and
 * `payloads.ts`, which is the direction the route table needs, and never `progress.ts` — the row
 * shapes belong to the `db` track and a route that returned one would be serving storage.
 */

import { z } from 'zod';
import {
  AreaSchema,
  DifficultyClassSchema,
  KindSchema,
  MedalSchema,
} from '@pyquest/content/browser';
import { ConceptIdSchema, ContentIdSchema, CountSchema } from './primitives.ts';
import {
  AreaIdentitySchema,
  AreaProgressSchema,
  AvailableQuestsSchema,
  BossStateSchema,
  QuestStatusSchema,
  StandingsSchema,
  XpSourcesSchema,
} from './payloads.ts';

/* -------------------------------------------------------------------------------------------
 * The error shape — one for every route
 * ----------------------------------------------------------------------------------------- */

/**
 * The nine failures a client has to tell apart.
 *
 * A client that distinguishes them by matching on `message` breaks the day somebody fixes a
 * typo, so the discrimination is a code. The list is short on purpose: each member exists
 * because some screen does something different about it, and a code nothing branches on is a
 * code that should have been `internal`.
 *
 * `runner-timeout` and `runner-killed` are separate for the reason `JobState` keeps `killed`:
 * running out of room is not being wrong, and the right next sentence to an 11–14-year-old
 * differs. `illegal-modifiers` maps to the engine's `IllegalModifierSetError`, which already
 * exists and already carries its reason.
 */
export const API_ERROR_CODES = [
  'not-found',
  'content-invalid',
  'verifier-failed',
  'runner-timeout',
  'runner-killed',
  'illegal-modifiers',
  'already-awarded',
  'signoff-denied',
  'internal',
] as const;

export const ApiErrorCodeSchema = z.enum(API_ERROR_CODES);
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;

/**
 * Every error body, on every route.
 *
 * `retryable` is required rather than optional, and that is the point of it: the SPA decides
 * whether to offer the button again without knowing what any code means, and a field that is
 * absent half the time is a field the SPA has to guess about — which is the guess it was added
 * to remove.
 */
export const ApiErrorSchema = z
  .object({
    code: ApiErrorCodeSchema,
    message: z.string().min(1),
    retryable: z.boolean(),
    details: z.record(z.unknown()).optional(),
  })
  .strict();

export type ApiError = z.infer<typeof ApiErrorSchema>;

/* -------------------------------------------------------------------------------------------
 * Jobs — spec §6.6
 * ----------------------------------------------------------------------------------------- */

/**
 * What a client sees a runner job doing. Six states, and `claimed` is not one of them.
 *
 * `progress.ts` types the same table in its **storage** states, because a row shape that does not
 * mirror the row is a second definition of the table. This is the translation, and the whole of
 * it is `claimed → running`: a worker having taken the row is a fact about the queue and not a
 * fact a screen can use.
 *
 * `killed` survives as its own state against a review that suggested folding it into `failed`.
 * It means the resource limits fired — memory, processes, output — and it is the one outcome
 * where "your code is wrong" is the wrong thing to say. A client that cannot tell it from a
 * failure cannot say either sentence.
 */
export const JOB_STATES = ['queued', 'running', 'passed', 'failed', 'timed-out', 'killed'] as const;

export const JobStateSchema = z.enum(JOB_STATES);
export type JobState = z.infer<typeof JobStateSchema>;

/** What `POST /submit` returns: an id to poll and the state it starts in. */
export const JobAcceptedSchema = z
  .object({
    jobId: z.string().min(1),
    state: JobStateSchema,
  })
  .strict();

export type JobAccepted = z.infer<typeof JobAcceptedSchema>;

/**
 * What the runner produced, as the client is allowed to see it.
 *
 * `truncated` is a field rather than an ellipsis in the text, because output arrives capped
 * (§6.6) and a learner reading a cut-off traceback needs to know it was cut off rather than
 * concluding the program stopped there.
 *
 * `stdout` and `stderr` are the runner's summary, never a pytest traceback: a traceback prints
 * the failing test's source, and the failing test is the hidden one.
 */
export const JobResultSchema = z
  .object({
    passed: z.boolean(),
    stdout: z.string(),
    stderr: z.string(),
    truncated: z.boolean(),
    durationMs: CountSchema,
  })
  .strict();

export type JobResult = z.infer<typeof JobResultSchema>;

/** `GET /api/jobs/:jobId`. Poll this after Submit; it is the only thing Submit promises. */
export const JobViewSchema = z
  .object({
    jobId: z.string().min(1),
    playerId: z.string().min(1),
    questId: ContentIdSchema,
    state: JobStateSchema,
    result: JobResultSchema.nullable(),
    errorCode: ApiErrorCodeSchema.nullable(),
    /** The `attempts` row this job produced. Null until the job has a verdict. */
    attemptId: z.string().min(1).nullable(),
  })
  .strict();

export type JobView = z.infer<typeof JobViewSchema>;

/* -------------------------------------------------------------------------------------------
 * Submit — one route, four verifiers
 * ----------------------------------------------------------------------------------------- */

/**
 * What Submit posts, discriminated on the quest's verifier type (§6.3).
 *
 * One route rather than four. Which verifier runs is a property of the quest, not of the URL the
 * client picked, and a client that chooses the URL is a client that can choose the easier
 * verifier. It is also what lets the button say Submit on every quest, which is the UI rule that
 * labels do not change with state.
 *
 * The bodies differ because the verifiers do. `hidden-tests` carries the code, because the code
 * is what the API has no other way to see. `local-repo` carries at most a ref: push is the
 * verification mechanism (§6.4), so the API tests what was pushed and would be wrong to accept a
 * working tree instead — which is why `code` is refused here rather than ignored. `peer-signoff`
 * and `git-signal` carry nothing at all; the evidence is a person or a git history.
 */
const HiddenTestsSubmitSchema = z
  .object({
    type: z.literal('hidden-tests'),
    code: z.string().min(1),
  })
  .strict();

const LocalRepoSubmitSchema = z
  .object({
    type: z.literal('local-repo'),
    /** Defaults to `origin/main` server-side. A ref, never code. */
    ref: z.string().min(1).optional(),
  })
  .strict();

const PeerSignoffSubmitSchema = z.object({ type: z.literal('peer-signoff') }).strict();

const GitSignalSubmitSchema = z.object({ type: z.literal('git-signal') }).strict();

export const SubmitRequestSchema = z.discriminatedUnion('type', [
  HiddenTestsSubmitSchema,
  LocalRepoSubmitSchema,
  PeerSignoffSubmitSchema,
  GitSignalSubmitSchema,
]);

export type SubmitRequest = z.infer<typeof SubmitRequestSchema>;

/* -------------------------------------------------------------------------------------------
 * The verifier, as a client may know it — spec §6.3
 * ----------------------------------------------------------------------------------------- */

/**
 * The half of a quest's verifier that is safe to ship.
 *
 * `VerifierSchema` in `@pyquest/content` carries `tests` and `starter` paths. Re-exporting it on
 * a quest payload would put the location of the hidden tests in a browser, which is the thing
 * §6.3 exists to prevent and which no amount of "the file is not served" makes safe. So this is
 * a second, narrower shape rather than a reuse, and the duplication is deliberate.
 *
 * `by` and `signal` stay, because they are not secrets: who signs off and what git signal counts
 * are both things the screen has to say out loud before the player can do them.
 *
 * `.strict()` is what makes this enforcement rather than intention. A handler that spreads a
 * content item into a response fails the parse instead of leaking the path.
 */
export const PublicVerifierSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('hidden-tests') }).strict(),
  z.object({ type: z.literal('local-repo') }).strict(),
  z.object({ type: z.literal('peer-signoff'), by: z.enum(['peer', 'dm']) }).strict(),
  z
    .object({
      type: z.literal('git-signal'),
      signal: z.enum(['commit', 'push', 'journal-entry', 'tag']),
    })
    .strict(),
]);

export type PublicVerifier = z.infer<typeof PublicVerifierSchema>;

/* -------------------------------------------------------------------------------------------
 * The quest screen
 * ----------------------------------------------------------------------------------------- */

/**
 * One medal slot and what taking it would pay, per §5.10.
 *
 * The numbers are the engine's — `effectiveDC` and `medalDelta` — carried rather than computed.
 * A slot the player already holds is reported in `medalsHeld`; this list is the offer, and §5.10
 * renders an unearned slot greyed rather than hiding it.
 */
export const MedalSlotSchema = z
  .object({
    medal: MedalSchema,
    effectiveDC: DifficultyClassSchema,
    /** What this medal would pay from here. Zero is legal and §5.10 says it reads as a brag. */
    xp: CountSchema,
  })
  .strict();

export type MedalSlot = z.infer<typeof MedalSlotSchema>;

/** `GET /api/players/:playerId/quests/:questId` — the quest, its brief, and what it would pay. */
export const QuestViewSchema = z
  .object({
    id: ContentIdSchema,
    title: z.string().min(1),
    kind: KindSchema,
    area: AreaSchema,
    dc: DifficultyClassSchema,
    concepts: z.array(ConceptIdSchema).min(1),
    requires: z.array(ContentIdSchema),
    status: QuestStatusSchema,
    /** The brief's markdown, read from the content root. Rendering is the UI's. */
    brief: z.string(),
    medalsHeld: z.array(MedalSchema),
    medalSlots: z.array(MedalSlotSchema),
    verifier: PublicVerifierSchema,
    /** The starter file's text, when the quest has one. Run happens in the browser (§6.1). */
    starter: z.string().optional(),
    /** §5.2 — a boss offers two or three framings and the player chooses. */
    themes: z.array(z.string().min(1)).min(2).max(3).optional(),
  })
  .strict();

export type QuestView = z.infer<typeof QuestViewSchema>;

/* -------------------------------------------------------------------------------------------
 * The map and the area screen
 * ----------------------------------------------------------------------------------------- */

/**
 * One area on the map: where it stands, and what it is called when the manifest says.
 *
 * **`identity` is optional, and that is a fact about the content rather than a softness here.**
 * `AreaIdentitySchema` requires `weeks` and `blurb`; `AreaManifestSchema` still has both optional
 * because `area-0.yml` and `area-2.yml` carry neither, and `payloads.ts` already ruled on what
 * happens then — "an area without them simply has no identity to send until then." The
 * alternative is an API that either invents a blurb or refuses to draw the map, and the map with
 * two unlabelled areas is the honest one. When all eight manifests carry the fields, tighten
 * `AreaManifestSchema` first and this becomes required for free.
 */
export const AreaCardSchema = z
  .object({
    area: AreaSchema,
    identity: AreaIdentitySchema.optional(),
    progress: AreaProgressSchema,
    boss: BossStateSchema,
  })
  .strict();

export type AreaCard = z.infer<typeof AreaCardSchema>;

/**
 * `GET /api/players/:playerId/campaign` — the whole map in one request.
 *
 * One screen, one request. A map that costs eight shows seven eighths of itself on a slow LAN,
 * and the eighth that is missing is the area he was about to open.
 *
 * An area appears once, checked here for the same reason `AreaIdentitiesSchema` checks it: a
 * duplicate means whatever assembled this is wrong, and a wrong map must not cross the wire.
 */
export const CampaignViewSchema = z
  .object({
    playerId: z.string().min(1),
    areas: z
      .array(AreaCardSchema)
      .refine((areas) => new Set(areas.map((a) => a.area)).size === areas.length, {
        message: 'an area appears once — a duplicate card means two states for one area',
      }),
  })
  .strict();

export type CampaignView = z.infer<typeof CampaignViewSchema>;

/**
 * `GET /api/players/:playerId/areas/:area` — the area screen, in one request.
 *
 * The area's one-line brief is `identity.blurb`, which is where the content puts it; there is no
 * second brief field, because a second place to write the sentence is the place that goes stale.
 */
export const AreaViewSchema = AreaCardSchema.extend({
  playerId: z.string().min(1),
  quests: AvailableQuestsSchema,
}).strict();

export type AreaView = z.infer<typeof AreaViewSchema>;

/* -------------------------------------------------------------------------------------------
 * Defend — spec §5.4
 * ----------------------------------------------------------------------------------------- */

/**
 * `POST /api/players/:playerId/defend/:conceptId` — repelled, or not.
 *
 * One boolean, and `.strict()` is what keeps it one: the obvious next field is the date, and the
 * date is exactly what a client must not be able to supply. §5.4's ladder is a schedule the
 * learner does not get to negotiate, and `{ repelled: true, now: 'yesterday' }` is how they
 * would.
 */
export const DrillResultSchema = z.object({ repelled: z.boolean() }).strict();
export type DrillResult = z.infer<typeof DrillResultSchema>;

/**
 * Where the concept landed on the ladder afterwards.
 *
 * `rung` and `dueOn` are `nextRung` and the interval it implies, both the engine's. The API
 * stores what it is told and returns the same thing; nothing here is recomputed on the way out.
 */
export const DrillOutcomeSchema = z
  .object({
    conceptId: ConceptIdSchema,
    rung: CountSchema,
    /** ISO 8601 calendar date, from the engine's interval and the API's clock. */
    dueOn: z.string().date(),
    xpAwarded: CountSchema,
  })
  .strict();

export type DrillOutcome = z.infer<typeof DrillOutcomeSchema>;

/* -------------------------------------------------------------------------------------------
 * The Party screen — spec §5.8
 * ----------------------------------------------------------------------------------------- */

/** One posting on §5.8's board, as a screen needs it: the row plus the names on it. */
export const BountyCardSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    xp: z.number().int().positive(),
    state: z.enum(['open', 'claimed', 'done', 'withdrawn']),
    postedBy: z.string().min(1),
    claimedBy: z.string().min(1).nullable(),
    postedAt: z.string().datetime(),
  })
  .strict();

export type BountyCard = z.infer<typeof BountyCardSchema>;

/**
 * `GET /api/players/:playerId/party`.
 *
 * `xpSources` ships as an array the API fills from the engine, and today the engine has no
 * `xpSources` to call — this plan declined to write it, because an API that sums medals is doing
 * engine arithmetic on the wrong side of §6.7. So the field arrives empty until the engine's
 * successor plan lands it, which the SPA already handles because the shape shipped first.
 */
export const PartyViewSchema = z
  .object({
    standings: StandingsSchema,
    xpSources: XpSourcesSchema,
    bounties: z.array(BountyCardSchema),
  })
  .strict();

export type PartyView = z.infer<typeof PartyViewSchema>;

/* -------------------------------------------------------------------------------------------
 * The Tome — content, and only content
 * ----------------------------------------------------------------------------------------- */

/**
 * `GET /api/tome` — the syllabus, as concepts by area.
 *
 * Not player-scoped, and it returns no unlocked state. An earlier draft returned both, which is
 * progress wearing a content route's clothes: the syllabus is the same for everyone (§6.7), and
 * the SPA already holds the player's areas from `/campaign` and derives what is open from the
 * two. That it renders differently per player is the UI's business.
 *
 * `.strict()` is the enforcement. An `unlocked` field added here in a hurry fails the parse.
 */
export const TomeConceptSchema = z
  .object({
    id: ConceptIdSchema,
    label: z.string().min(1),
  })
  .strict();

export type TomeConcept = z.infer<typeof TomeConceptSchema>;

export const TomeAreaSchema = z
  .object({
    area: AreaSchema,
    concepts: z.array(TomeConceptSchema),
  })
  .strict();

export type TomeArea = z.infer<typeof TomeAreaSchema>;

export const TomeSchema = z.object({ areas: z.array(TomeAreaSchema) }).strict();

export type Tome = z.infer<typeof TomeSchema>;

/* -------------------------------------------------------------------------------------------
 * Sign-offs — spec §6.3, §5.11
 * ----------------------------------------------------------------------------------------- */

/**
 * One row of the Console's queue.
 *
 * `by` is the role the quest's verifier names, carried so the queue can say who is being asked.
 * `playerId` is the submitter, and the API refuses a sign-off where the two are the same person.
 */
export const PendingSignoffSchema = z
  .object({
    attemptId: z.string().min(1),
    playerId: z.string().min(1),
    questId: ContentIdSchema,
    questTitle: z.string().min(1),
    by: z.enum(['peer', 'dm']),
    submittedAt: z.string().datetime(),
  })
  .strict();

export type PendingSignoff = z.infer<typeof PendingSignoffSchema>;

/**
 * `GET /api/signoffs?state=pending` — household-wide, and deliberately not filtered by caller.
 *
 * The Console is the DM seat and sees every pending sign-off. §5.11's teach-back runs both
 * directions, so a queue filtered to "sign-offs you can grant" would hide the parent's own
 * pending teach-back from the screen whose entire job is to show it.
 */
export const PendingSignoffsSchema = z.array(PendingSignoffSchema);

/**
 * `POST /api/signoffs/:attemptId`.
 *
 * `by` is a player id, not a role, and that is the whole of the difference between a check and a
 * claim. A client-supplied role is an assertion anyone on the LAN can make; a player id is
 * looked up against `player_roles`, which is where the role actually lives. The API refuses the
 * sign-off when the approver is the submitter, or when they do not hold the role the quest names.
 */
export const SignoffRequestSchema = z
  .object({
    by: z.string().min(1),
    granted: z.boolean(),
    note: z.string().min(1).optional(),
  })
  .strict();

export type SignoffRequest = z.infer<typeof SignoffRequestSchema>;

/** What a granted sign-off paid. A denial returns `signoff-denied` rather than a zero award. */
export const SignoffAwardSchema = z
  .object({
    attemptId: z.string().min(1),
    questId: ContentIdSchema,
    medal: MedalSchema,
    xpAwarded: CountSchema,
  })
  .strict();

export type SignoffAward = z.infer<typeof SignoffAwardSchema>;

/* -------------------------------------------------------------------------------------------
 * The Journal — spec §5.6. Typed here, not served yet.
 * ----------------------------------------------------------------------------------------- */

/**
 * §5.6's entry: what he wrote that session, the commit that proves it happened, what it paid,
 * and the DM's reply if one exists.
 *
 * `reply` is optional because a reply lands later than the entry, and a Journal that cannot
 * render an unanswered entry cannot render the common case.
 *
 * **`prompt` was removed on 2026-08-31 and the four-prompt problem went with it.** §5.6 wants
 * four prompts where this modelled one `prompt: string`, which under a Postgres store was schema
 * churn — four columns, a JSON blob, or a child table. ADR 0004 put the text in his repository
 * instead, and **in markdown four prompts are four headings**: visible to the person writing them
 * rather than encoded in a migration. `body` is the entry as he wrote it, `###` headings and all.
 *
 * The three fields this shape was accused of not being able to fill were never missing. They were
 * in the wrong store — `journal_entries` is the *ledger of paid journal commits*, and `commitSha`
 * is the join between a paid row and the prose it paid for.
 *
 * **The reply is not part of `body`.** In Areas 0–1 the DM writes under `## DM reply` in the same
 * file; from Area 2a it is a Gitea comment (§5.6). Two sources, sequential rather than
 * alternative, and one field — so a screen never has to know which era an entry came from.
 */
export const JournalEntrySchema = z
  .object({
    sessionDate: z.string().date(),
    body: z.string().min(1),
    commitSha: z.string().regex(/^[0-9a-f]{7,40}$/, 'must be a git sha, 7 to 40 hex characters'),
    xpAwarded: CountSchema,
    reply: z.string().min(1).optional(),
  })
  .strict();

export type JournalEntry = z.infer<typeof JournalEntrySchema>;

/**
 * `GET /api/players/:playerId/journal/template` — the entry to copy, for the area he is in.
 *
 * **It is served rather than shipped in the client, and that is the whole reason this shape
 * exists.** `curriculum/area-0/journal/TEMPLATE.md` and `area-1`'s differ substantially — the
 * `**Area:**` line, and coaching that names what goes wrong in *that* area's material — and one
 * lands per area as the curriculum is authored. Sixty lines of that copied into a component is
 * the `AREA_NAMES` mistake at four times the size: content duplicated into a screen, going stale
 * silently the moment somebody edits the file it was copied from.
 *
 * `area` is on the payload because the screen has to say which area's template it is showing.
 * The server picks it from progress, and a heuristic that guesses wrong in silence is worse than
 * one a reader can see and correct.
 *
 * `path` is where it goes — `journal.md`, or whatever `JOURNAL_PATH` names. The instruction on
 * screen is then served too, rather than a second place to write the filename down.
 */
export const JournalTemplateSchema = z
  .object({
    area: AreaSchema,
    /** The file's markdown, verbatim, coaching comments and all. */
    markdown: z.string().min(1),
    /** Repository-relative, and the same path `git-signal: journal-entry` watches. */
    path: z.string().min(1),
  })
  .strict();

export type JournalTemplate = z.infer<typeof JournalTemplateSchema>;

/* -------------------------------------------------------------------------------------------
 * The route table
 * ----------------------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------------------------
 * Accounts and sessions — who is asking, and what proves it
 * ----------------------------------------------------------------------------------------- */

/**
 * A player as anybody is allowed to see one.
 *
 * **There is no credential on this shape and there is no room for one.** `.strict()` is what makes
 * that a guarantee rather than an intention: a handler that spread a database row in here would
 * fail to parse rather than quietly serving a hash to a browser. §6.3's rule — anything shipped to
 * the client is readable — applies hardest to the one table that holds secrets.
 *
 * `roles` is the stored vocabulary (`player`, `dm`) and not the lexicon's `peer`. A peer is what
 * you are *to somebody* on a particular piece of work, so it is a relation computed against the
 * thing being signed and there is no row for it. See the plan's *Two vocabularies*.
 */
export const AccountSchema = z
  .object({
    id: z.string().min(1),
    handle: z.string().min(1),
    displayName: z.string().min(1),
    roles: z.array(z.enum(['player', 'dm'])),
  })
  .strict();

export type Account = z.infer<typeof AccountSchema>;

/** What `POST /api/session` takes. The one request in this api that carries a password. */
export const SignInRequestSchema = z
  .object({
    handle: z.string().min(1),
    password: z.string().min(1),
  })
  .strict();

export type SignInRequest = z.infer<typeof SignInRequestSchema>;

/**
 * The token, the account it belongs to, and when it stops working.
 *
 * **Named `TokenGrant` because `Session` was already taken, and the collision is the plan's own.**
 * `progress.ts` exports `Session` for the `sessions` table — a *teaching* session, a Saturday
 * morning, attended or forgiven. The plan warned that an auth table must not be called `sessions`
 * and the migration obeyed; the contract then walked into the same collision one layer up, where
 * TypeScript caught it as an ambiguous re-export. Two unrelated meanings, one word, and the
 * compiler refused to choose. `POST /api/session` keeps its name because a URL is a place rather
 * than a type, and signing in is what a person calls it.
 *
 * `expiresAt` is on the wire so the SPA can tell a stale token from a broken one without asking.
 * §5.4 puts a session at 45–60 minutes and this token lasts twelve hours, so in practice a screen
 * never sees this fire — which is the point of the number, not an argument for omitting the field.
 */
export const TokenGrantSchema = z
  .object({
    token: z.string().min(1),
    expiresAt: z.string().datetime(),
    account: AccountSchema,
  })
  .strict();

export type TokenGrant = z.infer<typeof TokenGrantSchema>;

/**
 * What `POST /api/session/bootstrap` takes: the printed secret, and the seat to claim with it.
 *
 * The secret is *spent* here rather than issued here. `packages/db/src/bootstrap.ts` is what
 * creates one, and it is a command line rather than a route because an api that hands out a
 * bootstrap secret hands out the household.
 */
export const BootstrapRequestSchema = z
  .object({
    secret: z.string().min(1),
    handle: z.string().min(1),
    displayName: z.string().min(1),
    password: z.string().min(1),
  })
  .strict();

export type BootstrapRequest = z.infer<typeof BootstrapRequestSchema>;

/** What the Console posts to make a player. No role: everyone created here is a `player`. */
export const CreatePlayerRequestSchema = z
  .object({
    handle: z.string().min(1),
    displayName: z.string().min(1),
    password: z.string().min(1),
  })
  .strict();

export type CreatePlayerRequest = z.infer<typeof CreatePlayerRequestSchema>;

/** A password reset, which is the DM's act because no address was collected to email. */
export const SetPasswordRequestSchema = z.object({ password: z.string().min(1) }).strict();

export type SetPasswordRequest = z.infer<typeof SetPasswordRequestSchema>;

/**
 * Granting or removing a role.
 *
 * `held` rather than two verbs, because promote and demote are one decision with a boolean in it
 * and two routes would be two places to forget the token revocation that follows either.
 */
export const SetRoleRequestSchema = z
  .object({
    role: z.enum(['player', 'dm']),
    held: z.boolean(),
  })
  .strict();

export type SetRoleRequest = z.infer<typeof SetRoleRequestSchema>;

/**
 * Thirteen routes, written down rather than left to be discovered by reading handlers.
 *
 * It is a value, not only a type, because the properties worth holding are countable ones: that
 * there is exactly one Submit route, that no path or query names a clock, that everything a
 * player reads is scoped by `:playerId`. A table nobody can iterate is a table nobody can check.
 *
 * Player-scoped reads carry the player in the path because Kitchen Table has two players, and a
 * route that implies one is a route that gets rewritten the first time the parent opens the app.
 * The four that are not scoped are not one player's view: a job id is already unique, the Tome is
 * content, and the sign-off queue is the household's.
 */
export interface ApiRoute {
  readonly method: 'GET' | 'POST';
  readonly path: string;
  /** Query parameters the handler reads. Never a date — see the file header. */
  readonly query?: readonly string[];
  /** Why the route exists, in the words the plan used. */
  readonly returns: string;
}

/**
 * Typed as `readonly ApiRoute[]` rather than left as an `as const` tuple.
 *
 * `as const satisfies` narrows each entry to its own literal shape, which means `route.query` is a
 * type error on the twelve entries that do not have one — and the property a test most needs to
 * check is "does any route name a clock". The literal types buy nothing here; nothing dispatches
 * on a path at compile time.
 */
export const API_ROUTES: readonly ApiRoute[] = [
  {
    method: 'GET',
    path: '/api/players/:playerId/campaign',
    returns: 'areas with AreaProgress and BossState, for the map',
  },
  {
    method: 'GET',
    path: '/api/players/:playerId/areas/:area',
    returns: 'AvailableQuests, AreaProgress, BossState, the area identity',
  },
  {
    method: 'GET',
    path: '/api/players/:playerId/quests/:questId',
    returns: 'the quest, its brief, medals held, effectiveDC per medal',
  },
  /*
   * **`jobId` is not always a job, and only two of the four verifiers may be polled.**
   *
   * This row said "a runner_jobs id" until 2026-09-01, and it was false for half the verifiers.
   * `hidden-tests` and `local-repo` enqueue a row and return its numeric id; `peer-signoff` and
   * `git-signal` return an **attempt** id, because neither has anything to run — one is waiting
   * on a person and the other is a read of a git history that already happened.
   *
   * That matters to a client rather than being trivia. `GET /api/jobs/:jobId` requires a numeric
   * id, so polling a `peer-signoff` answers 404 — a submission that worked, reported as missing.
   * And `JobAccepted` cannot tell the two apart: a queued `peer-signoff` and a queued
   * `hidden-tests` are byte-identical on the wire. **So pollability is a property of the
   * verifier, decided before the request is sent, and `state` only decides when to stop.**
   */
  {
    method: 'POST',
    path: '/api/players/:playerId/quests/:questId/submit',
    returns:
      'JobAccepted — a runner_jobs id for hidden-tests and local-repo, an attempts id for peer-signoff and git-signal. Only the first two may be polled',
  },
  {
    method: 'GET',
    path: '/api/jobs/:jobId',
    returns: 'JobView. Numeric ids only — a peer-signoff or git-signal id answers 404 here',
  },
  { method: 'GET', path: '/api/players/:playerId/defend', returns: 'DueInvasions' },
  {
    method: 'POST',
    path: '/api/players/:playerId/defend/:conceptId',
    returns: 'DrillOutcome — the new rung',
  },
  {
    method: 'GET',
    path: '/api/players/:playerId/party',
    returns: 'Standings, XpSources, bounties',
  },
  /*
   * Read only, and there is no write. He writes `journal.md` and commits it, and that *is* the
   * post — §6.4 already makes push the verification mechanism, so a second way to author one
   * artifact would only give the two ways something to disagree about. Removed 2026-08-31.
   */
  {
    method: 'GET',
    path: '/api/players/:playerId/journal',
    returns: 'JournalEntry[] — the ledger, joined to the markdown at each commit',
  },
  {
    method: 'GET',
    path: '/api/players/:playerId/journal/template',
    returns: 'JournalTemplate — the entry to copy, for the area he is working in',
  },
  { method: 'GET', path: '/api/tome', returns: 'the syllabus: concepts by area. Content only' },
  {
    method: 'GET',
    path: '/api/signoffs',
    query: ['state'],
    returns: 'pending peer-signoffs, household-wide',
  },
  { method: 'POST', path: '/api/signoffs/:attemptId', returns: 'the medal awarded' },

  /*
   * Accounts and sessions.
   *
   * `POST /api/session` is the only route that takes a password, and the only one reachable
   * without a token. Everything above requires one — see the guard in `apps/api/src/server.ts`.
   *
   * There is no route that *issues* a bootstrap secret. `packages/db/src/bootstrap.ts` does that,
   * from a command line, because an api that hands one out hands out the household.
   */
  { method: 'POST', path: '/api/session', returns: 'Session — a token and the account it belongs to' },
  {
    method: 'POST',
    path: '/api/session/bootstrap',
    returns: 'Session — spends the printed secret and claims the DM seat, once',
  },
  { method: 'POST', path: '/api/session/end', returns: 'nothing; the presented token is revoked' },
  { method: 'GET', path: '/api/me', returns: 'Account — who the presented token belongs to' },

  /* The Console's three acts (§6.8). Every one of these requires the `dm` role. */
  { method: 'GET', path: '/api/players', returns: 'Account[] — the household roster. dm only' },
  { method: 'POST', path: '/api/players', returns: 'Account — always a player, never a dm. dm only' },
  {
    method: 'POST',
    path: '/api/players/:playerId/password',
    returns: 'nothing; the password is replaced and that player is signed out. dm only',
  },
  {
    method: 'POST',
    path: '/api/players/:playerId/roles',
    returns: 'the roles now held, and that player is signed out. dm only',
  },
];
