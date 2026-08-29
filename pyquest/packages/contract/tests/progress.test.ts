/**
 * The input half of the contract: what `packages/db` hands the engine.
 *
 * These shapes matter as much as the payloads. The progress-schema plan builds "thin functions
 * returning the shapes `@pyquest/contract` declares", so if this file is vague the repository
 * and the query layer meet for the first time at integration — the drift this package exists
 * to prevent, on the side nobody watches.
 */

import { describe, expect, it } from 'vitest';
import {
  ConceptReviewSchema,
  ForcedReviewSchema,
  PlayerProgressSchema,
  QuestMedalRecordSchema,
  TOP_RUNG_BOUND,
} from '@pyquest/contract';

const medal = {
  playerId: 'p1',
  questId: 'a3-recipe-book',
  medal: 'ironman',
  earnedAt: '2026-08-20',
  xpAwarded: 34,
} as const;

const review = {
  playerId: 'p1',
  conceptId: 'dict',
  lastReviewedAt: '2026-08-20',
  rung: 2,
} as const;

const forced = {
  playerId: 'p1',
  conceptId: 'dict',
  dueOn: '2026-08-23',
} as const;

describe('QuestMedalRecordSchema — the §6.2 row', () => {
  it('accepts a row', () => {
    expect(QuestMedalRecordSchema.parse(medal).xpAwarded).toBe(34);
  });

  it('keeps xpAwarded, because §5.10 pays the delta once', () => {
    // The recorded number is what the player was actually paid. A query that re-prices history
    // reports a number nobody ever received, so the field is required rather than optional.
    expect(() => QuestMedalRecordSchema.parse({ ...medal, xpAwarded: undefined })).toThrow();
  });

  it('allows a zero payout — a medal at the DC floor pays nothing and that is legal', () => {
    expect(QuestMedalRecordSchema.parse({ ...medal, xpAwarded: 0 }).xpAwarded).toBe(0);
  });

  it('refuses a medal outside the §5.10 table', () => {
    expect(() => QuestMedalRecordSchema.parse({ ...medal, medal: 'gold' })).toThrow();
  });

  it('refuses a negative payout', () => {
    expect(() => QuestMedalRecordSchema.parse({ ...medal, xpAwarded: -5 })).toThrow();
  });

  it('refuses a non-ISO earnedAt', () => {
    expect(() => QuestMedalRecordSchema.parse({ ...medal, earnedAt: '20/08/2026' })).toThrow();
  });
});

describe('ConceptReviewSchema — the §5.4 ladder position', () => {
  it('accepts a review', () => {
    expect(ConceptReviewSchema.parse(review).rung).toBe(2);
  });

  it('refuses a rung off the end of the ladder', () => {
    // A rung past the top means the scheduler is broken, and the interval it implies does not
    // exist. Better refused at the boundary than clamped silently downstream.
    expect(() => ConceptReviewSchema.parse({ ...review, rung: TOP_RUNG_BOUND + 1 })).toThrow();
  });

  it('accepts the top rung itself', () => {
    expect(ConceptReviewSchema.parse({ ...review, rung: TOP_RUNG_BOUND }).rung).toBe(TOP_RUNG_BOUND);
  });

  it('refuses a concept the registry does not know', () => {
    expect(() => ConceptReviewSchema.parse({ ...review, conceptId: 'monads' })).toThrow();
  });

  it('refuses a non-ISO lastReviewedAt', () => {
    expect(() => ConceptReviewSchema.parse({ ...review, lastReviewedAt: '20/08/2026' })).toThrow();
  });

  it('pins the ladder length rather than deferring to itself', () => {
    // Asserting the boundary with TOP_RUNG_BOUND alone is self-referential: the constant could
    // drift to any value and every rung test would still pass. INVASION_LADDER in the engine is
    // the source of truth; the engine suite proves the two agree, and this pins the number here.
    expect(TOP_RUNG_BOUND).toBe(4);
  });
});

describe('ForcedReviewSchema — §5.5 +3 and +10', () => {
  it('accepts a scheduled review', () => {
    expect(ForcedReviewSchema.parse(forced).dueOn).toBe('2026-08-23');
  });

  it('refuses a non-ISO due date', () => {
    expect(() => ForcedReviewSchema.parse({ ...forced, dueOn: '23-08-2026' })).toThrow();
  });
});

describe('PlayerProgressSchema — what the API hands the engine', () => {
  const progress = {
    playerId: 'p1',
    questMedals: [medal],
    conceptReviews: [review],
    forcedReviews: [forced],
  };

  it('accepts a bundle', () => {
    expect(PlayerProgressSchema.parse(progress).questMedals).toHaveLength(1);
  });

  it('accepts a player who has done nothing yet', () => {
    // A fresh player and a corrupt row should both open the app, the same argument levelAt makes.
    expect(
      PlayerProgressSchema.parse({
        playerId: 'p2',
        questMedals: [],
        conceptReviews: [],
        forcedReviews: [],
      }).conceptReviews,
    ).toEqual([]);
  });

  it('refuses rows belonging to another player', () => {
    // The bundle is one player's. A mixed bundle is how one player's medals end up on another's
    // row of the completion board.
    expect(() =>
      PlayerProgressSchema.parse({ ...progress, questMedals: [{ ...medal, playerId: 'p9' }] }),
    ).toThrow();
  });

  it('refuses tables the queries do not read', () => {
    // attempts, sessions, journal_entries, bounties and runner_jobs are real tables that are not
    // engine inputs. Letting them in here invites a query to reach for one.
    expect(() => PlayerProgressSchema.parse({ ...progress, attempts: [] })).toThrow();
  });
});
