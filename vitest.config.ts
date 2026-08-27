import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    /**
     * `tsc -b` emits compiled copies of every `*.test.ts` into each package's `dist/`. Without
     * this, vitest collects both the source suite and its stale build output, so a green run can
     * be reporting on code that no longer exists — and a red one can be a build artifact nobody
     * edited. Source is the only thing worth running.
     */
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
