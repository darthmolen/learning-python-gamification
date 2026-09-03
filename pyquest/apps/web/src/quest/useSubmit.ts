import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { PublicVerifier } from '@pyquest/contract';
import { getJob, submitQuest } from '../gateway/index.ts';
import { INITIAL, bodyFor, reduce, type SubmitState } from './submit.ts';

/**
 * Owns the request and the interval, and decides nothing.
 *
 * The same division `useRunner` keeps with `runner.ts`: every rule worth being sure about is in
 * `submit.ts`, where it is tested against plain objects. What is left here is the two things
 * only a browser can do — send the POST, and come back later for the answer.
 *
 * **It polls while `state.jobId` is not null, and that is the whole loop.** The reducer sets an
 * id only for the two verifiers that enqueue a runner job, so the rule that a `peer-signoff`
 * must never be polled is enforced by there being nothing to poll rather than by this file
 * remembering it.
 */

/** How often to ask. Injectable so tests do not wait, and so the interval is one number. */
const DEFAULT_INTERVAL_MS = 700;

export interface Submitter {
  state: SubmitState;
  submit: (code: string) => void;
}

export function useSubmit(
  playerId: string,
  questId: string,
  verifier: PublicVerifier,
  intervalMs: number = DEFAULT_INTERVAL_MS,
): Submitter {
  const [state, dispatch] = useReducer(reduce, INITIAL);

  /**
   * Whether this component is still mounted.
   *
   * He submits, then clicks away to the Map while the runner is still working. Dispatching into
   * an unmounted component is a React warning today and a leak in the loop that produced it.
   */
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  const submit = useCallback(
    (code: string) => {
      dispatch({ kind: 'send' });
      submitQuest(playerId, questId, bodyFor(verifier.type, code)).then(
        (accepted) => {
          if (!live.current) return;
          dispatch({
            kind: 'accepted',
            verifier: verifier.type,
            accepted,
            /* The seat is on the quest, not in the response — the API has no reason to repeat
             * something the client is already holding. */
            ...(verifier.type === 'peer-signoff' ? { by: verifier.by } : {}),
          });
        },
        (cause: unknown) => {
          if (!live.current) return;
          dispatch({ kind: 'broke', error: cause instanceof Error ? cause.message : String(cause) });
        },
      );
    },
    [playerId, questId, verifier],
  );

  const { jobId } = state;

  useEffect(() => {
    if (jobId === null) return;

    /*
     * One request at a time. A slow answer under a short interval would otherwise stack up
     * requests, and the reducer would then apply them in whatever order they landed — which on
     * a link this actually runs over is how a `passed` gets overwritten by a stale `running`.
     */
    let asking = false;

    const ask = () => {
      if (asking || !live.current) return;
      asking = true;
      getJob(jobId).then(
        (job) => {
          asking = false;
          if (live.current) dispatch({ kind: 'polled', job });
        },
        (cause: unknown) => {
          asking = false;
          if (live.current) {
            dispatch({ kind: 'broke', error: cause instanceof Error ? cause.message : String(cause) });
          }
        },
      );
    };

    /* Ask once immediately. A job that is already finished should not cost a whole interval of
     * "queued" on screen before anybody looks. */
    ask();
    const timer = setInterval(ask, intervalMs);
    return () => clearInterval(timer);
  }, [jobId, intervalMs]);

  return { state, submit };
}
