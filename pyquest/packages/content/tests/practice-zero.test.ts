/**
 * Practice 0 — a spine may begin at zero.
 *
 * The bootstrap was a footnote and is now a practice. `tools/learner-setup/` delivers the
 * payload as a branch of the learner's own repository, and the payload contains
 * `tools/git/README.md` — the instructions for installing git. Receiving the instructions
 * required git, a clone and an account, so the ordering was not merely awkward, it was circular.
 *
 * Making the bootstrap Practice 0 of Area 0 breaks the circle by admitting what it is: setup,
 * done at the table, before the work starts. The number is the claim. `0` says *before* in a way
 * a footnote in a README does not, and `curriculum/how-to/how-to-learn.md` already tells the
 * learner the practices run in order — so the order had better be able to say where it begins.
 *
 * **`0` is legal in every area, not only Area 0.** Restricting it would bake a special case into
 * a schema roughly 150 quests are authored against, which is the argument §6.3 already made when
 * it chose a role over a family member. Area 3's ursina install is the next honest candidate.
 *
 * What must not follow is a spine that begins anywhere at all: the rule still refuses a start at
 * 2, because a learner told to begin at 2 asks what 1 was. That is the same failure as a gap,
 * moved to the front, and it is the one this relaxation could most easily let through.
 */

import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { validateContent } from '../src/validate.ts';
import { PracticeSchema } from '../src/schema.ts';
import type { ContentIssue } from '../src/validate.ts';

const fixture = (name: string): string =>
  fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));

const roots = (name: string) => ({
  curriculum: fixture(`${name}/curriculum`),
  game: fixture(`${name}/game`),
});

const byRule = (issues: readonly ContentIssue[], rule: string): ContentIssue[] =>
  issues.filter((i) => i.rule === rule);

describe('a practice numbered zero', () => {
  it('is accepted by the schema', () => {
    expect(PracticeSchema.safeParse({ n: 0, title: 'Setup', exercises: [] }).success).toBe(true);
  });

  it('is still refused below zero, because there is no practice minus one', () => {
    expect(PracticeSchema.safeParse({ n: -1, title: 'Setup', exercises: [] }).success).toBe(false);
  });

  it('validates a whole spine that starts at 0', () => {
    expect(validateContent(roots('practice-zero'))).toEqual([]);
  });
});

describe('where a spine may begin', () => {
  it('refuses one that starts at 2, which is a gap moved to the front', () => {
    const issues = byRule(
      validateContent(roots('broken/practice-numbering-start')),
      'practice-numbering',
    );

    expect(issues).toHaveLength(1);
    expect(issues[0]?.file).toBe('area-1/practices.yml');
    expect(issues[0]?.message).toContain('0 or 1');
  });

  it('still refuses a gap in the middle', () => {
    // The original rule, unchanged by the relaxation. 1, 2, 4 and the learner asks about 3.
    const issues = byRule(validateContent(roots('broken/practice-numbering')), 'practice-numbering');
    expect(issues).toHaveLength(1);
  });

  it('still accepts the ordinary case, which begins at 1', () => {
    expect(byRule(validateContent(roots('practices')), 'practice-numbering')).toEqual([]);
  });
});
