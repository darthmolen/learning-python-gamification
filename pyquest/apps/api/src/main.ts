/**
 * The boot. Content first, then the database, then the port.
 *
 * The order is the point. Content is validated before anything listens, so a bad content root is
 * a process that refuses to start with a report naming the file — not a server that answers
 * `/campaign` with a map that has a hole in it. §6.10 validates on load, and "on load" is here.
 */

import { Pool } from 'pg';
import { loadContentRoot } from './content.ts';
import { Spool, pump } from './dispatcher.ts';
import { gitea, giteaSettings } from './gitea.ts';
import { buildServer } from './server.ts';

const CONTENT_ROOT = process.env['CONTENT_ROOT'] ?? '/content';
const DATABASE_URL = process.env['DATABASE_URL'];
const SPOOL_ROOT = process.env['SPOOL_ROOT'] ?? '/spool';
/** One clone per player, reused between submissions and hard-reset on each. See `checkout.ts`. */
const WORKSPACE_ROOT = process.env['WORKSPACE_ROOT'] ?? '/workspaces';
const PORT = Number(process.env['API_PORT'] ?? 3081);

/**
 * How often the queue is drained and verdicts are recorded.
 *
 * A timer rather than a second process. There is one api, one runner and two players; a job
 * daemon would be infrastructure this household has no use for, and `runner_jobs`' lease already
 * covers the case where this process dies holding a claim.
 */
const PUMP_MS = 500;

async function main(): Promise<void> {
  if (DATABASE_URL === undefined || DATABASE_URL === '') {
    throw new Error('DATABASE_URL is required — see infra/compose/api.yml');
  }

  const content = loadContentRoot(CONTENT_ROOT);
  const db = new Pool({ connectionString: DATABASE_URL });
  const spool = new Spool(SPOOL_ROOT);
  spool.ensure();

  /**
   * Gitea is optional, and the api boots without it.
   *
   * Eleven of the thirteen routes have nothing to do with git; refusing to start over a missing
   * token would take the whole campaign down for the sake of two quests in Area 2. What the api
   * must not do is pretend — without this, `local-repo` and `git-signal` refuse with a stated
   * reason and record nothing, because a scar for a verifier that never ran is a lie in the one
   * record §3.5 says is never edited.
   */
  const settings = giteaSettings(process.env);
  const client = settings === undefined ? undefined : gitea(settings);

  const app = buildServer({
    content,
    db,
    logger: true,
    spool,
    workspaceRoot: WORKSPACE_ROOT,
    ...(client === undefined ? {} : { gitea: client }),
  });
  app.log.info(
    { root: content.root, items: content.items.length, areas: content.manifests.length },
    'content loaded',
  );

  if (client === undefined) {
    app.log.warn('no GITEA_TOKEN: local-repo and git-signal will refuse rather than guess');
  }

  /**
   * The pump never rejects the process. A transient database error must not take the api down
   * with it — the http side stays up, the log says what happened, and the next tick tries again.
   * A submission stuck behind one bad tick is recoverable; an api that exited is not.
   */
  const timer = setInterval(() => {
    void pump(db, content, spool).catch((error: unknown) => {
      app.log.error({ err: error }, 'the runner pump failed this tick');
    });
  }, PUMP_MS);
  timer.unref();

  /** `0.0.0.0` because the container's loopback is invisible from the host (§6.1). */
  await app.listen({ port: PORT, host: '0.0.0.0' });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
