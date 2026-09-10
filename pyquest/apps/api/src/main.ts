/**
 * The boot. Content first, then the database, then the port.
 *
 * The order is the point. Content is validated before anything listens, so a bad content root is
 * a process that refuses to start with a report naming the file — not a server that answers
 * `/campaign` with a map that has a hole in it. §6.10 validates on load, and "on load" is here.
 *
 * ## Running it from source, and against which database
 *
 * Do not do this by hand — **`./infra/dev-stack.sh`** exists for it, and the reason it exists is
 * that one of the environment variables below is dangerous to get wrong:
 *
 *     CONTENT_ROOT   the repository itself, so briefs are read live rather than from a bind mount
 *     DATABASE_URL   ***pyquest_dev***, never POSTGRES_DB — see below
 *     API_PORT       3083, production keeps 3081
 *     API_HOST       127.0.0.1, because on this host there is no container to hide behind
 *     SPOOL_ROOT     a host directory; the runner container cannot see it, so submissions queue
 *
 * **`DATABASE_URL` is the one that matters.** This process signs people in, records attempts,
 * awards medals and writes journal entries. Pointed at the production database it does content
 * review by mutating the learner's real progress — and §6.7 puts progress in Postgres precisely
 * because it is the half that cannot be regenerated from git. `dev-stack.sh` refuses to start
 * when the two names match, which is a refusal rather than a warning on purpose.
 *
 * Content reloads are not uniform, and `infra/README.md` has the table: prose (`read`, `howTo`)
 * is `readFileSync` per request and needs only a browser refresh, while `items`, `manifests` and
 * `practices` are built once by `loadContentRoot` below and need this process restarted.
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
 * Which interfaces to accept on.
 *
 * `0.0.0.0` is right in the container and wrong on the host, and the two cases are genuinely
 * different rather than one being a mistake. In the container, loopback is the *container's* own
 * and invisible from outside it (§6.1), so binding it would publish a port nothing could reach.
 * On this host there is no such indirection: the dev api (`infra/dev-stack.sh`, port 3083) is for
 * a browser and a `curl` on this machine only, and binding every interface would put an api with
 * no Gitea token and a throwaway database on the LAN beside the real one.
 *
 * Defaulted rather than required, so `compose/api.yml` keeps working with nothing added to it.
 */
const HOST = process.env['API_HOST'] ?? '0.0.0.0';

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
   * Ten of the twelve routes have nothing to do with git; refusing to start over a missing
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

  /** Defaults to `0.0.0.0`, because the container's loopback is invisible from the host (§6.1). */
  await app.listen({ port: PORT, host: HOST });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
