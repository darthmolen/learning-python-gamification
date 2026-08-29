/**
 * The query layer — the projections §6.7 defers to a screen.
 *
 * Every assertion here traces to an artboard in `docs/design/pyquest/` or to the section of the
 * spec named beside it. Where a shape looks arbitrary it was lifted from a binding, not invented.
 *
 * The contract is imported for its *values* in this file, which `src/` may not do. Tests are not
 * the runtime path, and the drift guard below cannot be written any other way: `INVASION_LADDER`
 * lives here and `TOP_RUNG_BOUND` restates it there, so something has to hold both at once.
 */

import { describe, expect, it, vi } from 'vitest';
import type { AreaManifest, ContentItem } from '@pyquest/content';
import {
  AreaProgressSchema,
  AvailableQuestsSchema,
  BossStateSchema,
  DueInvasionsSchema,
  INVASION_QUEUE_CAP,
  PRESENTATION_FIELDS,
  StandingsSchema,
  TOP_RUNG_BOUND,
  type PlayerProgress,
} from '@pyquest/contract';
import { INVASION_LADDER, TOP_RUNG } from '../src/invasions.ts';
import {
  areaProgress,
  availableQuests,
  bossState,
  dueInvasions,
  standings,
} from '../src/queries.ts';

/* ---------------------------------------------------------------------------------------------
 * Fixtures
 * ------------------------------------------------------------------------------------------- */

const quest = (id: string, over: Partial<ContentItem> = {}): ContentItem =>
  ({
    id,
    title: id,
    kind: 'quest',
    area: 3,
    concepts: ['dict'],
    requires: [],
    dc: 12,
    brief: `content/${id}.md`,
    verifier: { type: 'peer-signoff', by: 'dm' },
    ...over,
  }) as ContentItem;

const AREA_3: readonly ContentItem[] = [
  quest('a3-one'),
  quest('a3-two'),
  quest('a3-three'),
  quest('a3-four'),
  quest('a3-five'),
];

const complete: AreaManifest = { area: 3, title: 'Collections', authoring: 'complete' };
const partial: AreaManifest = {
  area: 3,
  title: 'Collections',
  authoring: 'partial',
  estimatedQuests: 5,
};

const empty = (playerId = 'p1'): PlayerProgress => ({
  playerId,
  questMedals: [],
  conceptReviews: [],
  forcedReviews: [],
});

/** A quest carrying a medal that is not Cleared — elective depth, no progression (§5.10). */
const ironmanOnly = (playerId: string, questId: string): PlayerProgress => ({
  ...empty(playerId),
  questMedals: [
    { playerId, questId, medal: 'ironman' as const, earnedAt: '2026-08-20', xpAwarded: 10 },
  ],
});

const cleared = (playerId: string, ...questIds: readonly string[]): PlayerProgress => ({
  ...empty(playerId),
  questMedals: questIds.map((questId) => ({
    playerId,
    questId,
    medal: 'cleared' as const,
    earnedAt: '2026-08-20',
    xpAwarded: 24,
  })),
});

/* ---------------------------------------------------------------------------------------------
 * availableQuests
 * ------------------------------------------------------------------------------------------- */

