/**
 * `npm run pack:payload`
 *
 * The list of files that may go onto a learner's machine, one repository-relative path per line.
 *
 * ## Why this is a command rather than a list
 *
 * `tools/learner-setup/manifest.txt` was that list, hand-written, and the sessions-to-practices
 * rename walked out from under two of its eighteen entries. `pack.sh` validates before copying,
 * so the only tool that provisions a learner's machine exited 1 at step 1 and stayed that way
 * until somebody went looking for something else.
 *
 * The rules live in `../payload.ts` so they can be asserted against the real curriculum; this
 * file is arguments, an existence check and an exit code. `pack.sh` calls it because it is POSIX
 * sh and the marking is frontmatter — a second parser written in shell is the drift `validate.ts`
 * already refuses by name.
 */

import { existsSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { payloadPaths } from '../payload.ts';

const DEFAULT_ROOT = fileURLToPath(new URL('../../../../..', import.meta.url));

const USAGE = `Usage: npm run pack:payload [-- --root <dir>] [--out <file>]

Prints every repository-relative path that may travel to a learner's machine: the hand-written
toolchain entries in tools/learner-setup/manifest.txt, plus every curriculum file the tree itself
says a learner may have.

  --root <dir>   the repository (default: the one this package lives in)
  --out <file>   write there instead of stdout
  --help         this message

Exits 0 when every path it names exists, 1 when one does not.`;

/**
 * Resolve `--root` against the directory the command was typed in.
 *
 * `npm run --workspace` sets the CWD to the package, so a relative path would otherwise resolve
 * somewhere the author never meant. npm records the real invocation directory in `INIT_CWD`.
 */
const resolveRoot = (root: string): string =>
  isAbsolute(root) ? root : resolve(process.env['INIT_CWD'] ?? process.cwd(), root);

function main(argv: readonly string[]): number {
  let parsed;
  try {
    parsed = parseArgs({
      args: [...argv],
      options: {
        root: { type: 'string' },
        out: { type: 'string' },
        help: { type: 'boolean', default: false },
      },
      allowPositionals: false,
    });
  } catch (cause) {
    console.error(cause instanceof Error ? cause.message : String(cause));
    console.error(USAGE);
    return 2;
  }

  if (parsed.values.help) {
    console.log(USAGE);
    return 0;
  }

  /*
   * `resolve` is not decoration. `fileURLToPath(new URL('../../../../..'))` hands back a path
   * with a trailing separator, and the walk slices `root.length + 1` off an absolute path to
   * make it relative — so one extra character silently ate the first letter of every result and
   * the CLI went looking for `urriculum/`.
   */
  const root = resolve(
    parsed.values.root === undefined ? DEFAULT_ROOT : resolveRoot(parsed.values.root),
  );
  if (!existsSync(root)) {
    console.error(`pack:payload: no directory at ${root}`);
    return 2;
  }

  const paths = payloadPaths(root);

  // The same guarantee `pack.sh` gives at step 1, made here so it holds for the derived half
  // too. A half-copied payload looks finished and surfaces its gap on the other machine.
  const missing = paths.filter((p) => !existsSync(join(root, p)));
  if (missing.length > 0) {
    console.error('pack:payload: these paths do not exist:');
    for (const p of missing) console.error(`  ${p}`);
    return 1;
  }

  const text = paths.join('\n') + '\n';
  if (parsed.values.out === undefined) process.stdout.write(text);
  else writeFileSync(resolveRoot(parsed.values.out), text, 'utf8');

  // stderr, so `PATHS=$(npm run --silent pack:payload)` captures only the list.
  console.error(`pack:payload: ${paths.length} paths`);
  return 0;
}

process.exit(main(process.argv.slice(2)));
