/**
 * The one integration with Gitea, used by both of the verifiers that need it (§6.3, §6.4).
 *
 * **Read through the API, not by shelling out to git**, and that is the plan's ruling. The api
 * already needs a token so `local-repo` can clone over HTTP, so `git-signal` reading the log
 * through the same credential is one integration instead of two — one place where an expired
 * token shows up, one place that knows what an empty repository answers.
 *
 * `local-repo` is the exception the ruling names for itself: it *clones*, because §6.4 makes push
 * the verification mechanism and a checkout is what pytest needs to run against. That is still
 * this file's credential and this file's URL — see `cloneUrl` — so there is still one place that
 * knows how to reach Gitea.
 *
 * **Polled when a screen asks, never pushed.** A webhook needs a callback Gitea can reach, and the
 * machine on the other end of this is a laptop that sleeps with the lid shut. A signal that is
 * read at Submit is a signal that is correct whenever it is read; a webhook that fired into a
 * closed lid is a medal that never arrives and no way to tell why.
 *
 * **Which repository belongs to which player is configuration, and it is configuration because
 * §7 lets him choose the name.** `players` has `handle`, `display_name` and roles, and no column
 * for a repository — adding one is the `db` track's, and it should happen. Until then the mapping
 * arrives as `PLAYER_REPOS`, which is one line in `infra/.env` and is at least in the same place
 * as the token it is used with.
 */

const DEFAULT_BASE_URL = 'http://localhost:3080';

/** Where a Journal commit has to land for `git-signal: journal-entry` to see it. */
export const DEFAULT_JOURNAL_PATH = 'journal.md';

/** One repository on this Gitea. Owner is a Gitea account; name is the one the learner chose. */
export interface GiteaRepo {
  readonly owner: string;
  readonly name: string;
}

/** A commit, reduced to the three things a signal is decided on. */
export interface GiteaCommit {
  readonly sha: string;
  readonly message: string;
  /** ISO-8601, UTC. The committer's date, which is the one the server recorded. */
  readonly committedAt: string;
}

/** A tag and the commit it points at. Lightweight and annotated tags both arrive this way. */
export interface GiteaTag {
  readonly name: string;
  readonly sha: string;
  readonly committedAt: string;
}

export interface GiteaSettings {
  readonly baseUrl: string;
  readonly token: string;
  /** Player handle (lower-cased, as `citext` compares them) to repository. */
  readonly repos: ReadonlyMap<string, GiteaRepo>;
  readonly journalPath: string;
}

/**
 * Anything Gitea refused, with the status it refused it with.
 *
 * A distinct type rather than a bare `Error` because `POST /submit` has to tell "your repository
 * has no commits yet" from "the api's token expired". The first is a verdict a learner acts on;
 * the second is the parent's problem and must not be recorded as the learner's failure.
 */
export class GiteaError extends Error {
  readonly status: number | undefined;