describe('availableQuests', () => {
  it('returns the area’s quests as cards the contract accepts', () => {
    const cards = availableQuests(AREA_3, empty(), 3);
    expect(AvailableQuestsSchema.parse(cards)).toHaveLength(5);
  });

  it('carries no presentation field', () => {
    // §5.1: the DC >= 20 warning is the UI's decision. `risky` is the field that decision would
    // arrive in, and the engine must not be the thing that decided it.
    const [card] = availableQuests(AREA_3, empty(), 3);
    for (const field of PRESENTATION_FIELDS) {
      expect(card).not.toHaveProperty(field);
    }
  });

  it('marks a quest cleared once the Cleared medal is held', () => {
    const cards = availableQuests(AREA_3, cleared('p1', 'a3-two'), 3);
    expect(cards.find((c) => c.id === 'a3-two')?.status).toBe('cleared');
    expect(cards.find((c) => c.id === 'a3-one')?.status).toBe('available');
  });

  it('locks a quest whose prerequisite is not cleared, and frees it when it is', () => {
    const items = [quest('a3-one'), quest('a3-two', { requires: ['a3-one'] })];
    expect(availableQuests(items, empty(), 3).find((c) => c.id === 'a3-two')?.status).toBe('locked');
    expect(
      availableQuests(items, cleared('p1', 'a3-one'), 3).find((c) => c.id === 'a3-two')?.status,
    ).toBe('available');
  });

  it('reports the medals held on a quest, not the slots it offers', () => {
    const progress: PlayerProgress = {
      ...empty(),
      questMedals: [
        { playerId: 'p1', questId: 'a3-one', medal: 'cleared', earnedAt: '2026-08-20', xpAwarded: 24 },
        { playerId: 'p1', questId: 'a3-one', medal: 'ironman', earnedAt: '2026-08-22', xpAwarded: 10 },
      ],
    };
    expect(availableQuests(AREA_3, progress, 3).find((c) => c.id === 'a3-one')?.medals).toEqual([
      'cleared',
      'ironman',
    ]);
  });

  it('does not call a quest cleared on a medal that is not Cleared', () => {
    // §5.10: "Only Cleared unlocks anything." Ironman is elective depth, and a quest holding it
    // without Cleared has not been completed — it is still there to be done.
    const cards = availableQuests(AREA_3, ironmanOnly('p1', 'a3-one'), 3);
    const card = cards.find((c) => c.id === 'a3-one');
    expect(card?.status).toBe('available');
    expect(card?.medals).toEqual(['ironman']);
  });

  it('does not let a non-Cleared medal satisfy a prerequisite', () => {
    const items = [quest('a3-one'), quest('a3-two', { requires: ['a3-one'] })];
    expect(availableQuests(items, ironmanOnly('p1', 'a3-one'), 3).find((c) => c.id === 'a3-two')?.status).toBe(
      'locked',
    );
  });

  it('ignores other areas, and bosses', () => {
    const items = [quest('a3-one'), quest('a4-one', { area: 4 }), quest('a3-boss', { kind: 'boss', themes: ['a', 'b'] })];
    const cards = availableQuests(items, empty(), 3);
    expect(cards.map((c) => c.id)).toEqual(['a3-one']);
  });
});

/* ---------------------------------------------------------------------------------------------
 * areaProgress
 * ------------------------------------------------------------------------------------------- */

describe('areaProgress', () => {
  it('counts cleared of an authored total', () => {
    const p = areaProgress(AREA_3, complete, cleared('p1', 'a3-one', 'a3-two'), 3);
    expect(AreaProgressSchema.parse(p)).toEqual({ cleared: 2, total: 5, estimated: false });
  });

  it('marks a partially authored area as an estimate', () => {
    // §5.1a: an estimate presented as fact is dishonest. The flag travels; the `~` is the UI's.
    expect(areaProgress(AREA_3.slice(0, 2), partial, empty(), 3).estimated).toBe(true);
  });

  it('never reports more cleared than total, even when the estimate is too low', () => {
    // A partial area that estimated five but authored six, all cleared, would otherwise produce
    // 6 of 5 — which the contract refuses outright.
    const six = [...AREA_3, quest('a3-six')];
    const p = areaProgress(six, partial, cleared('p1', ...six.map((q) => q.id)), 3);
    expect(() => AreaProgressSchema.parse(p)).not.toThrow();
    expect(p.total).toBeGreaterThanOrEqual(p.cleared);
  });
});

/* ---------------------------------------------------------------------------------------------
 * bossState
 * ------------------------------------------------------------------------------------------- */

