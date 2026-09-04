/**
 * One glossary file, split into its definitions.
 *
 * `curriculum/area-<n>/glossary.md` is a `#` title followed by one `## <concept-id>` section per
 * concept the area teaches. Three things read that shape — the validator checks every concept has
 * a section, the API serves the section to the Quest screen, and the Field Manual prints it — and
 * before this module each of them was going to write its own `## ` regex.
 *
 * That is worth a module rather than a shared constant because **the disagreement would be
 * silent**. A validator that counts headings one way and a reader that finds them another way
 * both pass their own tests: the file validates, the screen shows the wrong text, and nothing
 * anywhere reports a problem. CLAUDE.md draws this edge for concept ids already — content is
 * validated against `concepts.ts` so a changed id breaks content rather than drifting from it.
 * The heading rule deserves the same single owner.
 *
 * **Fences are the reason this is not a one-line regex.** A definition is free to show Python,
 * and Python comments start with `#`:
 *
 * ```markdown
 * ## inheritance
 *
 * ```python
 * ## a subclass gets its parent's methods for free
 * class Boss(Enemy): ...
 * ```
 * ```
 *
 * A line-anchored `/^## /` reads that comment as a new concept named
 * `a subclass gets its parent's methods for free`, and the validator built on it then reports
 * "not a concept" at an author who wrote ordinary Python. No authored glossary trips this today —
 * it was measured, all eight files, zero hits — so this parser changes no verdict now. It is
 * here so that the first author who writes a code example into a definition is not the one who
 * discovers the rule.
 */

/**
 * A fence opens on ``` or ~~~ (three or more), indented no more than three spaces, and closes on
 * a run of the same character that is at least as long. CommonMark's rule, kept because the
 * alternative — "a line starting with three backticks toggles" — gets nested fences wrong, and a
 * glossary that documents Markdown will nest them.
 */
const FENCE = /^ {0,3}(`{3,}|~{3,})/;

/** `## <id>`, with the trailing whitespace an editor leaves behind trimmed off. */
const HEADING = /^## ([^\n]+?)\s*$/;

/**
 * The definitions in one glossary, keyed by the concept id in the heading, in file order.
 *
 * Prose before the first `## ` is the file's own preamble and is dropped: it belongs to the
 * glossary rather than to any concept. A `#` title and a `###` subheading inside a definition are
 * both left alone — only `##` is a boundary, which is the contract `glossaryIssues` has assumed
 * since it was written.
 *
 * Bodies keep their internal blank lines and lose the ones at either end, so a caller can render
 * the value as Markdown without first deciding what to do with a leading newline.
 */
export function parseGlossary(markdown: string): Map<string, string> {
  const definitions = new Map<string, string>();

  let current: string | undefined;
  let body: string[] = [];
  let fence: string | undefined;

  const close = (): void => {
    if (current === undefined) return;
    definitions.set(current, body.join('\n').replace(/^\n+/, '').replace(/\s+$/, ''));
  };

  for (const line of markdown.split('\n')) {
    const fenceAt = FENCE.exec(line);
    if (fenceAt !== undefined && fenceAt !== null) {
      const rail = fenceAt[1] as string;
      // Opening remembers what will close it; a shorter run of the same character does not.
      if (fence === undefined) fence = rail;
      else if (rail[0] === fence[0] && rail.length >= fence.length) fence = undefined;
    }

    const heading = fence === undefined ? HEADING.exec(line) : null;
    if (heading !== null) {
      close();
      current = heading[1] as string;
      body = [];
      continue;
    }

    if (current !== undefined) body.push(line);
  }

  close();

  return definitions;
}
