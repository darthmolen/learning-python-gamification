/**
 * The invasion ladder — spec §5.4.
 *
 * A concept that goes untouched for its interval sends an invasion: a two-to-three
 * minute retrieval drill at the start of the next session. This module owns the
 * arithmetic of *when*, and nothing else. It reads no clock: an interval is a
 * number of days, and deciding what "now" means belongs to the caller.
 *
 * Spec §5.4 names a review interval and never specifies it. These are the numbers,
 * ruled on 2026-08-28.
 *
 * The queue itself — how many invasions a session shows, in what order, and what a
 * card carries — is deliberately not here. That shape is decided by the Defend
 * screen, and building it before the screen existed would mean building it twice.
 */

/**
 * Days between repelling a concept and its next invasion, by rung. Roughly
 * doubling, which is the shape every spaced-repetition schedule converges on.
 */
export const INVASION_LADDER = [1, 3, 7, 16, 35] as const;

/** The last rung. A concept here is as close to known as this system tracks. */
export const TOP_RUNG = INVASION_LADDER.length - 1;

/** The rung a concept starts on the first time it is taught. */
export const FIRST_RUNG = 0;

const clampRung = (rung: number): number =>
  Math.min(Math.max(Math.trunc(rung), FIRST_RUNG), TOP_RUNG);

/**
 * How many days a concept at `rung` may go untouched before it invades.
 * Out-of-range rungs are held at the ends rather than rejected — a stored rung
 * from an older ladder should still answer, not crash a session.
 */
export function intervalDays(rung: number): number {
  return INVASION_LADDER[clampRung(rung)] as number;
}

/**
 * The rung a concept sits on after an invasion is answered.
 *
 * Repelled, it climbs one rung and stays away longer. Missed, it steps back
 * **exactly one rung — never to the beginning.** That is the whole decision here:
 * resetting to zero punishes a single bad evening, and then floods the next
 * several sessions with material the learner already had, which is the failure
 * §5.4 exists to prevent. One miss costs one repel to undo, and no more.
 */
export function nextRung(rung: number, repelled: boolean): number {
  const current = clampRung(rung);
  return repelled ? Math.min(current + 1, TOP_RUNG) : Math.max(current - 1, FIRST_RUNG);
}
