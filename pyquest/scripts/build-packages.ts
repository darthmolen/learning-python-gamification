/**
 * `npm run build` — compile the workspace packages, then check that it actually happened.
 *
 * ## Why `tsc -b` is not enough on its own
 *
 * Because it exits 0 without emitting, and it did so four times in a row on 2026-09-09 while a
 * developer was actively trying to fix the thing it was reporting as fixed. The mechanism is
 * diagnosed in full in `planning/evidence/tsc-b-trusts-buildinfo-DIAGNOSIS.txt`; the short form:
 *
 *   - `tsc -b` **never stats `dist/`**. It reads the input text hashes recorded in
 *     `tsconfig.tsbuildinfo` and treats them as a complete account of what was emitted. A
 *     `dist/index.js` that is stale, or deleted outright, is invisible to it.
 *   - A **mtime-only change pushes the buildinfo's own mtime forward**. `git checkout` rewrites
 *     every `src/` file's mtime and changes no text, so the first `tsc -b` after a branch switch
 *     re-dates the buildinfo ahead of every input and confirms a build it never verified.
 *   - Emit is **per-file**, so unrelated work never sweeps up the one artifact that is wrong.
 *
 * Together those make the buildinfo self-confirming. This script breaks that circle by asking a
 * different witness.
 *
 * ## The witness is the test, not a second implementation
 *
 * Verification here is `vitest run --project dist` — the suite in `pyquest/tests`, which is the
 * one project with no source alias and therefore the one place a package is imported the way an
 * application imports it. Reimplementing the comparison inside this script was the first attempt
 * and it was wrong twice over: it would be a second copy of the check that could disagree with
 * the first, and it does not actually work — `packages/db/src/migrate.ts` uses a TypeScript
 * parameter property, which Node's `--experimental-strip-types` refuses outright. Vitest
 * transforms TypeScript properly. One check, exercised by `npm test` and by every build.
 *
 * ## What it does about a failure
 *
 * It repairs it once, then re-checks, then fails. Deleting the buildinfo is the only thing that
 * makes the compiler look at reality, and it is what a developer would have to be told to do
 * anyway — so the script does it rather than printing instructions and exiting 1. What it will
 * not do is hide a second failure: if parity is still wrong after a forced rebuild, the problem
 * is not a stale cache, and the script says so and stops.
 *
 *   npm run build          compile, verify, repair once if needed, verify again
 *   npm run check:dist     verify only — no compile, no repair
 */

import { readdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PACKAGES = join(ROOT, 'packages');

const USAGE = `Usage: npm run build [-- --check]

Compiles the workspace packages and proves the compile happened, by loading each package through
its published entry point and comparing what it exports against src/.

  --check   verify only: do not compile, do not repair
  --help    this message

Exits 0 when dist/ matches src/, 1 when it does not.`;

/**
 * Run a command from `pyquest/`, inheriting stdio so its diagnostics reach the terminal unedited.
 *
 * `shell: true` because `npx` and `tsc` are `.cmd` shims on Windows and `spawnSync` will not
 * execute one without it. Every argument below is a literal in this file — nothing reaches here
 * from a user, an environment variable or a filename — so there is nothing to quote.
 */
function run(command: string, args: readonly string[]): number {
  const result = spawnSync(command, [...args], { cwd: ROOT, stdio: 'inherit', shell: true });
  return result.status ?? 1;
}

const compile = (force: boolean): number =>
  run('npx', ['tsc', '-b', '--pretty', ...(force ? ['--force'] : [])]);

/**
 * The parity suite. A fresh process each time, which is what makes the post-repair check
 * meaningful — an in-process re-import would be answered from the module cache with the very
 * modules the repair was supposed to replace.
 */
const verify = (): number => run('npx', ['vitest', 'run', '--project', 'dist']);

/** Delete every buildinfo, which is the only thing that makes `tsc -b` look at `dist/` again. */
function discardBuildInfo(): void {
  for (const entry of readdirSync(PACKAGES, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    rmSync(join(PACKAGES, entry.name, 'tsconfig.tsbuildinfo'), { force: true });
  }
}

function main(argv: readonly string[]): number {
  let parsed;
  try {
    parsed = parseArgs({
      args: [...argv],
      options: { check: { type: 'boolean' }, help: { type: 'boolean', short: 'h' } },
    });
  } catch (error) {
    console.error(`${(error as Error).message}\n\n${USAGE}`);
    return 2;
  }

  if (parsed.values.help) {
    console.log(USAGE);
    return 0;
  }

  const checkOnly = parsed.values.check === true;

  if (!checkOnly) {
    const status = compile(false);
    if (status !== 0) return status;
  }

  if (verify() === 0) return 0;

  if (checkOnly) {
    console.error('\n      dist/ does not match src/, and --check does not repair.');
    console.error('      fix: npm run build\n');
    return 1;
  }

  /**
   * The repair. Announced rather than silent: a build that quietly did something unusual teaches
   * nothing, and the next person to hit this should recognize the message from the diagnosis.
   */
  console.error('\n      tsc -b reported success and did not emit what src/ declares.');
  console.error('      Discarding tsconfig.tsbuildinfo and rebuilding from scratch — this is');
  console.error('      the documented repair, not a retry. See');
  console.error('      planning/evidence/tsc-b-trusts-buildinfo-DIAGNOSIS.txt\n');

  discardBuildInfo();
  const forced = compile(true);
  if (forced !== 0) return forced;

  if (verify() === 0) {
    console.log('\n      Recovered after discarding stale build info.\n');
    return 0;
  }

  console.error('\n      STILL WRONG after a forced rebuild. This is not a stale cache — the');
  console.error('      compiler emitted, and what it emitted does not match src/. Read the');
  console.error('      names above; something is excluded from the build that should not be.\n');
  return 1;
}

process.exit(main(process.argv.slice(2)));
