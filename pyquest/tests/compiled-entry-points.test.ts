/**
 * The one suite that loads what the applications load.
 *
 * ## Why it is here and not beside the code it checks
 *
 * Every other project in `vitest.config.ts` aliases `@pyquest/*` to `src/`. This one does not,
 * and it is the only one that must not — so it lives in a directory no other project's glob
 * reaches. `scripts/**` belongs to the `scripts` project and `packages/**` to `packages`; a file
 * placed in either would be collected twice, once with the alias, and the aliased copy would pass
 * against source while the compiled artifact stayed broken. That is the exact failure this suite
 * exists to catch, so the placement is load-bearing rather than tidy.
 *
 * ## What it proves
 *
 * That `import '@pyquest/contract'` — through `package.json` `exports`, through `dist/index.js`,
 * the path every app takes and no other test does — offers the same names `src/index.ts` does.
 *
 * On 2026-09-09 it would have failed on `HowToSchema` three days before the SPA did, and on
 * `practices.yml` before the Field Manual's build threw 32 issues. Both were green everywhere
 * else at the time, in a suite of 1154 tests, because nothing had ever loaded `dist/`.
 */

import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { compareExports, entryPoints, formatParity, isCurrent } from '../scripts/dist-parity.ts';

const packagesDir = fileURLToPath(new URL('../packages', import.meta.url));
const published = entryPoints(packagesDir);

/**
 * A guard on the guard. `entryPoints` derives its list from the manifests, so a manifest that
 * loses its `exports` block, or a glob that stops matching, would leave this suite passing over
 * an empty list — green, and checking nothing.
 */
it('has entry points to check', () => {
  expect(published.length).toBeGreaterThanOrEqual(4);
});

describe.each(published)('$specifier', ({ specifier, sourcePath }) => {
  it('exports from dist everything it exports from src', async () => {
    /**
     * The bare specifier resolves through `exports` to `dist/`, because this project has no
     * alias. `sourcePath` is an absolute path, so it bypasses resolution entirely and vitest
     * transforms the TypeScript on the way in. Two different modules, deliberately.
     */
    let compiled: Record<string, unknown>;
    try {
      compiled = (await import(/* @vite-ignore */ specifier)) as Record<string, unknown>;
    } catch (error) {
      /**
       * No `dist/` at all — a fresh clone, or `npm ci`, which deletes it.
       *
       * Rethrown with the remedy because the message vitest produces on its own is actively
       * misleading: *"Failed to resolve entry for package. The package may have incorrect
       * main/module/exports specified in its package.json"* sends a reader to a manifest that is
       * correct, when what they actually need to do is build.
       */
      throw new Error(
        `${specifier} has no compiled entry point to check.\n\n` +
          `      ${(error as Error).message.split('\n')[0]}\n\n` +
          '      This is almost always an unbuilt tree rather than a broken manifest.\n' +
          '      fix: npm run build\n',
        { cause: error },
      );
    }

    const source = (await import(/* @vite-ignore */ sourcePath)) as Record<string, unknown>;
    const parity = compareExports(specifier, Object.keys(compiled), Object.keys(source));

    expect(isCurrent(parity), formatParity([parity])).toBe(true);
  });
});
