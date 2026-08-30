/**
 * The content root, loaded once at boot or not at all.
 *
 * §6.10 validates content on load. The decision this suite pins is what happens when validation
 * fails: the boot stops. A half-loaded campaign is worse than a stopped one, because it shows a
 * child a map with a hole in it and gives him no way to tell the hole is a bug rather than
 * something he has not unlocked.
 */

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { ContentRootError, loadContentRoot } from '../src/content.ts';

/** The repository's own content, which is the thing the api actually boots against. */
const REAL_ROOT = fileURLToPath(new URL('../../../../content', import.meta.url));

const scratchRoots: string[] = [];

function scratchRoot(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'pyquest-content-'));
  scratchRoots.push(root);
  for (const [relative, body] of Object.entries(files)) {
    const path = join(root, relative);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, body, 'utf8');
  }
  return root;
}

afterAll(() => {
  for (const root of scratchRoots) rmSync(root, { recursive: true, force: true });
});

const AREA_0 = `area: 0
title: First Light
authoring: partial
estimatedQuests: 5
`;

const QUEST = `id: a0-name-tag
title: The Name Tag
kind: quest
area: 0
concepts: [print]
dc: 5
brief: briefs/a0-name-tag.md
verifier:
  type: hidden-tests
  starter: starters/a0-name-tag.py
  tests: tests/a0-name-tag_test.py
`;

const GOOD_ROOT: Record<string, string> = {
  'areas/area-0.yml': AREA_0,
  'quests/a0-name-tag.yml': QUEST,
  'briefs/a0-name-tag.md': '# The Name Tag\n',
  'starters/a0-name-tag.py': 'def main() -> None: ...\n',
  'tests/a0-name-tag_test.py': 'def test_it() -> None: assert True\n',
};

describe('loading the content root', () => {
  it('loads the repository’s own content', () => {
    const content = loadContentRoot(REAL_ROOT);
    expect(content.items.length).toBeGreaterThan(0);
    expect(content.manifests.length).toBe(8);
  });

  it('indexes items by id so a route does not scan the corpus per request', () => {
    const content = loadContentRoot(REAL_ROOT);
    expect(content.item('a0-name-tag')?.title).toBe('The Name Tag');
    expect(content.item('no-such-quest')).toBeUndefined();
  });

  it('finds an area’s manifest', () => {
    const content = loadContentRoot(REAL_ROOT);
    expect(content.manifest(0)?.title).toBe('First Light');
  });

  it('reads a brief from disk as text', () => {
    const content = loadContentRoot(scratchRoot(GOOD_ROOT));
    expect(content.read('briefs/a0-name-tag.md')).toContain('The Name Tag');
  });

  it('refuses to read outside the content root, whatever the caller passes', () => {
    const content = loadContentRoot(scratchRoot(GOOD_ROOT));
    expect(() => content.read('../../../etc/passwd')).toThrow(/outside the content root/);
    expect(() => content.read('/etc/passwd')).toThrow(/outside the content root/);
  });

  it('refuses the boot when one file will not parse, and names it', () => {
    const root = scratchRoot({ ...GOOD_ROOT, 'quests/broken.yml': 'id: [unclosed\n' });
    let error: unknown;
    try {
      loadContentRoot(root);
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(ContentRootError);
    expect((error as ContentRootError).issues.length).toBeGreaterThan(0);
    expect((error as ContentRootError).message).toContain(root);
  });

  it('refuses the boot when a prerequisite graph has a cycle', () => {
    const a = QUEST.replace('id: a0-name-tag', 'id: a0-one').concat('requires: [a0-two]\n');
    const b = QUEST.replace('id: a0-name-tag', 'id: a0-two').concat('requires: [a0-one]\n');
    const root = scratchRoot({ ...GOOD_ROOT, 'quests/one.yml': a, 'quests/two.yml': b });
    expect(() => loadContentRoot(root)).toThrow(ContentRootError);
  });

  it('refuses the boot when a brief names a file that is not there', () => {
    const root = scratchRoot({ ...GOOD_ROOT });
    rmSync(join(root, 'briefs/a0-name-tag.md'));
    expect(() => loadContentRoot(root)).toThrow(ContentRootError);
  });

  it('refuses a content root that does not exist at all', () => {
    expect(() => loadContentRoot(join(tmpdir(), 'pyquest-no-such-root'))).toThrow(ContentRootError);
  });
});
