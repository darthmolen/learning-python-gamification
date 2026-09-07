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

import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
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
  html
    .replace(/<div class="brief">[\s\S]*?<\/div>/g, '')
    /**
     * Glossary definitions, on the same rule and for the same reason.
     *
     * `curriculum/area-5/glossary.md` teaches inheritance with `class Boss(Enemy)`, and the first
     * run of the site with definitions on it failed here — correctly, by the letter, and wrongly
     * by the rule above. The alternative was to rename the author's class to satisfy a test, which
     * is the site editing the curriculum: precisely what the paragraph above refuses to do for the
     * three briefs that say "boss" in their own teaching prose.
     *
     * The narrowness is the point. `<dd class="brief">` is exactly the container the author's
     * words go into; the `<dt>` beside it is the generator's, and so is every heading, label and
     * nav item around it. A difficulty class printed next to a concept still fails.
     */
    .replace(/<dd class="brief">[\s\S]*?<\/dd>/g, '');

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

    /**
     * Exercise titles only, and the scoping is load-bearing rather than tidy. This once matched
     * every `<h3>` on the page, which was the same set right up until `lesson.md` arrived and
     * authored prose started contributing its own subheadings. The assertion then counted
     * teaching as exercises and failed — correctly, but for a reason that had nothing to do
     * with what it guards. A proxy holds only until something else starts producing the thing
     * it was standing in for.
     */
    const headings = pages.flatMap((p) =>
      [...p.html.matchAll(/<section class="ex">\s*<h3>([^<]+)<\/h3>/g)].map((m) => m[1]),
    );
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

/**
 * The work, in the order it is done — including the work that carries no scored exercise.
 *
 * This is the hole that started the plan this suite belongs to. `exercises` was built from
 * `items.filter(kind === 'quest')`, so the published manual's "the work" *was the scored
 * subset*, and every practice delivered at the table was invisible here as well as in the app.
 * A learner who went looking for what he had missed found the same list that had confused him.
 */
describe('the manual publishes the practice spine', () => {
  const area1 = pages.find((p) => p.file === 'area-1.html')?.html ?? '';

  it('names every practice in order, not just the ones carrying a quest', () => {
    const numbered = [...area1.matchAll(/<h3>(\d+)\.\s([^<]+)<\/h3>/g)].map((m) => m[1]);
    expect(numbered).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
  });

  it('says so when a practice is worked at the table rather than leaving a gap', () => {
    // Practices 6 and 9 of area 1 carry no exercise, and `area-1/README.md` records why: the
    // broken loops and the mandala are DM-delivered and lose their point when automated.
    expect(area1).toContain('Worked at the table');
  });

  /**
   * The boss stays out, and `renders exactly the exercises, and no boss` above is what enforces
   * it. What this checks is the other half: the practice claiming it still appears, so the
   * sequence has no hole where its last row should be.
   */
  it('keeps the closing practice in the sequence without publishing its specification', () => {
    expect(area1).toContain('10. The Sigil');
    expect(area1).toContain('closing piece of this area is set by');
  });
});

/**
 * The deletion test, applied to the export.
 *
 * `two-roots.test.ts` proves the curriculum still *validates* with `game/` deleted. The DM build
 * now also *reads* from the overlay — `game/how-to/` — which is a new dependency in the
 * direction CLAUDE.md guards, so validating is no longer enough. This proves it still publishes.
 */
describe('the site builds with the overlay deleted', () => {
  it('publishes the curriculum, and a how-to with nothing to say about a game', () => {
    const alone = resolve(here, '..', 'dist-no-overlay-fixture');
    rmSync(alone, { recursive: true, force: true });
    mkdirSync(alone, { recursive: true });
    // `__pycache__` is most of the tree by file count and none of it by meaning. Copying it
    // put this test over the default timeout under a full-suite run.
    cpSync(join(contentRoot, 'curriculum'), join(alone, 'curriculum'), {
      recursive: true,
      filter: (src) => !src.includes('__pycache__'),
    });
    // No game/ at all. Not an empty directory — absent, which is the state a clone of the
    // curriculum alone would be in.

    const outDir = resolve(here, '..', 'dist-no-overlay');
    expect(() => buildSite({ contentRoot: alone, outDir })).not.toThrow();

    const howTo = readFileSync(join(outDir, 'how-to.html'), 'utf8');
    expect(howTo).toContain('What a practice is');
    expect(howTo).not.toContain('How to play');

    // The spine is the curriculum's own, so it survives intact rather than emptying out.
    const area1Alone = readFileSync(join(outDir, 'area-1.html'), 'utf8');
    expect(area1Alone).toContain('10. The Sigil');

    rmSync(alone, { recursive: true, force: true });
    rmSync(outDir, { recursive: true, force: true });
    // Copies a tree and builds a site twice over. The default 5s is a unit-test budget and this
    // is not a unit test.
  }, 30_000);
});
