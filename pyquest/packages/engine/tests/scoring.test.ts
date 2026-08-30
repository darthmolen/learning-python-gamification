import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as engine from '../src/scoring.ts';
import {
  IllegalModifierSetError,
  QUESTS_PER_AREA,
  QUESTS_TO_UNLOCK_BOSS,
  bossUnlocked,
  effectiveDC,
  medalDelta,
  modifierConflict,
  medalXpEarned,
  xpFor,
  type DifficultyModifier,
} from '../src/scoring.ts';

describe('effectiveDC — spec §5.1', () => {
  it('returns the base DC when no modifier applies', () => {
    expect(effectiveDC(15, [])).toBe(15);
  });

  it('adds the §5.1 table value for each modifier', () => {
    expect(effectiveDC(15, ['ironman'])).toBe(20);
    expect(effectiveDC(15, ['idiomatic'])).toBe(18);
    expect(effectiveDC(15, ['teach-back'])).toBe(18);
    expect(effectiveDC(15, ['time-attack'])).toBe(20);
    expect(effectiveDC(15, ['conjured'])).toBe(10);
    expect(effectiveDC(15, ['datamine'])).toBe(10);
    expect(effectiveDC(15, ['challenge-run'])).toBe(20);
  });

  it('is unmoved by "cleared", which is the base case rather than a modifier', () => {
    expect(effectiveDC(15, ['cleared'])).toBe(15);
  });

  it('sums every modifier rather than taking the largest', () => {
    // 15 + 5 + 3 + 3 = 26. A max would give 20, a first-wins 20, a last-wins 18.
    expect(effectiveDC(15, ['ironman', 'idiomatic', 'teach-back'])).toBe(26);
    // Mixed signs: 15 + 3 - 5 = 13. A max would give 18.
    expect(effectiveDC(15, ['idiomatic', 'datamine'])).toBe(13);
  });

  it('clamps below at the published floor of 5 (DC-1)', () => {
    // §5.5 permits Conjured and Datamine together: 5 - 5 - 5 = -5 unclamped.
    expect(effectiveDC(5, ['conjured', 'datamine'])).toBe(5);
    expect(effectiveDC(10, ['conjured', 'datamine'])).toBe(5);
  });

  it('clamps above at the published ceiling of 30 (DC-1)', () => {
    // 30 + 5 + 3 + 3 + 5 = 46 unclamped.
    expect(effectiveDC(30, ['ironman', 'idiomatic', 'teach-back', 'time-attack'])).toBe(30);
  });

  it('treats a repeated modifier as the one modifier it is', () => {
    expect(effectiveDC(15, ['ironman', 'ironman'])).toBe(20);
  });
});

describe('modifier legality — spec §5.12 (DC-3)', () => {
  it('names the Conjured/Ironman conflict', () => {
    const conflict = modifierConflict(['conjured', 'ironman']);
    expect(conflict).toMatch(/conjured/i);
    expect(conflict).toMatch(/ironman/i);
  });

  it('finds the conflict whichever order the pair arrives in', () => {
    expect(modifierConflict(['ironman', 'conjured'])).not.toBeNull();
  });

  it('reports no conflict for either half of the pair alone', () => {
    expect(modifierConflict(['conjured', 'idiomatic', 'datamine'])).toBeNull();
    expect(modifierConflict(['ironman', 'idiomatic', 'teach-back'])).toBeNull();
  });

  it('reports no conflict for the empty set', () => {
    expect(modifierConflict([])).toBeNull();
  });

  it('rejects the illegal pair rather than silently dropping one of them', () => {
    // Dropping conjured would give 20; dropping ironman would give 10. Both are answers the
    // player never asked for, so §5.12 is enforced by refusal.
    expect(() => effectiveDC(15, ['conjured', 'ironman'])).toThrow(IllegalModifierSetError);
  });
});

describe('xpFor — spec §5.1', () => {
  it('pays a quest twice its effective DC', () => {
    // The spec's own worked examples: "A DC 5 quest pays 10 and a DC 20 quest pays 40."
    expect(xpFor('quest', 5)).toBe(10);
    expect(xpFor('quest', 20)).toBe(40);
    expect(xpFor('quest', 13)).toBe(26);
  });

  it('pays a boss twenty times its effective DC', () => {
    // §5.1: "A DC 15 boss pays 300 and a DC 30 boss pays 600."
    //
    // Raised from x10 on 2026-08-28. At x10 a boss paid about 0.75 xp per minute of
    // work — less than a two-minute invasion drill, and the worst rate in the system
    // for the hardest thing in it.
    expect(xpFor('boss', 15)).toBe(300);
    expect(xpFor('boss', 30)).toBe(600);
  });

  it('pays the flat kinds their §5.1 table amount', () => {
    expect(xpFor('invasion')).toBe(5);
    expect(xpFor('journal-entry')).toBe(10);
    expect(xpFor('area-release-notes')).toBe(75);
    expect(xpFor('co-op-session')).toBe(20);
  });

  it('pays each kind its own amount rather than one constant', () => {
    const paid = [
      xpFor('quest', 15),
      xpFor('boss', 15),
      xpFor('invasion'),
      xpFor('journal-entry'),
      xpFor('area-release-notes'),
      xpFor('co-op-session'),
    ];
    expect(new Set(paid).size).toBe(paid.length);
  });

  it('refuses a DC-scaled kind with no DC rather than paying zero', () => {
    const untyped = xpFor as (kind: string, effectiveDC?: number) => number;
    expect(() => untyped('quest')).toThrow(/effective dc/i);
  });
});

