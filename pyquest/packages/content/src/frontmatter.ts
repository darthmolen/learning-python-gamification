/**
 * The frontmatter block of a markdown file, parsed and removed.
 *
 * **One parser, two corpora.** `planning/` has declared its status in frontmatter since
 * 2026-09-04, and `curriculum/` now declares its audience the same way. This file is the single
 * implementation both read, because `validate.ts` already records what a second one costs: "two
 * predicates that disagree about what a learner reads is the drift `parseGlossary` was extracted
 * to prevent."
 *
 * It is a deliberately small subset of YAML — `key: value`, one per line, no nesting and no
 * lists, because that is the whole of what either schema needs. The argument is
 * `scripts/plans.ts`'s, where this began: *"A real YAML parser would accept documents this
 * checker has no rules for, and the first one written would be the one nobody validates."*
 *
 * ## Why the opening fence must be line 0
 *
 * Not fussiness — it is the whole safety property for the curriculum. No markdown under
 * `curriculum/` or `game/` carried frontmatter before this, and **67 of those files contain a
 * `---` horizontal rule.** A parser that scanned for the first fence rather than requiring it at
 * the top would read the prose above a horizontal rule as key-value pairs, find no colon, and
 * silently return an empty map — reporting every one of those files as unmarked.
 */

/** A parsed block: the fields it declared, and whether there was a block at all. */
export interface Frontmatter {
  readonly fields: ReadonlyMap<string, string>;
  /** True only when a block opened on line 0 and closed again. An unterminated block is absent. */
  readonly present: boolean;
}

const FENCE = '---';

/**
 * Split a document's frontmatter from its body.
 *
 * Returns `present: false` for a file with no block, and for one whose opening fence is never
 * closed — an unterminated block is a mistake rather than a document, and treating it as absent
 * makes the `audience` rule report the useful thing ("no audience declared") instead of a parse
 * error about a file the author thinks is fine.
 */
export function splitFrontmatter(text: string): Frontmatter {
  const lines = text.split(/\r?\n/);
  const fields = new Map<string, string>();
  if (lines[0]?.trim() !== FENCE) return { fields, present: false };

  const end = lines.findIndex((line, i) => i > 0 && line.trim() === FENCE);
  if (end === -1) return { fields, present: false };

  for (const line of lines.slice(1, end)) {
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
    const at = line.indexOf(':');
    if (at === -1) continue;
    const key = line.slice(0, at).trim();
    // Trailing `# comment` is stripped, then surrounding quotes. Both appear in hand-written
    // frontmatter and neither is part of the value.
    const value = line
      .slice(at + 1)
      .replace(/\s+#.*$/, '')
      .trim()
      .replace(/^["']|["']$/g, '');
    if (key !== '') fields.set(key, value);
  }

  return { fields, present: true };
}

/**
 * The document without its frontmatter block.
 *
 * **Every renderer needs this and none of them had it.** `briefBody` strips a leading `# H1` and
 * nothing else; the Field Manual's how-to loader takes its title from the first `# ` heading; the
 * API serves prose straight from disk. Marking a file without this would publish `audience: dm`
 * into the HTML of the page it was meant to keep from the learner.
 *
 * Leading blank lines are dropped with the block, so that a body opening with `# Title` still
 * looks like one to the heading-strippers that run after this.
 */
export function stripFrontmatter(text: string): string {
  const lines = text.split(/\r?\n/);
  if (lines[0]?.trim() !== FENCE) return text;

  const end = lines.findIndex((line, i) => i > 0 && line.trim() === FENCE);
  if (end === -1) return text;

  const body = lines.slice(end + 1);
  while (body.length > 0 && body[0]?.trim() === '') body.shift();
  return body.join('\n');
}
