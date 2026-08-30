/**
 * The output half — what the API returns and the SPA consumes. Owned by the `main` track.
 *
 * Every shape here traces to an artboard in `docs/design/pyquest/`. They are `.strict()` without
 * exception, which is what keeps the §5.1 layer boundary enforced rather than merely documented:
 * a presentation field named in `PRESENTATION_FIELDS` cannot arrive in a payload even by
 * accident.
 *
 * Imports run one way. This module reads `primitives.ts` and never `progress.ts` — the two
 * halves exist because two tracks own them, and an import between them would re-couple the
 * tracks this split was made to separate.
 */

import { z } from 'zod';
import { AreaSchema, DifficultyClassSchema, MedalSchema } from '@pyquest/content';
import { ConceptIdSchema, ContentIdSchema, CountSchema, INVASION_QUEUE_CAP } from './primitives.ts';

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
