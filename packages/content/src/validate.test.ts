/**
 * The validator's own tests.
 *
 * The validator is worth exactly what it refuses, so every test here names one authoring
 * mistake and pins the *report*, not merely the refusal. A validator that says "invalid" is a
 * validator the author has to debug; §6.10 promises two minutes, and a message that does not
 * name the file, the id, and the fix spends more than that on its own.
 *
 * The broken fixtures under `fixtures/broken/` are the point of the suite. Each directory is
 * one mistake, held still, so the message it produces can be asserted rather than described.
 */

import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { findPrerequisiteCycle, formatIssues, validateContent } from './validate.ts';
import type { ContentIssue } from './validate.ts';

/** The authored content root, three levels up from `packages/content/src/`. */
const CONTENT_ROOT = fileURLToPath(new URL('../../../content', import.meta.url));

const broken = (name: string): string =>
  fileURLToPath(new URL(`../fixtures/broken/${name}`, import.meta.url));

/** Every issue of one rule, so a test can assert on the rule it is about and ignore the rest. */
const byRule = (issues: readonly ContentIssue[], rule: string): ContentIssue[] =>
  issues.filter((i) => i.rule === rule);

describe('the authored content root', () => {
  it('validates clean, so a failure here means the fixtures are the content', () => {
    expect(validateContent(CONTENT_ROOT)).toEqual([]);
  });
});

describe('the prerequisite graph', () => {
  /**
   * The whole value of the cycle check is naming the cycle. Asserting only that *a* cycle was
   * reported would survive an implementation that printed three arbitrary ids, so this pulls
   * the chain apart and checks every hop is a real `requires` edge.
   */
  it('names the actual cycle, hop by hop, rather than saying "cycle detected"', () => {
    const issues = byRule(validateContent(broken('cyclic')), 'prerequisite-cycle');
    expect(issues).toHaveLength(1);

    const chain = issues[0]!.message.match(/a1-[a-z](?: -> a1-[a-z])+/)?.[0];
    expect(chain, `no "a -> b -> a" chain in: ${issues[0]!.message}`).toBeDefined();

    const hops = chain!.split(' -> ');
    expect(hops).toHaveLength(4); // three items, returning to the start
    expect(hops[0]).toBe(hops[3]);
    expect(new Set(hops)).toEqual(new Set(['a1-a', 'a1-b', 'a1-c']));

    // The fixture's edges, written out: each item requires the next one named.
    const edges: Record<string, string> = { 'a1-a': 'a1-c', 'a1-b': 'a1-a', 'a1-c': 'a1-b' };
    for (let i = 0; i < hops.length - 1; i++) {
      expect(edges[hops[i]!], `${hops[i]} does not require ${hops[i + 1]}`).toBe(hops[i + 1]);
    }
  });

  it('does not mistake a diamond for a cycle', () => {
    // a -> b -> d and a -> c -> d. `d` is reached twice and the graph is still acyclic.
    const diamond = new Map<string, readonly string[]>([
      ['a', ['b', 'c']],
      ['b', ['d']],
      ['c', ['d']],
      ['d', []],
    ]);
    expect(findPrerequisiteCycle(diamond)).toBeUndefined();
  });

  it('reports a prerequisite that resolves to nothing, which would lock a quest forever', () => {
    const issues = byRule(validateContent(broken('dangling-require')), 'dangling-prerequisite');
    expect(issues).toHaveLength(1);
    expect(issues[0]!.id).toBe('a1-orphan');
    expect(issues[0]!.file).toBe('quests/a1-orphan.yml');
    expect(issues[0]!.line).toBe(6); // the `requires:` line in the fixture
    expect(issues[0]!.message).toContain('a1-does-not-exist');
  });
});