describe('medalDelta — spec §5.10 (DC-2)', () => {
  it('pays a first Cleared the whole quest at its base DC', () => {
    expect(medalDelta('quest', 15, [], 'cleared')).toBe(30);
  });

  it("pays Ironman the gap the spec names: DC 15 to DC 20", () => {
    // §5.10, verbatim: "replaying a DC 15 quest for Ironman pays the gap between DC 15 and
    // DC 20" — 40 minus 30.
    expect(medalDelta('quest', 15, ['cleared'], 'ironman')).toBe(10);
  });

  it('pays a medal once, so re-earning it pays nothing', () => {
    expect(medalDelta('quest', 15, ['cleared', 'ironman'], 'ironman')).toBe(0);
  });

  it('pays nothing at all until a medal is earned, whatever the standing modifiers', () => {
    // A Datamine re-prices the quest (§5.5); it is not itself an achievement to be paid for.
    expect(medalXpEarned('quest', 15, [])).toBe(0);
    expect(medalXpEarned('quest', 15, ['datamine'])).toBe(0);
    expect(medalDelta('quest', 15, ['datamine'], 'cleared')).toBe(20);
  });

  it('refuses to price a medal §5.12 forbids beside what is already earned', () => {
    expect(() => medalDelta('quest', 15, ['conjured'], 'ironman')).toThrow(IllegalModifierSetError);
  });

  it('never pays a negative amount, because the effective DC is floored (DC-1)', () => {
    expect(medalDelta('quest', 5, ['cleared', 'conjured'], 'datamine')).toBe(0);
  });

  describe('the kind is priced, not assumed — §5.1 × §5.10', () => {
    /**
     * The bug this block exists for: `medalDelta` used to ask `xpFor` for `'quest'`
     * unconditionally, so a medal on a boss paid 2×DC where §5.1 says 20×DC. `xpFor('boss', …)`
     * was correct, tested, and reached by nothing in production — the constant was right and
     * the wire was missing.
     */

    it('pays a first Cleared on a boss twenty times its DC, not twice', () => {
      // §5.1's own worked example, reached through the medal path this time: a DC 15 boss
      // pays 300. Before this change the same call paid 30.
      expect(medalDelta('boss', 15, [], 'cleared')).toBe(300);
      expect(medalDelta('boss', 30, [], 'cleared')).toBe(600);
    });

    it('prices a boss medal on the gap, the same arithmetic at the other rate', () => {
      // Ironman moves DC 15 to DC 20 (§5.10). On a quest that gap is 40 - 30 = 10; on a boss
      // it is 400 - 300 = 100. One formula, two rates.
      expect(medalDelta('quest', 15, ['cleared'], 'ironman')).toBe(10);
      expect(medalDelta('boss', 15, ['cleared'], 'ironman')).toBe(100);
    });

    it('pays a boss exactly ten times a quest for the same DC and the same medals', () => {
      // The ratio is XP_PER_DC.boss / XP_PER_DC.quest, and it must hold for every medal
      // rather than only for the first — a fix that priced Cleared and forgot the rest
      // would pass the two assertions above.
      for (const medal of ['cleared', 'ironman', 'idiomatic', 'time-attack'] as const) {
        const onAQuest = medalDelta('quest', 15, [], medal);
        const onABoss = medalDelta('boss', 15, [], medal);
        expect({ medal, onABoss }).toEqual({ medal, onABoss: onAQuest * 10 });
      }
    });

    it('pays nothing on a boss until a medal is earned, at either rate', () => {
      // §5.10 is unchanged by the rate: a standing modifier re-prices, it does not pay.
      expect(medalXpEarned('boss', 15, [])).toBe(0);
      expect(medalXpEarned('boss', 15, ['datamine'])).toBe(0);
      expect(medalXpEarned('boss', 15, ['cleared'])).toBe(300);
    });

    it('still refuses a §5.12-illegal set on a boss, before it prices anything', () => {
      expect(() => medalDelta('boss', 15, ['conjured'], 'ironman')).toThrow(IllegalModifierSetError);
    });

    it('floors a boss at DC 5 too, so no medal pays a negative (DC-1)', () => {
      expect(medalDelta('boss', 5, ['cleared', 'conjured'], 'datamine')).toBe(0);
    });
  });

  describe('DC-2: the total is the same however the medals were earned', () => {
    /**
     * A deterministic LCG rather than Math.random, so a counter-example is reproducible from
     * the seed printed with it. The engine takes no randomness of its own (§6.7).
     */
    const lcg = (seed: number) => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;

    const EARNABLE = [
      'cleared',
      'ironman',
      'idiomatic',
      'teach-back',
      'time-attack',
      'conjured',
    ] as const;

    /** The §5.1 table, retyped here so the property does not check the engine against itself. */
    const EXPECTED_DELTA: Record<(typeof EARNABLE)[number], number> = {
      cleared: 0,
      ironman: 5,
      idiomatic: 3,
      'teach-back': 3,
      'time-attack': 5,
      conjured: -5,
    };

    /**
     * Both kinds. Order-independence is a property of the telescoping difference, not of the
     * rate, so it must survive the rate changing — and running it over `'boss'` is what proves
     * the new argument threads all the way to `xpFor` rather than being accepted and dropped.
     */
    it.each(['quest', 'boss'] as const)(
      'sums to xp(final effective DC) across randomised earn orders — %s',
      (kind) => {
      const next = lcg(20260827);

      for (let trial = 0; trial < 500; trial++) {
        const baseDC = 5 + Math.floor(next() * 26);
        const set = EARNABLE.filter(() => next() < 0.5).filter(
          // §5.12 forbids the pair, so it is not a legal earn history to shuffle.
          (m, _i, kept) => !(m === 'ironman' && kept.includes('conjured')),
        );
        if (set.length === 0) continue;

        // Fisher-Yates on the same stream.
        const order = [...set];
        for (let i = order.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          [order[i], order[j]] = [order[j]!, order[i]!];
        }

        let paid = 0;
        const earned: DifficultyModifier[] = [];
        for (const medal of order) {
          paid += medalDelta(kind, baseDC, earned, medal);
          earned.push(medal);
        }

        // Computed independently of the engine, so the property pins the arithmetic and not
        // merely its own self-consistency: max is order-independent too, and an assertion
        // written against effectiveDC would hold just as well if effectiveDC took a maximum.
        const summed = set.reduce((dc, m) => dc + EXPECTED_DELTA[m], baseDC);
        const expected = xpFor(kind, Math.min(30, Math.max(5, summed)));

        expect({ kind, baseDC, order, paid }).toEqual({ kind, baseDC, order, paid: expected });
      }
      },
    );
  });
});

