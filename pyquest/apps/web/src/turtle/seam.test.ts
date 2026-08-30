import { describe, expect, it } from 'vitest';
import protocolSource from './protocol.ts?raw';
import turtleSource from './turtle.py?raw';
import { interpret } from './protocol.ts';

/** Every `_record("name", ...)` in the Python module — the ops it can actually emit. */
const emitted = (): string[] => [
  ...new Set([...turtleSource.matchAll(/_record\("([a-z]+)"/g)].map((m) => m[1] as string)),
];

/**
 * Every `case '...'` the interpreter answers to, read from the source rather than from
 * `String(interpret)` — the transform does not guarantee a function's text survives it, and a
 * check that reads an empty string passes forever.
 */
const handled = (): string[] => [
  ...new Set([...protocolSource.matchAll(/case '([a-z]+)':/g)].map((m) => m[1] as string)),
];

/**
 * The seam this design creates, guarded.
 *
 * Splitting the shim in two — Python records intent, TypeScript computes geometry — is what
 * makes the arithmetic testable without a browser. The cost is a seam, and a seam drifts: add
 * `stamp()` to the Python module and the interpreter silently ignores it, so the learner gets a
 * drawing with a piece missing and no error anywhere.
 *
 * jsdom cannot run Python and this suite will not start Pyodide, so the check is textual: every
 * op the Python side can emit must be an op the interpreter names. It is a cheap check for a
 * failure that is otherwise invisible until somebody looks at a drawing and frowns.
 */
describe('the two halves of the shim agree', () => {
  it('reads a non-trivial set of ops out of both halves', () => {
    // A regex that matched nothing would make every assertion below vacuous.
    expect(emitted().length).toBeGreaterThan(12);
    expect(emitted()).toContain('forward');
    expect(handled().length).toBeGreaterThan(12);
    expect(handled()).toContain('forward');
  });

  it('handles every op the Python module can emit', () => {
    const unhandled = emitted().filter((op) => !handled().includes(op));
    expect(unhandled).toEqual([]);
  });

  /**
   * The aliases are the other half of the same seam. `fd = forward` in Python emits `forward`,
   * so the interpreter's `case 'fd'` is never reached from this module — but a learner pasting
   * from a tutorial may hit a shim that grows a real `fd` later, and the case costs nothing.
   * What matters is that the long names all work, which the test above covers.
   */
  it('records under the long name even when called by its alias', () => {
    expect(turtleSource).toContain('fd = forward');
    expect(turtleSource).toContain('bk = backward');
  });

  it('records a no-op rather than raising on done()', () => {
    // The property the Python docstring promises: nothing here raises, and `done()` is recorded
    // like anything else so the op stream is a faithful log of what he called.
    expect(turtleSource).toContain('_record("done")');
    expect(interpret([{ op: 'done', args: [] }])).toEqual([]);
  });
});
