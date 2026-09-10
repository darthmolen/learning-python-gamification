/**
 * Does `dist/` still export what `src/` exports?
 *
 * ## Why this exists at all
 *
 * `vitest.config.ts` aliases every `@pyquest/*` to `src/`, deliberately and correctly — its own
 * comment argues it. The cost of that decision is that **no test in this repository has ever
 * loaded the compiled output every application imports**, because `package.json` `exports` points
 * at `dist/`. On 2026-09-09 two apps failed within twenty minutes of each other while 1154 tests
 * and both CI workflows were green: the SPA on `contract/dist/index.js` "does not provide an
 * export named 'HowToSchema'", added to source three days earlier and never emitted.
 *
 * This module is the missing question, asked at the only granularity that cannot be cached: load
 * the built artifact by its **entry point specifier** and ask it what it exports.
 *
 * ## Why not compare timestamps
 *
 * Because that is the comparison the compiler already gets wrong, and the diagnosis says so —
 * `planning/evidence/tsc-b-trusts-buildinfo-DIAGNOSIS.txt`. `tsc -b` never stats `dist/` at all;
 * it reads the input text hashes recorded in `tsconfig.tsbuildinfo` and treats them as a complete
 * account of what is on disk. Worse, a mtime-only change — precisely what `git checkout` does to
 * every `src/` file — pushes the buildinfo's own mtime forward, so the file becomes permanently
 * self-confirming. An mtime check is a second opinion from the same witness. Asking the module
 * what it exports is testimony from a different one.
 *
 * ## What it does not catch
 *
 * A body that changed while its signature did not. `medalsFor` returning the wrong number in
 * `dist` and the right one in `src` has identical export names and passes here. That gap is real
 * and named rather than papered over: closing it means comparing emitted bytes against a fresh
 * compile, which is a build, not a check. Export parity catches the failure that actually
 * happened, twice, and it catches it in the shape it happened in.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** One thing a consumer can `import` — a specifier, and the source file it is compiled from. */
export interface EntryPoint {
  /** What a consumer writes: `@pyquest/content`, or `@pyquest/content/browser`. */
  readonly specifier: string;
  /** Absolute path to the source module the specifier's `dist` file is built from. */
  readonly sourcePath: string;
}

/** What one entry point's compiled output is missing, and what it has that source does not. */
export interface Parity {
  readonly specifier: string;
  /** Exported by `src`, absent from `dist`. A stale build. */
  readonly missing: readonly string[];
  /** Exported by `dist`, absent from `src`. A build left behind by a deletion. */
  readonly extra: readonly string[];
}

/** The shape of a workspace package manifest, to the extent this file cares. */
interface Manifest {
  readonly name: string;
  readonly exports?: Readonly<Record<string, { readonly default?: string }>>;
}

/**
 * Every entry point every package publishes, derived from the manifests rather than listed here.
 *
 * Listed is what goes stale: `vitest.config.ts` used to name each package by hand and that made
 * it a file every new package's track had to remember to edit. A package that exists is checked,
 * and `@pyquest/content/browser` is checked because `exports` says it is published — not because
 * somebody wrote it down twice.
 *
 * The source path is derived from the compiled one, `./dist/browser.js` -> `./src/browser.ts`,
 * which is the same transformation `tsconfig.json`'s `rootDir`/`outDir` pair describes. A package
 * that stops obeying it fails loudly here rather than being skipped quietly.
 */
export function entryPoints(packagesDir: string): EntryPoint[] {
  return readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const dir = join(packagesDir, entry.name);
      const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as Manifest;

      return Object.entries(manifest.exports ?? {}).flatMap(([subpath, target]) => {
        const compiled = target.default;
        if (compiled === undefined) return [];

        const source = compiled.replace(/^\.\/dist\//, './src/').replace(/\.js$/, '.ts');
        if (source === compiled) {
          throw new Error(
            `${manifest.name}'s exports["${subpath}"] is "${compiled}", which is not ./dist/*.js — ` +
              'dist-parity derives the source path from it and cannot for this one',
          );
        }

        const specifier = subpath === '.' ? manifest.name : `${manifest.name}${subpath.slice(1)}`;
        return [{ specifier, sourcePath: join(dir, source) }];
      });
    });
}

/**
 * Compare two sets of export names.
 *
 * Pure, and separate from the loading, because this is the part worth testing directly: the
 * loading half is two `import()` calls and a `Object.keys`, and a test of it would be a test of
 * Node's resolver.
 *
 * **Runtime names on both sides**, so `export type` disappears from each equally — a type-only
 * export is erased at compile time and never present in either module namespace. Comparing
 * runtime to runtime keeps that from reading as a permanent, unfixable difference.
 */
export function compareExports(
  specifier: string,
  compiled: Iterable<string>,
  source: Iterable<string>,
): Parity {
  const inDist = new Set(compiled);
  const inSrc = new Set(source);

  return {
    specifier,
    missing: [...inSrc].filter((name) => !inDist.has(name)).sort(),
    extra: [...inDist].filter((name) => !inSrc.has(name)).sort(),
  };
}

/** True when this entry point's build is current, as far as export names can tell. */
export function isCurrent(parity: Parity): boolean {
  return parity.missing.length === 0 && parity.extra.length === 0;
}

/**
 * The report.
 *
 * It names the remedy, because the obvious one does not work and that is the whole point of the
 * diagnosis: a developer told "your dist is stale" reaches for `npm run build`, and `tsc -b`
 * answers by exiting 0 without emitting. Deleting the buildinfo is what makes the compiler look.
 */
export function formatParity(results: readonly Parity[]): string {
  const stale = results.filter((parity) => !isCurrent(parity));
  if (stale.length === 0) {
    return `OK  ${results.length} entry points, dist matches src`;
  }

  const lines = stale.flatMap((parity) => {
    const detail = [
      ...parity.missing.map((name) => `        missing from dist:  ${name}`),
      ...parity.extra.map((name) => `        stale in dist:      ${name}`),
    ];
    return [`FAIL  ${parity.specifier}`, ...detail];
  });

  return [
    ...lines,
    '',
    '      dist/ does not export what src/ does, so every app resolving the package',
    '      entry point is reading code that no longer exists.',
    '',
    '      fix: rm pyquest/packages/*/tsconfig.tsbuildinfo && npm run build',
    '',
    '      `tsc -b` alone will not fix this. It never stats dist/ — it trusts the',
    '      hashes in tsconfig.tsbuildinfo, and a branch switch pushes that file\'s',
    '      mtime past every source file without changing a byte of output. See',
    '      planning/evidence/tsc-b-trusts-buildinfo-DIAGNOSIS.txt.',
  ].join('\n');
}
