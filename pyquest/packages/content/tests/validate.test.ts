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
import {
  contentRootsFrom,
  findPrerequisiteCycle,
  formatIssues,
  validateContent,
} from '../src/validate.ts';
import type { ContentIssue } from '../src/validate.ts';

/** The authored content root, three levels up from `packages/content/src/`. */
const CONTENT_ROOT = fileURLToPath(new URL('../../../..', import.meta.url));

/** A broken fixture, addressed the way production is: a directory holding curriculum/ and game/. */
const broken = (name: string) =>
  contentRootsFrom(fileURLToPath(new URL(`../fixtures/broken/${name}`, import.meta.url)));

/** Every issue of one rule, so a test can assert on the rule it is about and ignore the rest. */
const byRule = (issues: readonly ContentIssue[], rule: string): ContentIssue[] =>
  issues.filter((i) => i.rule === rule);

describe('the authored content root', () => {
  it('validates clean, so a failure here means the fixtures are the content', () => {
    expect(validateContent(contentRootsFrom(CONTENT_ROOT))).toEqual([]);
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
    const issues = validateContent(contentRootsFrom(CONTENT_ROOT));
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

describe('pace in a lesson (ADR 0006)', () => {
  const issues = () => byRule(validateContent(broken('pace-in-lesson')), 'pace-in-lesson');

  /**
   * Six of eight lessons opened with a duration before this check existed, and the parent had
   * corrected it by hand more than once. ADR 0006 rules that lesson prose places the reader in
   * the sequence and never on the calendar; this is that rule, made load-bearing.
   */
  it('refuses every unit that pace is measured in', () => {
    expect(issues().map((i) => i.message)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('"Six weeks"'),
        expect.stringContaining('"three days"'),
        expect.stringContaining('"A few months"'),
        expect.stringContaining('"Next year"'),
      ]),
    );
  });

  /** Asked for by name, and right to be: a spelled quantifier is still a count. */
  it('catches "Four score and 7 years ago"', () => {
    expect(issues().map((i) => i.message)).toContainEqual(expect.stringContaining('"7 years"'));
  });

  /**
   * The three shapes that must survive, because a check that fires on honest sentences teaches
   * authors to write around it — ADR 0005's reason for refusing to be a test at all.
   */
  it('leaves seconds alone, because a game loop at sixty a second is the subject', () => {
    expect(issues().map((i) => i.message).join(' ')).not.toMatch(/second/i);
  });

  it('leaves a hyphenated age alone, because 11-14-year-old is not a duration', () => {
    expect(issues().map((i) => i.message).join(' ')).not.toMatch(/14-year|year-old/i);
  });

  /**
   * `ninety days` sits in a comment inside a fenced block and nowhere else in the fixture, which
   * is the whole point of choosing it. An earlier version of this test asserted on `two weeks` —
   * a phrase the fixture also uses in prose — so a mutant that stopped stripping fences altogether
   * passed it. A negative assertion is only as good as the uniqueness of the string it names.
   */
  it('leaves code alone, because a duration in a comment is Python rather than prose', () => {
    expect(issues().map((i) => i.message).join(' ')).not.toMatch(/ninety days/i);
  });

  it('honors a pace-ok marker that gives a reason', () => {
    expect(issues().map((i) => i.message).join(' ')).not.toMatch(/3 days/);
  });

  /**
   * **A bare `<!-- pace-ok -->` suppresses nothing**, and this is the assertion that makes the
   * reason load-bearing rather than decorative.
   *
   * Without it the marker is a mute switch: an author silences the check, nobody learns why, and
   * the next reader cannot tell a considered exception from a shrug. A mutant that relaxed the
   * pattern to `/<!--\\s*pace-ok:/` survived the suite until this test existed.
   */
  it('refuses a pace-ok marker that gives no reason', () => {
    const messages = issues().map((i) => i.message);
    /* `<!-- pace-ok: -->` — the colon is there and the reason is not. */
    expect(messages).toContainEqual(expect.stringContaining('"eleven days"'));
    /* `<!-- pace-ok -->` — not even the colon. */
    expect(messages).toContainEqual(expect.stringContaining('"twelve days"'));
  });

  /** Every issue names the file, the line and what to write instead. §6.10 promises two minutes. */
  it('reports where it is and what to write instead', () => {
    const first = issues()[0];
    expect(first?.file).toBe('area-1/lesson.md');
    expect(first?.line).toBeGreaterThan(0);
    expect(first?.fix).toMatch(/next session|by the end of this area/);
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

/**
 * The glossary, checked against the registry that names the concepts.
 *
 * CLAUDE.md already draws this edge: "authored content is validated against
 * `packages/content/src/concepts.ts`. If a concept id changes, content breaks — that is
 * `validate:content` doing its job." A definition is authored content and a concept id is the
 * key it hangs on, so the two can drift in three ways and every one of them is silent.
 *
 * A missing definition is a chip a learner clicks and gets nothing from. A misspelled heading is
 * the same failure wearing a definition nobody will ever see. And a concept defined in the wrong
 * area's file puts the word on a page he reaches before he has met it.
 */
/**
 * A `[[mark]]` names a concept id, so it is validated exactly as every other reference to one is.
 *
 * CLAUDE.md draws the edge: "authored content is validated against `concepts.ts`. If a concept id
 * changes, content breaks — that is `validate:content` doing its job." A mark is the newest way to
 * write that reference and the easiest to get wrong, because a mistyped id fails **silently at
 * the reader**: the mark resolves to nothing, the word renders as ordinary prose, and the learner
 * never learns there was a definition they were meant to be offered.
 *
 * The fixture also holds two marks the rule must ignore — one fenced, one in an inline code span.
 * A lesson teaching this syntax has to be able to print it, and a validator that could not tell
 * the example from the thing would make that page unwritable.
 */
describe('a glossary mark', () => {
  const marks = () => byRule(validateContent(broken('unknown-mark')), 'unknown-mark');

  it('refuses an id the concept registry has never heard of', () => {
    const bad = marks();
    expect(bad).toHaveLength(1);
    expect(bad[0]?.file).toBe('area-1/lesson.md');
    expect(bad[0]?.message).toContain('whlie');
  });

  it('names the line, because a lesson is long and an id is three characters', () => {
    expect(marks()[0]?.line).toBe(6);
  });

  it('says what to do, rather than only what is wrong', () => {
    expect(marks()[0]?.fix).toMatch(/concepts\.ts/);
  });

  it('leaves the real concepts alone', () => {
    const messages = marks().map((i) => i.message).join(' ');
    expect(messages).not.toContain('[[if]]');
    expect(messages).not.toContain('range');
  });

  it('ignores a mark inside a fence or a code span, so the syntax can be documented', () => {
    const messages = marks().map((i) => i.message).join(' ');
    expect(messages).not.toContain('not-a-concept');
    expect(messages).not.toContain('also-not-a-concept');
  });
});

describe('the glossary', () => {
  const issues = () => byRule(validateContent(broken('glossary-gap')), 'glossary-gap');

  it('names every concept of the area that has no definition', () => {
    const missing = issues().find((i) => i.message.includes('no definition'));
    expect(missing?.file).toBe('area-1/glossary.md');
    // Eight of Area 1's ten are undefined in the fixture; the message has to name them, not count.
    expect(missing?.message).toContain('for');
    expect(missing?.message).toContain('range');
    expect(missing?.message).not.toContain('elif');
  });

  it('refuses a heading the concept registry has never heard of', () => {
    const unknown = issues().find((i) => i.message.includes('whlie'));
    expect(unknown?.file).toBe('area-1/glossary.md');
    expect(unknown?.fix).toContain('concepts.ts');
  });

  /** `dict` is real, and it is Area 3's. Defining it here is a different mistake from a typo. */
  it('refuses a real concept defined in the wrong area', () => {
    const misplaced = issues().find((i) => i.message.includes('dict'));
    expect(misplaced?.message).toContain('area 3');
  });
});
