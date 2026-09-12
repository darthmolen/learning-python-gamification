/**
 * The learner-setup payload names files that have to be there.
 *
 * `tools/learner-setup/pack.sh` is the only thing that puts material on a learner's machine, and
 * it checks its whole manifest before copying anything — deliberately, because "a half-copied
 * payload is worse than no payload: it looks finished, and the missing file surfaces on the other
 * machine." The consequence is that one dead path takes the entire tool out, loudly, at step 1.
 *
 * **Nothing in CI ran it**, so when ADR 0007's sessions-to-practices rename moved
 * `curriculum/area-2/exercises/session-2` out from under the manifest, the tool stopped working
 * and every test stayed green. That is what this file is for. It is not a test of `pack.sh`; it
 * is the check that the manifest still describes the repository, which is the half that rots.
 *
 * It reaches outside `pyquest/` on purpose. `two-roots.test.ts` and `glossary.test.ts` already
 * establish that a content test may read the repository root, and the manifest is content in the
 * sense that matters here: authored, not compiled, and consumed by something that trusts it.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/** The repository root — four levels up from `packages/content/tests/`. */
const REPO_ROOT = fileURLToPath(new URL('../../../..', import.meta.url));

const MANIFEST = join(REPO_ROOT, 'tools/learner-setup/manifest.txt');

/**
 * The manifest as `pack.sh` reads it, and by the same rules.
 *
 * `pack.sh:108` runs the line through two `sed` expressions and a `grep`: strip from a `#` to the
 * end of the line, drop trailing whitespace, discard what is left empty. Parsing it any other way
 * here would make this suite agree with a manifest the tool disagrees with, which is worse than
 * not checking at all.
 *
 * The shell one-liner is deliberately described rather than quoted — it contains the two
 * characters that end a block comment, and pasting it here closes this one four lines early.
 */
function manifestPaths(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*/, '').trimEnd())
    .filter((line) => line !== '');
}

describe('the learner-setup manifest', () => {
  it('names at least one path', () => {
    // `pack.sh` dies on an empty manifest, so an empty one is a real failure rather than a
    // vacuous pass. Without this, deleting every line would make the suite below green.
    expect(manifestPaths(readFileSync(MANIFEST, 'utf8')).length).toBeGreaterThan(0);
  });

  it('names only paths that exist in this repository', () => {
    const missing = manifestPaths(readFileSync(MANIFEST, 'utf8')).filter(
      (path) => !existsSync(join(REPO_ROOT, path)),
    );

    // Asserting on the list rather than on a count, because the useful failure message is which
    // path died — that is the whole of the next action, and `pack.sh` prints the same thing.
    expect(missing).toEqual([]);
  });
});
