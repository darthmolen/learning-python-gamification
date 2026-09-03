import { describe, expect, it } from 'vitest';
import type { JobAccepted, JobView } from '@pyquest/contract';
import { INITIAL, bodyFor, enqueuesJob, inFlight, reduce, submitStatus } from './submit.ts';

/**
 * The rule this file exists to hold: **pollability is a property of the verifier, not of the
 * response.**
 *
 * `JobAcceptedSchema` is `{ jobId, state }` and `.strict()`. A queued `peer-signoff` and a
 * queued `hidden-tests` are therefore byte-identical, while one carries an `attempts` id that
 * `GET /api/jobs/:jobId` refuses with a 404 and the other carries a `runner_jobs` id it
 * accepts. A machine that decided from the response would poll both, and a submission that
 * worked would be reported to a child as "job … not found".
 */

const accepted = (over: Partial<JobAccepted> = {}): JobAccepted => ({
  jobId: '41',
  state: 'queued',
  ...over,
});

const job = (over: Partial<JobView> = {}): JobView => ({
  jobId: '41',
  playerId: 'p1',
  questId: 'a3-recipe-book',
  state: 'running',
  result: null,
  errorCode: null,
  attemptId: null,
  ...over,
});

const sent = () => reduce(INITIAL, { kind: 'send' });

describe('which submissions may be polled', () => {
  it('polls hidden-tests, which is the verifier that enqueues a runner job', () => {
    const state = reduce(sent(), { kind: 'accepted', verifier: 'hidden-tests', accepted: accepted() });

    expect(state.phase).toBe('queued');
    expect(state.jobId).toBe('41');
  });

  it('polls local-repo, which enqueues one too', () => {
    const state = reduce(sent(), { kind: 'accepted', verifier: 'local-repo', accepted: accepted() });

    expect(state.jobId).toBe('41');
  });

  /**
   * The case the whole rule is for. The API records an `attempts` row and answers 202 with its
   * id; there is no `runner_jobs` row and never will be, because what happens next is a person
   * looking at it. An id here would send the hook to a 404.
   */
  it('never polls a peer-signoff, however queued the response says it is', () => {
    const state = reduce(sent(), {
      kind: 'accepted',
      verifier: 'peer-signoff',
      accepted: accepted({ jobId: 'att-8f21c0', state: 'queued' }),
      by: 'dm',
    });

    expect(state.jobId).toBeNull();
    expect(state.phase).toBe('awaiting-signoff');
    expect(state.awaiting).toBe('dm');
  });

  /**
   * `git-signal` resolves at submit time: the evidence is a history that is already on the
   * server, so the answer is a read and the API returns a terminal state with a 200. Polling it
   * would be asking again for something already answered — at a route that would 404 anyway,
   * since this id is an attempt too.
   */
  it('never polls a git-signal, and takes its verdict from the submit response', () => {
    const state = reduce(sent(), {
      kind: 'accepted',
      verifier: 'git-signal',
      accepted: accepted({ jobId: 'att-4c07ab', state: 'passed' }),
    });

    expect(state.jobId).toBeNull();
    expect(state.phase).toBe('passed');
  });

  /**
   * The verifier rule has to stand on its own, and this is what proves it does.
   *
   * `git-signal` always answers terminal today, so the "is it terminal?" check masks a broken
   * verifier rule — a seeded mutant that made `git-signal` pollable survived every screen test
   * for exactly that reason. Hand it a non-terminal state, which only a changed API would send,
   * and the two guards separate: the verifier is the one that must refuse.
   */
  it('still refuses to poll a git-signal that comes back non-terminal', () => {
    const state = reduce(sent(), {
      kind: 'accepted',
      verifier: 'git-signal',
      accepted: accepted({ jobId: 'att-4c07ab', state: 'queued' }),
    });

    expect(state.jobId).toBeNull();
  });

  it('says outright which verifiers enqueue a job', () => {
    expect(enqueuesJob('hidden-tests')).toBe(true);
    expect(enqueuesJob('local-repo')).toBe(true);
    expect(enqueuesJob('peer-signoff')).toBe(false);
    expect(enqueuesJob('git-signal')).toBe(false);
  });
});

