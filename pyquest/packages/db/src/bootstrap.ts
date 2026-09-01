/**
 * `npm run bootstrap` — arm the one way into a household that has nobody in it.
 *
 * **This is a script and not an endpoint, and that is the whole design.** An api that hands out a
 * bootstrap secret is an api that hands out the household: anybody who can reach the port could
 * ask for one and become the DM. Running a command on the machine the api runs on is a permission
 * the filesystem already models, and it is the same permission that could read the database
 * directly — so it grants nothing that was not already granted.
 *
 * It prints the secret **once**, to stdout, and stores only a digest. There is no way to read it
 * back; losing it before it is spent means running this again, which is allowed precisely because
 * that is somebody who mislaid a printout rather than somebody minting a spare key.
 *
 * `--status` says whether the seat is already taken, so the answer to "did I already do this?" is
 * not "try it and find out".
 */

import { armBootstrap, bootstrapConsumed } from './accounts.ts';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const USAGE = `Usage: npm run bootstrap --workspace @pyquest/db [-- --status]

Arms the single-use secret that claims the DM seat, and prints it once.

  --status   say whether the seat has already been claimed, and change nothing
  --help     this message

The secret is stored as a digest and cannot be read back. Spend it with the sign-in screen,
or with POST /api/session/bootstrap.`;

export async function main(argv: readonly string[]): Promise<number> {
  if (argv.includes('--help')) {
    console.log(USAGE);
    return 0;
  }

  const connectionString = process.env['DATABASE_URL'];
  if (connectionString === undefined || connectionString === '') {
    console.error('DATABASE_URL is not set — see infra/.env');
    return 1;
  }

  const { Client } = await import('pg');
  const client = new Client({ connectionString });
  await client.connect();
  try {
    if (argv.includes('--status')) {
      const consumed = await bootstrapConsumed(client);
      console.log(
        consumed
          ? 'bootstrap: already claimed. The DM seat is taken; use the Console to make more accounts.'
          : 'bootstrap: not claimed. Run this without --status to arm a secret.',
      );
      return 0;
    }

    const secret = await armBootstrap(client);
    if (secret === undefined) {
      console.error(
        'bootstrap: refused. This household already has a DM, and re-arming would be a second way in.',
      );
      console.error('           Make further accounts from the Console, or reset a password there.');
      return 1;
    }

    /*
     * Printed to stdout, alone on its line, so it can be piped. Everything else goes to stderr
     * for the same reason: `npm run bootstrap | clip` should put the secret on the clipboard and
     * not a paragraph of advice.
     */
    console.error('bootstrap: this secret is shown once and is not stored. Spend it at sign-in.');
    console.log(secret);
    console.error('bootstrap: it claims the DM seat, and only the first use counts.');
    return 0;
  } finally {
    await client.end();
  }
}

/** True only when node was pointed at this file. An import must not arm anything. */
const invokedDirectly =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  try {
    process.exitCode = await main(process.argv.slice(2));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
