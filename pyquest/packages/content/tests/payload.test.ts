/**
 * What may travel to a learner's machine — asserted against the real curriculum.
 *
 * This is the suite with the worst failure mode in the repository. Everything else here fails
 * into a red test; this one fails into an eleven-year-old holding the answer key, and no commit
 * takes that back. So the rules are an allow-list, the three forbidden things are asserted by
 * name, and the assertions run over the actual tree rather than a fixture — a packing rule that
 * passes on invented content and ships the wrong file from the real one has proved nothing.
 *
 * The three, and where each says so itself:
 *
 * - `dm-guide.md` — the Socratic ladder, the stall table, and what to let a learner get wrong.
 * - `reference/` — `reference/README.md`: *"This directory is yours, not the learner's."*
 * - `hidden/` — every one opens *"Spec §6.3: these never reach the browser."*
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { curriculumEntries, manifestEntries, payloadPaths } from '../src/payload.ts';
import { audienceOf } from '../src/schema.ts';

/** The repository root — five levels up from `packages/content/tests/`. */
const REPO_ROOT = fileURLToPath(new URL('../../../..', import.meta.url));

const paths = payloadPaths(REPO_ROOT);

describe('the learner payload, over the real curriculum', () => {
  it('names something at all, so the assertions below are not vacuous', () => {
    // Without this, deleting every rule would make every "must not contain" test pass.
    expect(paths.length).toBeGreaterThan(50);
    expect(curriculumEntries(REPO_ROOT).length).toBeGreaterThan(20);
    expect(manifestEntries(REPO_ROOT).length).toBeGreaterThan(0);
  });

  it('carries no DM guide', () => {
    expect(paths.filter((p) => p.endsWith('dm-guide.md'))).toEqual([]);
  });

  it('carries nothing from a reference directory, which is the answer key', () => {
    expect(paths.filter((p) => p.includes('/reference/'))).toEqual([]);
  });

  it('carries no hidden test', () => {
    expect(paths.filter((p) => p.includes('/hidden/'))).toEqual([]);
  });

  /**
   * The practice plans are the specific failure this whole marking exists to fix.
   * `practices/README.md` told the learner to copy the directory holding them, and
   * `practice-3-the-broken-sigil.md` works only because the learner does not know what is
   * coming.
   */
  it('carries no practice plan, only the drills beside them', () => {
    expect(paths.filter((p) => /\/practices\/practice-\d+-[^/]+\.md$/.test(p))).toEqual([]);
    // And the drills themselves do travel, or the learner has briefs and nothing to run.
    expect(paths.some((p) => /\/practices\/practice-\d+\/.+\.py$/.test(p))).toBe(true);
  });

  it('carries no area README, which is written for somebody running a calendar', () => {
    expect(paths.filter((p) => /curriculum\/area-\d+\/README\.md$/.test(p))).toEqual([]);
  });

  /**
   * The general form of every assertion above, and the one that keeps holding when somebody
   * invents a new kind of DM document: of the area content, nothing that declares itself the
   * DM's may travel.
   *
   * **Scoped to `area-<n>/`, because that is where the flag governs.** The first version of this
   * test asserted over all of `curriculum/` and failed on `curriculum/lib/README.md` — which is
   * correct behavior, not a leak. `lib/` is not an area; it is the ursina shim the learner
   * imports, and it ships because a person put it in `manifest.txt`. `audienceOf` answers `dm`
   * for it only because it is unmarked, and it is unmarked because the `audience` rule does not
   * reach outside an area and would be asserting something nobody needs to decide.
   *
   * That is the seam between the two halves: the derived half is governed by the flag and this
   * assertion holds it; the hand-written half is governed by a person, and the review of
   * `manifest.txt` is what holds that.
   */
  it("carries no area document that declares itself the DM's", () => {
    const dmMarked = paths
      .filter((p) => /^curriculum\/area-\d+\/.*\.md$/.test(p))
      .filter((p) => audienceOf(readFileSync(join(REPO_ROOT, p), 'utf8')) !== 'learner');

    expect(dmMarked).toEqual([]);
  });

  it('carries the lesson, the glossary, the spine and the starters', () => {
    // The other direction. An allow-list that allows nothing is safe and useless, and a learner
    // with briefs but no starter cannot begin.
    expect(paths).toContain('curriculum/area-0/lesson.md');
    expect(paths).toContain('curriculum/area-0/glossary.md');
    expect(paths).toContain('curriculum/area-0/practices.yml');
    expect(paths).toContain('curriculum/area-0/verify.py');
    expect(paths.some((p) => /curriculum\/area-0\/exercises\/[^/]+\/starter\//.test(p))).toBe(true);
    expect(paths.some((p) => /curriculum\/area-0\/exercises\/[^/]+\/BRIEF\.md$/.test(p))).toBe(true);
  });

  it('carries no build debris', () => {
    expect(paths.filter((p) => /__pycache__|\.ruff_cache|\.pytest_cache/.test(p))).toEqual([]);
  });
});