describe('polling, once it has started', () => {
  it('keeps the job while it is still running', () => {
    const waiting = reduce(sent(), { kind: 'accepted', verifier: 'hidden-tests', accepted: accepted() });
    const state = reduce(waiting, { kind: 'polled', job: job({ state: 'running' }) });

    expect(state.phase).toBe('running');
    expect(state.jobId).toBe('41');
  });

  it('drops the job the moment there is a verdict, because that is what stops the poll', () => {
    const waiting = reduce(sent(), { kind: 'accepted', verifier: 'hidden-tests', accepted: accepted() });
    const result = { passed: true, stdout: '4 passed', stderr: '', truncated: false, durationMs: 812 };
    const state = reduce(waiting, { kind: 'polled', job: job({ state: 'passed', result }) });

    expect(state.phase).toBe('passed');
    expect(state.jobId).toBeNull();
    expect(state.result).toEqual(result);
  });

  /**
   * §6.6's resource limits fired. `endpoints.ts` keeps `killed` as its own state against a
   * review that wanted it folded into `failed`, on the grounds that it is "the one outcome
   * where 'your code is wrong' is the wrong thing to say". Folding it here would undo that.
   */
  it('keeps killed distinct from failed, and says the sandbox stopped it', () => {
    const waiting = reduce(sent(), { kind: 'accepted', verifier: 'hidden-tests', accepted: accepted() });
    const state = reduce(waiting, { kind: 'polled', job: job({ state: 'killed' }) });

    expect(state.phase).toBe('killed');
    expect(submitStatus(state)).toBe('Submit · stopped by the sandbox');
    expect(submitStatus(state)).not.toMatch(/failed|wrong/i);
  });

  it('keeps a timeout distinct too', () => {
    const waiting = reduce(sent(), { kind: 'accepted', verifier: 'hidden-tests', accepted: accepted() });
    const state = reduce(waiting, { kind: 'polled', job: job({ state: 'timed-out' }) });

    expect(submitStatus(state)).toBe('Submit · timed out');
  });
});

describe('when the request itself fails', () => {
  it('is not a verdict, and carries no job to poll', () => {
    const state = reduce(sent(), { kind: 'broke', error: 'submit answered 500' });

    expect(state.phase).toBe('errored');
    expect(state.jobId).toBeNull();
    expect(state.error).toBe('submit answered 500');
    expect(submitStatus(state)).toBe('Submit · could not send');
  });
});

/**
 * CLAUDE.md: labels never change with state. The status carries every one of these, so the
 * button can keep the one word it has — and each line is anchored, because a `toContain`
 * would let `Submit · passed` satisfy an assertion about `Submit`.
 */
describe('the status line', () => {
  it('starts as the plain word and never becomes a verdict on its own', () => {
    expect(submitStatus(INITIAL)).toBe('Submit');
    expect(submitStatus(sent())).toBe('Submit · sending');
  });

  it('names the seat that has to sign, because §5.11 runs both directions', () => {
    const peer = reduce(sent(), {
      kind: 'accepted',
      verifier: 'peer-signoff',
      accepted: accepted({ jobId: 'att-1' }),
      by: 'peer',
    });
    expect(submitStatus(peer)).toBe('Submit · waiting on the peer');

    const dm = reduce(sent(), {
      kind: 'accepted',
      verifier: 'peer-signoff',
      accepted: accepted({ jobId: 'att-2' }),
      by: 'dm',
    });
    expect(submitStatus(dm)).toBe('Submit · waiting on the DM');
  });
});

describe('what is in flight', () => {
  it('counts sending, queued and running, and nothing else', () => {
    expect(inFlight(INITIAL)).toBe(false);
    expect(inFlight(sent())).toBe(true);

    const queued = reduce(sent(), { kind: 'accepted', verifier: 'hidden-tests', accepted: accepted() });
    expect(inFlight(queued)).toBe(true);
    expect(inFlight(reduce(queued, { kind: 'polled', job: job({ state: 'running' }) }))).toBe(true);
    expect(inFlight(reduce(queued, { kind: 'polled', job: job({ state: 'passed' }) }))).toBe(false);

    // A sign-off waits on a person, not on this app. Blocking Submit behind it would leave the
    // button dead until somebody else acted.
    const signoff = reduce(sent(), {
      kind: 'accepted',
      verifier: 'peer-signoff',
      accepted: accepted(),
      by: 'peer',
    });
    expect(inFlight(signoff)).toBe(false);
  });
});

/**
 * §6.4: push is the verification mechanism, so `local-repo` grades what was pushed. Its schema
 * is `.strict()` and has no `code` field — a body carrying the working tree is refused rather
 * than ignored, which is the API declining to grade something that was never committed.
 */
describe('the body each verifier sends', () => {
  it('carries the code only for hidden-tests', () => {
    expect(bodyFor('hidden-tests', 'print(1)')).toEqual({ type: 'hidden-tests', code: 'print(1)' });
    expect(bodyFor('local-repo', 'print(1)')).toEqual({ type: 'local-repo' });
    expect(bodyFor('peer-signoff', 'print(1)')).toEqual({ type: 'peer-signoff' });
    expect(bodyFor('git-signal', 'print(1)')).toEqual({ type: 'git-signal' });
  });
});
