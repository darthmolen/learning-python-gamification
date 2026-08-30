/**
 * The input half — what `packages/db` hands the engine. Owned by the `db` track.
 *
 * These are not payloads. They are the progress rows the repository returns and the query layer
 * consumes, and they live in this package for the same reason the payloads do:
 * `feature_progress-schema` builds "thin functions returning the shapes `@pyquest/contract`
 * declares", so without them `packages/db` invents row shapes while the engine invents parameter
 * shapes.
 *
 * Three schemas today, one per table the six queries actually read. The schema has ten tables;
 * `players`, `player_roles`, `attempts`, `datamines`, `journal_entries`, `sessions` and
 * `bounties` are real and deliberately absent from *this* list, and adding them is the `db`
 * track's work in its own plan. A query that reaches for a table with no shape here is reaching
 * for something it should have been handed.
 *
 * Imports run one way. This module reads `primitives.ts` and never `payloads.ts` — a row shape
 * that needed a payload would mean the repository had started returning presentation.
 */

import { z } from 'zod';
import { ConceptIdSchema, ContentIdSchema, CountSchema, TOP_RUNG_BOUND } from './primitives.ts';
import { MedalSchema } from '@pyquest/content/browser';

/** The `quest_medals` row, exactly as §6.2 writes it. */
export const QuestMedalRecordSchema = z
  .object({
    playerId: z.string().min(1),
    questId: ContentIdSchema,
    medal: MedalSchema,
    earnedAt: z.string().date(),
    /**
     * What this medal paid at the moment it was earned. §5.10 prices the delta once, so the
     * recorded number is read rather than recomputed: re-pricing history reports a figure the
     * player was never paid. Zero is legal — at the DC floor a medal genuinely pays nothing,
     * which §5.10 says reads as a brag rather than as a failure.
     */
    xpAwarded: CountSchema,
  })
  .strict();

export type QuestMedalRecord = z.infer<typeof QuestMedalRecordSchema>;

/** The `concept_reviews` row — where a concept sits on the §5.4 ladder. */
export const ConceptReviewSchema = z
  .object({
    playerId: z.string().min(1),
    conceptId: ConceptIdSchema,
    lastReviewedAt: z.string().date(),
    rung: z.number().int().min(0).max(TOP_RUNG_BOUND),
  })
  .strict();

export type ConceptReview = z.infer<typeof ConceptReviewSchema>;

/** The `forced_reviews` row — §5.5's +3 and +10 guarantees, the second source `dueInvasions` merges. */
export const ForcedReviewSchema = z
  .object({
    playerId: z.string().min(1),
    conceptId: ConceptIdSchema,
    dueOn: z.string().date(),
  })
  .strict();

export type ForcedReview = z.infer<typeof ForcedReviewSchema>;

/**
 * One player's progress, which is the whole of what the API hands the engine alongside content
 * and `now`.
 *
 * Every row must belong to the named player. A mixed bundle is how one player's medals end up
 * on another's row of the completion board, and it is cheaper to refuse here than to find later.
 */
export const PlayerProgressSchema = z
  .object({
    playerId: z.string().min(1),
    questMedals: z.array(QuestMedalRecordSchema),
    conceptReviews: z.array(ConceptReviewSchema),
    forcedReviews: z.array(ForcedReviewSchema),
  })
  .strict()
  .refine(
    (p) =>
      [...p.questMedals, ...p.conceptReviews, ...p.forcedReviews].every(
        (row) => row.playerId === p.playerId,
      ),
    { message: 'every row must belong to this player', path: ['playerId'] },
  );

export type PlayerProgress = z.infer<typeof PlayerProgressSchema>;

