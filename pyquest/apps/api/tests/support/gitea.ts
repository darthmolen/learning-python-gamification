/**
 * A throwaway Gitea user, with a throwaway repository, on the Gitea that is already running.
 *
 * **Everything `local-repo` and `git-signal` do is server-side**, which is why these suites do not
 * wait for the learner's laptop. `infra/smoke.sh` step 4 already creates a real user, mints a real
 * token, creates a real repository and pushes a real commit, all over `localhost`; this is the
 * same sequence with the same two mechanisms — the `gitea` CLI for the things only an
 * administrator may do, the HTTP API for everything else — driven from a suite instead of a shell
 * script.
 *
 * **Nothing here touches an existing user or an existing repository.** The account name carries
 * the process id and the suite's label, the repository is created and deleted inside one suite,
 * and the account is purged in `afterAll` whether the suite passed or failed. A fixture that
 * leaves a user behind is a fixture that passes on the second run for the wrong reason.
 *
 * The probe is `docker inspect` rather than an HTTP call, and deliberately: it is synchronous, so
 * `describe.skipIf` can read it at collection time, and it checks the two things the fixture
 * actually needs — that the container is healthy, and that this process can run `docker exec`
 * against it. An HTTP 200 proves only the first.
 */

import { execFileSync } from 'node:child_process';
import { afterAll, beforeAll } from 'vitest';
import { infraEnv } from './database.ts';

const CONTAINER = 'pyquest-gitea';

/** Where this machine's Gitea answers. The port is `infra/.env`'s, never a guess. */
export function giteaBaseUrl(): string {
  return `http://localhost:${infraEnv()['GITEA_HTTP_PORT'] ?? '3080'}`;
}

function healthy(): boolean {
  try {
    const status = execFileSync(
      'docker',
      ['inspect', '-f', '{{.State.Health.Status}}', CONTAINER],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    return status.trim() === 'healthy';
  } catch {
    return false;
  }
}

/** Whether the Gitea suites can run at all. Reported once, loudly, rather than skipped in silence. */
export const HAVE_GITEA = healthy();

/** The `gitea` CLI, as the `git` user. It hard-refuses to run as root, which is `exec`'s default. */
function gitea(...args: string[]): string {
  return execFileSync('docker', ['exec', '-u', 'git', CONTAINER, 'gitea', ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

export interface GiteaFixture {
  readonly baseUrl: string;
  readonly owner: string;
  readonly repo: string;
  readonly token: string;
  /** Commit one file through the API. Returns the new commit's sha. */
  commit(path: string, text: string, message: string): Promise<string>;
  /** Tag whatever `main` currently points at. */
  tag(name: string): Promise<void>;
  /** An HTTP remote carrying the token, which is how the api clones (§6.4). */
  cloneUrl(): string;
}

async function api(
  fixture: { baseUrl: string; token: string },
  method: string,
  path: string,
  body?: unknown,
): Promise<unknown> {
  const response = await fetch(`${fixture.baseUrl}/api/v1${path}`, {
    method,
    headers: {
      Authorization: `token ${fixture.token}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) {
    throw new Error(`gitea ${method} ${path} -> ${response.status} ${await response.text()}`);
  }
  return response.status === 204 ? null : await response.json();
}

/** Gitea usernames are alphanumerics, dash, underscore and dot, and may not lead with a dash. */
function accountName(label: string): string {
  return `pqapi${process.pid}${label.replace(/[^a-z0-9]+/gi, '')}`.slice(0, 38).toLowerCase();
}

export interface GiteaFixtureOptions {
  /** `false` leaves the repository with no commits at all — the case the API must not treat as an error. */
  readonly autoInit?: boolean;
}

/**
 * Create the account and the repository, and hand back a way to remove both.
 *
 * Separate from `useGiteaRepo` because `scripts/e2e.ts` needs the same fixture and is not a vitest
 * suite: it has no `beforeAll` to hang one off. One creation sequence, two callers, rather than a
 * second copy of it in a script where nobody would notice it drifting.
 */
export async function createGiteaRepo(
  label: string,
  options: GiteaFixtureOptions = {},
): Promise<GiteaFixture & { destroy(): void }> {
  const owner = accountName(label);
  const repo = 'fixture';
  const baseUrl = giteaBaseUrl();

  gitea(
    'admin', 'user', 'create',
    '--username', owner,
    '--password', `Fixture-${process.pid}-Aa1`,
    '--email', `${owner}@localhost`,
    '--must-change-password=false',
  );
  const token = gitea(
    'admin', 'user', 'generate-access-token',
    '--username', owner,
    '--token-name', `suite-${Date.now()}`,
    '--scopes', 'write:repository,write:user',
    '--raw',
  ).replace(/\s+/g, '');

  const handle = { baseUrl, token };
  /**
   * Private, and that is not incidental. A public repository clones with any credential at all,
   * so a fixture that left it public would pass the "a bad token is refused" test by accident and
   * would prove nothing about the one path where the api's token actually matters.
   */
  await api(handle, 'POST', '/user/repos', {
    name: repo,
    auto_init: options.autoInit ?? true,
    default_branch: 'main',
    private: true,
  });

  return {
    baseUrl,
    owner,
    repo,
    token,
    commit: async (path, text, message) => {
      const created = (await api(handle, 'POST', `/repos/${owner}/${repo}/contents/${path}`, {
        content: Buffer.from(text, 'utf8').toString('base64'),
        message,
        branch: 'main',
      })) as { commit: { sha: string } };
      return created.commit.sha;
    },
    tag: async (name) => {
      await api(handle, 'POST', `/repos/${owner}/${repo}/tags`, { tag_name: name, target: 'main' });
    },
    cloneUrl: () => `${baseUrl.replace('://', `://${owner}:${token}@`)}/${owner}/${repo}.git`,
    /** Purged, not disabled. A fixture account that survives is one the next run reuses by accident. */
    destroy: () => {
      try {
        gitea('admin', 'user', 'delete', '--username', owner, '--purge');
      } catch {
        /* The caller's verdict is not this cleanup's to change. */
      }
    },
  };
}

/**
 * Register one suite's fixture: create the account, mint a token, create the repository, purge.
 *
 * Returns a getter rather than the fixture, because nothing exists until `beforeAll` has run and
 * a test that captured `undefined` at module load would fail for the wrong reason.
 */
export function useGiteaRepo(label: string, options: GiteaFixtureOptions = {}): () => GiteaFixture {
  let fixture: (GiteaFixture & { destroy(): void }) | undefined;

  beforeAll(async () => {
    fixture = await createGiteaRepo(label, options);
  }, 120_000);

  afterAll(() => {
    fixture?.destroy();
    fixture = undefined;
  }, 120_000);

  return () => {
    if (fixture === undefined) throw new Error('the gitea fixture is not open yet');
    return fixture;
  };
}
