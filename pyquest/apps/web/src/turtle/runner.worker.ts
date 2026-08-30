/// <reference lib="webworker" />
import turtleSource from './turtle.py?raw';
import type { TurtleOp } from './protocol.ts';

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
  globals: { get: (name: string) => unknown };
}

declare function importScripts(...urls: string[]): void;
declare const loadPyodide: (options: { indexURL: string }) => Promise<PyodideApi>;

let pyodide: PyodideApi | null = null;
let stdout = '';

async function boot(): Promise<PyodideApi> {
  if (pyodide !== null) return pyodide;

  importScripts(`${PYODIDE_URL}pyodide.js`);
  const api = await loadPyodide({ indexURL: PYODIDE_URL });

  /*
   * Written to the filesystem rather than exec'd into globals, so `import turtle` resolves the
   * way it does in every tutorial he will read. `from turtle import *` works for the same
   * reason. Anything cleverer would make his working program stop working when he moves it to
   * a real Python on his own machine, which is the whole point of Area 2.
   */
  api.FS.writeFile('turtle.py', turtleSource);
  api.setStdout({ batched: (s) => { stdout += `${s}\n`; } });

  pyodide = api;
  return api;
}

async function run(code: string): Promise<RunResult> {
  const api = await boot();
  stdout = '';

  let error: string | null = null;

  try {
    await api.runPythonAsync(code);
  } catch (cause) {
    // Reported, never thrown. A traceback is the most useful thing a learner sees all evening;
    // it belongs on his screen, not in a console he does not know how to open.
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

self.onmessage = (event: MessageEvent<RunRequest>) => {
  if (event.data.kind !== 'run') return;

  void run(event.data.code).then((result) => {
    self.postMessage(result);
  });
};
