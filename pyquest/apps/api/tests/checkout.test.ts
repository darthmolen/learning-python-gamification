/**
 * `local-repo`'s git half, against a real repository on the Gitea that is running.
 *
 * **Push is the verification mechanism (§6.4), and that is what these tests are about.** The api
 * tests what was pushed and never a working tree it cannot see — so a checkout that has been used
 * once and is used again must come back to `origin/main` and nothing else. Merging would let a
 * local commit survive into a run; keeping the cached copy would grade last week's work; a dirty
 * tree would grade a file nobody pushed. Each of those is a test below, because each of them is a
 * medal awarded for work that is not on the server.
 *
 * Nothing here is mocked. A fake remote would have agreed with every one of these assertions
 * while proving nothing about the two things that are actually hard — what `git` does the *second*
 * time, and what it does when the checkout has drifted.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { CheckoutError, exportTree, syncCheckout } from '../src/checkout.ts';
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


describe.skipIf(!HAVE_GITEA)('the local-repo checkout', () => {
  const fixture = useGiteaRepo('checkout');
  let root: string;

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'pyquest-checkout-'));
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  const sync = (): ReturnType<typeof syncCheckout> =>
    syncCheckout({ root, handle: 'ada', cloneUrl: fixture().cloneUrl() });

  it('clones on the first run and reports the commit it landed on', async () => {
    const sha = await fixture().commit('one.py', 'print(1)\n', 'the first thing');
    const checkout = sync();
    expect(checkout.sha).toBe(sha);
    expect(readFileSync(join(checkout.path, 'one.py'), 'utf8')).toBe('print(1)\n');
  });

  /**
   * The mutant this exists for: a `local-repo` that tests the clone it already has.
   *
   * It passes on the first run, passes on every run after it, and grades the work he did last
   * week as though it were the work he did tonight. §6.4's whole sentence is that pushing is what
   * makes it real, and a verifier that never fetches makes pushing optional.
   */
  it('fetches on the second run, so what it tests is what was pushed', async () => {
    sync();
    const sha = await fixture().commit('two.py', 'print(2)\n', 'pushed after the clone');
    const checkout = sync();
    expect(checkout.sha).toBe(sha);
    expect(readFileSync(join(checkout.path, 'two.py'), 'utf8')).toBe('print(2)\n');
  });

  it('discards a modified file, because a working tree is not evidence', async () => {
    const checkout = sync();
    writeFileSync(join(checkout.path, 'one.py'), 'print("tampered")\n', 'utf8');
    const again = sync();
    expect(readFileSync(join(again.path, 'one.py'), 'utf8')).toBe('print(1)\n');
  });

  it('removes an untracked file, so nothing survives between runs', async () => {
    const checkout = sync();
    writeFileSync(join(checkout.path, 'sneaky.py'), 'print("here")\n', 'utf8');
    const again = sync();
    expect(() => readFileSync(join(again.path, 'sneaky.py'), 'utf8')).toThrow();
  });

  /**
   * Hard reset, never merge — the plan's ruling, and this is what it buys.
   *
   * A merge would leave the local commit in the history and its files in the tree, so a checkout
   * somebody had committed into would grade a file that exists on no server anywhere. Reset means
   * the checkout is a view of `origin/main` or it is nothing.
   */
  it('resets a checkout that has drifted rather than merging it', async () => {
    const checkout = sync();
    writeFileSync(join(checkout.path, 'local-only.py'), 'print("local")\n', 'utf8');
    execFileSync('git', ['-C', checkout.path, 'add', '-A']);
    execFileSync('git', [
      '-C',
      checkout.path,
      '-c',
      'user.email=t@t',
      '-c',
      'user.name=t',
      'commit',
      '-qm',
      'a commit that was never pushed',
    ]);

    const remoteHead = execFileSync('git', ['-C', checkout.path, 'rev-parse', 'origin/main'], {
      encoding: 'utf8',
    }).trim();
    const again = sync();

    expect(again.sha).toBe(remoteHead);
    expect(() => readFileSync(join(again.path, 'local-only.py'), 'utf8')).toThrow();
    const log = execFileSync('git', ['-C', again.path, 'log', '--format=%s'], { encoding: 'utf8' });
    expect(log).not.toContain('a commit that was never pushed');
  });

  it('exports the tree at HEAD as a tar the runner can open', () => {
    const checkout = sync();
    const tar = join(root, 'export.tar');
    const bytes = exportTree(checkout, tar);
    expect(bytes).toBeGreaterThan(0);
    /** tar's magic lives at offset 257 and is what makes this a tar rather than a file. */
    expect(readFileSync(tar).subarray(257, 262).toString('ascii')).toBe('ustar');
  });

  /**
   * A failure must not print the token, and this is the only place the token is ever on a command
   * line. `git` echoes the remote back in most of its errors, and an api that logged that would
   * have written a working credential into the parent's terminal and into any log beside it.
   */
  it('does not put the token in the error when the remote refuses', () => {
    const badUrl = fixture().cloneUrl().replace(fixture().token, 'nope-not-the-token');
    try {
      syncCheckout({ root, handle: 'rejected', cloneUrl: badUrl });
      expect.unreachable('a bad credential should not clone');
    } catch (error) {
      expect(error).toBeInstanceOf(CheckoutError);
      expect(String(error)).not.toContain('nope-not-the-token');
    }
  });
});
