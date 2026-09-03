import type { JobAccepted, JobResult, JobState, JobView, SubmitRequest } from '@pyquest/contract';

/**
 * What Submit is doing, as a pure state machine.
 *
 * The same split `runner.ts` makes, for the same reason: every decision worth being sure about
 * lives here, where it can be tested without a network, a database or a runner container.
 * `useSubmit.ts` owns the request and the interval and decides nothing.
 *
 * §6.3 makes Run and Submit different paths. Run is Pyodide in the browser and records nothing;
 * Submit goes to the API, because hidden tests shipped to the client are not hidden. So this
 * machine reports a **verdict**, which is the word `runner.ts` deliberately refuses.
 */

/**
 * The nine ways a submission can be doing something, and `killed` is one of them.
 *
 * Six mirror `JobState`, because collapsing them loses the sentence each one needs said —
 * `killed` means the sandbox's resource limits fired, and "your code is wrong" is the wrong
 * thing to tell a learner whose program was stopped from outside. `endpoints.ts` keeps that
 * state against a review that wanted it folded into `failed`; folding it here would undo that.
 *
 * The other three are the client's own: `sending` is the POST in flight, `errored` is the POST
 * itself failing, and `awaiting-signoff` is the state no job can be in — a person has to look
 * at it.
 */
export type SubmitPhase =
  | 'idle'
  | 'sending'
  | 'queued'
  | 'running'
  | 'awaiting-signoff'
  | 'passed'
  | 'failed'
  | 'timed-out'
  | 'killed'
  | 'errored';

export interface SubmitState {
  phase: SubmitPhase;
  /**
   * The job to poll, and **it is set only when there is something to poll.**
   *
   * That invariant is what keeps the polling rule out of the hook. `useSubmit` polls while this
   * is not null and stops when it is, so a `peer-signoff` — which has no runner job and would
   * answer 404 — cannot be polled by a hook that forgot the rule, because it never gets an id.
   */
  jobId: string | null;
  /** The runner's summary, once there is a verdict. Never a pytest traceback (§6.3). */
  result: JobResult | null;
  error: string | null;
  /** Which seat must sign, when the quest is verified by a person. */
  awaiting: 'peer' | 'dm' | null;
}

export type SubmitEvent =
  | { kind: 'send' }
  | {
      kind: 'accepted';
      verifier: SubmitRequest['type'];
      accepted: JobAccepted;
      /** The seat named by a `peer-signoff` quest's verifier. */
      by?: 'peer' | 'dm';
    }
  | { kind: 'polled'; job: JobView }
  | { kind: 'broke'; error: string };

export const INITIAL: SubmitState = {
  phase: 'idle',
  jobId: null,
  result: null,
  error: null,
  awaiting: null,
};

/** The four states in which nothing further will happen. */
const TERMINAL: ReadonlySet<JobState> = new Set<JobState>(['passed', 'failed', 'timed-out', 'killed']);

/**
 * Which verifiers enqueue a runner job, and therefore which submissions may be polled.
 *
 * **This is a property of the verifier and not of the response**, and that is the whole of the
 * rule. `JobAcceptedSchema` is `{ jobId, state }` and nothing else, so a queued `peer-signoff`
 * and a queued `hidden-tests` arrive identical — while one carries a `runner_jobs` id and the
 * other carries an `attempts` id that `GET /api/jobs/:jobId` refuses with a 404.
 *
 * The client is not guessing. It chose the body type from the quest's own `verifier`, and
 * `server.ts` switches on that same field and refuses a mismatched body, so the two always
 * agree.
 */
export const enqueuesJob = (verifier: SubmitRequest['type']): boolean =>
  verifier === 'hidden-tests' || verifier === 'local-repo';

const phaseOf = (state: JobState): SubmitPhase => state;

export function reduce(state: SubmitState, event: SubmitEvent): SubmitState {
  switch (event.kind) {
    case 'send':
      return { ...INITIAL, phase: 'sending' };

    case 'accepted': {
      const { verifier, accepted } = event;

      /* Nothing to poll and nobody to wait for but a person. §5.11 runs sign-off both ways, so
       * which seat it is is worth saying out loud rather than "waiting". */
      if (verifier === 'peer-signoff') {
        return { ...INITIAL, phase: 'awaiting-signoff', awaiting: event.by ?? null };
      }

      const terminal = TERMINAL.has(accepted.state);
      const pollable = enqueuesJob(verifier) && !terminal;

      return {
        ...INITIAL,
        phase: phaseOf(accepted.state),
        /* `git-signal` resolves at submit time and returns an attempts id; giving it a `jobId`
         * would send the hook to a route that answers 404 for it. */
        jobId: pollable ? accepted.jobId : null,
      };
    }

    case 'polled': {
      const terminal = TERMINAL.has(event.job.state);
      return {
        ...state,
        phase: phaseOf(event.job.state),
        result: event.job.result,
        /* Dropping the id is what stops the poll. Terminal means terminal. */
        jobId: terminal ? null : state.jobId,
      };
    }

    case 'broke':
      return { ...INITIAL, phase: 'errored', error: event.error };
  }
}

/**
 * The prototype's vocabulary, kept: the state goes in the line beside the button, never in the
 * button's label. `Submit · passed`, `Submit · failed` — which is how the no-changing-labels
 * rule survives contact with a status that genuinely changes.
 *
 * `killed` is the line worth reading twice. The sandbox stopped his program from outside, and
 * telling him his code failed would be blaming him for a limit he never saw.
 */
export function submitStatus(state: SubmitState): string {
  switch (state.phase) {
    case 'idle':
      return 'Submit';
    case 'sending':
      return 'Submit · sending';
    case 'queued':
      return 'Submit · queued';
    case 'running':
      return 'Submit · working';
    case 'awaiting-signoff':
      return state.awaiting === null
        ? 'Submit · waiting on a sign-off'
        : `Submit · waiting on the ${state.awaiting === 'dm' ? 'DM' : 'peer'}`;
    case 'passed':
      return 'Submit · passed';
    case 'failed':
      return 'Submit · failed';
    case 'timed-out':
      return 'Submit · timed out';
    case 'killed':
      return 'Submit · stopped by the sandbox';
    case 'errored':
      return 'Submit · could not send';
  }
}

/** Whether a submission is in flight, which is the only reason to refuse a second one. */
export const inFlight = (state: SubmitState): boolean =>
  state.phase === 'sending' || state.phase === 'queued' || state.phase === 'running';

/**
 * The body for a quest, built from the verifier the quest declares.
 *
 * `local-repo` sends no code on purpose: push is the verification mechanism (§6.4), so the API
 * grades what was pushed, and `LocalRepoSubmitSchema` is `.strict()` — a `code` field is refused
 * rather than ignored. `peer-signoff` and `git-signal` carry nothing at all; the evidence is a
 * person or a git history.
 */
export function bodyFor(verifier: SubmitRequest['type'], code: string): SubmitRequest {
  switch (verifier) {
    case 'hidden-tests':
      return { type: 'hidden-tests', code };
    case 'local-repo':
      return { type: 'local-repo' };
    case 'peer-signoff':
      return { type: 'peer-signoff' };
    case 'git-signal':
      return { type: 'git-signal' };
  }
}
