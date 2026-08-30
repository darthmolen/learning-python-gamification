/**
 * The Gitea integration, against the Gitea that is running.
 *
 * **Read through the API rather than by shelling out to git**, which is the plan's ruling and not
 * a preference: the api already needs a token for `local-repo`'s clone, and one integration is
 * cheaper to reason about than two. It is also the only half of `git-signal` that could be done
 * either way, so saying which is the point.
 *
 * Nothing here is mocked. A mocked Gitea would have passed every one of these tests while telling
 * us nothing about the two answers that actually matter — what an empty repository returns, and
 * what a repository that is not there returns — because both are things the real server decides
 * and neither is what a naive stub would do.
 */

import { describe, expect, it } from 'vitest';
import { GiteaError, gitea, giteaSettings } from '../src/gitea.ts';
import { HAVE_GITEA, useGiteaRepo } from './support/gitea.ts';

describe('giteaSettings', () => {
  it('is undefined without a token, because a verifier with no credential is not configured', () => {
    expect(giteaSettings({ GITEA_URL: 'http://localhost:3080' })).toBeUndefined();
  });

  it('maps a player handle to the repository he chose the name of', () => {
    const settings = giteaSettings({
      GITEA_TOKEN: 'tok',
      GITEA_URL: 'http://localhost:3080',
      PLAYER_REPOS: 'steve=steve/journal, son = son/quests ',
    });
    expect(settings?.repos.get('steve')).toEqual({ owner: 'steve', name: 'journal' });
    expect(settings?.repos.get('son')).toEqual({ owner: 'son', name: 'quests' });
  });

  it('resolves a handle case-insensitively, because players.handle is citext', () => {
    const settings = giteaSettings({ GITEA_TOKEN: 'tok', PLAYER_REPOS: 'Steve=steve/journal' });
    expect(settings?.repos.get('steve')).toEqual({ owner: 'steve', name: 'journal' });
  });

  it('carries the token in the clone url, because the api clones over HTTP (§6.4)', () => {
    const settings = giteaSettings({
      GITEA_TOKEN: 'sekrit',
      GITEA_URL: 'http://localhost:3080',
      PLAYER_REPOS: 'steve=steve/journal',
    });
    const url = gitea(settings!).cloneUrl({ owner: 'steve', name: 'journal' });
    expect(url).toBe('http://steve:sekrit@localhost:3080/steve/journal.git');
  });
});

describe.skipIf(!HAVE_GITEA)('the gitea client, against the real server', () => {
  const fixture = useGiteaRepo('client');

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

  it('reads the repository log newest first', async () => {
    await fixture().commit('one.txt', 'one\n', 'the first thing');
    await fixture().commit('two.txt', 'two\n', 'the second thing');

    const log = await client().commits(repo());
    expect(log.map((entry) => entry.message.trim())).toEqual([
      'the second thing',
      'the first thing',
      'Initial commit',
    ]);
    expect(log[0]?.sha).toMatch(/^[0-9a-f]{40}$/);
  });

  it('filters the log by path, which is what a journal signal is', async () => {
    await fixture().commit('journal.md', 'day one\n', 'wrote it down');
    await fixture().commit('elsewhere.txt', 'nope\n', 'did something else');

    const touched = await client().commits(repo(), { path: 'journal.md' });
    expect(touched.map((entry) => entry.message.trim())).toEqual(['wrote it down']);
  });

  it('reads tags with the commit each one points at', async () => {
    await fixture().commit('tagged.txt', 'x\n', 'about to be tagged');
    await fixture().tag('v1');

    const tags = await client().tags(repo());
    expect(tags.map((tag) => tag.name)).toContain('v1');
    expect(tags.find((tag) => tag.name === 'v1')?.sha).toMatch(/^[0-9a-f]{40}$/);
  });

  it('raises a GiteaError naming the repository that is not there', async () => {
    await expect(client().commits({ owner: fixture().owner, name: 'no-such-repo' })).rejects.toThrow(
      GiteaError,
    );
  });

  /**
   * Gitea answers `404 not found` for both of these, and they are not the same thing.
   *
   * "No commit has touched your journal" is a verdict a learner acts on. "That repository is not
   * there" is the parent's typo in `PLAYER_REPOS`, and reporting it as the first would send a
   * 11–14-year-old to write a Journal entry he has already written.
   */
  it('tells a path with no commits from a repository that is not there', async () => {
    await expect(client().commits(repo(), { path: 'never-committed.txt' })).resolves.toEqual([]);
    await expect(
      client().commits({ owner: fixture().owner, name: 'no-such-repo' }, { path: 'journal.md' }),
    ).rejects.toThrow(GiteaError);
  });
});

describe.skipIf(!HAVE_GITEA)('an empty repository', () => {
  const fixture = useGiteaRepo('empty', { autoInit: false });

  /**
   * Gitea answers `409 Git Repository is empty` here, not `200 []`.
   *
   * Left unhandled that is an `internal` error on the day a learner presses Submit before he has
   * ever committed — which is the most likely day for him to press it. Zero commits is an answer,
   * and the answer is "no signal yet".
   */
  it('is no commits rather than an error', async () => {
    const client = gitea({
      baseUrl: fixture().baseUrl,
      token: fixture().token,
      repos: new Map(),
      journalPath: 'journal.md',
    });
    await expect(
      client.commits({ owner: fixture().owner, name: fixture().repo }),
    ).resolves.toEqual([]);
  });
});
