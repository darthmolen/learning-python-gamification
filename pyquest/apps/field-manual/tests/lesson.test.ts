/**
 * The teaching body, and the boundary between two audiences.
 *
 * The site published a vocabulary blurb, a sentence and a list of briefs, and the parent
 * called it what it was: *"no teachable body, no explanation around the real concepts, no code
 * examples."* That was not a rendering fault — `AreaView` had no field for teaching and no file
 * in the repository held one. `lesson.md` is that file, and these tests are what stop the slot
 * from quietly going empty again.
 *
 * The second half is the audience split. The DM build carries `dm-guide.md` behind a Teaching
 * aid control; the learner build must not carry it **at all**. Hiding it with CSS would publish
 * the teacher's notes to anyone who opens view-source, and this site is public — so the
 * assertion is over the bytes of the learner's HTML, not over what a browser chooses to paint.
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildSite } from '../src/build.ts';

const here = dirname(fileURLToPath(import.meta.url));

/** A throwaway two-root tree, so these assertions never depend on what is authored today. */
function scratch(name: string, files: Record<string, string>): string {
  const root = resolve(here, '..', `dist-${name}-fixture`);
  rmSync(root, { recursive: true, force: true });
  for (const [relative, body] of Object.entries(files)) {
    const full = join(root, relative);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body, 'utf8');
  }
  return root;
}

const readOut = (out: string, file: string): string =>
  readFileSync(join(out, file), 'utf8');

const AREA = ['area: 4', 'title: Nowhere', 'authoring: complete', ''].join('\n');

describe('the lesson is the page body', () => {
  it('renders lesson.md into the area page', () => {
    const root = scratch('lesson', {
      'curriculum/area-4/area.yml': AREA,
      'curriculum/area-4/lesson.md': '# Ignored\n\nA loop repeats. That is the whole idea.\n',
    });
    const out = resolve(here, '..', 'dist-lesson-out');
    buildSite({ contentRoot: root, outDir: out });
    const html = readOut(out, 'area-4.html');

    expect(html).toContain('A loop repeats. That is the whole idea.');
    rmSync(root, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  });

  /**
   * An unwritten lesson has to read as unwritten. §5.1a's honesty rule applied to prose: the
   * page that hides a gap is worse than the page that names it, because only one of them tells
   * the reader whether to come back.
   */
  it('says so when an area has no lesson yet, rather than rendering nothing', () => {
    const root = scratch('nolesson', { 'curriculum/area-4/area.yml': AREA });
    const out = resolve(here, '..', 'dist-nolesson-out');
    buildSite({ contentRoot: root, outDir: out });
    const html = readOut(out, 'area-4.html');

    /**
     * "Not written yet" would pass on the *exercises* gap, which this fixture also has — the
     * first version of this assertion did exactly that and a mutant deleting the lesson gap
     * survived it. The phrase asserted here belongs to the lesson and to nothing else.
     */
    expect(html).toMatch(/no lesson yet/i);
    rmSync(root, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  });
});

describe('the teaching aid is absent from the learner build, not hidden', () => {
  const files = {
    'curriculum/area-4/area.yml': AREA,
    'curriculum/area-4/lesson.md': 'The learner reads this.\n',
    'curriculum/area-4/dm-guide.md': '# Guide\n\nAsk them to predict before running it.\n',
  };

  it('carries the guide, behind a control, in the dm build', () => {
    const root = scratch('dm', files);
    const out = resolve(here, '..', 'dist-dm-out');
    buildSite({ contentRoot: root, outDir: out, audience: 'dm' });
    const html = readOut(out, 'area-4.html');

    expect(html).toContain('Ask them to predict before running it.');
    expect(html).toMatch(/teaching aid/i);
    rmSync(root, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  });

  /**
   * The mutant this test exists for is a renderer that emits the aid and hides it with CSS.
   * Asserting on the raw HTML is what tells the difference; asserting on rendered text would
   * pass for both.
   */
  it('contains no word of the guide in the learner build', () => {
    const root = scratch('learner', files);
    const out = resolve(here, '..', 'dist-learner-out');
    buildSite({ contentRoot: root, outDir: out });
    const html = readOut(out, 'area-4.html');

    expect(html).toContain('The learner reads this.');
    expect(html).not.toContain('Ask them to predict');
    expect(html).not.toMatch(/teaching aid/i);
    rmSync(root, { recursive: true, force: true });
    rmSync(out, { recursive: true, force: true });
  });
});
