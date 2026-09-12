/**
 * Audience — who a curriculum document is written for, declared rather than inferred.
 *
 * The rule replaces a convention that had already failed in shipped prose.
 * `curriculum/area-<n>/practices/README.md` tells the learner *"Copy this whole directory
 * somewhere you own"*, and `practices/` holds the DM's plans beside the learner's drills —
 * including `practice-3-the-broken-sigil.md`, the practice that works only because the learner
 * does not know what is coming. Directory-as-audience failed because the two audiences share a
 * directory, and nothing caught it because a directory cannot be asked who reads it.
 *
 * These tests hold three things: that an undeclared audience is reported, that an invented one
 * is reported, and that the parser cannot be fooled by the 67 horizontal rules already sitting
 * in this corpus.
 */

import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { splitFrontmatter, stripFrontmatter } from '../src/frontmatter.ts';
import { validateContent } from '../src/validate.ts';
import type { ContentIssue } from '../src/validate.ts';

const fixture = (name: string): string =>
  fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));

const roots = (name: string) => ({
  curriculum: fixture(`${name}/curriculum`),
  game: fixture(`${name}/game`),
});

const byRule = (issues: readonly ContentIssue[], rule: string): ContentIssue[] =>
  issues.filter((i) => i.rule === rule);

describe('the audience rule', () => {
  it('reports a file under an area that declares no audience', () => {
    const issues = byRule(validateContent(roots('broken/audience-missing')), 'audience');

    expect(issues).toHaveLength(1);
    expect(issues[0]?.file).toBe('area-1/exercises/the-countdown/BRIEF.md');
    expect(issues[0]?.message).toContain('no `audience:` declared');
    // The fix has to name both values, because the author's next action is to pick one.
    expect(issues[0]?.fix).toContain('learner');
    expect(issues[0]?.fix).toContain('dm');
  });

  it('reports an audience that is not one of the two', () => {
    const issues = byRule(validateContent(roots('broken/audience-unknown')), 'audience');

    expect(issues).toHaveLength(1);
    expect(issues[0]?.file).toBe('area-1/exercises/the-countdown/BRIEF.md');
    // The word the author wrote, not the word the list expected -- an error naming the wrong
    // one sends them hunting for a second occurrence.
    expect(issues[0]?.message).toContain('teacher');
  });

  it('stays silent on a tree where every file under an area declares one', () => {
    expect(byRule(validateContent(roots('practices')), 'audience')).toEqual([]);
  });
});

describe('the frontmatter parser', () => {
  /**
   * The safety property the whole rule rests on.
   *
   * 67 markdown files under `curriculum/` and `game/` contain a `---` horizontal rule and none
   * of them carried frontmatter before this. A parser that scanned for the first fence rather
   * than requiring it at line 0 would read the prose above a rule as key-value pairs, find no
   * colon in any of it, and return an empty map -- reporting every one of those files as
   * unmarked while looking like it had parsed them.
   */
  it('does not mistake a horizontal rule for a frontmatter fence', () => {
    const doc = ['# A lesson', '', 'Some prose.', '', '---', '', 'More prose.'].join('\n');

    expect(splitFrontmatter(doc).present).toBe(false);
    expect(stripFrontmatter(doc)).toBe(doc);
  });

  it('reads a block that opens on the first line', () => {
    const doc = ['---', 'audience: learner', '---', '', '# A lesson'].join('\n');
    const { fields, present } = splitFrontmatter(doc);

    expect(present).toBe(true);
    expect(fields.get('audience')).toBe('learner');
  });

  /**
   * An unterminated block is a mistake rather than a document. Treating it as absent makes the
   * audience rule say "no audience declared", which is both true and actionable; treating it as
   * present would report a file with no fields and no explanation.
   */
  it('treats an unclosed block as no block at all', () => {
    const doc = ['---', 'audience: learner', '', '# A lesson'].join('\n');

    expect(splitFrontmatter(doc).present).toBe(false);
    expect(stripFrontmatter(doc)).toBe(doc);
  });

  /**
   * Every renderer runs a heading-stripper after this one. If the block left its trailing blank
   * line behind, a body opening with `# Title` would no longer look like one to them, and the
   * Field Manual would publish the title twice.
   */
  it('removes the block and the blank line under it', () => {
    const doc = ['---', 'audience: dm', '---', '', '# A guide', '', 'Prose.'].join('\n');

    expect(stripFrontmatter(doc)).toBe(['# A guide', '', 'Prose.'].join('\n'));
  });

  it('leaves a document with no block exactly as it found it', () => {
    const doc = '# A lesson\n\nProse.\n';

    expect(stripFrontmatter(doc)).toBe(doc);
    expect(splitFrontmatter(doc).present).toBe(false);
  });
});
