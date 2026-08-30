/**
 * The migration runner, which is the one piece of this package that can lose data.
 *
 * The plan rules it ours — about forty lines, an advisory lock, one transaction per file, a
 * `schema_migrations` ledger — precisely so it is small enough to read and to attack. What is
 * asserted here is not that it works once, but that it survives the two things that actually
 * happen: being run again, and being run against a file that fails halfway.
 */

import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from 'pg';
import { describe, expect, it } from 'vitest';
import { MIGRATIONS_DIR, migrate, migrationFiles } from '../src/migrate.ts';
import { HAVE_DATABASE, useScratchDatabase } from './support/scratch-db.ts';

if (!HAVE_DATABASE) {
  console.warn(
    'packages/db: integration suites skipped — set TEST_DATABASE_URL, or bring up infra/ (docker compose up -d postgres) so infra/.env can be read.',
  );
}

describe('migrationFiles — the naming rule, which needs no database', () => {
  it('returns every migration in lexical order', () => {
    const files = migrationFiles();
    expect(files.length).toBeGreaterThan(0);
    expect([...files].sort()).toEqual(files);
  });

  it('accepts only NNNN-kebab-name.sql, because lexical order is the ordering', () => {
    for (const file of migrationFiles()) {
      expect(file).toMatch(/^\d{4}-[a-z0-9]+(-[a-z0-9]+)*\.sql$/);
    }
  });

  it('numbers every migration uniquely — two 0003s have no defined order', () => {
    const numbers = migrationFiles().map((f) => f.slice(0, 4));
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it('reads from the package root, not from dist — src and dist are both one level down', () => {
    const parts = MIGRATIONS_DIR.split(/[/\\]/);
    expect(parts.slice(-3)).toEqual(['packages', 'db', 'migrations']);
  });
});

describe.skipIf(!HAVE_DATABASE)('migrate — against a real Postgres', () => {
  const scratch = useScratchDatabase('migrate');

  it('applies every migration from empty and records each one', async () => {
    const applied = await migrate(scratch().client);
    expect(applied).toEqual(migrationFiles());

    const { rows } = await scratch().client.query('SELECT version FROM schema_migrations ORDER BY version');
    expect(rows.map((r) => (r as { version: string }).version)).toEqual(migrationFiles());
  });

  it('is a no-op the second time — the ledger is what makes re-running safe', async () => {
    const before = await scratch().client.query('SELECT version, applied_at FROM schema_migrations ORDER BY version');
    const applied = await migrate(scratch().client);
    expect(applied).toEqual([]);

    const after = await scratch().client.query('SELECT version, applied_at FROM schema_migrations ORDER BY version');
    expect(after.rows).toEqual(before.rows);
  });

  it('releases its advisory lock, so a second run is not a deadlock', async () => {
    const { rows } = await scratch().client.query(
      "SELECT count(*)::int AS held FROM pg_locks WHERE locktype = 'advisory' AND pid = pg_backend_pid()",
    );
    expect((rows[0] as { held: number }).held).toBe(0);
  });
});

describe.skipIf(!HAVE_DATABASE)('migrate — a file that fails halfway', () => {
  const scratch = useScratchDatabase('migrate_rollback');

  it('rolls the whole file back and does not record it', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pyquest-migrations-'));
    writeFileSync(join(dir, '0001-good.sql'), 'CREATE TABLE kept (id integer primary key);\n');
    writeFileSync(
      join(dir, '0002-halfway.sql'),
      'CREATE TABLE doomed (id integer primary key);\nINSERT INTO doomed (id) VALUES (1), (1);\n',
    );

    await expect(migrate(scratch().client, dir)).rejects.toThrow();

    const doomed = await scratch().client.query("SELECT to_regclass('public.doomed') AS t");
    expect((doomed.rows[0] as { t: string | null }).t).toBeNull();

    const kept = await scratch().client.query("SELECT to_regclass('public.kept') AS t");
    expect((kept.rows[0] as { t: string | null }).t).toBe('kept');

    const ledger = await scratch().client.query('SELECT version FROM schema_migrations ORDER BY version');
    expect(ledger.rows.map((r) => (r as { version: string }).version)).toEqual(['0001-good.sql']);
  });

  it('leaves no advisory lock behind after a failure — the next run must not hang', async () => {
    const { rows } = await scratch().client.query(
      "SELECT count(*)::int AS held FROM pg_locks WHERE locktype = 'advisory' AND pid = pg_backend_pid()",
    );
    expect((rows[0] as { held: number }).held).toBe(0);
  });
});

describe.skipIf(!HAVE_DATABASE)('migrate — the file and its ledger row commit together', () => {
  const scratch = useScratchDatabase('migrate_atomic');

  /**
   * This test exists because the obvious one did not work.
   *
   * Deleting `BEGIN`, `COMMIT` and `ROLLBACK` from the runner left the whole suite green: `pg`
   * sends a multi-statement string over the simple query protocol, which Postgres already wraps
   * in an implicit transaction, so a file that fails halfway rolls itself back either way. The
   * mutant survived, which per the test-filter rule means the suite was wrong rather than the
   * mutant being unfair.
   *
   * What the implicit transaction does *not* cover is the seam between the migration and the
   * ledger row that records it — two separate `query` calls. Without an explicit transaction the
   * schema can change and the ledger not say so, and the next run re-applies a migration that
   * already ran. `xmin` is the transaction that inserted a row, so comparing the two is a direct
   * observation of "these committed together" rather than a proxy for it.
   */
  it('writes both in one transaction — same xmin, not merely both present', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pyquest-migrations-'));
    writeFileSync(
      join(dir, '0001-probe.sql'),
      'CREATE TABLE probe (id integer primary key);\nINSERT INTO probe (id) VALUES (1);\n',
    );

    expect(await migrate(scratch().client, dir)).toEqual(['0001-probe.sql']);

    const { rows } = await scratch().client.query(
      `SELECT (SELECT xmin FROM probe WHERE id = 1)
            = (SELECT xmin FROM schema_migrations WHERE version = '0001-probe.sql') AS same`,
    );
    expect((rows[0] as { same: boolean }).same).toBe(true);
  });
});

describe.skipIf(!HAVE_DATABASE)('migrate — two runners at once', () => {
  const scratch = useScratchDatabase('migrate_concurrent');

  it('serialises on the advisory lock rather than racing to create the same table', async () => {
    const second = new Client({ connectionString: scratch().url });
    await second.connect();
    try {
      const results = await Promise.all([migrate(scratch().client), migrate(second)]);
      const total = [...results[0], ...results[1]];
      // Every migration applied exactly once, no matter which runner got there first.
      expect([...total].sort()).toEqual(migrationFiles());
    } finally {
      await second.end();
    }
  }, 60_000);
});
