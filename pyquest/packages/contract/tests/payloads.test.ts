/**
 * The contract's job is to refuse. These tests are mostly about what a schema will not accept,
 * because a schema that accepts everything types the API and the SPA against nothing.
 *
 * The §5.1 layer boundary is pinned here rather than in the engine: presentation belongs to the
 * UI, so a payload carrying `risky`, `accent` or `dcFill` is a boundary violation the contract
 * catches once, on behalf of both consumers.
 */

import { describe, expect, it } from 'vitest';
import {
  AreaProgressSchema,
  BossStateSchema,
  DueInvasionSchema,
  DueInvasionsSchema,
  INVASION_QUEUE_CAP,
  LevelSchema,
  PRESENTATION_FIELDS,
  QuestCardSchema,
  StandingSchema,
  XpSourceSchema,
} from '@pyquest/contract';

const questCard = {
  id: 'a3-recipe-book',
  title: 'The Recipe Book',
  dc: 12,
  concepts: ['dict'],
  medals: ['cleared'],
  status: 'available',
} as const;

const standing = {
  playerId: 'p1',
  level: 4,
  toNext: 90,
  areaXp: 320,
  areas: [{ area: 3, cleared: 2, medals: ['cleared', 'ironman'] }],
} as const;

describe('AreaProgressSchema — §5.1a cleared of total', () => {
  it('accepts a complete area', () => {
    expect(AreaProgressSchema.parse({ cleared: 3, total: 5, estimated: false })).toEqual({
      cleared: 3,
      total: 5,
      estimated: false,
    });
  });

  it('requires the estimated flag rather than defaulting it', () => {
    // §5.1a: an estimate presented as fact is dishonest. A default would let a partial area
    // ship as though it were complete because someone forgot a field.
    expect(() => AreaProgressSchema.parse({ cleared: 3, total: 5 })).toThrow();
  });

  it('refuses progress beyond the total', () => {
    expect(() => AreaProgressSchema.parse({ cleared: 6, total: 5, estimated: false })).toThrow();
  });

  it('refuses a negative count', () => {
    expect(() => AreaProgressSchema.parse({ cleared: -1, total: 5, estimated: false })).toThrow();
  });
});

describe('BossStateSchema — §5.2 three of five', () => {
  it('carries how close, not just whether', () => {
    const state = BossStateSchema.parse({ cleared: 2, required: 3, unlocked: false });
    expect(state.cleared).toBe(2);
    expect(state.required).toBe(3);
  });

  it('refuses a state that contradicts itself', () => {
    // Unlocked at two of three is the mutant the engine test seeds; the contract will not
    // carry it even if the engine produces it.
    expect(() => BossStateSchema.parse({ cleared: 2, required: 3, unlocked: true })).toThrow();
  });

  it('accepts unlocked once the requirement is met', () => {
    expect(BossStateSchema.parse({ cleared: 3, required: 3, unlocked: true }).unlocked).toBe(true);
  });
});

describe('QuestCardSchema — the Area screen, minus the colours', () => {
  it('accepts a card', () => {
    expect(QuestCardSchema.parse(questCard).id).toBe('a3-recipe-book');
  });

  it.each(PRESENTATION_FIELDS)('refuses the presentation field %s', (field) => {
    expect(() => QuestCardSchema.parse({ ...questCard, [field]: 'anything' })).toThrow();
  });

  it('refuses an unknown concept-shaped id that is not kebab-case', () => {
    expect(() => QuestCardSchema.parse({ ...questCard, id: 'Recipe Book' })).toThrow();
  });

  it('refuses a DC outside the published 5–30 scale', () => {
    expect(() => QuestCardSchema.parse({ ...questCard, dc: 31 })).toThrow();
    expect(() => QuestCardSchema.parse({ ...questCard, dc: 4 })).toThrow();
  });

  it('refuses a medal that is not in the §5.10 table', () => {
    expect(() => QuestCardSchema.parse({ ...questCard, medals: ['gold'] })).toThrow();
  });
});

