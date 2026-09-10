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

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
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
  /**
   * The shape changed on 2026-09-10 and the property did not.
   *
   * This was a `<dl class="glossary">` printing every entry in full, which put two screens of
   * reference material between the reader and the lesson. It is now a row of words, each opening
   * its own entry below the row — the in-app Tome's design, arrived at after a hover card proved
   * wrong for anything containing a code block.
   *
   * What these tests protect is unchanged: **the site defines the words it lists.** The state
   * they exist to refuse is the one the site was actually in once — 95 words listed and none
   * defined — and that failure looks identical in any container.
   */
  it('renders words that open a definition, rather than a row of bare tags', () => {
    expect(areaPage(0)).toContain('<div class="vocab-row">');
    expect(areaPage(0)).toContain('<label class="gl" for="v0-print">print</label>');
    expect(areaPage(0)).toContain('<div class="vp" id="p-v0-print">');
  });

  it('puts real prose in the panel, not just the term again', () => {
    /**
     * The assertion that would have caught the whole feature failing quietly. A build emitting a
     * word and an empty panel satisfies every structural check above and publishes a glossary
     * that defines nothing.
     */
    const bodies = [...areaPage(0).matchAll(/<div class="vp"[\s\S]*?<div class="brief">([\s\S]*?)<\/div>/g)].map(
      (match) => (match[1] as string).replace(/<[^>]+>/g, '').trim(),
    );

    expect(bodies.length, 'area 0 published no definitions at all').toBeGreaterThan(5);
    for (const body of bodies) expect(body.length).toBeGreaterThan(20);
  });

  it('carries the glossary text itself, from the file the validator checks', () => {
    // A sentence from the authored glossary. If the build ever renders labels alone, or reads a
    // different file, this is what notices.
    const area5 = areaPage(5);

    expect(areaPage(0)).toContain('<div class="vocab">');
    // Area 5's inheritance entry is the one that forced `no-game.test.ts` to widen. If it stopped
    // being published the widening would be dead weight nobody would think to remove.
    expect(area5).toMatch(/class Boss\(Enemy\)/);
  });
});

