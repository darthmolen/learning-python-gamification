import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const src = (pkg: string) =>
  fileURLToPath(new URL(`./packages/${pkg}/src/index.ts`, import.meta.url));

export default defineConfig({
  resolve: {
    /**
     * Run the tests against source, never against a build.
     *
     * Each package's `exports` points at `dist/`, so a cross-package import —
     * the engine reaching for `@pyquest/content` — resolved to compiled output.
     * That passes happily against a stale `dist`, which means an edit to
     * `content/src` could be green in a suite that never loaded it. Aliasing to
     * source removes the possibility rather than relying on remembering to build.
     *
     * `tsc -b` still builds `dist` for real consumers; this only governs tests.
     */
    alias: {
      '@pyquest/content': src('content'),
      '@pyquest/engine': src('engine'),
    },
  },
  test: {
    /**
     * `tsc -b` emits compiled copies of anything it is given. Without this,
     * vitest would collect both the source suite and its build output, so a green
     * run could be reporting on code that no longer exists.
     */
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
