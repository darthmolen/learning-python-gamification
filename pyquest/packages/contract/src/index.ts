/**
 * `packages/contract` — the shapes the API returns and the SPA consumes.
 *
 * This package exists so that "the SPA is not blocked by the API" is safe rather than merely
 * true. Without it the SPA invents stub shapes, the API invents response shapes, and the two
 * meet for the first time at integration. Both build against this instead.
 *
 * It holds schemas and nothing else. No logic, no I/O, no engine import: the engine returns
 * plain data that satisfies these shapes, and a test parses engine output through them. That
 * direction matters — a build edge from the engine to here would put a dependency on the one
 * component §6.7 requires to stay trivially testable.
 *
 * It does depend on `@pyquest/content`, deliberately. Areas, medals and the 5–30 DC scale are
 * already defined there, pinned to §5.1, §5.2 and §5.10, and a second definition of `Medal` in
 * this file is a second definition that can disagree with the first. Endpoint payloads reuse
 * the content vocabulary rather than restating it.
 */

import { z } from 'zod';
import { AreaSchema, CONCEPT_IDS, DifficultyClassSchema, MedalSchema } from '@pyquest/content';

/* -------------------------------------------------------------------------------------------
 * The layer boundary — spec §5.1
 * ----------------------------------------------------------------------------------------- */

/**
 * Fields the artboards bind that the engine must never produce.
 *
 * §5.1 puts presentation decisions in the UI: the DC ≥ 20 warning, a zero payout rendering as
 * a brag, the `~` on an estimated total. `risky` is the warning; the rest are colours the
 * design canvas computes. Every payload below is `.strict()`, so this list is what the test
 * enumerates rather than what enforcement depends on — but naming them is what makes the
 * boundary reviewable by someone who has not read §5.1.
 */
export const PRESENTATION_FIELDS = [
  'risky',
  'risk',
  'warning',
  'label',
  'accent',
  'bg',
  'fg',
  'dcFill',
  'markFill',
] as const;

export type PresentationField = (typeof PRESENTATION_FIELDS)[number];

/* -------------------------------------------------------------------------------------------
 * Shared primitives
 * ----------------------------------------------------------------------------------------- */

/**
 * A stable content id, e.g. `a3-recipe-book`.
 *
 * The source of truth is `IdSchema` in `packages/content/src/schema.ts`, which is not exported.
 * Restated here rather than widening the content package's public surface from a plan that does
 * not own that file; if the two ever disagree, content wins and this is the one to change.
 */
const ContentIdSchema = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be lower-case kebab-case, e.g. "a3-recipe-book"');

/** A concept tag that the registry knows (§5.4 schedules review by these ids). */
const ConceptIdSchema = ContentIdSchema.refine((id) => CONCEPT_IDS.has(id), {
  message: 'is not a known concept tag — see packages/content/src/concepts.ts',
});

/** A whole number of things that cannot be negative: counts, XP, days. */
const CountSchema = z.number().int().min(0);

/* -------------------------------------------------------------------------------------------
 * Area progress — spec §5.1a
 * ----------------------------------------------------------------------------------------- */

/**
 * "Cleared of total, never a bare XP figure." `estimated` carries the area manifest's
 * `authoring: partial`; whether it renders as a `~` is the UI's decision.
 *
 * The flag is required rather than defaulted on purpose. A default would let a partial area
 * ship as though it were complete because a caller forgot a field, and §5.1a's whole argument
 * is that an estimate presented as fact is dishonest.
 */
export const AreaProgressSchema = z
  .object({
    cleared: CountSchema,
    total: CountSchema,
    estimated: z.boolean(),
  })
  .strict()
  .refine((p) => p.cleared <= p.total, {
    message: 'cleared cannot exceed the total',
    path: ['cleared'],
  });

export type AreaProgress = z.infer<typeof AreaProgressSchema>;