  constructor(message: string, status?: number, options?: { cause?: unknown }) {
    super(message, options?.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'GiteaError';
    this.status = status;
  }
}

/**
 * `handle=owner/name` pairs, comma- or semicolon-separated. Anything unparseable is skipped.
 *
 * Skipped rather than fatal: a typo in one player's entry must not stop the api booting for the
 * other one, and the failure it does cause — that player's `local-repo` submit is refused with a
 * message naming the missing configuration — is the one that says what to fix.
 */
function parseRepos(raw: string | undefined): Map<string, GiteaRepo> {
  const repos = new Map<string, GiteaRepo>();
  if (raw === undefined) return repos;
  for (const entry of raw.split(/[,;]/)) {
    const match = /^\s*([^=\s]+)\s*=\s*([^/\s]+)\s*\/\s*([^/\s]+)\s*$/.exec(entry);
    if (match?.[1] === undefined || match[2] === undefined || match[3] === undefined) continue;
    repos.set(match[1].toLowerCase(), { owner: match[2], name: match[3] });
  }
  return repos;
}

/**
 * Read the settings, or `undefined` when this deployment has no Gitea configured.
 *
 * `undefined` rather than a throw, and rather than defaults: the api serves eleven routes that
 * have nothing to do with git, and refusing to boot because a token is missing would take the
 * whole campaign down over two quests in Area 2. What it must not do is pretend — a submit against
 * an unconfigured Gitea is refused with a stated reason and writes no `attempts` row, because a
 * scar for a verifier that never ran is a lie in the one record §3.5 says is never edited.
 */
export function giteaSettings(
  env: Record<string, string | undefined>,
): GiteaSettings | undefined {
  const token = env['GITEA_TOKEN'];
  if (token === undefined || token === '') return undefined;
  return {
    baseUrl: (env['GITEA_URL'] ?? DEFAULT_BASE_URL).replace(/\/+$/, ''),
    token,
    repos: parseRepos(env['PLAYER_REPOS']),
    journalPath: env['JOURNAL_PATH'] ?? DEFAULT_JOURNAL_PATH,
  };
}

export interface Gitea {
  readonly settings: GiteaSettings;
  /** The repository this player pushes to, or `undefined` when nobody has configured one. */
  repoFor(handle: string): GiteaRepo | undefined;
  /** An HTTP remote carrying the token. What `local-repo` clones and fetches from. */
  cloneUrl(repo: GiteaRepo): string;
  /** The log, newest first. An empty repository is `[]`, not a throw. */
  commits(repo: GiteaRepo, options?: { path?: string; limit?: number }): Promise<GiteaCommit[]>;
  tags(repo: GiteaRepo): Promise<GiteaTag[]>;
  /**
   * One file's text at the default branch's tip, or `undefined` when it is not there.
   *
   * **`undefined` rather than a throw, because "he has not written one yet" is the normal state
   * of week 1** — §5.6 starts the Journal in week 1 and only commits it at Area 2a, so for the
   * first eight weeks this correctly finds nothing. A screen that said "error" there would be
   * telling a learner something is broken when the truth is that he has not got there yet.
   */
  readFile(repo: GiteaRepo, path: string): Promise<string | undefined>;
}

/** Gitea's own shapes, named so the parsing below reads as parsing rather than as casting. */
interface RawCommit {
  sha?: unknown;
  commit?: { message?: unknown; committer?: { date?: unknown } };
}

interface RawTag {
  name?: unknown;
  commit?: { sha?: unknown; created?: unknown };
}

/** A `contents/` entry. `type` is `file` or `dir`, and asking for a directory is a caller bug. */
interface RawFile {
  type?: unknown;
  encoding?: unknown;
  content?: unknown;
}

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

/** How many commits are read. Two players and a 48-week campaign; a page is more than enough. */
const COMMIT_PAGE = 50;

export function gitea(settings: GiteaSettings): Gitea {
  async function request(path: string): Promise<{ status: number; body: unknown }> {
    let response: Response;
    try {
      response = await fetch(`${settings.baseUrl}/api/v1${path}`, {
        headers: { Authorization: `token ${settings.token}`, Accept: 'application/json' },
      });
    } catch (cause) {
      throw new GiteaError(`gitea at ${settings.baseUrl} did not answer`, undefined, { cause });
    }
    const text = await response.text();
    let body: unknown = null;
    try {
      body = text === '' ? null : JSON.parse(text);
    } catch {
      body = null;
    }
    return { status: response.status, body };
  }

  return {
    settings,

    repoFor: (handle) => settings.repos.get(handle.toLowerCase()),

    /**
     * Credentials in the URL, which is how a token authenticates a clone over HTTP.
     *
     * The owner is used as the username because Gitea accepts any username beside a token, and
     * using the account's own name keeps a `git remote -v` on the parent's machine readable.
     */
    cloneUrl: (repo) => {
      const url = new URL(settings.baseUrl);
      url.username = encodeURIComponent(repo.owner);
      url.password = encodeURIComponent(settings.token);
      return `${url.origin.replace('//', `//${url.username}:${url.password}@`)}/${repo.owner}/${repo.name}.git`;
    },

    /**
     * `409` is the empty repository, and it is the one status that is not a failure.
     *
     * A learner who presses Submit before his first commit gets "no signal yet", not an internal
     * error — and the day he is most likely to press it is exactly that day.
     *
     * **`404` means two different things and they are told apart rather than guessed at.** Gitea
     * answers `404 not found` for a repository that does not exist *and* for a path filter that
     * matched no commits — so a journal signal on a repository with no journal looks exactly like
     * a repository the token cannot see. Treating both as "no evidence" would tell a learner he
     * has not written his Journal when what actually happened is that the parent typoed
     * `PLAYER_REPOS`. So the repository is asked for by name, and only then is the empty answer
     * believed. One extra request, in the only case that needs it.
     */
    commits: async (repo, options = {}) => {
      const query = new URLSearchParams({ limit: String(options.limit ?? COMMIT_PAGE) });
      if (options.path !== undefined) query.set('path', options.path);
      const { status, body } = await request(
        `/repos/${repo.owner}/${repo.name}/commits?${query.toString()}`,
      );
      if (status === 409) return [];
      if (status === 404 && options.path !== undefined) {
        const { status: repoStatus } = await request(`/repos/${repo.owner}/${repo.name}`);
        if (repoStatus === 200) return [];
      }
      if (status !== 200 || !Array.isArray(body)) {
        throw new GiteaError(`gitea refused the log for ${repo.owner}/${repo.name}`, status);
      }
      return (body as RawCommit[]).map((raw) => ({
        sha: asString(raw.sha),
        message: asString(raw.commit?.message),
        committedAt: asString(raw.commit?.committer?.date),
      }));
    },

    tags: async (repo) => {
      const { status, body } = await request(`/repos/${repo.owner}/${repo.name}/tags?limit=100`);
      if (status === 409) return [];
      if (status !== 200 || !Array.isArray(body)) {
        throw new GiteaError(`gitea refused the tags for ${repo.owner}/${repo.name}`, status);
      }
      return (body as RawTag[]).map((raw) => ({
        name: asString(raw.name),
        sha: asString(raw.commit?.sha),
        committedAt: asString(raw.commit?.created),
      }));
    },

    /**
     * **Read at the tip, not at the commit that was paid for.** The Journal is a living document:
     * the template invites him to revisit an old entry — *"next time, or in this same entry if
     * you come back to it"* — and an improvement he makes in week 12 to what he wrote in week 3
     * should show. Reading each entry at its own stored sha would freeze every entry as it was
     * the night it was paid and silently discard every later edit.
     *
     * That leaves `commitSha` doing the job a ledger's sha is for: provenance for the **payment**,
     * not a pointer for the read. §6.4 makes push the verification mechanism, and what it verifies
     * is that the writing happened — not what it has said ever since.
     *
     * `content` arrives base64 whatever the file is; Gitea sends `encoding` alongside and this
     * trusts the field rather than the extension, because a journal that happened to be valid
     * base64 is not the interesting case but a journal that is not is.
     */
    readFile: async (repo, path) => {
      const encoded = path.split('/').map(encodeURIComponent).join('/');
      const { status, body } = await request(
        `/repos/${repo.owner}/${repo.name}/contents/${encoded}`,
      );
      if (status === 409) return undefined;
      if (status === 404) {
        const { status: repoStatus } = await request(`/repos/${repo.owner}/${repo.name}`);
        if (repoStatus === 200) return undefined;
        throw new GiteaError(`gitea has no repository ${repo.owner}/${repo.name}`, status);
      }
      if (status !== 200 || body === null || typeof body !== 'object') {
        throw new GiteaError(`gitea refused ${path} in ${repo.owner}/${repo.name}`, status);
      }
      const file = body as RawFile;
      if (asString(file.type) === 'dir' || Array.isArray(body)) {
        throw new GiteaError(`${path} in ${repo.owner}/${repo.name} is a directory`, status);
      }
      const content = asString(file.content);
      if (content === '') return '';
      if (asString(file.encoding, 'base64') !== 'base64') {
        throw new GiteaError(
          `gitea sent ${path} as ${asString(file.encoding)}, which this does not decode`,
          status,
        );
      }
      return Buffer.from(content, 'base64').toString('utf8');
    },
  };
}
