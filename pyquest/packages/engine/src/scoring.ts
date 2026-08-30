/**
 * The scoring arithmetic.
 *
 * Spec §6.7: pure functions over state and content. No I/O, no database, no network, no
 * clock — if a function ever needs "now", it takes it as a parameter. This is described as
 * the one component that must never be wrong, which is exactly why it is the one component
 * that is trivially testable.
 *
 * Scope is deliberately narrow. This module holds only the arithmetic §5.1, §5.2 and §5.10
 * pin to the number. `availableQuests`, `areaProgress`, `dueInvasions`, `standings` and `level`
 * are projections whose shape only a real screen can settle, so they are deferred rather than
 * guessed at and built twice.
 */

import { MAX_DC, MEDALS, MIN_DC, type Medal } from '@pyquest/content';

/* -------------------------------------------------------------------------------------------
 * Difficulty modifiers — spec §5.1
 * ----------------------------------------------------------------------------------------- */

/**
 * Spec §5.1's table, verbatim, plus two entries the table implies rather than lists.
 *
 * `datamine` is §5.5's −5, named there as a difficulty modifier rather than as a discount.
 * `challenge-run` is §5.2's unnamed boss bonus expressed as +5 (DC-5): §5.1 argues a bonus
 * should not be a special case bolted onto scoring, so it reuses the machinery already built.
 *
 * `cleared` is the base case, not a modifier — it is what the base DC already prices — so it
 * sits at 0 and can be passed through harmlessly with the medals it accompanies.
 */
export const MODIFIER_DC_DELTA = {
  cleared: 0,
  ironman: 5,
  idiomatic: 3,
  'teach-back': 3,
  'time-attack': 5,
  conjured: -5,
  datamine: -5,
  'challenge-run': 5,
} as const satisfies Record<Medal | 'datamine' | 'challenge-run', number>;

/** Every name that adjusts an effective DC: the six medals of §5.10, plus §5.5 and §5.2. */
export type DifficultyModifier = keyof typeof MODIFIER_DC_DELTA;

/* -------------------------------------------------------------------------------------------
 * Legality — spec §5.12
 * ----------------------------------------------------------------------------------------- */

/** Raised when a modifier set contradicts itself. Carries the reason, for the UI to render. */
export class IllegalModifierSetError extends Error {
  override readonly name = 'IllegalModifierSetError';
}

/**
 * Spec §5.12 — Conjured and Ironman cannot coexist on one quest: one says the AI helped, the
 * other says nothing did. DC-3 has the engine enforce this by refusing the pair rather than by
 * dropping one, because either drop is an answer nobody asked for and the player would be paid
 * for a claim they did not make. The quest may of course be replayed later for Ironman.
 *
 * Returns the reason, or `null` when the set is legal.
 */
export function modifierConflict(modifiers: readonly DifficultyModifier[]): string | null {
  const applied = new Set(modifiers);
  if (applied.has('conjured') && applied.has('ironman')) {
    return 'conjured and ironman cannot coexist on one quest (spec §5.12)';
  }
  return null;
}

/**
 * Spec §5.1 — modifiers adjust the effective DC rather than paying flat bonuses, and they sum.
 * The sum matters: it is what makes medal payment order-independent (DC-2), because a set of
 * modifiers has one total however you reach it.
 *
 * DC-1 clamps the result to the published 5–30 scale. §5.1 gives Conjured −5 and Datamine −5
 * as separate modifiers and §5.5 permits both on one quest, so a DC 5 quest would otherwise
 * land at −5 and pay negative XP. Clamping keeps the borrowed D&D vocabulary honest: a number
 * off the published scale reads as a bug to anyone who knows the scale.
 *
 * Modifiers are a set. A name listed twice is the one modifier it names, earned once.
 *
 * Throws `IllegalModifierSetError` on a combination §5.12 forbids, rather than quietly
 * dropping one of the pair.
 */
export function effectiveDC(baseDC: number, modifiers: readonly DifficultyModifier[]): number {
  const conflict = modifierConflict(modifiers);
  if (conflict !== null) throw new IllegalModifierSetError(conflict);

  const applied = new Set(modifiers);
  let dc = baseDC;
  for (const modifier of applied) dc += MODIFIER_DC_DELTA[modifier];

  return Math.min(MAX_DC, Math.max(MIN_DC, dc));
}

/* -------------------------------------------------------------------------------------------
 * XP — spec §5.1
 * ----------------------------------------------------------------------------------------- */

/** The two kinds §5.1 prices from the effective DC. */
export const XP_PER_DC = {
  quest: 2,
  boss: 20,
} as const;

/**
 * The four kinds §5.1 prices flat. They have no DC to scale from: an invasion is two to three
 * minutes by construction (§5.4) and a Journal entry is paid for substance rather than for
 * difficulty (§5.6).
 */
export const FLAT_XP = {
  invasion: 5,
  'journal-entry': 10,
  'area-release-notes': 75,
  'co-op-session': 20,
} as const;

