/**
 * A scratch database per suite, and never the real one.
 *
 * The plan forbids mocking the database, and this is what makes obeying it safe: a suite that
 * truncated the progress database would destroy the one artifact §6.9 says cannot be regenerated,
 * and it would do it every time somebody typed `npx vitest`.
 *
 * **This duplicates `packages/db/tests/support/scratch-db.ts` on purpose.** That file belongs to
 * the `db` track and is not on that package's public surface; reaching into another track's test
 * internals by relative path is the coupling the track split exists to prevent, and it would
 * break this suite the next time they reorganise a directory they own. Sixty lines of overlap is
 * the cheaper of the two.
 *
 * The database name carries the process id so two runs cannot collide, and the drop is
 * unconditional in `afterAll` — a failing suite is exactly when the cleanup matters most.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';
import { afterAll, beforeAll } from 'vitest';
import { migrate } from '@pyquest/db';

/** This machine's credentials live in one place and it is not source control. */
const ENV_FILE = fileURLToPath(new URL('../../../../../infra/.env', import.meta.url));

function readInfraEnv(): Record<string, string> {
  try {
    const out: Record<string, string> = {};
    for (const line of readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
      const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (match?.[1] !== undefined && match[2] !== undefined) out[match[1]] = match[2];
    }
    return out;
  } catch {
    return {};
  }
}

/** The `postgres` maintenance database, which is where `CREATE DATABASE` has to be issued from. */
export function adminUrl(): string | undefined {
  const override = process.env['TEST_DATABASE_URL'];
  if (override !== undefined && override !== '') return override;

  const env = readInfraEnv();
  const user = env['POSTGRES_USER'];
  const password = env['POSTGRES_PASSWORD'];
  if (user === undefined || password === undefined) return undefined;

  const port = env['POSTGRES_PORT'] ?? '5433';
  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@127.0.0.1:${port}/postgres`;
}

/** Whether the integration suites can run at all. Reported once, loudly, rather than skipped in silence. */
export const HAVE_DATABASE = adminUrl() !== undefined;

function urlFor(database: string): string {
  const url = new URL(adminUrl() ?? '');
  url.pathname = `/${database}`;
  return url.toString();
}

async function withAdmin<T>(work: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: adminUrl() });
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

/** Postgres has no `DROP DATABASE ... $1`, so the name is built here and never taken from input. */
function scratchName(label: string): string {
  return `pyquest_api_${process.pid}_${label.replace(/[^a-z0-9]+/g, '_')}`;
}

export interface Scratch {
  readonly client: Client;
  readonly url: string;
  readonly name: string;
}

/**
 * Register the lifecycle for one suite: create, migrate, hand back, drop.
 *
 * Returns a getter rather than the client, because the client does not exist until `beforeAll`
 * has run and a test that captured `undefined` at module load would fail for the wrong reason.
 */
export function useMigratedDatabase(label: string): () => Scratch {
  const name = scratchName(label);
  let scratch: Scratch | undefined;

  beforeAll(async () => {
    await withAdmin(async (admin) => {
      await admin.query(`DROP DATABASE IF EXISTS "${name}"`);
      await admin.query(`CREATE DATABASE "${name}"`);
    });
    const client = new Client({ connectionString: urlFor(name) });
    await client.connect();
    await migrate(client);
    scratch = { client, url: urlFor(name), name };
  }, 60_000);

  afterAll(async () => {
    if (scratch !== undefined) await scratch.client.end();
    scratch = undefined;
    await withAdmin(async (admin) => {
      await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
    });
  }, 60_000);

  return () => {
    if (scratch === undefined) throw new Error('scratch database is not open yet');
    return scratch;
  };
}