/* -------------------------------------------------------------------------------------------
 * The rest of the schema — the rows the six engine queries do not read
 *
 * The three shapes above are what `packages/engine` consumes. These are the other tables
 * `feature_progress-schema` builds, and they are here rather than in `packages/db` for the same
 * reason the first three are: the API returns them, the SPA renders them, and a shape defined at
 * one end of that wire is a shape the other end has to guess at.
 *
 * **Two conventions run through all of them.**
 *
 * *`playerId` is `z.string().min(1)`, not `.uuid()`, even though the column is a uuid.* Every
 * shape in this file already types it that way and the engine's fixtures say `p1`. Tightening it
 * here would split the same field into two different types depending on which row you were
 * holding, which is worse than the looseness it fixes.
 *
 * *A `bigserial` id is a string.* `pg` returns `int8` as a string because the range does not fit
 * a JavaScript number, and the repository selects `id::text` rather than reconfiguring the
 * driver's parser globally. Typing it as a number here would be the contract asserting something
 * the driver does not do.
 * ----------------------------------------------------------------------------------------- */

/**
 * §5.11. Roles are not people: Kitchen Table mode is one adult holding both.
 *
 * A table rather than an `is_parent` boolean, because a boolean makes every arrangement that is
 * not this one a migration — the same mistake the content contract already made once.
 */
export const PlayerRoleSchema = z.enum(['player', 'dm']);
export type PlayerRole = z.infer<typeof PlayerRoleSchema>;

/**
 * The `players` row, with its `player_roles` rows folded in.
 *
 * `id` is the identity and `handle` is not. A handle is for routing and for humans and can be
 * changed without rewriting history, which is exactly why it cannot be what history keys on.
 */
export const PlayerSchema = z
  .object({
    id: z.string().min(1),
    handle: z.string().min(1),
    displayName: z.string().min(1),
    roles: z.array(PlayerRoleSchema),
    createdAt: z.string().datetime(),
  })
  .strict();

export type Player = z.infer<typeof PlayerSchema>;

/**
 * The `attempts` row. A scar is one of these with `passed = false` (§5.3, §3.5), which is why
 * there is no separate scar shape to disagree with this one about how many there were.
 *
 * `attemptedAt` is an instant rather than a date, and that is the one place this file departs
 * from the calendar dates above: scars are a sequence, and the order within a day is the point.
 */
export const AttemptSchema = z
  .object({
    id: z.string().min(1),
    playerId: z.string().min(1),
    questId: ContentIdSchema,
    passed: z.boolean(),
    attemptedAt: z.string().datetime(),
    /** Verifier output and whatever else the API recorded. Null when there was nothing to say. */
    detail: z.record(z.unknown()).nullable(),
  })
  .strict();

export type Attempt = z.infer<typeof AttemptSchema>;

/**
 * The `datamines` row (§5.5). One per quest per player.
 *
 * `note` is required by the spec and non-empty by the schema, because a requirement that admits
 * an empty string is not a requirement. `attemptsBefore` is positive: a Datamine granted after
 * zero failures is not a Datamine, it is a hint.
 */
export const DatamineSchema = z
  .object({
    playerId: z.string().min(1),
    questId: ContentIdSchema,
    unlockedAt: z.string().datetime(),
    attemptsBefore: z.number().int().positive(),
    note: z.string().trim().min(1),
  })
  .strict();

export type Datamine = z.infer<typeof DatamineSchema>;

/**
 * The `journal_entries` row (§5.6). One per session day.
 *
 * Named `...Record` for the same reason `QuestMedalRecord` is: the API's `JournalEntry` payload
 * is a different, wider thing, and two shapes sharing one name is how a payload ends up being
 * parsed as a row.
 *
 * The sha is what makes the entry real rather than claimed — push is the verification mechanism
 * (§6.4), so an entry naming no commit names nothing.
 */
export const JournalEntryRecordSchema = z
  .object({
    playerId: z.string().min(1),
    sessionDate: z.string().date(),
    commitSha: z.string().regex(/^[0-9a-f]{7,40}$/, 'must be a git sha, 7 to 40 hex characters'),
    xpAwarded: CountSchema,
  })
  .strict();

export type JournalEntryRecord = z.infer<typeof JournalEntryRecordSchema>;

