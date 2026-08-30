/**
 * The pieces every module in this package needs — owned by the `main` track.
 *
 * This file exists so that the split into owned modules does not become three files that each
 * redefine an id. It should almost never change: a track that needs a new primitive has found
 * something the other two will also need, which is a conversation rather than an edit.
 *
 * **Its exports and the package's exports deliberately differ.** `ContentIdSchema`,
 * `ConceptIdSchema` and `CountSchema` are exported here because a sibling module cannot reach a
 * module-private binding, and are *not* re-exported by `index.ts` because they were never public
 * API. Exported to siblings, invisible to consumers. This is the one place that distinction is
 * load-bearing, and `index.ts` naming its primitives one by one is what keeps it true.
 */

import { z } from 'zod';
import { CONCEPT_IDS } from '@pyquest/content';

/* -------------------------------------------------------------------------------------------
 * The layer boundary — spec §5.1
 * ----------------------------------------------------------------------------------------- */

/**
 * Fields the artboards bind that the engine must never produce.
 *
 * §5.1 puts presentation decisions in the UI: the DC ≥ 20 warning, a zero payout rendering as
 * a brag, the `~` on an estimated total. `risky` is the warning; the rest are colours the
 * design canvas computes. Every payload is `.strict()`, so this list is what the test
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
export const ContentIdSchema = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be lower-case kebab-case, e.g. "a3-recipe-book"');

/** A concept tag that the registry knows (§5.4 schedules review by these ids). */
export const ConceptIdSchema = ContentIdSchema.refine((id) => CONCEPT_IDS.has(id), {
  message: 'is not a known concept tag — see packages/content/src/concepts.ts',
});

/** A whole number of things that cannot be negative: counts, XP, days. */
export const CountSchema = z.number().int().min(0);

/* -------------------------------------------------------------------------------------------
 * Bounds the payload and progress halves share
 * ----------------------------------------------------------------------------------------- */

/** §5.4 shows three to five drills in a session. Five is the ceiling. */
export const INVASION_QUEUE_CAP = 5;

/**
 * The last rung of the §5.4 ladder.
 *
 * `INVASION_LADDER` lives in `packages/engine` and is the source of truth; the contract cannot
 * import it without inverting the dependency, so the bound is restated. The engine's suite
 * asserts the two agree — a rung past the top means the scheduler is broken and the interval it
 * implies does not exist.
 */
export const TOP_RUNG_BOUND = 4;
