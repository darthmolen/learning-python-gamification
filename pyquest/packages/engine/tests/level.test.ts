/**
 * The level curve (§5.1a, §6.7).
 *
 * §6.7 says the engine returns a level and the spec never gave a formula. These
 * tests pin the one chosen on 2026-08-28, and — more importantly — pin the shape
 * of the answer: §5.1a forbids a bare number, so `levelAt` must always be able to
 * say how far into the level he is and how much is left.
 */

import { describe, expect, it } from 'vitest';
import { LEVEL_COEFFICIENT, levelAt, xpForLevel } from '../src/level.ts';

describe('the curve', () => {
  it('starts everyone at level 1 for nothing', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(levelAt(0).level).toBe(1);
  });

  it('follows 15·L·(L−1)', () => {
    expect(xpForLevel(2)).toBe(30);
    expect(xpForLevel(5)).toBe(300);
    expect(xpForLevel(10)).toBe(1350);
    expect(xpForLevel(20)).toBe(5700);
  });

  it('gets harder every level, never easier', () => {
    for (let l = 2; l <= 30; l++) {
      const step = xpForLevel(l) - xpForLevel(l - 1);
      const prev = xpForLevel(l - 1) - xpForLevel(l - 2 || 1);
      expect(step).toBeGreaterThan(0);
      if (l > 2) expect(step).toBeGreaterThan(prev);
    }
  });

  it('lands near level 24 over a campaign, about three an area', () => {
    // ~1,095 xp an area x 8 areas, costed in the spec's §5.1 rationale.
    expect(levelAt(8760).level).toBe(24);
  });
});

describe('levelAt answers with a denominator, never a bare number', () => {
  it('reports how far in and how much is left', () => {
    // level 9 spans 1080..1350
    const at = levelAt(1260);
    expect(at.level).toBe(9);
    expect(at.into).toBe(180);
    expect(at.need).toBe(270);
    expect(at.toNext).toBe(90);
  });

  it('sits at zero into a level on the exact threshold', () => {
    const at = levelAt(xpForLevel(7));
    expect(at.level).toBe(7);
    expect(at.into).toBe(0);
    expect(at.toNext).toBe(at.need);
  });

  it('never reports more progress into a level than the level costs', () => {
    for (let xp = 0; xp <= 9000; xp += 37) {
      const at = levelAt(xp);
      expect(at.into).toBeGreaterThanOrEqual(0);
      expect(at.into).toBeLessThan(at.need);
      expect(at.into + at.toNext).toBe(at.need);
    }
  });

  it('is monotonic — more xp is never a lower level', () => {
    let last = 0;
    for (let xp = 0; xp <= 9000; xp += 13) {
      const l = levelAt(xp).level;
      expect(l).toBeGreaterThanOrEqual(last);
      last = l;
    }
  });

  it('treats negative, absent or nonsense xp as a clean level 1', () => {
    // Checking only `.level` here was not enough: the while loop already answers 1
    // for a negative, so the clamp could be deleted with the suite still green while
    // `into` came back as -500. A mutant found that; these assertions close it.
    for (const bad of [-500, 0, Number.NaN, Number.NEGATIVE_INFINITY]) {
      const at = levelAt(bad);
      expect(at.level).toBe(1);
      expect(at.into).toBe(0);
      expect(at.toNext).toBe(at.need);
    }
  });
});

describe('boundaries', () => {
  it('is one retunable constant, not a table', () => {
    expect(LEVEL_COEFFICIENT).toBe(15);
    expect(xpForLevel(10)).toBe(LEVEL_COEFFICIENT * 10 * 9);
  });

  it('carries no presentation field — §5.1 layer boundary', () => {
    expect(Object.keys(levelAt(1260)).sort()).toEqual(['into', 'level', 'need', 'toNext']);
  });
});
