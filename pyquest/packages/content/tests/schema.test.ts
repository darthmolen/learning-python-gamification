/**
 * The content contract's own tests.
 *
 * These are filter tests, not pinning tests: each rejection case names a specific authoring
 * mistake, and the schema is only worth what it refuses. The acceptance cases are drawn from
 * the spec itself so the contract cannot silently drift away from the document it implements.
 */

import { describe, expect, it } from 'vitest';
import { medalsFor, parseContentItem, parseAreaManifest } from '../src/index.ts';

/** The exact example from spec §6.2. If this stops parsing, the contract has drifted. */
const SPEC_EXAMPLE = {
  id: 'a3-recipe-book',
  title: 'The Recipe Book',
  kind: 'quest',
  area: 3,
  concepts: ['dict', 'dict-methods', 'iteration'],
  requires: ['a3-inventory-lists'],
  dc: 12,
  brief: 'briefs/a3-recipe-book.md',
  verifier: {
    type: 'hidden-tests',
    starter: 'starters/a3-recipe-book.py',
    tests: 'tests/a3-recipe-book_test.py',
  },
} as const;

describe('accepts what the spec describes', () => {
  it('parses the §6.2 example unchanged', () => {
    const quest = parseContentItem(SPEC_EXAMPLE);
    expect(quest.id).toBe('a3-recipe-book');
    expect(quest.dc).toBe(12);
    expect(quest.concepts).toEqual(['dict', 'dict-methods', 'iteration']);
  });

  it('defaults requires to empty rather than demanding the author write it', () => {
    const { requires: _omitted, ...withoutRequires } = SPEC_EXAMPLE;
    expect(parseContentItem(withoutRequires).requires).toEqual([]);
  });

  it('offers the §5.10 medal slots by default, and time-attack is not among them', () => {
    const medals = medalsFor(parseContentItem(SPEC_EXAMPLE));
    expect(medals).toContain('cleared');
    expect(medals).toContain('ironman');
    expect(medals).not.toContain('time-attack'); // roadmap, per §5.10
  });

  it('parses a boss carrying its two-or-three theme framings (§5.2)', () => {
    const boss = parseContentItem({
      ...SPEC_EXAMPLE,
      id: 'a3-the-crafting-table',
      kind: 'boss',
      themes: ['A potion brewer', 'A blacksmith'],
      verifier: { type: 'peer-signoff', by: 'peer' },
    });
    expect(boss.themes).toHaveLength(2);
  });

  it('parses each of the four §6.3 verifier types', () => {
    const verifiers = [
      { type: 'hidden-tests', starter: 's.py', tests: 't.py' },
      { type: 'local-repo', tests: 'tests/t.py' },
      { type: 'peer-signoff', by: 'peer' },
      { type: 'git-signal', signal: 'push' },
    ];
    for (const verifier of verifiers) {
      expect(parseContentItem({ ...SPEC_EXAMPLE, verifier }).verifier.type).toBe(verifier.type);
    }
  });

  it('records a partially authored area as an estimate (§5.1a)', () => {
    const manifest = parseAreaManifest({
      area: 3, title: 'Collections', authoring: 'partial', estimatedQuests: 5,
    });
    expect(manifest.authoring).toBe('partial');
    expect(manifest.estimatedQuests).toBe(5);
  });
});

describe('refuses what an author would get wrong', () => {
  const rejects: ReadonlyArray<readonly [string, unknown]> = [
    ['an unknown concept tag', { ...SPEC_EXAMPLE, concepts: ['dicts'] }],
    ['a DC above the 5-30 scale', { ...SPEC_EXAMPLE, dc: 31 }],
    ['a DC below the 5-30 scale', { ...SPEC_EXAMPLE, dc: 4 }],
    ['a non-integer DC', { ...SPEC_EXAMPLE, dc: 12.5 }],
    ['a boss with no theme framings', { ...SPEC_EXAMPLE, kind: 'boss' }],
    ['theme framings on something that is not a boss', { ...SPEC_EXAMPLE, themes: ['a', 'b'] }],
    ['a boss offering only one framing', { ...SPEC_EXAMPLE, kind: 'boss', themes: ['only one'] }],
    ['an absolute brief path', { ...SPEC_EXAMPLE, brief: '/etc/passwd' }],
    ['a Windows absolute brief path', { ...SPEC_EXAMPLE, brief: 'C:/Windows/win.ini' }],
    ['a brief path escaping the content root', { ...SPEC_EXAMPLE, brief: '../../secrets.md' }],
    ['an item requiring itself', { ...SPEC_EXAMPLE, requires: ['a3-recipe-book'] }],
    ['medal slots omitting "cleared"', { ...SPEC_EXAMPLE, medals: ['ironman'] }],
    ['an unknown verifier type', { ...SPEC_EXAMPLE, verifier: { type: 'vibes' } }],
    ['a hidden-tests verifier missing its tests', {
      ...SPEC_EXAMPLE, verifier: { type: 'hidden-tests', starter: 's.py' },
    }],
    ['no concept tags at all', { ...SPEC_EXAMPLE, concepts: [] }],
    ['a mistyped field name', { ...SPEC_EXAMPLE, tierr: 3 }],
    ['an id that is not kebab-case', { ...SPEC_EXAMPLE, id: 'T3_Recipe_Book' }],
    ['an area beyond the curriculum', { ...SPEC_EXAMPLE, area: 8 }],
  ];

  it.each(rejects)('rejects %s', (_label, input) => {
    expect(() => parseContentItem(input)).toThrow();
  });

  it('rejects a partial area that does not estimate its total (§5.1a)', () => {
    expect(() => parseAreaManifest({ area: 3, title: 'Collections', authoring: 'partial' }))
      .toThrow();
  });
});
