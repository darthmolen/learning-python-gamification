/**
 * The browser-safe entry, checked by walking its module graph.
 *
 * "Run `vite build` and see" is not a check that lives anywhere — it passes on the machine of
 * whoever remembers to run it, which is how a broken production build survived a commit and was
 * found by a runtime error in the dev server instead.
 *
 * This walks every import reachable from `src/browser.ts` and asserts none of them resolves to a
 * Node builtin. It fails on the graph, not on the bundler, so it fails in the suite everyone
 * already runs.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const src = (file: string) => resolve(here, '..', 'src', file);

/** Every relative import in a module, as a resolved path. Static `import`/`export from` only. */
function importsOf(file: string): string[] {
  const source = readFileSync(file, 'utf8');
  const specifiers = [...source.matchAll(/(?:^|\n)\s*(?:import|export)[^'"]*from\s*['"]([^'"]+)['"]/g)]
    .map((m) => m[1] as string);
  return specifiers.map((s) => (s.startsWith('.') ? resolve(dirname(file), s) : s));
}

/** Walks the graph from an entry, returning every specifier reached. */
function graphFrom(entry: string): { modules: string[]; bare: string[] } {
  const seen = new Set<string>();
  const bare = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const spec of importsOf(file)) {
      if (spec.startsWith('/') || /^[A-Za-z]:/.test(spec)) queue.push(spec);
      else bare.add(spec);
    }
  }
  return { modules: [...seen].map((m) => m.split(sep).join('/')), bare: [...bare] };
}

describe('the browser-safe entry', () => {
  it('reaches no Node builtin, however deep', () => {
    // The mutant that decides this test: re-export validate.ts from browser.ts. A suite that
    // stays green has proved the file exists and nothing else.
    const { bare } = graphFrom(src('browser.ts'));
    const builtins = bare.filter((s) => s.startsWith('node:'));
    expect(builtins).toEqual([]);
  });

  it('reaches neither validate nor scaffold, which are the two that import fs', () => {
    const { modules } = graphFrom(src('browser.ts'));
    const forbidden = modules.filter((m) => /\/(validate|scaffold)\.ts$/.test(m));
    expect(forbidden).toEqual([]);
  });

  it('still carries what the contract actually imports', async () => {
    const entry = (await import('../src/browser.ts')) as Record<string, unknown>;
    for (const name of ['AreaSchema', 'MedalSchema', 'DifficultyClassSchema', 'CONCEPT_IDS']) {
      expect(entry[name], `browser entry is missing ${name}`).toBeDefined();
    }
  });

  it('the full entry is unchanged and still reaches the validator', () => {
    // `.` stays the complete API: apps/api imports checkContent from the bare specifier, and
    // this split must not move that out from under it.
    const { modules } = graphFrom(src('index.ts'));
    expect(modules.some((m) => /\/validate\.ts$/.test(m))).toBe(true);
  });
});
