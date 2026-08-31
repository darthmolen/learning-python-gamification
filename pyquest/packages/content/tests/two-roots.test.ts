/**
 * Two roots: `curriculum/` holds every educational artifact, `game/` is the overlay.
 *
 * The rule these tests exist to hold is the one that spans the boundary. A quest lives in
 * `game/` and its `brief`, `starter` and `tests` name files in `curriculum/`, so "every path an
 * item points at must exist" is now a check across two trees rather than within one.
 * `buildSite` skips its own existence checks *because* this rule is here (see the note in
 * `apps/field-manual/src/build.ts`), so a weak version of it publishes broken links rather than
 * failing a build.
 *
 * The thesis is also asserted here rather than described: delete `game/` and the curriculum
 * must still validate. That is the deletion test the two-tree layout exists to make possible.
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

describe('a quest in game/ pointing at a brief in curriculum/', () => {
  it('validates clean when every referenced file exists in the other tree', () => {
    expect(validateContent(roots('two-roots'))).toEqual([]);
  });

  it('finds the item and its manifest across both trees', () => {
    const { items, manifests, issues } = checkContent(roots('two-roots'));
    expect(issues).toEqual([]);
    expect(items.map((i) => i.id)).toEqual(['a1-the-countdown']);
    expect(manifests.map((m) => m.area)).toEqual([1]);
  });

  /**
   * The mutant this suite exists for. A quest naming a brief that is not in the curriculum root
   * must be caught — if the reference check silently resolves against the game root, or skips
   * paths it cannot resolve, this is the test that notices.
   */
  it('reports a reference that does not exist in the curriculum root', () => {
    const issues = byRule(validateContent(roots('broken/cross-root-missing')), 'missing-file');
    expect(issues).toHaveLength(3); // brief, starter, tests

    const brief = issues.find((i) => i.message.includes('BRIEF.md'));
    expect(brief?.id).toBe('a1-ghost');
    expect(brief?.file).toBe('area-1/quests/a1-ghost.yml');
    expect(brief?.message).toContain('area-1/exercises/ghost/BRIEF.md');
  });
});

describe('the manifest convention no longer depends on an areas/ directory', () => {
  it('reads area.yml sitting inside its own area folder', () => {
    const { manifests } = checkContent(roots('two-roots'));
    expect(manifests).toHaveLength(1);
    expect(manifests[0]?.title).toBe('Control');
  });
});

describe('the deletion test — the curriculum stands without the game', () => {
  /**
   * The project's whole claim, made checkable. With `game/` gone there are no items, so there
   * is nothing to be missing a manifest and nothing pointing at a file that is not there. A
   * curriculum root that only validates while the game is present would not be a curriculum.
   */
  it('validates a curriculum root with no game root at all', () => {
    expect(
      validateContent({ curriculum: fixture('two-roots/curriculum'), game: fixture('nonexistent') }),
    ).toEqual([]);
  });
});

describe('a single root stays valid', () => {
  /**
   * The old shape must keep working while the real tree is still in it. Phase 2 moves the
   * files; until then `checkContent(string)` is what the repository, the API and the CLI all
   * call, and this branch is not allowed to break the live site on its way past.
   */
  it('accepts a bare string and treats it as both roots', () => {
    const legacy = fileURLToPath(new URL('../../../../content', import.meta.url));
    expect(validateContent(legacy)).toEqual([]);
  });
});
