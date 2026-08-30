/**
 * A scratch database with the migrations already applied, which is what most suites want.
 *
 * The second `beforeAll` registers after the first, and vitest runs them in registration order,
 * so the migration runs against a database that exists.
 */

import { beforeAll } from 'vitest';
import { migrate } from '../../src/migrate.ts';
import { useScratchDatabase, type Scratch } from './scratch-db.ts';

export function useMigratedDatabase(label: string): () => Scratch {
  const scratch = useScratchDatabase(label);
  beforeAll(async () => {
    await migrate(scratch().client);
  }, 60_000);
  return scratch;
}

/** Run some statements and undo them, whatever happened. Postgres rolls DDL back too. */
export async function inRollback(
  scratch: Scratch,
  work: () => Promise<void>,
): Promise<void> {
  await scratch.client.query('BEGIN');
  try {
    await work();
  } finally {
    await scratch.client.query('ROLLBACK');
  }
}