describe('bossState', () => {
  it('shows how close, not merely whether', () => {
    const state = bossState(AREA_3, cleared('p1', 'a3-one', 'a3-two'), 3);
    expect(BossStateSchema.parse(state)).toEqual({ cleared: 2, required: 3, unlocked: false });
  });

  it('unlocks at the third quest, whichever three they were', () => {
    // §5.2: the count is the whole rule; which three is the player's business.
    const state = bossState(AREA_3, cleared('p1', 'a3-five', 'a3-one', 'a3-four'), 3);
    expect(state.unlocked).toBe(true);
  });

  it('does not count a quest that holds only a non-Cleared medal', () => {
    // Three Ironmen without Cleared is not three quests done, and must not open the boss.
    const progress: PlayerProgress = {
      ...empty(),
      questMedals: ['a3-one', 'a3-two', 'a3-three'].map((questId) => ({
        playerId: 'p1',
        questId,
        medal: 'ironman' as const,
        earnedAt: '2026-08-20',
        xpAwarded: 10,
      })),
    };
    expect(bossState(AREA_3, progress, 3)).toEqual({ cleared: 0, required: 3, unlocked: false });
    expect(areaProgress(AREA_3, complete, progress, 3).cleared).toBe(0);
  });

  it('does not unlock at two', () => {
    expect(bossState(AREA_3, cleared('p1', 'a3-one', 'a3-two'), 3).unlocked).toBe(false);
  });
});

/* ---------------------------------------------------------------------------------------------
 * dueInvasions
 * ------------------------------------------------------------------------------------------- */

describe('dueInvasions', () => {
  const review = (conceptId: string, lastReviewedAt: string, rung = 0) => ({
    playerId: 'p1',
    conceptId,
    lastReviewedAt,
    rung,
  });

  it('leaves a concept alone until its interval has passed', () => {
    // Rung 0 is a one-day interval: due on the 21st, not on the 20th.
    const progress = { ...empty(), conceptReviews: [review('dict', '2026-08-20')] };
    expect(dueInvasions(progress, '2026-08-20')).toHaveLength(0);
    expect(dueInvasions(progress, '2026-08-21')).toHaveLength(1);
  });

  it('respects the rung, not a fixed interval', () => {
    const progress = { ...empty(), conceptReviews: [review('dict', '2026-08-01', 3)] };
    // Rung 3 is sixteen days: due on the 17th.
    expect(dueInvasions(progress, '2026-08-16')).toHaveLength(0);
    expect(dueInvasions(progress, '2026-08-17')).toHaveLength(1);
  });

  it('orders most overdue first', () => {
    const progress = {
      ...empty(),
      conceptReviews: [review('dict', '2026-08-19'), review('set', '2026-08-10'), review('tuple', '2026-08-15')],
    };
    expect(dueInvasions(progress, '2026-08-25').map((d) => d.conceptId)).toEqual([
      'set',
      'tuple',
      'dict',
    ]);
  });

  it('caps the queue at the §5.4 ceiling', () => {
    const progress = {
      ...empty(),
      conceptReviews: ['dict', 'set', 'tuple', 'slicing', 'iteration', 'len', 'sorted'].map((c) =>
        review(c, '2026-08-01'),
      ),
    };
    const queue = dueInvasions(progress, '2026-08-25');
    expect(queue).toHaveLength(INVASION_QUEUE_CAP);
    expect(() => DueInvasionsSchema.parse(queue)).not.toThrow();
  });

  it('fires a Datamine forced review on its due date', () => {
    // §5.5's guarantee is a second source. Ignoring it leaves the queue looking healthy.
    const progress = {
      ...empty(),
      conceptReviews: [review('dict', '2026-08-20', TOP_RUNG)],
      forcedReviews: [{ playerId: 'p1', conceptId: 'dict', dueOn: '2026-08-23' }],
    };
    expect(dueInvasions(progress, '2026-08-22')).toHaveLength(0);
    expect(dueInvasions(progress, '2026-08-23')).toHaveLength(1);
  });

  it('merges a concept due on both paths into one entry that says so', () => {
    // The dedup the plan calls the mutant most worth seeding: two entries would eat two of five.
    const progress = {
      ...empty(),
      conceptReviews: [review('dict', '2026-08-19')],
      forcedReviews: [{ playerId: 'p1', conceptId: 'dict', dueOn: '2026-08-21' }],
    };
    const queue = dueInvasions(progress, '2026-08-25');
    expect(queue).toHaveLength(1);
    expect(queue[0]?.source).toBe('both');
    expect(() => DueInvasionsSchema.parse(queue)).not.toThrow();
  });

  it('takes the more overdue of the two when it merges', () => {
    const progress = {
      ...empty(),
      conceptReviews: [review('dict', '2026-08-01')],
      forcedReviews: [{ playerId: 'p1', conceptId: 'dict', dueOn: '2026-08-24' }],
    };
    // Ladder: due 2026-08-02, so 23 days overdue at the 25th. Forced: 1 day.
    expect(dueInvasions(progress, '2026-08-25')[0]?.overdueDays).toBe(23);
  });

  it('names the concept’s own area, not the player’s', () => {
    const progress = { ...empty(), conceptReviews: [review('dict', '2026-08-01')] };
    expect(dueInvasions(progress, '2026-08-25')[0]?.area).toBe(3);
  });

  it('skips a forced review for a concept never taught', () => {
    // The ladder row is written when a concept is first taught, so a forced review without one
    // describes a player who never met the concept. Skipped rather than thrown: a corrupt row
    // should not stop a session, the same argument levelAt makes.
    const progress = {
      ...empty(),
      forcedReviews: [{ playerId: 'p1', conceptId: 'dict', dueOn: '2026-08-01' }],
    };
    expect(dueInvasions(progress, '2026-08-25')).toHaveLength(0);
  });
});

