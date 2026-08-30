/**
 * The migration runner — ours, on purpose, and about forty lines of it.
 *
 * `node-pg-migrate` is a good library and it earns its keep on teams that need
 * down-migrations, several environments and a rollback story. This campaign has one database,
 * one household, and a restore rehearsal (`infra/restore.sh`) that is a better rollback than any
 * migration tool's. What it buys instead is that the person this repository is *for* can read the
 * whole thing in one sitting — he opens this repository at Boss 7.
 *
 * The mechanism, in full:
 *
 * - `migrations/NNNN-kebab-name.sql`, applied in lexical order, forward-only.
 * - A Postgres advisory lock, so two runners cannot both decide a file is unapplied.
 * - One transaction per file. Postgres does transactional DDL, so a file that fails halfway
 *   leaves nothing — not half a table, and not a ledger row claiming it succeeded.
 * - `schema_migrations(version, applied_at)` is the ledger, and it is the only reason running
 *   the job twice is safe.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The migrations directory, found relative to this module rather than to the process's cwd.
 *
 * `src/` and `dist/` are both exactly one level under the package root, so this resolves to the
 * same directory whether the caller loaded the TypeScript (vitest, aliased to source) or the
 * compiled output (the compose job, `node dist/cli.js`). A cwd-relative path would have been two
 * different directories depending on where `npm` was invoked.
 */
export const MIGRATIONS_DIR = fileURLToPath(new URL('../migrations', import.meta.url));

/**
 * An arbitrary but fixed key. Any runner against any database in this project takes this one
 * lock; the number itself means nothing beyond "not zero, and not one somebody else would pick".
 */
const ADVISORY_LOCK_KEY = 4781252119n;

/** `0007-add-bounties.sql`. Zero-padded so lexical order and numeric order are the same order. */
const MIGRATION_NAME = /^\d{4}-[a-z0-9]+(-[a-z0-9]+)*\.sql$/;

const LEDGER = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version    text        PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`;

/**
 * The narrowest thing this module needs. `pg`'s `Client` and `PoolClient` both satisfy it, and
 * naming the shape rather than the class keeps `packages/db` from asserting which one a caller
 * has to hold.
 */
export interface Queryable {
  query(queryText: string, values?: unknown[]): Promise<{ rows: unknown[] }>;
}

/** Thrown with the failing file named, and the driver's error chained rather than swallowed. */
export class MigrationError extends Error {
  constructor(
    readonly version: string,
    options: { cause: unknown },
  ) {
    super(`migration ${version} failed and was rolled back`, options);
    this.name = 'MigrationError';
  }
}

/**
 * Every migration in the directory, in the order they must be applied.
 *
 * A `.sql` file that does not match the naming rule is an error rather than a skip: lexical order
 * *is* the ordering, so a file named `add-bounties.sql` has no defined place in it, and silently
 * ignoring it is how a table goes missing on the machine that ran the job second.
 */
export function migrationFiles(dir: string = MIGRATIONS_DIR): string[] {
  const files = readdirSync(dir).filter((name) => name.endsWith('.sql'));

  for (const name of files) {
    if (!MIGRATION_NAME.test(name)) {
      throw new Error(`migration "${name}" is not NNNN-kebab-name.sql — lexical order is the ordering`);
    }
  }

  const numbers = files.map((name) => name.slice(0, 4));
  const duplicate = numbers.find((n, i) => numbers.indexOf(n) !== i);
  if (duplicate !== undefined) {
    throw new Error(`two migrations are numbered ${duplicate} — their order is undefined`);
  }

  return files.sort();
}

/**
 * Apply every unapplied migration. Returns the versions this call applied, which is empty on the
 * second run and is what makes "the job is safe to re-run" observable rather than asserted.
 */
export async function migrate(client: Queryable, dir: string = MIGRATIONS_DIR): Promise<string[]> {
  const files = migrationFiles(dir);

  await client.query(`SELECT pg_advisory_lock(${ADVISORY_LOCK_KEY})`);
  try {
    await client.query(LEDGER);
    const { rows } = await client.query('SELECT version FROM schema_migrations');
    const done = new Set(rows.map((row) => (row as { version: string }).version));

    const applied: string[] = [];
    for (const version of files) {
      if (done.has(version)) continue;

      await client.query('BEGIN');
      try {
        await client.query(readFileSync(join(dir, version), 'utf8'));
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
        await client.query('COMMIT');
      } catch (cause) {
        await client.query('ROLLBACK');
        throw new MigrationError(version, { cause });
      }
      applied.push(version);
    }
    return applied;
  } finally {
    // In `finally` so that a failure does not park the lock until the connection closes. A runner
    // that dies holding it is survivable; one that stays connected and holding it is a hang.
    await client.query(`SELECT pg_advisory_unlock(${ADVISORY_LOCK_KEY})`);
  }
}
