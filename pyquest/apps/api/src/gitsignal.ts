/**
 * `git-signal` — the verifier that watches the history instead of running anything (§6.3).
 *
 * It exists because three of Area 2's win conditions are not programs. *Make a commit.* *Get it
 * onto the server.* *Write the entry down.* There is no test to run against those; the evidence
 * is the repository, and the repository is on a Gitea the api can already read.
 *
 * **One question, asked of four different parts of the history.** Is there evidence, dated after
 * the last time this quest was attempted? That framing is the plan's — "commits since the last
 * recorded attempt" — and it is what makes a second Submit on unchanged history fail rather than
 * pay a second time.
 *
 * **`commit` and `push` read the same evidence, and that is the honest answer.** The api is
 * looking at a bare repository on a server. A commit it can see is a commit that was pushed,
 * because there is no other way for one to have arrived — which is §6.4's sentence exactly: if
 * you did not push it, it did not happen. A `push` signal that looked for something else would be
 * looking for something the server cannot observe, and the quest that uses it (`a2-it-is-
 * somewhere-else`) is asking precisely whether his work is somewhere else. It is, or the api
 * cannot see it.
 *
 * **`journal-entry` is a path, not a commit message convention.** An earlier reading had it
 * matching "the quest's convention" in the message as well. Nothing in `GitSignalVerifierSchema`
 * carries a pattern, so the convention would have been one only this file knew — a rule the
 * learner is graded against and cannot read, which §5.3's "the brief says what passing is" rules
 * out. The path is `JOURNAL_PATH` and it is one line of configuration next to the token.
 */

import type { Gitea, GiteaRepo } from './gitea.ts';

/** The four `git-signal` kinds, as `@pyquest/content` spells them. */
export type GitSignal = 'commit' | 'push' | 'journal-entry' | 'tag';

/**
 * What the history said, and enough of why for the `attempts` row to be worth reading later.
 *
 * `sha` is the commit the medal was granted against. It is recorded because §3.5 keeps attempts
 * forever, and an attempt that says "passed" without saying against what is a record that cannot
 * be checked — which is the same as no record.
 */
export interface SignalEvidence {
  readonly satisfied: boolean;
  readonly reason: string;
  readonly sha: string | null;
}

export interface SignalOptions {
  /**
   * ISO-8601. Only evidence dated strictly after this counts.
   *
   * Supplied by the api from the last `attempts` row on this quest, and absent on a first
   * submission — where anything in the history counts, because none of it has been claimed yet.
   */
  readonly since?: string | undefined;
}

/** Strictly after, and `undefined` means everything counts. Both halves matter. */
function newer(committedAt: string, since: string | undefined): boolean {
  if (since === undefined || since === '') return true;
  const at = Date.parse(committedAt);
  const bound = Date.parse(since);
  if (Number.isNaN(at) || Number.isNaN(bound)) return false;
  return at > bound;
}

const nothing = (reason: string): SignalEvidence => ({ satisfied: false, reason, sha: null });

/**
 * Ask the history one question and report what it said.
 *
 * Never throws for an empty repository: `gitea.commits` turns Gitea's `409 Git Repository is
 * empty` into no commits, because a learner pressing Submit before his first commit is the most
 * likely person to press it and "no signal yet" is the answer he needs.
 */
export async function readSignal(
  client: Gitea,
  repo: GiteaRepo,
  signal: GitSignal,
  options: SignalOptions,
): Promise<SignalEvidence> {
  const { since } = options;

  if (signal === 'tag') {
    const tags = await client.tags(repo);
    const fresh = tags.find((tag) => newer(tag.committedAt, since));
    if (fresh === undefined) {
      return nothing(
        tags.length === 0
          ? 'this repository has no tags yet'
          : 'every tag on this repository was already there last time',
      );
    }
    return { satisfied: true, reason: `the tag ${fresh.name} is on the repository`, sha: fresh.sha };
  }

  const path = signal === 'journal-entry' ? client.settings.journalPath : undefined;
  const log = await client.commits(repo, path === undefined ? {} : { path });
  const fresh = log.find((entry) => newer(entry.committedAt, since));

  if (fresh === undefined) {
    if (signal === 'journal-entry') {
      return nothing(
        `no commit has touched ${client.settings.journalPath} since the last time you asked`,
      );
    }
    return nothing(
      log.length === 0
        ? 'this repository has no commits on it yet'
        : 'nothing has been pushed since the last time you asked',
    );
  }

  return {
    satisfied: true,
    reason:
      signal === 'journal-entry'
        ? `${client.settings.journalPath} was written in ${fresh.sha.slice(0, 7)}`
        : `${fresh.sha.slice(0, 7)} is on the server`,
    sha: fresh.sha,
  };
}