describe('bossUnlocked — spec §5.2', () => {
  it('unlocks on the third cleared quest', () => {
    // "Each area offers five quests; any three unlock the boss."
    expect(bossUnlocked(3)).toBe(true);
  });

  it('stays locked at two', () => {
    expect(bossUnlocked(0)).toBe(false);
    expect(bossUnlocked(1)).toBe(false);
    expect(bossUnlocked(2)).toBe(false);
  });

  it('stays unlocked beyond three', () => {
    expect(bossUnlocked(4)).toBe(true);
    expect(bossUnlocked(5)).toBe(true);
  });

  it('publishes the two counts §5.2 fixes, so no caller has to hard-code three of five', () => {
    expect(QUESTS_TO_UNLOCK_BOSS).toBe(3);
    expect(QUESTS_PER_AREA).toBe(5);
  });
});

/**
 * Spec §5.1 draws a layer boundary and §6.7 draws a purity boundary. Neither is arithmetic, so
 * neither is pinned by any test above — and both are the kind of line that erodes one
 * convenience at a time. These two tests are the erosion detector.
 */
describe('the boundaries this module is not allowed to cross', () => {
  const source = readFileSync(new URL('../src/scoring.ts', import.meta.url), 'utf8');

  it('returns bare numbers, never a number wearing a presentation label (§5.1)', () => {
    // "The engine owns effectiveDC and nothing else. The threshold at which a number becomes a
    // warning is a presentation decision and lives in the UI." A `risk` field here would let
    // two surfaces disagree about the same DC, which is the failure §5.1 is avoiding.
    const results: unknown[] = [
      effectiveDC(15, ['ironman']),
      xpFor('quest', 20),
      xpFor('invasion'),
      medalDelta('quest', 15, ['cleared'], 'ironman'),
      medalXpEarned('quest', 15, ['cleared']),
      bossUnlocked(3),
    ];
    for (const result of results) {
      expect(Object(result)).not.toBe(result); // a primitive has no fields to disagree with
    }

    const forbidden = /\b\w*(risk|warning|isHard|severity)\w*\b/i;
    const offenders = Object.keys(engine).filter((name) => forbidden.test(name));
    expect(offenders).toEqual([]);
    expect(source.match(forbidden)).toBeNull();
  });

  it('reads no clock, no randomness, and no I/O (§6.7)', () => {
    // "No I/O, no database, no network." If this module ever needs "now", it takes it as a
    // parameter — which is what keeps every result reproducible from its inputs alone.
    expect(source).not.toMatch(/\bDate\b|\bnow\(\)|Math\.random|\bfetch\(|require\(|node:/);
  });
});
