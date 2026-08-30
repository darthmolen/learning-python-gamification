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
import { MedalSchema } from '@pyquest/content';

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
