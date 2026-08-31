/**
 * The gates the two-tree, two-audience shape demands — asserted over the real content.
 *
 * `lesson.test.ts` proves the mechanism against fixtures. This file proves the *published
 * artifact*, because the failure mode that matters is not "the renderer could leak" but "the
 * thing on the internet does". Three of this repository's gates have now been found looking at
 * the wrong object; these look at the bytes that get deployed.
 */

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { buildSite } from '../src/build.ts';

const here = dirname(fileURLToPath(import.meta.url));
const contentRoot = resolve(here, '..', '..', '..', '..');
const out = resolve(here, '..', 'dist-published');

const NEWLINE = String.fromCharCode(10);
const LESSON = `A list holds things.${NEWLINE}`;

const pages = (dir: string): { file: string; html: string }[] =>
  readdirSync(dir)
    .filter((f) => f.endsWith('.html'))
    .map((f) => ({ file: f, html: readFileSync(join(dir, f), 'utf8') }));

let learner: { file: string; html: string }[];
let dm: { file: string; html: string }[];

beforeAll(() => {
  rmSync(out, { recursive: true, force: true });
  buildSite({ contentRoot, outDir: out });
  buildSite({ contentRoot, outDir: join(out, 'dm'), audience: 'dm' });
  learner = pages(out);
  dm = pages(join(out, 'dm'));
});

describe('the deletion test, on the real tree', () => {
  /**
   * The claim the two-tree layout exists to make: the curriculum stands without the game. The
   * validator's version of this lives in `packages/content`; this is the publishing version —
   * with no `game/` there are no exercises, and the site must still build eight area pages
   * rather than throwing or emitting nothing.
   */
  it('builds a site from the curriculum alone, with no game root at all', () => {
    const src = resolve(here, '..', 'dist-nogame-src');
    const dest = resolve(here, '..', 'dist-nogame');
    rmSync(src, { recursive: true, force: true });
    rmSync(dest, { recursive: true, force: true });
    mkdirSync(join(src, 'curriculum', 'area-4'), { recursive: true });
    const yaml = ['area: 4', 'title: Collections', 'authoring: complete', ''].join(NEWLINE);
    writeFileSync(join(src, 'curriculum', 'area-4', 'area.yml'), yaml, 'utf8');
    writeFileSync(join(src, 'curriculum', 'area-4', 'lesson.md'), LESSON, 'utf8');

    // No game/ directory is created at all. This is `rm -rf game/`, performed.
    const areas = buildSite({ contentRoot: src, outDir: dest });

    expect(areas).toHaveLength(1);
    expect(areas[0]?.exercises).toEqual([]);
    expect(readFileSync(join(dest, 'area-4.html'), 'utf8')).toContain('A list holds things.');

    rmSync(src, { recursive: true, force: true });
    rmSync(dest, { recursive: true, force: true });
  });
});

describe('what the learner artifact may not contain', () => {
  it('carries no teaching aid on any page', () => {
    for (const p of learner) {
      expect(p.html, `${p.file} carries a teaching aid`).not.toMatch(/teaching aid/i);
    }
  });

  /**
   * Phrases that only ever appear in a document written *about* a learner rather than *to*
   * one. If one of these reaches the Tome, the guide has leaked — and the assertion is over
   * raw HTML, so a leak hidden behind CSS still fails.
   */
  it('carries no DM direction on any page', () => {
    const direction = /\bask them\b|\bdo not say\b|\bmake them predict\b|\bnever cut this\b/i;
    for (const p of learner) {
      expect(p.html, `${p.file} reads as the teacher's notes`).not.toMatch(direction);
    }
  });

  /**
   * `reference/` holds worked solutions and an answers file. The reader walks `exercises/` and
   * `sessions/` only, so exclusion is by construction — this is the test that keeps it true
   * when somebody later adds a directory walk.
   *
   * **The learner site only.** The first version of this asserted over both and failed, and it
   * was the test that was wrong: the DM guide tells whoever is teaching to read
   * `reference/session-6-answers.md` before session 6, which is exactly what that document is
   * for. Pointing a teacher at the answers is the guide doing its job; the rule being kept here
   * is that the *learner* is never pointed at them.
   */
  it('never points the learner at a reference solution or an answer file', () => {
    for (const p of learner) {
      expect(p.html, `${p.file} names the reference directory`).not.toMatch(
        /reference\/|session-\d+-answers/i,
      );
    }
  });

  /**
   * Neither site may carry the answers themselves, however either one refers to them. A path is
   * a pointer; the worked solution is the thing that spoils the exercise.
   */
  it('embeds no worked solution in either site', () => {
    const solutions = readdirSync(join(contentRoot, 'curriculum', 'area-1', 'reference'))
      .filter((f) => f.endsWith('.py'))
      .map((f) => readFileSync(join(contentRoot, 'curriculum', 'area-1', 'reference', f), 'utf8'))
      .flatMap((src) => src.split(NEWLINE))
      .map((line) => line.trim())
      // Substantial lines only: `import turtle` is in every starter and proves nothing.
      .filter((line) => line.length > 40 && !line.startsWith('#') && !line.startsWith('"'));

    expect(solutions.length, 'fixture sanity: there are solutions to leak').toBeGreaterThan(0);
    for (const p of [...learner, ...dm]) {
      for (const line of solutions) {
        expect(p.html, `${p.file} contains a line from a worked solution`).not.toContain(line);
      }
    }
  });

  /** Hidden tests are hidden. A path is enough to give the game away. */
  it('names no hidden test path', () => {
    for (const p of [...learner, ...dm]) {
      expect(p.html, `${p.file} names a hidden test`).not.toMatch(/hidden\/test\.py/);
    }
  });
});

describe('what the dm artifact adds', () => {
  it('carries the aid on the areas that have a guide', () => {
    const withAid = dm.filter((p) => /teaching aid/i.test(p.html));
    expect(withAid.length).toBeGreaterThan(0);
  });

  /**
   * Same page count both ways. The DM site is the Tome plus aids, not a different site — if
   * these diverge, one of the two audiences is being shown a curriculum the other cannot see.
   */
  it('publishes the same pages as the learner site', () => {
    expect(dm.map((p) => p.file).sort()).toEqual(learner.map((p) => p.file).sort());
  });

  /** Unlisted, and it stays unlisted: nothing in the Tome may point at it. */
  it('is not linked from the learner site', () => {
    for (const p of learner) {
      expect(p.html, `${p.file} links to the dm site`).not.toMatch(/href="[^"]*\bdm\//);
    }
  });
});
