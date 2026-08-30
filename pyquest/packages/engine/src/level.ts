/**
 * The level curve — §6.7 returns a level; §5.1a says it may never be a bare number.
 *
 * The spec never gave a formula. This is the one chosen on 2026-08-28, costed
 * against a real campaign: roughly 1,095 XP an area over eight areas, which lands
 * at level 24 — about three levels an area, one every five sessions or so. Often
 * enough to be its own reward, rarely enough not to duplicate finishing an area.
 *
 * `15·L·(L−1)` is quadratic on purpose. A flat cost per level is easier for a
 * 11–14-year-old to compute in his head, and was seriously considered; it was
 * turned down because a curve is what everything else in his life does, and a
 * level that costs the same at 20 as at 2 says the twentieth was no harder.
 *
 * One coefficient. Retuning the whole campaign is one number.
 */

/** XP for level L is `LEVEL_COEFFICIENT · L · (L − 1)`. */
export const LEVEL_COEFFICIENT = 15;

/** Where a level begins, on the same axis as `totalXp`. Level 1 begins at nothing. */
export function xpForLevel(level: number): number {
  const l = Math.max(1, Math.trunc(level));
  return LEVEL_COEFFICIENT * l * (l - 1);
}

/**
 * A level, and the denominator §5.1a insists on.
 *
 * `into` and `toNext` always sum to `need`, so a progress bar cannot be drawn
 * from a number that disagrees with the label beside it. Whether that renders as
 * a bar, "90 to level 10", or nothing at all is the UI's decision (§5.1).
 *
 * Negative or absent XP answers level 1 rather than throwing: a fresh player and
 * a corrupt row should both open the app.
 */
export function levelAt(totalXp: number): {
  level: number;
  into: number;
  need: number;
  toNext: number;
} {
  const xp = Number.isFinite(totalXp) ? Math.max(0, Math.trunc(totalXp)) : 0;

  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;

  const base = xpForLevel(level);
  const need = xpForLevel(level + 1) - base;
  const into = xp - base;
  return { level, into, need, toNext: need - into };
}
