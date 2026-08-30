/**
 * The entry point `infra/compose/migrate.yml` runs: apply every unapplied migration, then exit.
 *
 * A job, not a service (§6.1). It runs to completion and stops, which is why the compose fragment
 * sets `restart: "no"` — a migration job that restarts on failure re-applies migrations in a loop.
 *
 * It prints what it applied, including when that is nothing. "already up to date" is the answer a
 * person needs on the day they are not sure whether the job ran, and silence is not that answer.
 */

import { Client } from 'pg';
import { migrate } from './migrate.ts';

async function main(): Promise<void> {
  const connectionString = process.env['DATABASE_URL'];
  if (connectionString === undefined || connectionString === '') {
    throw new Error('DATABASE_URL is not set — see infra/compose/migrate.yml');
  }

  const client = new Client({ connectionString });
  await client.connect();
  try {
    const applied = await migrate(client);
    if (applied.length === 0) {
      console.log('migrate: already up to date');
    } else {
      for (const version of applied) console.log(`migrate: applied ${version}`);
    }
  } finally {
    await client.end();
  }
}

try {
  await main();
} catch (error) {
  // Chained, not swallowed: the failing migration's name is in the MigrationError and the driver's
  // complaint is its cause, and a job that prints only "failed" sends someone to the logs anyway.
  console.error(error);
  process.exitCode = 1;
}
