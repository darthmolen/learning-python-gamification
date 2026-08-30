import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { RunResult } from '../turtle/runner.worker.ts';
import { INITIAL, reduce, type RunState } from './runner.ts';

/**
 * Owns the worker, and nothing else.
 *
 * Every decision lives in `reduce`; this binds it to a `Worker` and to React. The worker is
 * injectable so the binding can be tested with a fake one — jsdom has no `Worker`, and a hook
 * that could only be exercised by downloading ten megabytes of wasm is a hook nobody tests.
 *
 * ADR 0003 is why there is a worker at all, and `stop` is the whole payoff: a main thread
 * running `while True:` cannot service the click that would end it.
 */

export interface WorkerLike {
  postMessage: (message: { kind: 'run'; code: string }) => void;
  terminate: () => void;
  onmessage: ((event: { data: RunResult }) => void) | null;
}

export type WorkerFactory = () => WorkerLike;

const defaultFactory: WorkerFactory = () =>
  new Worker(new URL('../turtle/runner.worker.ts', import.meta.url), { type: 'module' }) as WorkerLike;

export interface Runner {
  state: RunState;
  run: (code: string) => void;
  stop: () => void;
}

export function useRunner(makeWorker: WorkerFactory = defaultFactory): Runner {
  const [state, dispatch] = useReducer(reduce, INITIAL);
  const worker = useRef<WorkerLike | null>(null);

  const spawn = useCallback((): WorkerLike => {
    const created = makeWorker();
    created.onmessage = (event) => {
      const { ops, stdout, error } = event.data;
      dispatch({ kind: 'finished', ops, stdout, error });
    };
    worker.current = created;
    return created;
  }, [makeWorker]);

  const run = useCallback(
    (code: string) => {
      dispatch({ kind: 'start' });
      (worker.current ?? spawn()).postMessage({ kind: 'run', code });
    },
    [spawn],
  );

  /**
   * Terminate rather than signal. There is no cooperative way to interrupt a Python loop that
   * is not yielding — which is exactly the loop he will write — so the worker is killed and the
   * next Run spawns a fresh one. Pyodide reloads, which costs a second and is worth it.
   */
  const stop = useCallback(() => {
    worker.current?.terminate();
    worker.current = null;
    dispatch({ kind: 'stopped' });
  }, []);

  useEffect(() => () => worker.current?.terminate(), []);

  return { state, run, stop };
}
