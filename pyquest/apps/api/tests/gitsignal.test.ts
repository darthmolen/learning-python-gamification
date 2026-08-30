/**
 * `git-signal`, read off a real repository on the Gitea that is running.
 *
 * The four signals are not four features. Each one asks the same question — *is there evidence in
 * the history, dated after the last time you asked?* — of a different part of the history, and the
 * tests below are written to fail if that question stops being asked. A verifier that answers yes
 * to any repository is a medal for owning a repository, which is the failure mode with the most
 * gravity here: it is the one nobody notices, because it looks like success.
 */

import { describe, expect, it } from 'vitest';
import { gitea } from '../src/gitea.ts';
import { readSignal } from '../src/gitsignal.ts';
import { HAVE_GITEA, useGiteaRepo } from './support/gitea.ts';

/** Later than anything the fixture can have committed. "Nothing has happened since." */
const AFTER_EVERYTHING = new Date(Date.now() + 3_600_000).toISOString();

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
      const evidence = await readSignal(client(), repo(), signal, {});
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
    const evidence = await readSignal(client(), repo(), 'commit', {});
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
  it('is not satisfied by history older than the last attempt', async () => {
    const evidence = await readSignal(client(), repo(), 'commit', { since: AFTER_EVERYTHING });
    expect(evidence.satisfied).toBe(false);
    expect(evidence.sha).toBeNull();
  });

  /**
   * `push` and `commit` read the same evidence, and that is the honest answer rather than a
   * shortcut. The api sees a bare repository on the server: a commit it can see is a commit that
   * was pushed, because there is no other way for one to arrive. §6.4 is exactly that sentence —
   * if you did not push it, it did not happen — so a `push` signal that looked for something else
   * would be looking for something the server cannot observe.
   */
  it('reads push the same way, because a commit the server can see was pushed (§6.4)', async () => {
    const asCommit = await readSignal(client(), repo(), 'commit', {});
    const asPush = await readSignal(client(), repo(), 'push', {});
    expect(asPush.satisfied).toBe(true);
    expect(asPush.sha).toBe(asCommit.sha);
  });

  it('a journal signal is not satisfied by a commit somewhere else', async () => {
    const evidence = await readSignal(client(), repo(), 'journal-entry', {});
    expect(evidence.satisfied).toBe(false);
  });

  it('a journal signal is satisfied by a commit that touches the journal', async () => {
    const sha = await fixture().commit('journal.md', 'day one, it worked\n', 'the journal');
    const evidence = await readSignal(client(), repo(), 'journal-entry', {});
    expect(evidence.satisfied).toBe(true);
    expect(evidence.sha).toBe(sha);
  });

  it('a tag signal is not satisfied by a repository with no tags', async () => {
    const evidence = await readSignal(client(), repo(), 'tag', {});
    expect(evidence.satisfied).toBe(false);
  });

  it('a tag signal is satisfied by a tag, and names it', async () => {
    await fixture().tag('v1');
    const evidence = await readSignal(client(), repo(), 'tag', {});
    expect(evidence.satisfied).toBe(true);
    expect(evidence.reason).toContain('v1');
  });

  it('a tag older than the last attempt is not new evidence', async () => {
    const evidence = await readSignal(client(), repo(), 'tag', { since: AFTER_EVERYTHING });
    expect(evidence.satisfied).toBe(false);
  });
});
