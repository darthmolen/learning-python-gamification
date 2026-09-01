/**
 * `git-signal`, read off a real repository on the Gitea that is running.
 *
 * The four signals are not four features. Each one asks the same question — *is there evidence in
 * the history, dated after the last time you asked?* — of a different part of the history, and the
 * tests below are written to fail if that question stops being asked. A verifier that answers yes
 * to any repository is a medal for owning a repository, which is the failure mode with the most
 * gravity here: it is the one nobody notices, because it looks like success.
 */

import { describe, expect, it, vi } from 'vitest';
import { gitea } from '../src/gitea.ts';
import type { Gitea } from '../src/gitea.ts';
import { readSignal } from '../src/gitsignal.ts';
import { HAVE_GITEA, useGiteaRepo } from './support/gitea.ts';

/**
 * These tests drive a real Gitea container over HTTP — create a user, mint a token, push a
 * commit, clone it back — and vitest's default `testTimeout` is 5000ms, which was never enough.
 *
 * Measured per test on an idle machine, `checkout.test.ts`: 631ms, 1484ms, 1611ms, 2411ms,
 * 2829ms, 3177ms, 3319ms. The worst case spends two thirds of the default budget with nothing
 * else running, so under the parallel load of a full run they went over at 5437ms, 5553ms and
 * 6220ms. That is the same work taking the time it takes, not a race: every file passes its own
 * label to `useGiteaRepo` and gets its own account and repository.
 *
 * `useGiteaRepo` already gives its `beforeAll` 120 seconds. Somebody measured this setup and
 * budgeted for it — for the hook, and not for the tests it sets up. This finishes that thought.
 *
 * The ceiling is not a duration. A suite that passes in eighteen seconds still passes in
 * eighteen seconds; the number only decides when vitest gives up. Deliberately not `retry`,
 * which would hide a real failure the moment there is one.
 */
vi.setConfig({ testTimeout: 30_000, hookTimeout: 120_000 });


/**
 * A first attempt: this quest has been shown nothing, so anything in the history counts.
 *
 * This replaced an `AFTER_EVERYTHING` timestamp — an hour in the future, standing for "nothing
 * has happened since". That worked only while both sides of the comparison came from one clock,
 * and they never did: see `firstUnclaimed` in `gitsignal.ts`.
 */
const NOTHING_CLAIMED = { claimed: new Set<string>() };

describe.skipIf(!HAVE_GITEA)('a repository with no commits at all', () => {
  const fixture = useGiteaRepo('signalempty', { autoInit: false });

  const client = (): ReturnType<typeof gitea> =>
    gitea({
      baseUrl: fixture().baseUrl,
      token: fixture().token,
      repos: new Map(),
      journalPath: 'journal.md',
    });
  const repo = (): { owner: string; name: string } => ({
    owner: fixture().owner,
    name: fixture().repo,
  });

  it('satisfies no signal, and says so rather than erroring', async () => {
    for (const signal of ['commit', 'push', 'journal-entry', 'tag'] as const) {
      const evidence = await readSignal(client(), repo(), signal, NOTHING_CLAIMED);
      expect(evidence.satisfied, signal).toBe(false);
      expect(evidence.sha, signal).toBeNull();
    }
  });
});

