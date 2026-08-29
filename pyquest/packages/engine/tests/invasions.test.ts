/**
 * The invasion ladder (spec §5.4).
 *
 * These are filter tests: the ladder is a policy decision, and the whole value of
 * pinning it here is that a change to the numbers or to the miss rule has to be
 * deliberate rather than incidental.
 */

import { describe, expect, it } from 'vitest';
import { INVASION_LADDER, TOP_RUNG, intervalDays, nextRung } from '../src/invasions.ts';

describe('the ladder itself', () => {
  it('runs 1, 3, 7, 16, 35 days', () => {
    expect([...INVASION_LADDER]).toEqual([1, 3, 7, 16, 35]);
  });

  it('gives each rung its own interval, longest last', () => {
    const days = INVASION_LADDER.map((_, r) => intervalDays(r));
    expect(days).toEqual([1, 3, 7, 16, 35]);
    expect([...days].sort((a, b) => a - b)).toEqual(days);
  });

  it('holds a rung below zero at the shortest interval', () => {
    expect(intervalDays(-3)).toBe(1);
  });

  it('holds a rung above the top at the longest interval', () => {
    expect(intervalDays(99)).toBe(35);
  });
});

describe('repelling an invasion pushes it further away', () => {
  it('advances one rung', () => {
    expect(nextRung(0, true)).toBe(1);
    expect(nextRung(2, true)).toBe(3);
  });

  it('stops at the top rather than running off the ladder', () => {
    expect(nextRung(TOP_RUNG, true)).toBe(TOP_RUNG);
  });

  it('turns a repel at rung 2 into a 16-day wait, not a 7-day one', () => {
    expect(intervalDays(nextRung(2, true))).toBe(16);
  });
});

describe('missing one steps back a single rung, never to zero', () => {
  /**
   * The decision this file exists to protect. Resetting to the beginning punishes
   * one bad evening and then floods the next several sessions with everything the
   * learner already knew — which is the failure mode §5.4 was written against.
   */
  it('steps back exactly one rung from the top', () => {
    expect(nextRung(TOP_RUNG, false)).toBe(TOP_RUNG - 1);
  });

  it('does not reset a well-known concept to the beginning', () => {
    expect(nextRung(4, false)).not.toBe(0);
    expect(nextRung(3, false)).toBe(2);
  });

  it('holds at the bottom rung rather than going negative', () => {
    expect(nextRung(0, false)).toBe(0);
  });

  it('costs one miss and one repel to end up where you started', () => {
    expect(nextRung(nextRung(3, false), true)).toBe(3);
  });

  it('a miss at rung 4 brings it back in 16 days, not 1', () => {
    expect(intervalDays(nextRung(4, false))).toBe(16);
  });
});

describe('boundaries', () => {
  it('reads no clock — an interval is days, and when is the caller’s problem', () => {
    expect(typeof intervalDays(0)).toBe('number');
  });

  it('is total: every integer rung answers, none throw', () => {
    for (let r = -5; r <= 10; r++) {
      expect(Number.isInteger(nextRung(r, true))).toBe(true);
      expect(Number.isInteger(nextRung(r, false))).toBe(true);
      expect(INVASION_LADDER).toContain(intervalDays(r));
    }
  });
});
