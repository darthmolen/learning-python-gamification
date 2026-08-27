/**
 * `npm run validate:content`
 *
 * Spec §6.10. The contract this file owns is the exit code: zero when the content root will
 * load, non-zero when it will not. Everything else it prints is for the person who has to fix
 * the thing, so it prints the path, the id, the rule, the problem, and the remedy.
 */

import { existsSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkContent, formatIssues } from '../validate.ts';

/** The authored content root, four levels up from `packages/content/src/cli/`. */
/**
 * Resolve a user-supplied `--root` against the directory the command was typed in.
 *
 * `npm run --workspace @pyquest/content` sets the CWD to `packages/content`, so a relative path
 * would otherwise resolve somewhere the author never meant and report "no content root" for a
 * directory that plainly exists. npm records the real invocation directory in `INIT_CWD`; fall
 * back to `process.cwd()` when the script is run directly rather than through npm.
 */
function resolveRoot(root: string): string {
  return isAbsolute(root) ? root : resolve(process.env['INIT_CWD'] ?? process.cwd(), root);
}

const DEFAULT_ROOT = fileURLToPath(new URL('../../../../content', import.meta.url));

const USAGE = `Usage: npm run validate:content [-- --root <dir>]

Proves that a content root will load: every YAML file parses against the schema, the
prerequisite graph is acyclic, every prerequisite and concept tag resolves, every referenced
file exists, and no item tags vocabulary from a tier above its own.

  --root <dir>   content root to check (default: the repository's content/)
  --help         this message

Exits 0 when the root is clean, 1 when it is not.`;

/** "1 item", "2 items" — a report that cannot count reads like a report that cannot check. */
const plural = (n: number, noun: string): string => `${n} ${noun}${n === 1 ? '' : 's'}`;

function main(argv: readonly string[]): number {
  let parsed;
  try {
    parsed = parseArgs({
      args: [...argv],
      allowPositionals: true,
      options: { root: { type: 'string' }, help: { type: 'boolean', short: 'h' } },
    });
  } catch (error) {
    console.error(`${(error as Error).message}\n\n${USAGE}`);
    return 2;
  }

  if (parsed.values.help) {
    console.log(USAGE);
    return 0;
  }

  const supplied = parsed.values.root ?? parsed.positionals[0];
  const root = supplied === undefined ? DEFAULT_ROOT : resolveRoot(supplied);

  if (!existsSync(root)) {
    console.error(`FAIL  no content root at ${root}\n      fix: pass --root, or create the directory`);
    return 1;
  }

  const { items, manifests, issues } = checkContent(root);

  if (issues.length === 0) {
    console.log(formatIssues(issues, root));
    console.log(`    ${plural(items.length, 'item')} across ${plural(manifests.length, 'tier')}`);
    return 0;
  }

  console.error(formatIssues(issues, root));
  return 1;
}

process.exit(main(process.argv.slice(2)));