/* -------------------------------------------------------------------------------------------
 * Boss state — spec §5.2
 * ----------------------------------------------------------------------------------------- */

/**
 * Not a boolean. The map and the area screen both show *how close* he is, so the payload
 * carries cleared-of-required alongside the unlock.
 *
 * `unlocked` is checked against the counts rather than trusted. It is redundant by
 * construction, and a redundant field that is never checked is a field that can lie.
 */
export const BossStateSchema = z
  .object({
    cleared: CountSchema,
    required: CountSchema,
    unlocked: z.boolean(),
  })
  .strict()
  .refine((b) => b.unlocked === b.cleared >= b.required, {
    message: 'unlocked must agree with cleared against required (spec §5.2)',
    path: ['unlocked'],
  });

export type BossState = z.infer<typeof BossStateSchema>;

/* -------------------------------------------------------------------------------------------
 * Quest cards — the Area screen
 * ----------------------------------------------------------------------------------------- */

/**
 * Where a quest stands for one player. `locked` is the `requires` graph (§6.10) not yet
 * satisfied; `cleared` means the Cleared medal is held, which is the only medal progression
 * reads (§5.10). The glyph the Area screen draws from this is the UI's.
 */
export const QuestStatusSchema = z.enum(['locked', 'available', 'cleared']);
export type QuestStatus = z.infer<typeof QuestStatusSchema>;

export const QuestCardSchema = z
  .object({
    id: ContentIdSchema,
    title: z.string().min(1),
    dc: DifficultyClassSchema,
    concepts: z.array(ConceptIdSchema).min(1),
    /** Medals held on this quest, not the slots it offers. */
    medals: z.array(MedalSchema),
    status: QuestStatusSchema,
  })
  .strict();

export type QuestCard = z.infer<typeof QuestCardSchema>;

export const AvailableQuestsSchema = z.array(QuestCardSchema);

/* -------------------------------------------------------------------------------------------
 * The Defend queue — spec §5.4, §5.5
 * ----------------------------------------------------------------------------------------- */

/** §5.4 shows three to five drills in a session. Five is the ceiling. */
export const INVASION_QUEUE_CAP = 5;

/**
 * Which schedule put this concept in the queue. `both` is load-bearing: a concept overdue on
 * the ladder that also holds a Datamine review (§5.5) is one entry, not two, and without a
 * member saying so the deduplication is indistinguishable from a dropped review.
 */
export const InvasionSourceSchema = z.enum(['ladder', 'datamine', 'both']);
export type InvasionSource = z.infer<typeof InvasionSourceSchema>;

/**
 * `why` and `prompt` are absent on purpose: they are content the caller looks up by concept id,
 * not payload the engine copies into every entry of every queue.
 */
export const DueInvasionSchema = z
  .object({
    conceptId: ConceptIdSchema,
    area: AreaSchema,
    /** ISO 8601 calendar date. The engine reads no clock — `now` arrives as a parameter (§6.7). */
    lastSeen: z.string().date(),
    overdueDays: CountSchema,
    source: InvasionSourceSchema,
  })
  .strict();

export type DueInvasion = z.infer<typeof DueInvasionSchema>;

/**
 * The queue, which carries two rules the entry cannot: the §5.4 cap, and one entry per concept.
 * Both are here rather than only in the engine so that a wrong queue cannot cross the wire even
 * if the engine is the thing that is wrong.
 */
export const DueInvasionsSchema = z
  .array(DueInvasionSchema)
  .max(INVASION_QUEUE_CAP, `a session shows at most ${INVASION_QUEUE_CAP} invasions (spec §5.4)`)
  .refine((queue) => new Set(queue.map((d) => d.conceptId)).size === queue.length, {
    message: 'a concept appears once — merge ladder and Datamine into one entry with source "both"',
  });

/* -------------------------------------------------------------------------------------------
 * The completion board — spec §5.8
 * ----------------------------------------------------------------------------------------- */

