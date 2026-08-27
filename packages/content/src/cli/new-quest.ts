/**
 * `npm run new:quest`
 *
 * Spec §6.10: more than 150 times, and it should take two minutes. Two consequences shape this
 * file. It takes flags, so it can be driven from a script or a session log rather than only by
 * hand. And when a flag is missing at an interactive terminal it asks, rather than printing
 * usage at someone who is three keystrokes from finished.
 *
 * The scaffolding itself lives in `../scaffold.ts`, which is where the tests point: a CLI that
 * owns its own logic is a CLI whose logic can only be tested through a subprocess.
 */

import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ScaffoldError, scaffoldQuest, type VerifierType } from '../scaffold.ts';
import { TierSchema, type Kind, type Tier } from '../schema.ts';

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

const USAGE = `Usage: npm run new:quest -- --id <id> --title <title> --tier <0-7> --concepts <a,b,c>

Scaffolds a content item and everything it references, wired so that
\`npm run validate:content\` passes with no hand-editing.

  --id <id>            kebab-case, e.g. t3-recipe-book        (required)
  --title <title>      what the player sees                   (required)
  --tier <0-7>         which tier it belongs to               (required)
  --concepts <a,b,c>   comma-separated tags from concepts.ts  (required)
  --kind <k>           quest | patrol | boss                  (default: quest)
  --dc <5-30>          difficulty class, spec §5.1            (default: 10)
  --requires <a,b>     prerequisite ids, comma-separated
  --verifier <v>       hidden-tests | local-repo | peer-signoff | git-signal
                       (default: peer-signoff for a boss, hidden-tests up to tier 1,
                        local-repo from tier 2)
  --themes <a;b;c>     semicolon-separated boss framings, §5.2 (default: three placeholders)
  --root <dir>         content root to write into             (default: the repository's content/)
  --force              overwrite files that already exist
  --help               this message

Omit a required flag at an interactive terminal and it will ask.`;

const list = (value: string | undefined, separator = ','): string[] =>
  (value ?? '')
    .split(separator)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

async function main(argv: readonly string[]): Promise<number> {
  let parsed;
  try {
    parsed = parseArgs({
      args: [...argv],
      options: {
        id: { type: 'string' },
        title: { type: 'string' },
        tier: { type: 'string' },
        concepts: { type: 'string' },
        kind: { type: 'string' },
        dc: { type: 'string' },
        requires: { type: 'string' },
        verifier: { type: 'string' },
        themes: { type: 'string' },
        root: { type: 'string' },
        force: { type: 'boolean' },
        help: { type: 'boolean', short: 'h' },
      },
    });
  } catch (error) {
    console.error(`${(error as Error).message}\n\n${USAGE}`);
    return 2;
  }

  const values = { ...parsed.values };
  if (values.help) {
    console.log(USAGE);
    return 0;
  }

  /* Ask for what is missing, but only where there is someone to answer. */
  const missing = (['id', 'title', 'tier', 'concepts'] as const).filter((key) => !values[key]);
  if (missing.length > 0) {
    if (!process.stdin.isTTY) {
      console.error(
        `missing required argument${missing.length === 1 ? '' : 's'}: ${missing.map((m) => `--${m}`).join(', ')}\n\n${USAGE}`,
      );
      return 2;
    }
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
      for (const key of missing) {
        values[key] = (await rl.question(`--${key}: `)).trim();
      }
    } finally {
      rl.close();
    }
  }

  const tier = TierSchema.safeParse(Number(values.tier));
  if (!tier.success) {
    console.error(`--tier must be a whole number from 0 to 7, not ${JSON.stringify(values.tier)}`);
    return 2;
  }

  try {
    const { created } = scaffoldQuest({
      root: values.root === undefined ? DEFAULT_ROOT : resolveRoot(values.root),
      id: (values.id ?? '').trim(),
      title: (values.title ?? '').trim(),
      tier: tier.data as Tier,
      concepts: list(values.concepts),
      kind: values.kind as Kind | undefined,
      dc: values.dc === undefined ? undefined : Number(values.dc),
      requires: list(values.requires),
      verifier: values.verifier as VerifierType | undefined,
      themes: values.themes === undefined ? undefined : list(values.themes, ';'),
      force: values.force ?? false,
    });

    console.log('created:');
    for (const path of created) console.log(`  ${path}`);
    console.log('\nnext:  npm run validate:content');
    return 0;
  } catch (error) {
    if (error instanceof ScaffoldError) {
      console.error(`nothing was written: ${error.message}`);
      return 1;
    }
    throw error;
  }
}

process.exit(await main(process.argv.slice(2)));
