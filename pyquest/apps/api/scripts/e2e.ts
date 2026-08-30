/**
 * The whole loop, once, against everything real: Submit to medal.
 *
 * Not a vitest suite, deliberately. It needs Docker, and a suite that fails on a machine with no
 * Docker running fails for a reason that has nothing to do with the code — so `npx vitest run`
 * does not collect it and this is run by hand:
 *
 *     npm run e2e --workspace @pyquest/api
 *
 * What it proves that the suites do not. `tests/dispatcher.test.ts` writes the verdict file the
 * runner would write, and `apps/runner/tests/` runs the sandbox inside the container — the two
 * halves meet at a JSON file whose shape both pin, but neither one has ever seen the other. This
 * closes that: a real submission goes into a real Postgres, the real runner container picks it up
 * with `--network none` and a read-only root, and a real medal comes out priced by the engine.
 *
 * It found the bug that mattered most on this track. Every suite was green and the api would not
 * boot: Node's `--experimental-strip-types` refuses a TypeScript parameter property, which no
 * typecheck and no test can see because both run through a real compiler.
 */

import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { migrate } from '@pyquest/db';
import { medalDelta } from '@pyquest/engine';
import { loadContentRoot } from '../src/content.ts';
import { Spool, pump } from '../src/dispatcher.ts';
import { buildServer } from '../src/server.ts';

const ADA = '11111111-1111-1111-1111-111111111111';
const QUEST = 'a0-name-tag';
const SOLUTION = 'name = input("Name? ")\nprint(f"Welcome, {name}!")\n';

const CONTENT_ROOT = fileURLToPath(new URL('../../../../content', import.meta.url));
const ADMIN_URL = process.env['E2E_DATABASE_URL'];

function say(step: string): void {
  console.log(`\n=== ${step}`);
}

/**
 * Run the real runner image over the spool, once.
 *
 * Every flag the compose fragment sets is repeated here, and that repetition is the point: a check
 * that ran the sandbox with the network on, as root, or on a writable root filesystem would be
 * checking a boundary this project does not deploy.
 */
function runTheRunner(spoolRoot: string): void {
  execFileSync(
    'docker',
    [
      'run', '--rm',
      '--network', 'none',
      '--memory', '512m',
      '--pids-limit', '256',
      '--read-only',
      '--user', '10001:10001',
      '--security-opt', 'no-new-privileges:true',
      '--cap-drop', 'ALL',
      '--tmpfs', '/tmp:size=64m,mode=1777',
      '-v', `${spoolRoot}:/spool`,
      'pyquest-runner:local',
      'python', '-c',
      'from pathlib import Path; from pyquest_runner.worker import Spool, serve; '
        // The workspace root is `/tmp`, the tmpfs — never under `/spool`, which is the volume the
        // api shares. See `worker.Spool` for what happened when it was.
        + 'serve(Spool(Path("/spool"), Path("/tmp")), forever=False)',
    ],
    { stdio: 'inherit' },
  );
}

async function main(): Promise<void> {
  if (ADMIN_URL === undefined) {
    throw new Error('set E2E_DATABASE_URL to a scratch database this script may create and drop');
  }

  const spoolRoot = join(tmpdir(), `pyquest-e2e-${process.pid}`);
  mkdirSync(spoolRoot, { recursive: true });
  const spool = new Spool(spoolRoot);
  spool.ensure();

  const db = new Pool({ connectionString: ADMIN_URL });
  try {
    say('migrating and seeding');
    await migrate(db);
    await db.query('DELETE FROM runner_jobs');
    await db.query('DELETE FROM attempts');
    await db.query('DELETE FROM quest_medals');
    await db.query(
      `INSERT INTO players (id, handle, display_name) VALUES ($1, 'ada', 'Ada')
       ON CONFLICT (id) DO NOTHING`,
      [ADA],
    );

    say('loading content and starting the api');
    const content = loadContentRoot(CONTENT_ROOT);
    const app = buildServer({ content, db });
    await app.ready();

    say('submitting');
    const submitted = await app.inject({
      method: 'POST',
      url: `/api/players/${ADA}/quests/${QUEST}/submit`,
      payload: { type: 'hidden-tests', code: SOLUTION },
    });
    const { jobId } = submitted.json() as { jobId: string };
    console.log(`job ${jobId} queued`);

    say('dispatching to the spool');
    console.log(await pump(db, content, spool));

    say('running the real runner container');
    runTheRunner(spoolRoot);

    say('collecting the verdict');
    console.log(await pump(db, content, spool));

    say('what the api now says');
    const polled = await app.inject({ method: 'GET', url: `/api/jobs/${jobId}` });
    console.log(polled.body);

    const { rows } = await db.query('SELECT medal, xp_awarded FROM quest_medals');
    const expected = medalDelta(content.item(QUEST)?.dc ?? 0, [], 'cleared');
    console.log('medals:', rows, 'expected xp:', expected);

    const state = (polled.json() as { state: string }).state;
    if (state !== 'passed') throw new Error(`expected passed, got ${state}`);
    if (rows.length !== 1) throw new Error('expected exactly one medal');
    if (polled.body.includes('_run_with_input')) throw new Error('the hidden tests leaked (§6.3)');

    say('OK — Submit to medal, nothing mocked');
    await app.close();
  } finally {
    await db.end();
    rmSync(spoolRoot, { recursive: true, force: true });
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
