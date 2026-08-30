/**
 * `local-repo` — the api pulls the learner's repository and runs the quest's tests against it.
 *
 * **Push is the verification mechanism (§6.4), and every decision in this file is that sentence
 * applied.** The api tests what was pushed and never a working tree it cannot see, so:
 *
 * - It **clones over HTTP** with the token `gitea.ts` already holds. One credential, one place.
 * - On every run after the first it **fetches and hard-resets to `origin/main`, never merges.**
 *   A merge would leave a local commit in the history and its files in the tree, and the api
 *   would then grade a file that exists on no server anywhere. The plan rules this and it is
 *   worth stating why: reset means the checkout is a view of the remote or it is nothing.
 * - It **cleans untracked files**, for the same reason one directory down. A file somebody
 *   dropped in the checkout is not a file he pushed.
 *
 * **The checkout is per player and it is reused.** Cloning forty megabytes on every Submit is a
 * button that takes a minute; a fetch is a button that takes a second. What makes reuse safe is
 * the reset above, and that is exactly the pair a test has to hold together — which
 * `tests/checkout.test.ts` does, in the test that pushes a commit *after* the clone.
 *
 * **The token never reaches an error message.** It is on a command line and `git` echoes the
 * remote back in most of what it says, so every failure is re-worded through `redact` before it
 * becomes a `CheckoutError`. A credential in a log is a credential.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** The branch §6.4 means by "what was pushed". Overridable per submission, defaulted here. */
export const DEFAULT_REF = 'main';

export interface CheckoutResult {
  /** Where the working tree is, on the api's disk. */
  readonly path: string;
  /** The ref that was asked for. Recorded on the attempt beside the sha. */
  readonly ref: string;
  /** The commit the tree is at. This is the thing the medal is granted against. */
  readonly sha: string;
}

export interface CheckoutOptions {
  /** The workspace root. One directory per player lives under it. */
  readonly root: string;
  /** The player's handle. `/workspaces/<handle>/`, as the plan writes it. */
  readonly handle: string;
  /** An HTTP remote carrying the token — `gitea.cloneUrl`. */
  readonly cloneUrl: string;
  readonly ref?: string | undefined;
}

/** Anything git refused, with the credential taken out of it. */
export class CheckoutError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options?.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'CheckoutError';
  }
}

/**
 * Remove anything that looks like credentials in a URL.
 *
 * Blunt on purpose. This runs on text git produced, which may hold the remote several times over
 * and in forms this file did not construct, so a targeted replacement of the one token string
 * would miss a re-encoded copy of it. Everything between `//` and `@` goes.
 */
function redact(text: string): string {
  return text.replace(/\/\/[^/@\s]*@/g, '//');
}

/**
 * `git`, with the parts of a developer's machine that would make it interactive turned off.
 *
 * `GIT_TERMINAL_PROMPT=0` and an empty credential helper matter more here than they look: with a
 * credential manager installed, a bad token makes `git` open a dialog and the api hangs holding
 * an HTTP request open until somebody notices. A refused clone must fail, promptly, in the
 * process that asked for it.
 */
function git(args: string[], cwd?: string): string {
  try {
    return execFileSync(
      'git',
      ['-c', 'credential.helper=', '-c', 'core.askPass=', '-c', 'advice.detachedHead=false', ...args],
      {
        encoding: 'utf8',
        ...(cwd === undefined ? {} : { cwd }),
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          GIT_TERMINAL_PROMPT: '0',
          GIT_ASKPASS: '',
          GCM_INTERACTIVE: 'never',
          GIT_CONFIG_NOSYSTEM: '1',
        },
      },
    );
  } catch (cause) {
    const detail =
      cause instanceof Error && 'stderr' in cause && typeof cause.stderr === 'string'
        ? cause.stderr
        : String(cause);
    throw new CheckoutError(`git ${redact(args.join(' '))} failed: ${redact(detail).trim()}`);
  }
}

/**
 * Bring the player's checkout to `origin/<ref>`, cloning it if it is not there yet.
 *
 * Synchronous, because it is `git` and `git` is a process: an async wrapper would add a promise
 * around a blocking call without making anything concurrent. Submit waits for it, which is the
 * honest thing for a request whose answer depends on a network fetch to do.
 */
export function syncCheckout(options: CheckoutOptions): CheckoutResult {
  const ref = options.ref ?? DEFAULT_REF;
  const path = join(options.root, options.handle);

  mkdirSync(options.root, { recursive: true });

  if (!existsSync(join(path, '.git'))) {
    /** A half-finished clone from a previous failure is not a checkout; it is in the way. */
    rmSync(path, { recursive: true, force: true });
    git(['clone', '--quiet', options.cloneUrl, path]);
  } else {
    /**
     * The remote is re-pointed on every run, because the token can be rotated and a checkout
     * holding yesterday's credential fails in a way that reads like the learner's fault.
     */
    git(['-C', path, 'remote', 'set-url', 'origin', options.cloneUrl]);
    git(['-C', path, 'fetch', '--quiet', '--prune', 'origin']);
  }

  /** Reset, not merge — see the header. Then clean, so nothing untracked survives into a run. */
  git(['-C', path, 'reset', '--hard', '--quiet', `origin/${ref}`]);
  git(['-C', path, 'clean', '-qfdx']);

  return { path, ref, sha: git(['-C', path, 'rev-parse', 'HEAD']).trim() };
}

/**
 * Write the tree at the checkout's HEAD into a tar the runner can open.
 *
 * A tar rather than a directory copy, and that is what makes the handoff cross the boundary
 * cleanly: one file appears in the spool, atomically, and the runner unpacks it onto its own
 * tmpfs. Copying a tree into a shared volume would put the learner's files on a disk the api
 * writes to, which is the disk fill §6.6's tmpfs exists to contain.
 *
 * `.git` is not in it. The tests are about what he wrote, and the history is several times the
 * size of the work.
 *
 * `subPath` is the quest's optional `path` — the subdirectory of his repository the project lives
 * in. It limits what crosses into the sandbox and keeps the paths as the repository has them, so
 * a test that says `where-the-file-lives/run_me.py` still finds it.
 */
export function exportTree(checkout: CheckoutResult, tarPath: string, subPath?: string): number {
  git([
    '-C',
    checkout.path,
    'archive',
    '--format=tar',
    '-o',
    tarPath,
    checkout.sha,
    ...(subPath === undefined ? [] : [subPath]),
  ]);
  return statSync(tarPath).size;
}
