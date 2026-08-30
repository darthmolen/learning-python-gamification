import { existsSync, readFileSync, readdirSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Run the tests against source, never against a build.
 *
 * Each package's `exports` points at `dist/`, so a cross-package import — the
 * engine reaching for `@pyquest/content` — resolved to compiled output. That
 * passes happily against a stale `dist`, which means an edit to `content/src`
 * could be green in a suite that never loaded it. Aliasing to source removes the
 * possibility rather than relying on remembering to build.
 *
 * `tsc -b` still builds `dist` for real consumers; this only governs tests.
 *
 * **Defined once, on purpose.** Both projects below spread this same object. An
 * `apps/web`-local vitest config would be a second place for these to be written
 * down, and the second place is the one that goes stale — `packages/contract/dist/`
 * exists on disk, so a web project missing the contract alias would parse its
 * fixtures against compiled output and stay green against a contract that moved.
 *
 * **Derived, not listed** — Wave 3, 2026-08-29. The map used to name each package by
 * hand, which made this file something every new package's track had to edit: the
 * `db` track's plan listed it for one line, and `api`'s did too. Reading each
 * package's own `package.json` keeps the single definition the paragraph above argues
 * for and removes the queue behind it. A package that exists is aliased; there is no
 * list to forget to update, which is the failure mode that paragraph is guarding.
 */
const packagesDir = fileURLToPath(new URL('./packages', import.meta.url));

const alias = Object.fromEntries(
  readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const manifest = new URL(`./packages/${entry.name}/package.json`, import.meta.url);
      const { name } = JSON.parse(readFileSync(manifest, 'utf8')) as { name: string };
      const file = (basename: string) =>
        fileURLToPath(new URL(`./packages/${entry.name}/src/${basename}.ts`, import.meta.url));

      /**
       * A package with a `src/browser.ts` also publishes `<name>/browser`, and that key must
       * come FIRST. Vite matches string aliases by prefix, so a bare `@pyquest/content` sitting
       * ahead of it would rewrite `@pyquest/content/browser` into a path ending `index.ts/browser`
       * — a resolution failure whose message names neither file.
       */
      const subpaths: [string, string][] = existsSync(file('browser'))
        ? [[`${name}/browser`, file('browser')]]
        : [];

      return [...subpaths, [name, file('index')] as [string, string]];
    }),
);

/**
 * `tsc -b` emits compiled copies of anything it is given. Without this, vitest
 * would collect both the source suite and its build output, so a green run could
 * be reporting on code that no longer exists.
 */
const exclude = ['**/node_modules/**', '**/dist/**'];

export default defineConfig({
  test: {
    /**
     * Two projects, because the packages and the app need different environments
     * and the root `test` script does not fan out across workspaces.
     *
     * Without this the app's tests are still collected — a bare `vitest run` globs
     * the whole tree — but into a `node` environment with no `document`, so every
     * DOM test fails for a reason that has nothing to do with the test.
     */
    projects: [
      {
        resolve: { alias },
        test: {
          /**
           * The static curriculum site. Node, because it is a build-time generator and has no
           * browser to run in — its whole point is that the published pages carry no script.
           */
          name: 'field-manual',
          root: fileURLToPath(new URL('./apps/field-manual', import.meta.url)),
          include: ['tests/**/*.{test,spec}.ts'],
          exclude,
          environment: 'node',
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'packages',
          include: ['packages/**/*.{test,spec}.ts'],
          exclude,
          environment: 'node',
        },
      },
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: 'web',
          root: fileURLToPath(new URL('./apps/web', import.meta.url)),
          include: ['src/**/*.{test,spec}.{ts,tsx}'],
          exclude,
          environment: 'jsdom',
          globals: true,
          setupFiles: [fileURLToPath(new URL('./apps/web/src/test-setup.ts', import.meta.url))],
        },
      },
      /**
       * `apps/api`. Appended by the `api` track — the second entry to this list, and written
       * as an append rather than a merge because two tracks name this file and neither owns it.
       *
       * Without it the API's suites are collected by nothing: the `packages` glob stops at
       * `packages/`, and the `web` project is rooted in `apps/web`. A suite that no project
       * collects does not fail — it is silently absent, which is the worst of the three
       * outcomes.
       *
       * `node`, because there is no DOM here and never will be: the api is the half of the
       * system that must not care what a screen looks like.
       */
      {
        resolve: { alias },
        test: {
          name: 'api',
          root: fileURLToPath(new URL('./apps/api', import.meta.url)),
          include: ['{src,tests}/**/*.{test,spec}.ts'],
          exclude,
          environment: 'node',
        },
      },
    ],
  },
});
