/**
 * The comparison itself, tested directly.
 *
 * The half that loads modules is exercised by `tests/compiled-entry-points.test.ts`, which runs
 * in the one vitest project with no source alias. This file is the arithmetic underneath it, and
 * it runs in the ordinary `scripts` project because it imports nothing from `@pyquest/*`.
 */

import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { compareExports, entryPoints, formatParity, isCurrent } from './dist-parity.ts';

describe('compareExports', () => {
  it('reports an export that source has and the build does not', () => {
    const parity = compareExports('@pyquest/contract', ['TomeSchema'], ['TomeSchema', 'HowToSchema']);

    expect(parity.missing).toEqual(['HowToSchema']);
    expect(parity.extra).toEqual([]);
    expect(isCurrent(parity)).toBe(false);
  });

  it('reports an export the build kept after source dropped it', () => {
    const parity = compareExports('@pyquest/engine', ['scoreQuest', 'oldPayout'], ['scoreQuest']);

    expect(parity.missing).toEqual([]);
    expect(parity.extra).toEqual(['oldPayout']);
    expect(isCurrent(parity)).toBe(false);
  });

  it('is current when both sides agree, whatever the order', () => {
    const parity = compareExports('@pyquest/content', ['b', 'a'], ['a', 'b']);

    expect(isCurrent(parity)).toBe(true);
    expect(parity.missing).toEqual([]);
    expect(parity.extra).toEqual([]);
  });

  /**
   * The failure this whole module was written for was one missing name among dozens of correct
   * ones. A comparison that only answered "identical or not" would have been true and useless.
   */
  it('names every difference rather than stopping at the first', () => {
    const parity = compareExports('@pyquest/content', ['keep'], ['keep', 'one', 'two', 'three']);

    expect(parity.missing).toEqual(['one', 'three', 'two']);
  });
});

describe('entryPoints', () => {
  const packagesDir = fileURLToPath(new URL('../packages', import.meta.url));
  const found = entryPoints(packagesDir);

  it('finds every package, derived from the manifests rather than a list', () => {
    const specifiers = found.map((entry) => entry.specifier);

    expect(specifiers).toContain('@pyquest/content');
    expect(specifiers).toContain('@pyquest/contract');
    expect(specifiers).toContain('@pyquest/db');
    expect(specifiers).toContain('@pyquest/engine');
  });

  /**
   * `@pyquest/content/browser` is a published entry point, so it is one an app can import stale.
   * The bare-package check would not have covered it.
   */
  it('finds published subpaths, not only the package root', () => {
    const specifiers = found.map((entry) => entry.specifier);

    expect(specifiers).toContain('@pyquest/content/browser');
  });

  it('maps a compiled entry back to the source it is built from', () => {
    const browser = found.find((entry) => entry.specifier === '@pyquest/content/browser');

    expect(browser?.sourcePath.split('\\').join('/')).toMatch(/packages\/content\/src\/browser\.ts$/);
  });
});

describe('formatParity', () => {
  it('says so plainly when everything matches', () => {
    const report = formatParity([compareExports('@pyquest/engine', ['a'], ['a'])]);

    expect(report).toContain('OK');
    expect(report).not.toContain('FAIL');
  });

  /**
   * The remedy is in the report because the obvious one does not work. A developer told "dist is
   * stale" runs `npm run build`, and `tsc -b` exits 0 without emitting — measured four times.
   */
  it('names the missing export and the remedy that actually works', () => {
    const report = formatParity([compareExports('@pyquest/contract', [], ['HowToSchema'])]);

    expect(report).toContain('@pyquest/contract');
    expect(report).toContain('HowToSchema');
    expect(report).toContain('tsbuildinfo');
  });

  it('reports only the entry points that are wrong', () => {
    const report = formatParity([
      compareExports('@pyquest/engine', ['fine'], ['fine']),
      compareExports('@pyquest/contract', [], ['HowToSchema']),
    ]);

    expect(report).toContain('@pyquest/contract');
    expect(report).not.toContain('@pyquest/engine');
  });
});
