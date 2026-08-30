import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const src = (pkg: string) =>
  fileURLToPath(new URL(`./packages/${pkg}/src/index.ts`, import.meta.url));

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
 */
const alias = {
  '@pyquest/content': src('content'),
  '@pyquest/contract': src('contract'),
  '@pyquest/engine': src('engine'),
};

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
    ],
  },
});