/* ---------------------------------------------------------------------------------------------
 * standings
 * ------------------------------------------------------------------------------------------- */

describe('standings — the completion board, §5.8', () => {
  const withMedals = (playerId: string, medals: readonly (readonly [string, string, number])[]): PlayerProgress => ({
    ...empty(playerId),
    questMedals: medals.map(([questId, medal, xpAwarded]) => ({
      playerId,
      questId,
      medal: medal as 'cleared',
      earnedAt: '2026-08-20',
      xpAwarded,
    })),
  });

  it('returns a row per player that the contract accepts', () => {
    const rows = standings(AREA_3, [cleared('p1', 'a3-one'), cleared('p2')], 3);
    expect(StandingsSchema.parse(rows)).toHaveLength(2);
  });

  it('reads xpAwarded rather than re-pricing history', () => {
    // §5.10 pays a medal's delta once. Recomputing from the DC reports a number the player was
    // never paid — and would silently disagree with every row already in the database.
    const rows = standings(AREA_3, [withMedals('p1', [['a3-one', 'cleared', 999]])], 3);
    expect(rows[0]?.areaXp).toBe(999);
  });

  it('levels from the total, with the §5.1a denominator', () => {
    // 15·L·(L−1): level 4 begins at 180, level 5 at 300.
    const rows = standings(AREA_3, [withMedals('p1', [['a3-one', 'cleared', 200]])], 3);
    expect(rows[0]?.level).toBe(4);
    expect(rows[0]?.toNext).toBe(100);
  });

  it('carries no display name and no rank', () => {
    const [row] = standings(AREA_3, [cleared('p1', 'a3-one')], 3);
    expect(row).not.toHaveProperty('name');
    expect(row).not.toHaveProperty('rank');
  });

  it('keeps a per-area record, so a player ahead still shows the areas behind', () => {
    const items = [quest('a3-one'), quest('a4-one', { area: 4 })];
    const progress = cleared('p1', 'a3-one', 'a4-one');
    const [row] = standings(items, [progress], 4);
    expect(row?.areas.find((a) => a.area === 3)?.cleared).toBe(1);
    expect(row?.areas.find((a) => a.area === 4)?.cleared).toBe(1);
  });
});

/* ---------------------------------------------------------------------------------------------
 * Properties — the rules that must hold for every input
 * ------------------------------------------------------------------------------------------- */

