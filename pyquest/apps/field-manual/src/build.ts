/**
 * The Field Manual — the curriculum, published without the game.
 *
 * Reads what the validator reads. `checkContent` is the same function `npm run validate:content`
 * runs, so this site cannot drift from what the repository considers valid content: a manifest
 * this rejects is a manifest that already fails the validator. Nothing here re-parses YAML.
 *
 * It runs at build time and emits plain HTML with no script, which is the whole reason it can be
 * published while the API is unfinished — §6.7 puts content in git, and this reads git.
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONCEPTS, checkContent, contentRootsFrom } from '@pyquest/content';
import { marked } from 'marked';
import { renderArea, renderIndex, type AreaView } from './render.ts';

export interface BuildOptions {
  /** The directory holding `curriculum/` and `game/`. Briefs resolve under the former. */
  readonly contentRoot: string;
  readonly outDir: string;
}

/**
 * Read a brief.
 *
 * No existence check here on purpose. `validate.ts:389` already enforces that "every path an
 * item points at must exist", so a missing brief is a validation issue and the guard above threw
 * before this ran. A second check would be the same rule with two homes, and the one further
 * from the content is the one that goes stale — a mutant proved the branch unreachable rather
 * than merely untested.
 */
function readBrief(curriculumRoot: string, relative: string): string {
  return readFileSync(join(curriculumRoot, relative), 'utf8');
}

/**
 * Markdown to HTML, minus the title. Every brief opens with an `# H1` that repeats the quest's
 * title, and the page already prints that as its heading — rendering both reads as a stutter.
 */
function briefBody(markdown: string): string {
  const withoutTitle = markdown.replace(/^#\s+.*\r?\n/, '');
  return marked.parse(withoutTitle, { async: false });
}

export function buildSite({ contentRoot, outDir }: BuildOptions): AreaView[] {
  const roots = contentRootsFrom(contentRoot);
  const { items, manifests, issues } = checkContent(roots);

  // The validator is the gate, not this. If content is broken, say so here rather than
  // publishing a site built from it.
  if (issues.length > 0) {
    throw new Error(
      `content has ${issues.length} validation issue(s); run \`npm run validate:content\` — ` +
        `the Field Manual will not publish invalid content.`,
    );
  }

  const areas: AreaView[] = [...manifests]
    .sort((a, b) => a.area - b.area)
    .map((manifest) => ({
      area: manifest.area,
      title: manifest.title,
      ...(manifest.weeks ? { weeks: manifest.weeks } : {}),
      ...(manifest.blurb ? { blurb: manifest.blurb } : {}),
      concepts: CONCEPTS.filter((c) => c.area === manifest.area).map((c) => ({
        id: c.id,
        label: c.label,
      })),
      /**
       * Exercises only. A boss is the game's word for an assessment and this site does not have
       * assessments — it has the work. Anything that is not an exercise is left out rather than
       * renamed, because renaming it would be the game leaking in under a different label.
       */
      exercises: items
        .filter((item) => item.area === manifest.area && item.kind === 'quest')
        .map((item) => ({
          title: item.title,
          body: briefBody(readBrief(roots.curriculum, item.brief)),
          concepts: [...item.concepts],
        })),
    }));

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), renderIndex(areas), 'utf8');
  for (const area of areas) {
    writeFileSync(join(outDir, `area-${area.area}.html`), renderArea(area), 'utf8');
  }
  // GitHub Pages runs Jekyll over the artifact unless told not to; a leading-underscore file
  // would silently vanish. Nothing here starts with one today, and this costs a byte.
  writeFileSync(join(outDir, '.nojekyll'), '', 'utf8');

  return areas;
}

if (import.meta.filename === process.argv[1]) {
  const here = dirname(fileURLToPath(import.meta.url));
  const areas = buildSite({
    contentRoot: resolve(here, '..', '..', '..', '..'),
    outDir: resolve(here, '..', 'dist'),
  });
  const exercises = areas.reduce((n, a) => n + a.exercises.length, 0);
  const concepts = areas.reduce((n, a) => n + a.concepts.length, 0);
  console.log(
    `field-manual: ${areas.length} areas, ${concepts} ideas, ${exercises} exercises -> dist/`,
  );
}
