/**
 * The gate that is the thesis.
 *
 * This site exists to show that the curriculum is the substance and the game is only
 * encouragement. That claim is checkable: the published HTML must contain no scoring vocabulary
 * at all. A site that quietly grew a medal column, or started printing a difficulty class beside
 * every exercise, would still render — and would no longer be the thing it says it is.
 *
 * So the assertion is over the *built output*, not over the source. What the generator intends
 * is not the question; what it published is.
 */

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkContent, contentRootsFrom } from '@pyquest/content';
import { buildSite } from '../src/build.ts';

const here = dirname(fileURLToPath(import.meta.url));
const contentRoot = resolve(here, '..', '..', '..', '..');

/** Build once into a temp directory; every test reads the same output. */
const out = resolve(here, '..', 'dist-test');
const pages = (() => {
  buildSite({ contentRoot, outDir: out });
  return readdirSync(out)
    .filter((f) => f.endsWith('.html'))
    .map((f) => ({ file: f, html: readFileSync(join(out, f), 'utf8') }));
})();

/**
 * The words the game is made of. `dc` is matched as a whole word only: "DC" appears inside no
 * ordinary English word, but a substring match would fire on "reduce" and prove nothing.
 */
const GAME_WORDS = ['xp', 'dc', 'medal', 'medals', 'ironman', 'idiomatic', 'boss', 'cleared', 'invasion', 'datamine', 'teach-back', 'conjured'];

/**
 * The rule is that **the generator** adds no scoring vocabulary — not that the curriculum may
 * never use a word.
 *
 * Three Area 2 briefs say "boss" in their own teaching prose, and the first working run of this
 * gate caught them. Rewriting an author's sentence to satisfy a test would be the site editing
 * the curriculum, which is the opposite of what it is for. So the author's words are excluded
 * and everything the generator wraps around them is not: headings, labels, navigation, metadata.
 * A difficulty class printed beside an exercise title still fails, which is the case that
 * matters.
 */
const withoutAuthorProse = (html: string): string =>
  html.replace(/<div class="brief">[\s\S]*?<\/div>/g, '');

describe('the published site carries no scoring vocabulary', () => {
  it('builds at least one page per authored area, plus an index', () => {
    // If this drops to one page the assertions below become vacuous — a site with nothing in it
    // contains no game words either.
    expect(pages.length).toBeGreaterThanOrEqual(9);
    expect(pages.map((p) => p.file)).toContain('index.html');
  });

  it.each(GAME_WORDS)('says nothing about %s', (word) => {
    const pattern = new RegExp(String.raw`\b${word}\b`, 'i');
    const offenders = pages
      .filter((p) => pattern.test(withoutAuthorProse(p.html)))
      .map((p) => p.file);
    expect(offenders, `"${word}" reached the published site`).toEqual([]);
  });

  it('still contains the teaching, so the check above is not passing on an empty site', () => {
    const all = pages.map((p) => p.html).join('');
    expect(all).toContain('Collections');
    expect(all).toContain('The Perimeter');
    expect(all).toMatch(/slicing/);
  });
});

describe('the site publishes the work, not the assessments', () => {
  it('renders exactly the exercises, and no boss', () => {
    /**
     * A boss is the game's word for an assessment, and this site has no assessments — it has the
     * work. Leaving one in would not trip the vocabulary check above, because the three boss
     * titles happen to contain no game word: "First Light", "The Sigil", "Escape the Sandbox".
     * That is exactly why this assertion exists separately. It was found by a mutant that
     * changed the filter and survived.
     */
    const { items } = checkContent(contentRootsFrom(contentRoot));
    const quests = items.filter((i) => i.kind === 'quest');
    const bosses = items.filter((i) => i.kind === 'boss');
    expect(bosses.length, 'fixture sanity: there are bosses to leave out').toBeGreaterThan(0);

    const headings = pages.flatMap((p) => [...p.html.matchAll(/<h3>([^<]+)<\/h3>/g)].map((m) => m[1]));
    expect(headings).toHaveLength(quests.length);
    for (const boss of bosses) {
      expect(headings, `${boss.title} is an assessment and must not be published as work`)
        .not.toContain(boss.title);
    }
  });
});

describe('it refuses to publish content the validator would reject', () => {
  it('throws rather than building a site from broken content', () => {
    /**
     * The guard is untestable against the real content root, because that content is valid and
     * the branch never fires either way — a mutant disabling it survived, which is how this test
     * came to exist. So point the build at a deliberately broken root instead.
     */
    const broken = resolve(here, '..', 'dist-broken-fixture');
    rmSync(broken, { recursive: true, force: true });
    mkdirSync(join(broken, 'curriculum', 'area-9'), { recursive: true });
    const yaml = ['area: 9', 'title: Nowhere', 'authoring: complete', ''].join(
      String.fromCharCode(10),
    );
    writeFileSync(join(broken, 'curriculum', 'area-9', 'area.yml'), yaml, 'utf8');

    expect(() => buildSite({ contentRoot: broken, outDir: resolve(here, '..', 'dist-broken-out') }))
      .toThrow(/validation issue/i);

    rmSync(broken, { recursive: true, force: true });
  });
});

describe('every referenced brief is rendered', () => {
  it('renders prose for each authored exercise, not just its title', () => {
    const all = pages.map((p) => p.html).join('');
    // A sentence from the middle of a real brief. If the generator ever emits titles alone, or
    // silently skips a brief it cannot read, this is what notices.
    expect(all).toContain('the size is typed into four separate orders');
  });
});
