/**
 * A draft lesson has to read as a draft.
 *
 * Areas 3–7 get their teaching written ahead of the sessions that will test it, which is worth
 * doing — a syllabus nobody can read is not a syllabus — and dangerous in exactly one way: a
 * draft that looks finished is worse than the honest "No lesson yet" it replaced. The reader
 * cannot tell whether to trust it, and the author cannot tell what still needs work.
 *
 * **The signal is the filename**, `lesson.draft.md` rather than `lesson.md`. Promotion is then a
 * `git mv` — a visible, reviewable act — instead of remembering to delete a line from the top of
 * a file. A marker inside the prose can be forgotten in either direction; a filename cannot be
 * half-changed.
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildSite } from '../src/build.ts';

const here = dirname(fileURLToPath(import.meta.url));
const NEWLINE = String.fromCharCode(10);
const AREA = ['area: 4', 'title: Nowhere', 'authoring: complete', ''].join(NEWLINE);

function build(name: string, files: Record<string, string>): { area: string; index: string } {
  const src = resolve(here, '..', `dist-${name}-src`);
  const out = resolve(here, '..', `dist-${name}-out`);
  rmSync(src, { recursive: true, force: true });
  rmSync(out, { recursive: true, force: true });
  for (const [relative, body] of Object.entries(files)) {
    const full = join(src, relative);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body, 'utf8');
  }
  buildSite({ contentRoot: src, outDir: out });
  /**
   * The `<style>` block is stripped before anything is asserted. It carries a `.draft` rule on
   * every page, finished or not, so a whole-document search for "draft" matches the stylesheet
   * and says nothing about what the page shows. Strip the CSS and the broad assertion becomes
   * meaningful again: no mention of a draft anywhere the reader can see.
   */
  const read = (f: string): string =>
    readFileSync(join(out, f), 'utf8').replace(/<style>[\s\S]*?<\/style>/g, '');
  const result = { area: read('area-4.html'), index: read('index.html') };
  rmSync(src, { recursive: true, force: true });
  rmSync(out, { recursive: true, force: true });
  return result;
}

describe('a draft lesson', () => {
  it('renders its prose, because an unreadable draft helps nobody', () => {
    const { area } = build('draft', {
      'curriculum/area-4/area.yml': AREA,
      'curriculum/area-4/lesson.draft.md': 'A list holds things in order.' + NEWLINE,
    });
    expect(area).toContain('A list holds things in order.');
  });

  it('says on the page that it is a draft', () => {
    const { area } = build('draftlabel', {
      'curriculum/area-4/area.yml': AREA,
      'curriculum/area-4/lesson.draft.md': 'A list holds things in order.' + NEWLINE,
    });
    expect(area).toMatch(/draft/i);
  });

  /**
   * The index is where somebody decides what to read. A draft that is indistinguishable there
   * is a draft that gets opened as if it were settled.
   */
  it('is marked as a draft on the index, not only on the page', () => {
    const { index } = build('draftindex', {
      'curriculum/area-4/area.yml': AREA,
      'curriculum/area-4/lesson.draft.md': 'A list holds things in order.' + NEWLINE,
    });
    expect(index).toMatch(/draft/i);
  });
});

describe('a finished lesson', () => {
  it('is never labelled a draft', () => {
    const { area, index } = build('final', {
      'curriculum/area-4/area.yml': AREA,
      'curriculum/area-4/lesson.md': 'A list holds things in order.' + NEWLINE,
    });
    expect(area).toContain('A list holds things in order.');
    expect(area).not.toMatch(/draft/i);
    expect(index).not.toMatch(/draft/i);
  });

  /**
   * If both exist the finished one wins, and nothing on the page says "draft". Otherwise
   * promoting a lesson would mean remembering to delete the old file, and the failure mode is a
   * finished lesson that still apologises for itself.
   */
  it('wins over a draft left beside it', () => {
    const { area } = build('both', {
      'curriculum/area-4/area.yml': AREA,
      'curriculum/area-4/lesson.md': 'The finished words.' + NEWLINE,
      'curriculum/area-4/lesson.draft.md': 'The old draft words.' + NEWLINE,
    });
    expect(area).toContain('The finished words.');
    expect(area).not.toContain('The old draft words.');
    expect(area).not.toMatch(/draft/i);
  });
});

describe('an area with neither', () => {
  it('still says no lesson yet', () => {
    const { area } = build('none', { 'curriculum/area-4/area.yml': AREA });
    expect(area).toMatch(/no lesson yet/i);
  });
});