describe('glossary marks never reach the published site', () => {
  /**
   * `[[print]]` is authored for the Tome, and `marked` prints unknown syntax rather than ignoring
   * it. This is the gate that stops a marked-up lesson publishing double brackets to a site whose
   * whole claim is that the curriculum stands without the game.
   *
   * It is asserted over the built HTML rather than over `stripMarks`, because the unit test proves
   * the function and this proves it is *called* — `briefBody` is one line away from being the
   * place somebody adds a second renderer that forgets.
   */
  it('publishes no literal double bracket anywhere', () => {
    const offenders = pages.filter((p) => p.html.includes('[[')).map((p) => p.file);
    expect(offenders, 'a glossary mark reached the published site').toEqual([]);
  });

  it('renders the display text of a mark, not the id', () => {
    /**
     * Built from a fixture rather than the real curriculum, because the authoring pass is Phase 4
     * and this gate has to work before a single lesson carries a mark. Otherwise the check passes
     * today for the reason that there is nothing to catch, and stops passing the moment it matters.
     */
    const marked = join(out, '..', 'dist-marks-fixture');
    rmSync(marked, { recursive: true, force: true });
    mkdirSync(join(marked, 'curriculum', 'area-0'), { recursive: true });
    writeFileSync(
      join(marked, 'curriculum', 'area-0', 'area.yml'),
      ['area: 0', 'title: First Light', 'authoring: complete', ''].join('\n'),
      'utf8',
    );
    writeFileSync(
      join(marked, 'curriculum', 'area-0', 'lesson.md'),
      [
        // Marked because every `.md` under an area must declare its audience; this suite is
        // about marks reaching the page, not about who reads it.
        '---',
        'audience: learner',
        '---',
        '',
        '# First Light',
        '',
        'Use [[print]] to see it, and read the [[reading-errors|error message]] on purpose.',
        '',
      ].join('\n'),
      'utf8',
    );

    const outDir = join(out, '..', 'dist-marks-out');
    buildSite({ contentRoot: marked, outDir });
    const html = readFileSync(join(outDir, 'area-0.html'), 'utf8');

    expect(html).not.toContain('[[');
    expect(html).toContain('Use print to see it');
    expect(html).toContain('read the error message on purpose');
    // The id must not leak where the author asked for different words.
    expect(html).not.toContain('reading-errors');

    rmSync(marked, { recursive: true, force: true });
    rmSync(outDir, { recursive: true, force: true });
  });

  /**
   * A mark becomes a pill carrying its own definition, and the page still runs no script.
   *
   * The site stripped marks to plain words until 2026-09-10, on the stated grounds that "this is
   * HTML with no script; there is no hover to have." That was wrong about the web rather than
   * about the site — `:hover` and `:focus-within` are CSS — and the reader was being sent two
   * screens up to the vocabulary list for a word they were looking at.
   *
   * **The script-free assertion is the load-bearing half.** It is the property that lets this
   * publish as static HTML at all, and a hover card is exactly the feature somebody would reach
   * for JavaScript to build.
   */
  it('turns a mark into a pill with its definition, without script', () => {
    const src = join(out, '..', 'dist-pill-fixture');
    const outDir = join(out, '..', 'dist-pill-out');
    rmSync(src, { recursive: true, force: true });
    mkdirSync(join(src, 'curriculum', 'area-0'), { recursive: true });

    writeFileSync(
      join(src, 'curriculum', 'area-0', 'area.yml'),
      ['area: 0', 'title: First Light', 'authoring: complete', ''].join('\n'),
      'utf8',
    );
    writeFileSync(
      join(src, 'curriculum', 'area-0', 'lesson.md'),
      ['---', 'audience: learner', '---', '', '# First Light', '', 'Use [[print]] to see it.', ''].join('\n'),
      'utf8',
    );
    /*
     * Every Area 0 concept, because `glossary-gap` is bidirectional: an area whose glossary omits
     * one of its own concepts fails validation, and `buildSite` refuses to publish invalid
     * content. Only `print` needs real prose for this test; the rest need to exist.
     */
    const ids = [
      'print', 'variables', 'int', 'float', 'str', 'bool',
      'input', 'f-strings', 'reading-errors', 'git-clone',
    ];
    writeFileSync(
      join(src, 'curriculum', 'area-0', 'glossary.md'),
      [
        '---', 'audience: learner', '---', '', '# Area 0 glossary', '',
        ...ids.flatMap((id) =>
          id === 'print'
            ? ['## print', '', 'Puts something in the terminal, with *emphasis* and `code`.', '']
            : [`## ${id}`, '', `A definition of ${id}.`, ''],
        ),
      ].join('\n'),
      'utf8',
    );

    buildSite({ contentRoot: src, outDir });
    const html = readFileSync(join(outDir, 'area-0.html'), 'utf8');

    expect(html).toContain('<span class="gl" tabindex="0">print');

    /*
     * The vocabulary is a row of words, and clicking one opens its full entry BELOW the row.
     *
     * It printed all ten definitions in full first — several paragraphs and a code block each,
     * sitting between the reader and the lesson. A hover card was the next attempt and was wrong
     * twice: ten of them overlapped, and an entry with a code block in it does not belong in a
     * tooltip. The in-app Tome had it right all along, so the two surfaces now agree.
     *
     * The mechanism is a radio per concept and a CSS sibling rule, which is why the page can do
     * click-to-open and still run no script. The rule is asserted because it is the whole trick:
     * without it every panel stays hidden and the words do nothing.
     */
    expect(html).toContain('class="vocab-row"');
    expect(html).toContain('<label class="gl" for="v0-print">print</label>');
    expect(html).toContain('#v0-print:checked~#p-v0-print{display:block}');
    // The panel carries the real entry, code formatting and all — not a flattened line.
    expect(html).toMatch(/<div class="vp" id="p-v0-print">[\s\S]*?<code>/);

    /*
     * Asserted on the card's own text rather than the whole page.
     *
     * The same entry is also printed in full under "What this area teaches", where it is real
     * markdown and `*emphasis*` becomes `<em>` correctly. The flattening is a property of the
     * card, so the card is what has to be looked at — the first version of this test asserted
     * over the page and failed on the vocabulary list doing its job.
     */
    const card = /<span class="gl-d">([\s\S]*?)<\/span>/.exec(html)?.[1] ?? '';
    expect(card).toContain('Puts something in the terminal');
    // The card is injected into prose the parser has not read yet, so a stray `*` would
    // italicise the rest of a sentence and a backtick would open a code span that never closes.
    expect(card).not.toContain('<em>');
    expect(card).not.toContain('*');
    expect(card).not.toContain('`');

    expect(html).not.toContain('[[');
    expect(html.toLowerCase()).not.toContain('<script');

    rmSync(src, { recursive: true, force: true });
    rmSync(outDir, { recursive: true, force: true });
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
    // The term is a `<label>` in the vocabulary row since the glossary became click-to-open.
    // It is still the generator's own words, which is what the sweep has to keep reaching.
    const planted = areaPage(0).replace(
      '<label class="gl" for="v0-print">print</label>',
      '<label class="gl" for="v0-print">print · DC 12</label>',
    );
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