/** What one player did in one area: how much they cleared, and which medals they took. */
export const AreaRecordSchema = z
  .object({
    area: AreaSchema,
    cleared: CountSchema,
    medals: z.array(MedalSchema),
  })
  .strict();

export type AreaRecord = z.infer<typeof AreaRecordSchema>;

/**
 * One row of the completion board. §5.8 as ruled on 2026-08-29: a record of what each player
 * completed and which medals they took, not a ranking — so there is no rank field, and nothing
 * here gates anything.
 *
 * There is no display name either. §6.2 keys on `player_id`; names are roster data in Postgres,
 * and a payload that carried one would mean the engine had reached across §6.7 to do a join.
 */
export const StandingSchema = z
  .object({
    playerId: z.string().min(1),
    level: z.number().int().min(1),
    toNext: CountSchema,
    /** XP in the area currently on screen. The board itself does not reset (§5.8). */
    areaXp: CountSchema,
    areas: z.array(AreaRecordSchema),
  })
  .strict();

export type Standing = z.infer<typeof StandingSchema>;

export const StandingsSchema = z.array(StandingSchema);

/* -------------------------------------------------------------------------------------------
 * XP provenance — the Party screen's sources panel
 * ----------------------------------------------------------------------------------------- */

/**
 * The six kinds §5.1's table prices. Nothing pays for minutes logged, videos watched or lessons
 * read, so nothing here can name one.
 *
 * Shipped in the contract ahead of its engine function so the SPA is not blocked; whether
 * `xpSources` lands in the engine or the API is still open.
 */
export const XpKindSchema = z.enum([
  'quest',
  'boss',
  'invasion',
  'journal-entry',
  'area-release-notes',
  'co-op-session',
]);

export type XpKind = z.infer<typeof XpKindSchema>;

export const XpSourceSchema = z
  .object({
    kind: XpKindSchema,
    xp: CountSchema,
  })
  .strict();

export type XpSource = z.infer<typeof XpSourceSchema>;

export const XpSourcesSchema = z.array(XpSourceSchema);

/* -------------------------------------------------------------------------------------------
 * Level — spec §5.1a
 * ----------------------------------------------------------------------------------------- */

/**
 * A level and the denominator §5.1a insists on, matching `levelAt` in the engine.
 *
 * `into` and `toNext` must sum to `need`, checked rather than assumed, so a progress bar can
 * never be drawn from numbers that disagree with the label beside it.
 */
export const LevelSchema = z
  .object({
    level: z.number().int().min(1),
    into: CountSchema,
    need: z.number().int().min(1),
    toNext: CountSchema,
  })
  .strict()
  .refine((l) => l.into + l.toNext === l.need, {
    message: 'into + toNext must equal need (spec §5.1a)',
    path: ['toNext'],
  });

export type Level = z.infer<typeof LevelSchema>;

/* -------------------------------------------------------------------------------------------
 * The input half — what `packages/db` hands the engine
 * ----------------------------------------------------------------------------------------- */

/**
 * These are not payloads. They are the progress rows the repository returns and the query layer
 * consumes, and they live here for the same reason the payloads do: `feature_progress-schema`
 * builds "thin functions returning the shapes `@pyquest/contract` declares", so without them
 * `packages/db` invents row shapes while the engine invents parameter shapes.
 *
 * One schema per table the six queries actually read. `attempts`, `sessions`,
 * `journal_entries`, `bounties` and `runner_jobs` are real tables and deliberately absent —
 * a query that needs one is reaching for something it should have been handed.
 */

/**
 * The last rung of the §5.4 ladder.
 *
 * `INVASION_LADDER` lives in `packages/engine` and is the source of truth; the contract cannot
 * import it without inverting the dependency, so the bound is restated. The engine's suite
 * asserts the two agree — a rung past the top means the scheduler is broken and the interval it
 * implies does not exist.
 */
export const TOP_RUNG_BOUND = 4;

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