describe.skipIf(!HAVE_GITEA)('a repository with a history', () => {
  const fixture = useGiteaRepo('signal');

  const client = (): ReturnType<typeof gitea> =>
    gitea({
      baseUrl: fixture().baseUrl,
      token: fixture().token,
      repos: new Map(),
      journalPath: 'journal.md',
    });
  const repo = (): { owner: string; name: string } => ({
    owner: fixture().owner,
    name: fixture().repo,
  });

  it('a commit signal is the head of the default branch', async () => {
    const sha = await fixture().commit('notes.txt', 'something\n', 'wrote something');
    const evidence = await readSignal(client(), repo(), 'commit', NOTHING_CLAIMED);
    expect(evidence.satisfied).toBe(true);
    expect(evidence.sha).toBe(sha);
  });

  /**
   * The plan's "commits since the last recorded attempt", asserted.
   *
   * Without this the verifier is satisfied by history the player already used, which is the same
   * medal paid twice — and worse, it would pass a re-submit on a quest he was told to go and do
   * something for.
   */
  it('is not satisfied by history this quest has already been paid against', async () => {
    const first = await readSignal(client(), repo(), 'commit', NOTHING_CLAIMED);
    expect(first.satisfied).toBe(true);
    expect(first.sha).not.toBeNull();

    /* The same repository, one submission later, with nothing new pushed. */
    const again = await readSignal(client(), repo(), 'commit', {
      claimed: new Set([first.sha as string]),
    });
    expect(again.satisfied).toBe(false);
    expect(again.sha).toBeNull();
  });

  /**
   * `push` and `commit` read the same evidence, and that is the honest answer rather than a
   * shortcut. The api sees a bare repository on the server: a commit it can see is a commit that
   * was pushed, because there is no other way for one to arrive. §6.4 is exactly that sentence —
   * if you did not push it, it did not happen — so a `push` signal that looked for something else
   * would be looking for something the server cannot observe.
   */
  it('reads push the same way, because a commit the server can see was pushed (§6.4)', async () => {
    const asCommit = await readSignal(client(), repo(), 'commit', NOTHING_CLAIMED);
    const asPush = await readSignal(client(), repo(), 'push', NOTHING_CLAIMED);
    expect(asPush.satisfied).toBe(true);
    expect(asPush.sha).toBe(asCommit.sha);
  });

  it('a journal signal is not satisfied by a commit somewhere else', async () => {
    const evidence = await readSignal(client(), repo(), 'journal-entry', NOTHING_CLAIMED);
    expect(evidence.satisfied).toBe(false);
  });

  it('a journal signal is satisfied by a commit that touches the journal', async () => {
    const sha = await fixture().commit('journal.md', 'day one, it worked\n', 'the journal');
    const evidence = await readSignal(client(), repo(), 'journal-entry', NOTHING_CLAIMED);
    expect(evidence.satisfied).toBe(true);
    expect(evidence.sha).toBe(sha);
  });

  it('a tag signal is not satisfied by a repository with no tags', async () => {
    const evidence = await readSignal(client(), repo(), 'tag', NOTHING_CLAIMED);
    expect(evidence.satisfied).toBe(false);
  });

  it('a tag signal is satisfied by a tag, and names it', async () => {
    await fixture().tag('v1');
    const evidence = await readSignal(client(), repo(), 'tag', NOTHING_CLAIMED);
    expect(evidence.satisfied).toBe(true);
    expect(evidence.reason).toContain('v1');
  });

  it('a tag this quest has already been paid against is not new evidence', async () => {
    const first = await readSignal(client(), repo(), 'tag', NOTHING_CLAIMED);
    expect(first.satisfied).toBe(true);

    const again = await readSignal(client(), repo(), 'tag', {
      claimed: new Set([first.sha as string]),
    });
    expect(again.satisfied).toBe(false);
  });
});

/* -------------------------------------------------------------------------------------------
 * What counts as new — with no clock in it
 * ----------------------------------------------------------------------------------------- */

/**
 * These run against a stub rather than the container, and that is the point of them.
 *
 * The question "is this evidence new?" has nothing to do with the network, and the bug that
 * prompted this block could not be reproduced reliably against a real Gitea — it surfaced about
 * one run in seven, because it depended on how far apart two machines' clocks had drifted. A
 * stub makes the disagreement exact and the test deterministic.
 */
const stub = (log: readonly { sha: string; committedAt: string }[], tags: readonly { name: string; sha: string; committedAt: string }[] = []): Gitea => ({
  settings: { baseUrl: 'http://gitea.invalid', token: 'stub', repos: new Map(), journalPath: 'journal.md' },
  repoFor: () => undefined,
  cloneUrl: () => '',
  commits: async () => log.map((c) => ({ ...c, message: 'a commit' })),
  tags: async () => [...tags],
  readFile: async () => undefined,
});

