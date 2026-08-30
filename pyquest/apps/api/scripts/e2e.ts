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
import { gitea } from '../src/gitea.ts';
import { buildServer } from '../src/server.ts';
import { createGiteaRepo, HAVE_GITEA } from '../tests/support/gitea.ts';

const ADA = '11111111-1111-1111-1111-111111111111';
const QUEST = 'a0-name-tag';
const SOLUTION = 'name = input("Name? ")\nprint(f"Welcome, {name}!")\n';

/**
 * The second loop: `local-repo`, from a push to a medal.
 *
 * `a2-where-the-file-lives` is graded against a repository rather than against a file, so the
 * files below are the quest's win condition written out — a project directory, a script that
 * prints the line the brief names, and notes long enough to be three real sentences. There is
 * deliberately **no** `run_me.py` at the repository root, because the quest's last assertion is
 * that the same command fails one directory up. That is the lesson, and a second copy would
 * quietly delete it.
 */
const REPO_QUEST = 'a2-where-the-file-lives';
const REPO_FILES: ReadonlyArray<readonly [string, string]> = [
  ['where-the-file-lives/run_me.py', 'print("I am running from a file.")\n'],
  [
    'where-the-file-lives/NOTES.md',
    'The file lives in where-the-file-lives/run_me.py. I first ran it from the top of the\n' +
      'repository and python said it could not find it. Running it from inside its own\n' +
      'directory worked, because a relative path is relative to where you are standing.\n',
  ],
];

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

    await localRepoLoop(db, content, spool, spoolRoot);
  } finally {
    await db.end();
    rmSync(spoolRoot, { recursive: true, force: true });
  }
}

/**
 * The same loop for `local-repo`, and it is a different loop in every part that can break.
 *
 * `hidden-tests` hands the runner a string the client typed. This hands it a **tar the api built
 * from a clone of a repository on a real Gitea** — so it is the only thing that has ever proven
 * the api and the runner agree about that file: that `git archive` writes an archive the runner's
 * `tarfile` will open under `filter="data"`, that the paths inside it survive the trip, and that
 * pytest run with its cwd at the unpacked root finds the project where the quest's specification
 * looks for it. Every one of those is a seam between two suites that each pass alone.
 *
 * It is also the §6.4 claim end to end: the api graded what was pushed, and nothing else was ever
 * on this machine to grade.
 */
async function localRepoLoop(
  db: Pool,
  content: ReturnType<typeof loadContentRoot>,
  spool: Spool,
  spoolRoot: string,
): Promise<void> {
  if (!HAVE_GITEA) {
    say('SKIPPED — local-repo needs the gitea container; start the stack to run this half');
    return;
  }

  say('creating a throwaway gitea account and repository');
  const fixture = await createGiteaRepo('e2e');
  const workspaceRoot = join(tmpdir(), `pyquest-e2e-work-${process.pid}`);

  try {
    for (const [path, text] of REPO_FILES) {
      await fixture.commit(path, text, `e2e: ${path}`);
    }
    console.log(`pushed ${REPO_FILES.length} files to ${fixture.owner}/${fixture.repo}`);

    await db.query('DELETE FROM runner_jobs');
    await db.query('DELETE FROM attempts');
    await db.query('DELETE FROM quest_medals');

    const app = buildServer({
      content,
      db,
      spool,
      workspaceRoot,
      gitea: gitea({
        baseUrl: fixture.baseUrl,
        token: fixture.token,
        repos: new Map([['ada', { owner: fixture.owner, name: fixture.repo }]]),
        journalPath: 'journal.md',
      }),
    });
    await app.ready();

    try {
      say('submitting a local-repo quest — the api clones, resets to origin/main and exports');
      const submitted = await app.inject({
        method: 'POST',
        url: `/api/players/${ADA}/quests/${REPO_QUEST}/submit`,
        payload: { type: 'local-repo' },
      });
      if (submitted.statusCode !== 202) {
        throw new Error(`submit answered ${submitted.statusCode}: ${submitted.body}`);
      }
      const { jobId } = submitted.json() as { jobId: string };
      console.log(`job ${jobId} queued`);

      say('dispatching the tree to the spool');
      console.log(await pump(db, content, spool));

      say('running the real runner container over a repository it has never seen');
      runTheRunner(spoolRoot);

      say('collecting the verdict');
      console.log(await pump(db, content, spool));

      const polled = await app.inject({ method: 'GET', url: `/api/jobs/${jobId}` });
      console.log(polled.body);

      const { rows } = await db.query('SELECT medal, xp_awarded FROM quest_medals');
      const expected = medalDelta(content.item(REPO_QUEST)?.dc ?? 0, [], 'cleared');
      console.log('medals:', rows, 'expected xp:', expected);

      const state = (polled.json() as { state: string }).state;
      if (state !== 'passed') throw new Error(`expected passed, got ${state}`);
      if (rows.length !== 1) throw new Error('expected exactly one medal');

      /** The attempt has to name the commit it graded, or §3.5's record cannot be checked. */
      const attempts = await db.query('SELECT detail FROM attempts');
      const sha = (attempts.rows[0] as { detail: { localRepo?: { sha?: string } } } | undefined)
        ?.detail.localRepo?.sha;
      if (sha === undefined || !/^[0-9a-f]{40}$/.test(sha)) {
        throw new Error(`the attempt does not name the commit it graded: ${String(sha)}`);
      }
      console.log(`graded against ${sha}`);

      /** §6.3 on the verifier that pulls a whole repository: the specification is still secret. */
      if (polled.body.includes('MIN_NOTES_CHARACTERS')) {
        throw new Error('the hidden tests leaked (§6.3)');
      }

      say('OK — push to medal, against a real repository and a real sandbox');
    } finally {
      await app.close();
    }
  } finally {
    fixture.destroy();
    rmSync(workspaceRoot, { recursive: true, force: true });
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
