/**
 * A scratch database per suite, and never the real one.
 *
 * `infra/restore.sh` already establishes the pattern with `pyquest_scratch`: a rehearsal runs
 * against a throwaway copy so that a mistake costs nothing. The same reasoning applies here with
 * more force — a suite that truncates the progress database destroys the one artifact §6.9 says
 * cannot be regenerated, and it would do it every time somebody typed `npx vitest`.
 *
 * The name carries the process id so two runs cannot collide, and the drop runs in `afterAll`,
 * which vitest executes whether the suite passed or failed. A suite that leaves a database behind
 * every time it fails fills a disk on the day you can least afford it.
 *
 * **Why not `globalSetup`.** The plan named one, and `pyquest/vitest.config.ts` is no longer this
 * track's file: it declares the `packages` project inline, so there is nowhere to hang a global
 * hook without editing a file another track owns. Per-suite hooks give the same lifecycle — create,
 * migrate, hand over the URL, drop — at the cost of one database per file rather than one per run.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';
import { afterAll, beforeAll } from 'vitest';

/**
 * This machine's credentials live in one place and it is not source control. `infra/.env` is
 * gitignored, which is why it is read rather than duplicated.
 */
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

/**
 * The `postgres` maintenance database, which is where `CREATE DATABASE` has to be issued from.
 * `TEST_DATABASE_URL` wins so that a different stack can be pointed at without editing anything.
 */
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
  const safe = label.replace(/[^a-z0-9]+/g, '_');
  return `pyquest_test_${process.pid}_${safe}`;
}

export interface Scratch {
  /** A connected client on the scratch database. Valid between `beforeAll` and `afterAll`. */
  readonly client: Client;
  readonly url: string;
  readonly name: string;
}

/**
 * Register the lifecycle for one suite: create, connect, hand back, drop.
 *
 * Returns a getter rather than the client, because the client does not exist until `beforeAll`
 * has run and a test that captured `undefined` at module load would fail for the wrong reason.
 */
export function useScratchDatabase(label: string): () => Scratch {
  const name = scratchName(label);
  let scratch: Scratch | undefined;

  beforeAll(async () => {
    await withAdmin(async (admin) => {
      await admin.query(`DROP DATABASE IF EXISTS "${name}"`);
      await admin.query(`CREATE DATABASE "${name}"`);
    });
    const client = new Client({ connectionString: urlFor(name) });
    await client.connect();
    scratch = { client, url: urlFor(name), name };
  }, 60_000);

  afterAll(async () => {
    // Unconditional. A failing suite is exactly when the cleanup matters most.
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
