/**
 * Frontmatter for content these tests invent on the fly.
 *
 * Every `.md` under `curriculum/area-<n>/` must declare an `audience:` — the rule exists because
 * the convention it replaced had already handed a learner the DM's plans. A test that writes a
 * content root therefore has to write valid content, and before this helper existed twelve of
 * them wrote unmarked briefs and failed at `loadContentRoot` rather than at what they were
 * asserting.
 *
 * The rule applied here is the corpus rule, not a convenience: `dm-guide.md` is the DM's and
 * everything else a test invents is the learner's. That matters for more than tidiness — the
 * Field Manual now reads the guide's *declared* audience before rendering it into the DM build,
 * so a helper that marked the guide `learner` would quietly stop the DM build carrying it and
 * the test asserting that it does would fail for the wrong reason.
 */

const NEWLINE = String.fromCharCode(10);

const audienceFor = (relative: string): 'learner' | 'dm' =>
  relative.endsWith('dm-guide.md') ? 'dm' : 'learner';

/** True for a body that already opens with a frontmatter fence, which is left alone. */
const alreadyMarked = (body: string): boolean => body.startsWith('---' + NEWLINE);

/** True for the files the `audience` rule reaches: markdown under an area directory. */
const needsAudience = (relative: string): boolean =>
  /(^|\/)curriculum\/area-\d+\/.*\.md$/.test(relative);

/**
 * A file map with the audience blocks filled in.
 *
 * Non-markdown, files outside an area, and anything already carrying frontmatter pass through
 * untouched, so a test that wants to write a malformed or deliberately unmarked file still can —
 * it simply says so, which is the point.
 */
export function marked(files: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [relative, body] of Object.entries(files)) {
    out[relative] =
      needsAudience(relative) && !alreadyMarked(body)
        ? `---${NEWLINE}audience: ${audienceFor(relative)}${NEWLINE}---${NEWLINE}${NEWLINE}${body}`
        : body;
  }
  return out;
}
