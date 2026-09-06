/**
 * `npm run validate:plans`
 *
 * The contract this file owns is the exit code: zero when every planning document declares what it
 * is and where it belongs, non-zero when one does not. Everything else it prints is for the person
 * who has to fix it, so it prints the path, the rule, the problem and the remedy.
 *
 * Modelled on `packages/content/src/cli/validate.ts` deliberately — same shape, same reporting,
 * run the same way from `pyquest/`. A second validator that behaves differently from the first is
 * a second thing to learn.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { checkPlans, formatIssues, type Doc } from './plans.ts';

/** The repository root, two levels up from `pyquest/scripts/`. */
const DEFAULT_ROOT = fileURLToPath(new URL('../..', import.meta.url));

const USAGE = `Usage: npm run validate:plans [-- --root <dir>]

Proves that the planning board says what it is: every document carries frontmatter with a kind and
a status from that kind's closed vocabulary, every status-required field is present, every
reference resolves to exactly one document of the kind it expects, and the directory and filename
prefix agree with the status.

  --root <dir>   directory holding planning/ (default: the repository)
  --help         this message

Exits 0 when the board is clean, 1 when it is not.`;

/**
 * `npm run --workspace` rewrites the CWD, so a relative `--root` would resolve somewhere the
 * author never meant. npm records the real invocation directory in `INIT_CWD`.
 */
function resolveRoot(root: string): string {
  return isAbsolute(root) ? root : resolve(process.env['INIT_CWD'] ?? process.cwd(), root);
}

/**
 * Every markdown document under `planning/`, README files excepted.
 *
 * A README is signage rather than a document of the corpus — it has no status, describes the
 * directory it sits in, and demanding frontmatter of it would be the validator misreading what it
 * is looking at.
 */
function collect(root: string, relative: string, into: Doc[]): void {
  const absolute = join(root, relative);
  if (!existsSync(absolute)) return;

  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    const child = `${relative}/${entry.name}`;
    if (entry.isDirectory()) {
      collect(root, child, into);
      continue;
    }
    if (!entry.name.endsWith('.md') || entry.name === 'README.md') continue;
    into.push({ path: child, text: readFileSync(join(root, child), 'utf8') });
  }
}

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

  if (!existsSync(join(root, 'planning'))) {
    console.error(`FAIL  no planning/ directory under ${root}\n      fix: pass --root, or run from the repository`);
    return 1;
  }

  const docs: Doc[] = [];
  collect(root, 'planning', docs);

  if (docs.length === 0) {
    console.error('FAIL  planning/ holds no documents\n      fix: check --root — this is almost certainly the wrong directory');
    return 1;
  }

  /** POSIX, absolute: the form a terminal will let you click. */
  const display = root.split('\\').join('/').replace(/\/+$/, '');
  const issues = checkPlans(docs);

  if (issues.length === 0) {
    console.log(formatIssues(issues, display));
    console.log(`    ${docs.length} documents`);
    return 0;
  }

  console.error(formatIssues(issues, display));
  return 1;
}

process.exit(main(process.argv.slice(2)));
