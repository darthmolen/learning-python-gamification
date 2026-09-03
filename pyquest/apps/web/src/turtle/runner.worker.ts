/// <reference lib="webworker" />
import harnessSource from './harness.py?raw';
import turtleSource from './turtle.py?raw';
import type { TurtleOp } from './protocol.ts';
import { stdinFrom } from './stdin.ts';

/**
 * Learner Python, off the main thread.
 *
 * **The boundary is a worker, and it was chosen rather than defaulted to.** `while True:` is
 * week-three material (§6.6). On the main thread it freezes the tab with his code in it, and a
 * learner who loses an evening to his own infinite loop learns that the tool is dangerous —
 * the opposite of the lesson. A worker can also be killed, which a spinning main thread cannot:
 * a page running a hot loop has no way to interrupt itself.
 *
 * Pyodide loads from the CDN rather than the bundle. It is ~10MB of wasm and it does not belong
 * in a build that has to fit on a laptop's disk eight times over.
 */

const PYODIDE_VERSION = '0.26.4';
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

export interface RunRequest {
  kind: 'run';
  code: string;
  /** What his program is called in a traceback. `<exec>` is not a filename he can learn from. */
  filename: string;
  /**
   * What `input()` reads, one line per call.
   *
   * Without it Pyodide has no stdin and `input()` raises `OSError: [Errno 29]` — which is what
   * `a0-ask-and-draw` did on Run, on the Area 0 quest that teaches `input()` and whose starter
   * says "Run it first and read what falls out". See `stdin.ts`.
   */
  stdin: string;
}

export interface RunResult {
  kind: 'result';
  /** Everything the turtle recorded, including whatever it managed before an exception. */
  ops: TurtleOp[];
  /** Anything the program printed. */
  stdout: string;
  /** The traceback, if it raised. `null` when it ran clean. */
  error: string | null;
}

interface PyodideApi {
  runPythonAsync: (code: string) => Promise<unknown>;
  registerJsModule: (name: string, module: object) => void;
  FS: { writeFile: (path: string, data: string) => void };
  setStdout: (options: { batched: (s: string) => void }) => void;
  /** Pyodide's stdin hook. `null` from the handler is end-of-stream, so Python raises EOFError. */
  setStdin: (options: { stdin: () => string | null; isatty?: boolean }) => void;
  globals: { get: (name: string) => unknown; set: (name: string, value: unknown) => void };
}

type LoadPyodide = (options: { indexURL: string }) => Promise<PyodideApi>;

let pyodide: PyodideApi | null = null;
let stdout = '';

async function boot(): Promise<PyodideApi> {
  if (pyodide !== null) return pyodide;

  /*
   * The ESM build, imported rather than `importScripts`-ed. This worker is `{ type: 'module' }`
   * — which it must be, to import `turtle.py?raw` through Vite — and a module worker has no
   * `importScripts`. The first version used it anyway and died on boot with
   * "Module scripts don't support importScripts()", leaving the screen on `Run · working`
   * forever with a Stop button that had nothing to stop.
   *
   * `@vite-ignore` because the URL is a CDN address resolved at run time, not something the
   * bundler should try to follow.
   */
  const module = (await import(/* @vite-ignore */ `${PYODIDE_URL}pyodide.mjs`)) as {
    loadPyodide: LoadPyodide;
  };
  const api = await module.loadPyodide({ indexURL: PYODIDE_URL });

  /*
   * Written to the filesystem rather than exec'd into globals, so `import turtle` resolves the
   * way it does in every tutorial he will read. `from turtle import *` works for the same
   * reason. Anything cleverer would make his working program stop working when he moves it to
   * a real Python on his own machine, which is the whole point of Area 2.
   */
  api.FS.writeFile('turtle.py', turtleSource);
  api.FS.writeFile('_pyquest_harness.py', harnessSource);
  api.setStdout({ batched: (s) => { stdout += `${s}\n`; } });

  pyodide = api;
  return api;
}

async function run(code: string, filename: string, stdin: string): Promise<RunResult> {
  const api = await boot();
  stdout = '';

  /*
   * A fresh queue per run, which is what makes pressing Run twice with a different number work
   * — and that is precisely what Area 0 session 5 asks for ("type 150, then try 40").
   *
   * `isatty: false` because this is a pipe, not a terminal. It is what `python x.py < answers`
   * looks like from inside Python, and a program that checks would otherwise be told it has a
   * console it cannot use.
   */
  api.setStdin({ stdin: stdinFrom(stdin), isatty: false });

  let error: string | null = null;

  try {
    /*
     * Run through the Python harness rather than `runPythonAsync` directly.
     *
     * Pyodide raises through three frames of its own `_pyodide/_base.py`, so a one-line syntax
     * error arrives wearing a stack that starts in a file inside a zip the learner has never
     * seen, with the four lines that matter at the bottom and his file called `<exec>`. The
     * harness catches inside Python and formats with `traceback`, which produces exactly what
     * `python his_file.py` produces, because it is the same module doing it.
     */
    api.globals.set('_pyquest_source', code);
    api.globals.set('_pyquest_filename', filename);
    const reported = await api.runPythonAsync(
      'import _pyquest_harness; _pyquest_harness.run_program(_pyquest_source, _pyquest_filename)',
    );
    error = reported === null || reported === undefined ? null : String(reported);
  } catch (cause) {
    // The harness itself failed, which is not his program failing. Reported all the same: a
    // traceback belongs on his screen, never in a console he does not know how to open.
    error = cause instanceof Error ? cause.message : String(cause);
  }

  /*
   * Drained *after* the catch on purpose. A program that raises halfway through still leaves
   * every op it recorded before it failed, so the drawing he got to keep stays on screen and
   * the traceback sits beside it. Draining before would throw away the evidence.
   */
  let ops: TurtleOp[] = [];
  try {
    const drained = await api.runPythonAsync('import turtle, json; json.dumps(turtle._drain())');
    ops = JSON.parse(String(drained)) as TurtleOp[];
  } catch {
    // The turtle module was never imported — a text-only program. No drawing is correct here.
    ops = [];
  }

  return { kind: 'result', ops, stdout, error };
}

export interface RunFailure {
  kind: 'failure';
  error: string;
}

self.onmessage = (event: MessageEvent<RunRequest>) => {
  if (event.data.kind !== 'run') return;

  void run(event.data.code, event.data.filename, event.data.stdin ?? '').then(
    (result) => self.postMessage(result),
    /*
     * Boot failures land here — a CDN that will not answer, a Pyodide that will not start. They
     * must be posted rather than thrown: an unhandled rejection in a worker is invisible to the
     * page, which is how a broken runner became a screen that said `working` and meant nothing.
     */
    (cause: unknown) => {
      const failure: RunFailure = {
        kind: 'failure',
        error: cause instanceof Error ? cause.message : String(cause),
      };
      self.postMessage(failure);
    },
  );
};