describe('properties', () => {
  it('reads no clock', () => {
    // §6.7: "now" is a parameter. A query that calls Date.now() is unreproducible and untestable,
    // and would make two players' screens disagree for reasons neither could see.
    const now = vi.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('a query read the clock');
    });
    try {
      const progress = {
        ...empty(),
        conceptReviews: [{ playerId: 'p1', conceptId: 'dict', lastReviewedAt: '2026-08-01', rung: 0 }],
      };
      expect(() => {
        availableQuests(AREA_3, empty(), 3);
        areaProgress(AREA_3, complete, empty(), 3);
        bossState(AREA_3, empty(), 3);
        dueInvasions(progress, '2026-08-25');
        standings(AREA_3, [empty()], 3);
      }).not.toThrow();
    } finally {
      now.mockRestore();
    }
  });

  it('is order-independent: the same medals in any order give the same board', () => {
    // §5.10 earns medals on replay over weeks, so the order is whatever it happens to be. Two
    // players holding the same medals must show the same numbers.
    const rows = [...cleared('p1', 'a3-one', 'a3-two', 'a3-three').questMedals];
    const forward = standings(AREA_3, [{ ...empty(), questMedals: rows }], 3);
    const backward = standings(AREA_3, [{ ...empty(), questMedals: [...rows].reverse() }], 3);
    expect(forward).toEqual(backward);
  });

  it('never reports progress beyond its total, for any subset cleared', () => {
    for (let n = 0; n <= AREA_3.length; n++) {
      const ids = AREA_3.slice(0, n).map((q) => q.id);
      const p = areaProgress(AREA_3, complete, cleared('p1', ...ids), 3);
      expect(p.cleared).toBeLessThanOrEqual(p.total);
    }
  });

  it('boss unlock is monotonic: clearing never re-locks', () => {
    let previous = false;
    for (let n = 0; n <= AREA_3.length; n++) {
      const ids = AREA_3.slice(0, n).map((q) => q.id);
      const { unlocked } = bossState(AREA_3, cleared('p1', ...ids), 3);
      if (previous) expect(unlocked).toBe(true);
      previous = unlocked;
    }
  });

  it('the queue never exceeds its cap and never repeats a concept', () => {
    const concepts = ['dict', 'set', 'tuple', 'slicing', 'iteration', 'len', 'sorted', 'min'];
    const progress = {
      ...empty(),
      conceptReviews: concepts.map((conceptId) => ({
        playerId: 'p1',
        conceptId,
        lastReviewedAt: '2026-08-01',
        rung: 0,
      })),
      forcedReviews: concepts.map((conceptId) => ({ playerId: 'p1', conceptId, dueOn: '2026-08-02' })),
    };
    const queue = dueInvasions(progress, '2026-08-25');
    expect(queue.length).toBeLessThanOrEqual(INVASION_QUEUE_CAP);
    expect(new Set(queue.map((d) => d.conceptId)).size).toBe(queue.length);
  });

  it('is deterministic: the same inputs give the same answer twice', () => {
    // The other half of §6.7's purity. A stray Math.random or a Set whose iteration order leaked
    // into a result would pass every example test above and still make two screens disagree.
    const progress = {
      ...empty(),
      conceptReviews: ['dict', 'set', 'tuple'].map((conceptId) => ({
        playerId: 'p1',
        conceptId,
        lastReviewedAt: '2026-08-01',
        rung: 0,
      })),
    };
    expect(dueInvasions(progress, '2026-08-25')).toEqual(dueInvasions(progress, '2026-08-25'));
    expect(availableQuests(AREA_3, progress, 3)).toEqual(availableQuests(AREA_3, progress, 3));
    expect(standings(AREA_3, [progress], 3)).toEqual(standings(AREA_3, [progress], 3));
  });

  it('the contract’s ladder bound still matches the ladder', () => {
    // TOP_RUNG_BOUND restates INVASION_LADDER's length because the contract cannot import the
    // engine without inverting the dependency. This is the only place both are in scope.
    expect(INVASION_LADDER.length - 1).toBe(TOP_RUNG_BOUND);
  });
});