describe('concept tags', () => {
  it('reports an unknown tag with the file and the line it is on, not a ZodError dump', () => {
    const issues = byRule(validateContent(broken('unknown-concept')), 'schema');
    expect(issues).toHaveLength(1);

    const issue = issues[0]!;
    expect(issue.file).toBe('quests/a1-typo.yml');
    expect(issue.line).toBe(5); // the `concepts:` line in the fixture
    expect(issue.message).toContain('whille');
    expect(issue.message).toContain('concepts[1]');
    expect(issue.message).not.toContain('ZodError');
  });

  it('refuses vocabulary the learner will not meet for another eighteen weeks', () => {
    const issues = byRule(validateContent(broken('concept-above-area')), 'concept-above-area');
    expect(issues).toHaveLength(1);
    expect(issues[0]!.id).toBe('a3-too-early');
    expect(issues[0]!.line).toBe(5); // the `concepts:` line in the fixture
    expect(issues[0]!.message).toContain('class');
    expect(issues[0]!.message).toContain('area 5'); // where `class` is first taught
    expect(issues[0]!.message).toContain('area 3'); // where this quest sits
  });

  it('allows a tag from an area below the quest, which is what review looks like', () => {
    // The guard is one-directional on purpose: an Area 3 quest revisiting `print` is an invasion.
    const issues = validateContent(CONTENT_ROOT);
    expect(byRule(issues, 'concept-above-area')).toEqual([]);
  });
});

describe('referenced files', () => {
  it('reports every missing file the item points at, by path', () => {
    const issues = byRule(validateContent(broken('missing-file')), 'missing-file');
    expect(issues).toHaveLength(3);
    const messages = issues.map((i) => i.message);
    expect(messages.some((m) => m.includes('briefs/never-written.md'))).toBe(true);
    expect(messages.some((m) => m.includes('starters/a0-ghost.py'))).toBe(true);
    expect(messages.some((m) => m.includes('tests/a0-ghost_test.py'))).toBe(true);
  });
});

describe('identity and manifests', () => {
  it('reports a duplicate id, naming both files that claim it', () => {
    const issues = byRule(validateContent(broken('duplicate-id')), 'duplicate-id');
    expect(issues).toHaveLength(1);
    expect(issues[0]!.message).toContain('a1-twin');
    expect(issues[0]!.message).toContain('quests/a1-twin.yml');
    expect(issues[0]!.message).toContain('quests/a1-twin-copy.yml');
  });

  it('reports an area with content but no manifest, since §5.1a has no denominator without one', () => {
    const issues = byRule(validateContent(broken('no-area-manifest')), 'missing-area-manifest');
    expect(issues).toHaveLength(1);
    expect(issues[0]!.message).toContain('area 4');
  });
});

describe('malformed YAML', () => {
  it('reports the parse error against the file instead of throwing out of the run', () => {
    const parseIssues = byRule(validateContent(broken('malformed-yaml')), 'yaml-parse');
    expect(parseIssues).toHaveLength(1);
    expect(parseIssues[0]!.file).toBe('quests/a0-mangled.yml');
    expect(parseIssues[0]!.line).toBeGreaterThan(0);
  });
});

describe('one pass over everything', () => {
  /**
   * The parent runs this more than 150 times (§6.10). A validator that stops at the first
   * problem turns one authoring session into N runs, so this pins that every distinct problem
   * in a root is reported together.
   */
  it('reports every distinct problem in a root in a single run', () => {
    const rules = new Set(validateContent(broken('many-problems')).map((i) => i.rule));
    expect(rules).toEqual(
      new Set(['prerequisite-cycle', 'schema', 'concept-above-area', 'dangling-prerequisite']),
    );
  });

  it('does not blame a valid item for pointing at one that failed to parse', () => {
    // `a3-recipe-book` has a typo'd concept tag, so it never becomes a ContentItem. The item
    // that requires it is not at fault, and saying so would bury the real error in cascade.
    const dangling = byRule(validateContent(broken('many-problems')), 'dangling-prerequisite');
    expect(dangling.map((i) => i.message).join(' ')).not.toContain('a3-recipe-book');
  });
});

describe('the report a human reads at nine in the evening', () => {
  it('gives the file, the id, what is wrong, and how to fix it', () => {
    const root = broken('dangling-require');
    const report = formatIssues(validateContent(root), root);
    expect(report).toContain('quests/a1-orphan.yml');
    expect(report).toContain('a1-orphan');
    expect(report).toContain('a1-does-not-exist');
    expect(report.toLowerCase()).toContain('fix');
  });

  it('says so plainly when there is nothing wrong', () => {
    const report = formatIssues([], CONTENT_ROOT);
    expect(report).toMatch(/ok|pass|clean|no problems/i);
  });
});