describe('DueInvasionSchema — §5.4 and §5.5 merged', () => {
  const due = {
    conceptId: 'dict',
    area: 3,
    lastSeen: '2026-08-20',
    overdueDays: 4,
    source: 'ladder',
  } as const;

  it('accepts a ladder entry', () => {
    expect(DueInvasionSchema.parse(due).source).toBe('ladder');
  });

  it('carries "both" so a deduplicated entry can say so', () => {
    // A concept overdue on the ladder that also holds a Datamine review is one entry, not two.
    // Losing this member is how that dedup silently becomes a drop.
    expect(DueInvasionSchema.parse({ ...due, source: 'both' }).source).toBe('both');
  });

  it('refuses an unknown source', () => {
    expect(() => DueInvasionSchema.parse({ ...due, source: 'guess' })).toThrow();
  });

  it('refuses an area outside 0–7', () => {
    expect(() => DueInvasionSchema.parse({ ...due, area: 8 })).toThrow();
  });

  it('refuses a non-ISO lastSeen', () => {
    expect(() => DueInvasionSchema.parse({ ...due, lastSeen: '20/08/2026' })).toThrow();
  });

  it('refuses a concept id the registry does not know', () => {
    expect(() => DueInvasionSchema.parse({ ...due, conceptId: 'monads' })).toThrow();
  });
});

describe('DueInvasionsSchema — the queue, not the entry', () => {
  const entry = (conceptId: string, overdueDays: number) => ({
    conceptId,
    area: 3,
    lastSeen: '2026-08-20',
    overdueDays,
    source: 'ladder' as const,
  });

  it('accepts a full queue at the cap', () => {
    const five = ['dict', 'set', 'tuple', 'slicing', 'iteration'].map((c, i) => entry(c, 5 - i));
    expect(DueInvasionsSchema.parse(five)).toHaveLength(INVASION_QUEUE_CAP);
  });

  it('refuses a queue past the §5.4 cap', () => {
    const six = ['dict', 'set', 'tuple', 'slicing', 'iteration', 'len'].map((c, i) => entry(c, 6 - i));
    expect(() => DueInvasionsSchema.parse(six)).toThrow();
  });

  it('refuses the same concept twice', () => {
    // The dedup rule the plan names as the mutant most worth seeding: a concept overdue on the
    // ladder that also holds a Datamine review is one entry carrying source both, never two
    // entries eating two of five slots.
    expect(() => DueInvasionsSchema.parse([entry('dict', 4), entry('dict', 2)])).toThrow();
  });
});

describe('StandingSchema — the completion board, §5.8', () => {
  it('accepts a player row', () => {
    expect(StandingSchema.parse(standing).playerId).toBe('p1');
  });

  it('carries no display name — §6.2 keys on player_id and the API joins the roster', () => {
    expect(() => StandingSchema.parse({ ...standing, name: 'Dad' })).toThrow();
  });

  it('carries no rank — it is a record, not a race', () => {
    expect(() => StandingSchema.parse({ ...standing, rank: 1 })).toThrow();
  });
});

describe('XpSourceSchema — where the XP came from', () => {
  it('accepts every kind the engine can pay', () => {
    for (const kind of ['quest', 'boss', 'invasion', 'journal-entry', 'area-release-notes', 'co-op-session']) {
      expect(XpSourceSchema.parse({ kind, xp: 40 }).kind).toBe(kind);
    }
  });

  it('refuses a kind the XP table does not price', () => {
    expect(() => XpSourceSchema.parse({ kind: 'lessons-watched', xp: 40 })).toThrow();
  });
});

describe('LevelSchema — §5.1a, never a bare number', () => {
  it('accepts a level with its denominator', () => {
    expect(LevelSchema.parse({ level: 4, into: 90, need: 180, toNext: 90 }).need).toBe(180);
  });

  it('refuses a level whose parts do not sum to its denominator', () => {
    // into + toNext must equal need, or a progress bar disagrees with the label beside it.
    expect(() => LevelSchema.parse({ level: 4, into: 90, need: 180, toNext: 45 })).toThrow();
  });
});
