/**
 * The practice spine — the ordering the curriculum has always had and never stored.
 *
 * Quests are deliberately unordered: §5.2 gives an area five of which any three unlock the
 * boss, and `a1-the-sigil.yml` refuses `requires` in as many words so that the choice stays
 * the learner's. The consequence nobody noticed is that the app then showed *no* order at
 * all, because the only sequence in the curriculum lived in session plans the learner never
 * opens. These tests hold the spine that fixes it.
 *
 * The relation was authored three ways before this — a README table in area 1, a
 * `### The quest` section in areas 2 and 3, and nothing at all in area 0 — and stored in
 * none of them, which is CLAUDE.md's own rule about frontmatter and punctuation, one level
 * worse because it was never even frontmatter.
 */

import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkContent, validateContent } from '../src/validate.ts';
import type { ContentIssue } from '../src/validate.ts';

const fixture = (name: string): string =>
  fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));

const roots = (name: string) => ({
  curriculum: fixture(`${name}/curriculum`),
  game: fixture(`${name}/game`),
});

const byRule = (issues: readonly ContentIssue[], rule: string): ContentIssue[] =>
  issues.filter((i) => i.rule === rule);

describe('a practices.yml beside the area manifest', () => {
  it('validates clean, and is not mistaken for a content item', () => {
    expect(validateContent(roots('practices'))).toEqual([]);
  });

  it('is read as a spine rather than as a quest', () => {
    const { practices, items, issues } = checkContent(roots('practices'));
    expect(issues).toEqual([]);
    expect(practices.map((p) => p.n)).toEqual([1, 2, 3, 4]);
    // The quests are still quests. A practices.yml adds a spine; it does not add items.
    expect(items.map((i) => i.id).sort()).toEqual(['a1-the-countdown', 'a1-the-sigil']);
  });

  /**
   * The honest half. Roughly half the practices in a real area carry no brief-bearing
   * exercise at all — the work is DM-delivered at the table. An empty list is the truth
   * about those, and a validator that rejected it would force authors to invent an exercise
   * to satisfy a schema.
   */
  it('accepts a practice that lists no exercises', () => {
    const { practices } = checkContent(roots('practices'));
    expect(practices.find((p) => p.n === 1)?.exercises).toEqual([]);
  });

  /**
   * Many-to-many is the real shape, not an edge case: `a1-the-polygon-engine` is built from
   * session 1 and session 2, and `a1-the-growing-spiral` from 7 and 8. A rule that demanded
   * one practice per exercise would reject the actual curriculum on the day it was written.
   */
  it('accepts one exercise claimed by more than one practice', () => {
    const { practices } = checkContent(roots('practices'));
    const claiming = practices.filter((p) => p.exercises.includes('the-countdown'));
    expect(claiming.map((p) => p.n)).toEqual([2, 3]);
  });
});

/**
 * The loop closes here, and this is the only place it can be wrong.
 *
 * Practice -> Exercise is authored in `curriculum/`. Quest -> Exercise is already authored in
 * `game/`, as the `brief:` path. Practice -> Quest is neither: it is derived by joining the
 * two, which is why it cannot drift out of date the way three hand-maintained tables did.
 * Storing it instead would either point the curriculum at game ids — failing the deletion
 * test — or duplicate a fact the brief path already states.
 */
describe('the practice-to-quest edge', () => {
  it('is derived from the brief path, not authored', () => {
    const { practices } = checkContent(roots('practices'));
    expect(practices.find((p) => p.n === 2)?.quests).toEqual(['a1-the-countdown']);
    expect(practices.find((p) => p.n === 3)?.quests).toEqual(['a1-the-countdown']);
    expect(practices.find((p) => p.n === 4)?.quests).toEqual(['a1-the-sigil']);
  });

  it('leaves a practice with no scored work carrying no quests', () => {
    const { practices } = checkContent(roots('practices'));
    expect(practices.find((p) => p.n === 1)?.quests).toEqual([]);
  });

  /**
   * The deletion test, applied to the spine. `game/` is an overlay; the ordering is the
   * curriculum's own. Pointing both roots at the curriculum is what the loader does when the
   * overlay is gone, and the spine must survive it intact with every quest edge simply empty.
   */
  it('survives the overlay being deleted', () => {
    const only = fixture('practices/curriculum');
    const { practices, issues } = checkContent({ curriculum: only, game: only });
    expect(issues).toEqual([]);
    expect(practices.map((p) => p.n)).toEqual([1, 2, 3, 4]);
    expect(practices.flatMap((p) => p.quests)).toEqual([]);
  });
});

describe('what the spine refuses', () => {
  /** A slug resolving to nothing is the sequence pointing at work that does not exist. */
  it('reports a listed exercise with no directory', () => {
    const issues = byRule(
      validateContent(roots('broken/practice-missing-exercise')),
      'practice-missing-exercise',
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.file).toBe('area-1/practices.yml');
    expect(issues[0]?.message).toContain('ghost');
    expect(issues[0]?.fix).not.toBe('');
  });

  /**
   * The check this suite exists for. An exercise authored into the tree and claimed by no
   * practice is invisible to the learner — it is exactly the drift that left area 0's README
   * proposing, in future tense, quests that had already shipped.
   */
  it('reports an exercise no practice claims', () => {
    const issues = byRule(
      validateContent(roots('broken/unclaimed-exercise')),
      'unclaimed-exercise',
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain('the-sigil');
    expect(issues[0]?.fix).not.toBe('');
  });

  /**
   * `build.ts` already refuses game vocabulary by argument — "anything that is not an
   * exercise is left out rather than renamed, because renaming it would be the game leaking
   * in under a different label." That was a convention held by hand. This makes it a filter
   * that can fail, over the one document most likely to break it: a page explaining how the
   * whole thing works, written by someone holding both halves in their head at once.
   *
   * The word boundary matters and CLAUDE.md records why a naive one is worth nothing: an
   * underscore is a word character, so `\bquest\b` misses `practice_quest`.
   */
  it('reports game vocabulary in a curriculum how-to', () => {
    const issues = byRule(
      validateContent(roots('broken/game-vocabulary')),
      'game-vocabulary',
    );
    const words = issues.map((i) => i.message).join(' ');
    expect(words).toContain('quest');
    expect(words).toContain('XP');
    expect(issues[0]?.file).toBe('how-to/how-to-learn.md');

    /**
     * `boss_fight.py` is the case that makes this filter worth anything, and the one a naive
     * boundary sails past. `\bboss\b` does not match inside `boss_fight`, because `_` counts
     * as a word character and so there is no boundary there at all — which is the failure
     * CLAUDE.md records shipping twice in one day. Excluding `_` from the boundary is the fix,
     * and this assertion is what proves the fix is present.
     */
    expect(words).toContain('boss');
    expect(issues).toHaveLength(3);
  });

  it('leaves the game half alone, because the game may name its own machinery', () => {
    expect(byRule(validateContent(roots('practices')), 'game-vocabulary')).toEqual([]);
  });

  /** A gap is either an unwritten practice or a half-done renumbering. Both are bugs. */
  it('reports a gap in the numbering', () => {
    const issues = byRule(
      validateContent(roots('broken/practice-numbering')),
      'practice-numbering',
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain('3');
  });
});