export type ScaledXpKind = keyof typeof XP_PER_DC;
export type FlatXpKind = keyof typeof FLAT_XP;
export type XpKind = ScaledXpKind | FlatXpKind;

/**
 * Spec §5.1's XP table. Working code is the only currency: nothing here pays for minutes
 * logged, videos watched or lessons read, and there is no argument for any of those to pass.
 *
 * The DC argument is the *effective* DC, never the base — pass `effectiveDC(...)` through.
 * That is the whole point of §5.1's design: harder work pays more by the same formula that
 * prices everything else, so no medal needs per-medal tuning.
 */
export function xpFor(kind: ScaledXpKind, effectiveDC: number): number;
export function xpFor(kind: FlatXpKind): number;
export function xpFor(kind: XpKind, effectiveDC?: number): number {
  if (kind in FLAT_XP) return FLAT_XP[kind as FlatXpKind];
  if (effectiveDC === undefined) {
    throw new TypeError(`xpFor("${kind}") needs an effective DC — it is priced from one (§5.1)`);
  }
  return effectiveDC * XP_PER_DC[kind as ScaledXpKind];
}

/* -------------------------------------------------------------------------------------------
 * Medals — spec §5.10
 * ----------------------------------------------------------------------------------------- */

const MEDAL_NAMES: ReadonlySet<string> = new Set(MEDALS);

/**
 * Everything an item has paid its player so far in medals, given what they hold on it.
 *
 * The set may carry the standing non-medal modifiers too — a Datamine (§5.5), a challenge run
 * (§5.2) — because §5.10 prices a medal on the item's *effective* DC, and those move it.
 * They earn nothing on their own: a Datamine is a legal move that re-prices the item, not an
 * achievement, so an item with no medal on it has paid nothing.
 *
 * `kind` is required and has no default. It was once absent, and `'quest'` was assumed here —
 * which meant every medal earned on a boss paid a tenth of §5.1's rate, silently, into a row
 * §5.10 writes once and never re-prices. A default would have compiled every call site
 * untouched and left that bug in place for whoever forgot to opt out of it; a required argument
 * makes the compiler stop at each call site and makes somebody choose.
 *
 * It is `ScaledXpKind`, not content's `Kind`, because §5.1 prices an invasion flat at 5 and an
 * invasion carries no medals. A caller pricing a medal on one has already gone wrong, and a
 * compile error says so at the line rather than a runtime throw saying it in a log.
 */
export function medalXpEarned(
  kind: ScaledXpKind,
  baseDC: number,
  earned: readonly DifficultyModifier[],
): number {
  const holdsAMedal = earned.some((modifier) => MEDAL_NAMES.has(modifier));
  if (!holdsAMedal) return 0;
  return xpFor(kind, effectiveDC(baseDC, earned));
}

/**
 * Spec §5.10 — each medal "raises the item's effective DC and pays the difference, once".
 *
 * Written as a difference of two totals rather than as a per-medal price, which is what makes
 * DC-2 hold: because modifiers sum, the total paid across every medal earned is
 * `xp(final effective DC)` no matter what order they were earned in. The intermediate terms
 * telescope away. Order-independence is not a nicety here — medals are earned on replay over
 * weeks (§5.10), so the order is whatever it happens to be, and two players holding the same
 * medals on the same item must show the same XP.
 *
 * The rate does not disturb that: both terms are priced at the same `kind`, so they telescope
 * exactly as before and DC-2 holds for a boss at 20×DC for the same reason it holds for a quest
 * at 2×. The property test runs over both kinds rather than assuming it.
 *
 * A medal already held pays nothing: "once" is enforced by the arithmetic rather than by a
 * caller remembering to check.
 */
export function medalDelta(
  kind: ScaledXpKind,
  baseDC: number,
  alreadyEarned: readonly DifficultyModifier[],
  newMedal: DifficultyModifier,
): number {
  return (
    medalXpEarned(kind, baseDC, [...alreadyEarned, newMedal]) -
    medalXpEarned(kind, baseDC, alreadyEarned)
  );
}

/* -------------------------------------------------------------------------------------------
 * Boss unlock — spec §5.2
 * ----------------------------------------------------------------------------------------- */

/** §5.2: "Each area offers five quests; any three unlock the boss. He chooses which three." */
export const QUESTS_PER_AREA = 5;
export const QUESTS_TO_UNLOCK_BOSS = 3;

/**
 * Spec §5.2 — the count is the whole rule. *Which* three is the player's business, and that is
 * the autonomy the rule exists to protect, so nothing here asks which quests they were.
 *
 * A challenge run (§5.2, §5.11) does not consult this at all: any boss may be attempted early.
 * This answers "has the area been played through", not "may the boss be attempted".
 */
export function bossUnlocked(clearedQuestCount: number): boolean {
  return clearedQuestCount >= QUESTS_TO_UNLOCK_BOSS;
}