/**
 * The `sessions` row (§5.9). The streak is derived from these and never stored.
 *
 * `forgivenBy` names who forgave rather than recording that someone did, because a forgiveness
 * nobody signed is one nobody can discuss.
 */
export const SessionSchema = z
  .object({
    id: z.string().min(1),
    scheduledFor: z.string().date(),
    attended: z.boolean(),
    forgivenBy: z.string().min(1).nullable(),
    note: z.string().nullable(),
  })
  .strict();

export type Session = z.infer<typeof SessionSchema>;

/** §5.8's lifecycle. `open` is the only state with no claimant, and the row shape says so below. */
export const BountyStateSchema = z.enum(['open', 'claimed', 'done', 'withdrawn']);
export type BountyState = z.infer<typeof BountyStateSchema>;

/**
 * The `bounties` row (§5.8): either player posts for the other, and both pay.
 *
 * The refinement is the table's CHECK restated. A claimed bounty that reads as open is the bug
 * this catches, and it is worth catching on both sides — the database refuses to store one, and
 * the contract refuses to hand one to the SPA.
 */
export const BountySchema = z
  .object({
    id: z.string().min(1),
    postedBy: z.string().min(1),
    claimedBy: z.string().min(1).nullable(),
    title: z.string().trim().min(1),
    xp: z.number().int().positive(),
    state: BountyStateSchema,
    postedAt: z.string().datetime(),
    claimedAt: z.string().datetime().nullable(),
  })
  .strict()
  .refine((b) => (b.state === 'open') === (b.claimedBy === null), {
    message: 'an open bounty has no claimant, and a claimed one is not open',
    path: ['state'],
  });

export type Bounty = z.infer<typeof BountySchema>;

/**
 * The household's single `campaign` row.
 *
 * It holds `startedOn` and nothing derived from it. The current week is whole weeks between that
 * date and `now`, computed by the caller with `now` as a parameter (§6.7) — a stored week number
 * is a cached total that is wrong every Monday morning until somebody runs a job.
 */
export const CampaignSchema = z
  .object({
    startedOn: z.string().date(),
    createdAt: z.string().datetime(),
  })
  .strict();

export type Campaign = z.infer<typeof CampaignSchema>;

/**
 * `runner_jobs.status` — the STORAGE states, all six.
 *
 * These are the values in the column, not the values a client sees. `claimed` means a worker has
 * taken the row; the API translates it to `running` on the way out, and that translation lives in
 * `endpoints.ts` with the rest of the client-facing vocabulary. A row shape that did not mirror
 * the row would be a second definition of the table, which is the thing this package exists to
 * prevent.
 */
export const RunnerJobStatusSchema = z.enum([
  'queued',
  'claimed',
  'passed',
  'failed',
  'timed-out',
  'killed',
]);

export type RunnerJobStatus = z.infer<typeof RunnerJobStatusSchema>;

/**
 * The `runner_jobs` row — the queue the API and the runner share (§6.6).
 *
 * The columns are `planning/feature_api-and-runner_2026-08-28.md`'s appendix, which is the one
 * definition. `payload` carries the submitted code and identifiers — quest id, verifier type, the
 * path to the tests — and never the tests themselves: those are content, they live in git, and a
 * copy of them in Postgres would be both a §6.7 violation and stale.
 */
export const RunnerJobSchema = z
  .object({
    id: z.string().min(1),
    playerId: z.string().min(1),
    questId: ContentIdSchema,
    attemptId: z.string().min(1).nullable(),
    status: RunnerJobStatusSchema,
    payload: z.record(z.unknown()),
    result: z.record(z.unknown()).nullable(),
    errorCode: z.string().min(1).nullable(),
    createdAt: z.string().datetime(),
    claimedAt: z.string().datetime().nullable(),
    claimedBy: z.string().min(1).nullable(),
    leaseExpiresAt: z.string().datetime().nullable(),
    attemptsMade: CountSchema,
  })
  .strict();

export type RunnerJob = z.infer<typeof RunnerJobSchema>;
