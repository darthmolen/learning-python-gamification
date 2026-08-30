import type { TurtleOp } from '../turtle/protocol.ts';

/**
 * What Run is doing, as a pure state machine.
 *
 * §6.3 makes Run and Submit deliberately different paths: Run is Pyodide in the browser and
 * **records nothing**, Submit goes to the API because hidden tests shipped to the client are
 * not hidden. So nothing here reports a verdict — a program that raises has *raised*, it has
 * not *failed*, because nothing was judging it.
 *
 * The worker is left with nothing to decide. Every transition worth being sure about is here,
 * where it can be tested without a browser, Pyodide, or a ten-megabyte download.
 */

export type RunPhase = 'idle' | 'running' | 'ran' | 'raised' | 'stopped';

export interface RunState {
  phase: RunPhase;
  /** Whatever the turtle recorded, including what a failing program managed before it failed. */
  ops: TurtleOp[];
  stdout: string;
  error: string | null;
}

export type RunEvent =
  | { kind: 'start' }
  | { kind: 'finished'; ops: TurtleOp[]; stdout: string; error: string | null }
  | { kind: 'stopped' };

export const INITIAL: RunState = { phase: 'idle', ops: [], stdout: '', error: null };

export function reduce(state: RunState, event: RunEvent): RunState {
  switch (event.kind) {
    case 'start':
      // Clear the last run before the next one, so a drawing on screen is never the previous
      // program's while the current one is still thinking.
      return { phase: 'running', ops: [], stdout: '', error: null };

    case 'stopped':
      return { ...state, phase: 'stopped' };

    case 'finished':
      /*
       * A result arriving after a stop is discarded. Terminating a worker does not un-send a
       * message already in flight, and showing the output of a run he cancelled would tell him
       * the Stop button does not work.
       */
      if (state.phase === 'stopped') return state;

      return {
        phase: event.error === null ? 'ran' : 'raised',
        ops: event.ops,
        stdout: event.stdout,
        error: event.error,
      };
  }
}

/**
 * The prototype's vocabulary, kept: state goes in the line beside the button and never in the
 * button's label. "Labels never change with state" (CLAUDE.md) — and this is the screen where
 * the temptation is strongest, because a Run button that says "Running…" feels helpful right up
 * until "Take it cold" is false on a screen showing three quests cleared.
 *
 * `raised` rather than `failed` is deliberate. Failure is Submit's word, because Submit is the
 * one being marked.
 */
export function statusLine(state: RunState): string {
  switch (state.phase) {
    case 'idle':
      return 'Console';
    case 'running':
      return 'Run · working';
    case 'ran':
      return 'Run · browser';
    case 'raised':
      return 'Run · raised';
    case 'stopped':
      return 'Run · stopped';
  }
}

/**
 * Whether the editor still holds exactly what it was given.
 *
 * The prototype's Submit parses the editor rather than counting clicks, and the plan is blunt
 * about why: "a Submit that passes on unchanged code is a lie about the mechanic." Whitespace
 * is ignored, because reformatting is not work.
 */
export const isUnchanged = (code: string, starter: string): boolean =>
  code.replace(/\s+/g, '') === starter.replace(/\s+/g, '');
