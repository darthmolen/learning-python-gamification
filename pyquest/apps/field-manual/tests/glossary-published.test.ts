/**
 * The definitions, in the bytes that get deployed.
 *
 * This file exists because `no-game.test.ts` had to be *weakened* to let the glossary through —
 * its author-prose exclusion now covers `<dd class="brief">` as well as `<div class="brief">`.
 * A widened exclusion is a smaller gate, and a smaller gate needs two things proved beside it:
 * that the thing it now lets through is actually being published, and that it still catches what
 * it was built to catch.
 *
 * Both are asserted over the built site rather than over the renderer, for the reason
 * `published.test.ts` gives: three of this repository's gates were found looking at the wrong
 * object.
 */

import { readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { buildSite } from '../src/build.ts';

const here = dirname(fileURLToPath(import.meta.url));
const contentRoot = resolve(here, '..', '..', '..', '..');
const out = resolve(here, '..', 'dist-glossary-test');

const pages = (() => {
  buildSite({ contentRoot, outDir: out });
  return readdirSync(out)
    .filter((f) => f.endsWith('.html'))
    .map((f) => ({ file: f, html: readFileSync(join(out, f), 'utf8') }));
})();

const areaPage = (area: number): string =>
  pages.find((p) => p.file === `area-${area}.html`)?.html ?? '';

afterAll(() => rmSync(out, { recursive: true, force: true }));

describe('the published site defines the words it lists', () => {
  it('renders a definition list rather than a row of tags', () => {
    expect(areaPage(0)).toContain('<dl class="glossary">');
    expect(areaPage(0)).toMatch(/<dt>print<\/dt>/);
  });

  it('puts real prose under the term, not just the term again', () => {
    /**
     * The assertion that would have caught the whole feature failing quietly. A build that
     * emitted `<dt>` and an empty `<dd>` satisfies every structural check above and publishes a
     * glossary that defines nothing — which is the state the site was already in, in a new shape.
     */
    const bodies = [...areaPage(0).matchAll(/<dd class="brief">([\s\S]*?)<\/dd>/g)].map(
      (match) => (match[1] as string).replace(/<[^>]+>/g, '').trim(),
    );

    expect(bodies.length, 'area 0 published no definitions at all').toBeGreaterThan(5);
    for (const body of bodies) expect(body.length).toBeGreaterThan(20);
  });

  it('carries the glossary text itself, from the file the validator checks', () => {
    // A sentence from the authored glossary. If the build ever renders labels alone, or reads a
    // different file, this is what notices.
    const all = pages.map((p) => p.html).join('');
    const area5 = areaPage(5);

    expect(all).toContain('<dl class="glossary">');
    // Area 5's inheritance entry is the one that forced `no-game.test.ts` to widen. If it stopped
    // being published the widening would be dead weight nobody would think to remove.
    expect(area5).toMatch(/class Boss\(Enemy\)/);
  });
});

describe('the sweep it weakened still bites', () => {
  /**
   * The mutant, written down as a test.
   *
   * `no-game.test.ts` excludes author prose so that a learner's page may quote an author's Python.
   * The risk of widening that exclusion is that it swallows the generator's own words too. So the
   * exclusion is applied here to a page with scoring vocabulary planted **outside** `class="brief"`
   * — where the generator speaks — and the sweep must still see it.
   */
  const withoutAuthorProse = (html: string): string =>
    html
      .replace(/<div class="brief">[\s\S]*?<\/div>/g, '')
      .replace(/<dd class="brief">[\s\S]*?<\/dd>/g, '');

  it('still sees a game word in a term, where the generator writes', () => {
    const planted = areaPage(0).replace('<dt>print</dt>', '<dt>print · DC 12</dt>');
    expect(/\bdc\b/i.test(withoutAuthorProse(planted))).toBe(true);
  });

  it('still sees a game word in a heading', () => {
    const planted = areaPage(0).replace(
      '<h2>What this area teaches</h2>',
      '<h2>Medals for this area</h2>',
    );
    expect(/\bmedals\b/i.test(withoutAuthorProse(planted))).toBe(true);
  });

  it('does not see one inside an author definition, which is the whole exemption', () => {
    // The other direction, so the pair pins the boundary rather than one side of it.
    const real = areaPage(5);
    expect(/\bboss\b/i.test(real), 'area 5 no longer contains the word at all').toBe(true);
    expect(/\bboss\b/i.test(withoutAuthorProse(real))).toBe(false);
  });
});