const REPO = { owner: 'ada', name: 'quests' };

describe('what counts as evidence the quest has not already been paid for', () => {
  /**
   * **The bug this phase exists for**, made deterministic.
   *
   * `committedAt` is written by git on the learner's machine. The old baseline was
   * `attempts.attempted_at`, written by `now()` in Postgres. Those are two clocks on two
   * machines, and they were measured 5,900 ms apart — so a commit made *before* an attempt
   * carried a later timestamp than the attempt did, stale history read as fresh evidence, and
   * the quest paid for work nobody had done. §6.4 makes push the verification mechanism; this
   * is the code that decides whether a push happened.
   *
   * The commit below genuinely predates the attempt. Only a comparison of two clocks says
   * otherwise.
   */
  it('is not fooled by two clocks that disagree', async () => {
    const evidence = await readSignal(stub([{ sha: 'aaa1111', committedAt: '2026-09-01T12:00:00.000Z' }]), REPO, 'commit', {
      claimed: new Set(['aaa1111']),
    });
    expect(evidence.satisfied).toBe(false);
  });

  it('pays for a commit the quest has not been shown', async () => {
    const evidence = await readSignal(
      stub([
        { sha: 'bbb2222', committedAt: '2026-09-01T12:00:00.000Z' },
        { sha: 'aaa1111', committedAt: '2026-09-01T11:00:00.000Z' },
      ]),
      REPO,
      'commit',
      { claimed: new Set(['aaa1111']) },
    );
    expect(evidence.satisfied).toBe(true);
    expect(evidence.sha).toBe('bbb2222');
  });

  /**
   * **The hole in plain set membership**, which is why the fix reads log position rather than
   * asking whether a sha has been seen.
   *
   * The first attempt is satisfied by the newest commit and records that one sha. Every commit
   * *under* it is equally unrecorded — so a re-submit with no new work finds an unclaimed
   * ancestor and pays again. The backlog item sketched membership; the log is ordered, and the
   * order is what makes the answer right.
   */
  it('does not pay for an ancestor of a commit it has already been shown', async () => {
    const evidence = await readSignal(
      stub([
        { sha: 'ccc3333', committedAt: '2026-09-01T12:00:00.000Z' },
        { sha: 'bbb2222', committedAt: '2026-09-01T11:00:00.000Z' },
        { sha: 'aaa1111', committedAt: '2026-09-01T10:00:00.000Z' },
      ]),
      REPO,
      'commit',
      { claimed: new Set(['ccc3333']) },
    );
    expect(evidence.satisfied).toBe(false);
  });

  it('counts everything on a first attempt, because none of it has been claimed', async () => {
    const evidence = await readSignal(stub([{ sha: 'aaa1111', committedAt: '2026-09-01T12:00:00.000Z' }]), REPO, 'commit', {
      claimed: new Set(),
    });
    expect(evidence.satisfied).toBe(true);
  });

  it('reads a tag the same way', async () => {
    const shown = await readSignal(stub([], [{ name: 'v1', sha: 'tag1111', committedAt: '2026-09-01T12:00:00.000Z' }]), REPO, 'tag', {
      claimed: new Set(['tag1111']),
    });
    expect(shown.satisfied).toBe(false);

    const fresh = await readSignal(
      stub([], [
        { name: 'v2', sha: 'tag2222', committedAt: '2026-09-01T13:00:00.000Z' },
        { name: 'v1', sha: 'tag1111', committedAt: '2026-09-01T12:00:00.000Z' },
      ]),
      REPO,
      'tag',
      { claimed: new Set(['tag1111']) },
    );
    expect(fresh.satisfied).toBe(true);
    expect(fresh.reason).toContain('v2');
  });
});
