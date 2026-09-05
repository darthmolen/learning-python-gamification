/**
 * Glossary marks — `[[concept-id]]` and `[[concept-id|display words]]` in authored prose.
 *
 * A mark says *this word has a definition and the reader may open it*. It is authored rather than
 * inferred, and that was a decision with a measurement behind it: matching concept ids against
 * every inline code span covers six concepts in Area 0 and six in Area 1 for no authoring effort,
 * and lights up Area 1's lesson seventeen times with no way for the author to opt one occurrence
 * out. A reference the reader stops seeing is not a reference.
 *
 * **Three consumers, one syntax, and only one of them shows a card.**
 *
 * | Consumer | What it does |
 * |---|---|
 * | `validate:content` | refuses an id that is not a concept |
 * | The Tome screen | renders a marked term that opens its definition |
 * | The Quest screen, the Field Manual | `stripMarks` — display text, no card |
 *
 * That last row is the rule that keeps every surface correct: **a mark that cannot or should not
 * open renders as its display text.** No renderer ever prints a bracket at a learner, and a
 * future surface gets that behavior by default rather than by remembering to.
 *
 * MediaWiki's argument order — target first — because it is the order the author has seen before,
 * and because `[[words|id]]` reads better only until the display text contains something that
 * looks like an id.
 */

/**
 * `[[id]]` or `[[id|display]]`, not preceded by a backslash.
 *
 * A mark may not span a line — otherwise an author who types `[[print` and moves on would have
 * the next `]]` anywhere in the file close it, swallowing every paragraph between.
 *
 * **What actually enforces that is `overProse`, not this pattern.** It hands the matcher one line
 * at a time, so a match can never cross a newline whatever the character classes say. The `\n`
 * exclusions below are belt-and-braces for a future caller that matches against unsplit text, and
 * they are honestly redundant today: a seeded mutant removing both left all thirteen tests green,
 * which is how this comment came to be corrected. It previously claimed the character class was
 * the guarantee, and cited a `[^\S\n]` that is not in the pattern at all.
 *
 * The leading `(^|[^\\])` is the escape: `\[[print]]` is a literal, for the lesson that will one
 * day document this syntax.
 */
const MARK = /(^|[^\\])\[\[([^\]\n|]+?)(?:\|([^\]\n]*?))?\]\]/g;

/** A fence opens on ``` or ~~~ and closes on the same character. CommonMark's rule, as `glossary.ts`. */
const FENCE = /^ {0,3}(`{3,}|~{3,})/;

/** One authored mark, and where it sits in the source. */
export interface Mark {
  /** The concept id. `validate:content` refuses one the registry does not know. */
  readonly id: string;
  /** What the reader sees — the id itself unless the author piped something else. */
  readonly text: string;
  /** Index of the `[[` in the source. */
  readonly start: number;
  /** Index one past the `]]`. */
  readonly end: number;
}

/**
 * Run a callback over the parts of `markdown` that are prose, skipping fenced blocks and inline
 * code spans.
 *
 * Both are skipped for the same reason `parseGlossary` skips fences: a lesson teaching this
 * syntax has to be able to show it. `` `[[print]]` `` is how a sentence names a mark, and a
 * parser that could not tell the example from the thing would make that page unwritable.
 */
function overProse(markdown: string, visit: (chunk: string, offset: number) => void): void {
  let fence: string | undefined;
  let offset = 0;

  for (const line of markdown.split('\n')) {
    const fenceAt = FENCE.exec(line);
    if (fenceAt !== null) {
      const rail = fenceAt[1] as string;
      if (fence === undefined) fence = rail;
      else if (rail[0] === fence[0] && rail.length >= fence.length) fence = undefined;
      offset += line.length + 1;
      continue;
    }

    if (fence === undefined) {
      // Inline code is a hole in the line, not a reason to skip it: `a `[[x]]` b [[y]]` marks y.
      let cursor = 0;
      for (const span of line.matchAll(/`[^`\n]*`/g)) {
        visit(line.slice(cursor, span.index), offset + cursor);
        cursor = span.index + span[0].length;
      }
      visit(line.slice(cursor), offset + cursor);
    }

    offset += line.length + 1;
  }
}

/** Every mark in authored prose, in source order. Fenced blocks and code spans carry none. */
export function parseMarks(markdown: string): Mark[] {
  const marks: Mark[] = [];

  overProse(markdown, (chunk, offset) => {
    for (const found of chunk.matchAll(MARK)) {
      const id = (found[2] ?? '').trim();
      // An empty id is not a mark. `[[]]` and `[[|words]]` are almost certainly a typo, and
      // guessing at what was meant is worse than leaving the brackets visible to whoever wrote it.
      if (id === '') continue;

      const lead = (found[1] ?? '').length;
      const start = offset + (found.index ?? 0) + lead;
      const piped = found[3];
      const text = piped === undefined || piped.trim() === '' ? id : piped.trim();

      marks.push({ id, text, start, end: start + found[0].length - lead });
    }
  });

  return marks;
}

/**
 * The same prose with every mark replaced by its display text, and every escape resolved.
 *
 * What a renderer without a glossary lookup falls back to — the Field Manual, which is static
 * HTML, and the Quest screen, which deliberately shows no cards above the editor. Neither can
 * print a bracket at a learner, and neither had to be told not to.
 */
export function stripMarks(markdown: string): string {
  const marks = parseMarks(markdown);

  let out = '';
  let cursor = 0;
  for (const mark of marks) {
    out += markdown.slice(cursor, mark.start) + mark.text;
    cursor = mark.end;
  }
  out += markdown.slice(cursor);

  // The escape resolves last, so `\[[x]]` survives the pass above and then becomes a literal.
  // Only outside fences: a fenced example writing `\[[x]]` means the backslash.
  let resolved = '';
  let at = 0;
  overProse(out, (chunk, offset) => {
    if (offset < at) return;
    resolved += out.slice(at, offset) + chunk.replaceAll('\\[[', '[[');
    at = offset + chunk.length;
  });

  return resolved + out.slice(at);
}
