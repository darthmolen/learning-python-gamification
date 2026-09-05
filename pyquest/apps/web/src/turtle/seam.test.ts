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
    // The property the Python docstring promises: a *cosmetic* call never raises, and `done()`
    // is recorded like anything else so the op stream is a faithful log of what he called.
    expect(turtleSource).toContain('_record("done")');
    expect(interpret([{ op: 'done', args: [] }]).strokes).toEqual([]);
  });
});

/**
 * The bug this section exists for, and it broke the one quest that most depends on it.
 *
 * `a0-ask-and-draw`'s starter says *"This one is broken in the way session 5 broke it on purpose.
 * Run it first and read what falls out before you fix anything."* What is supposed to fall out is
 * `TypeError: can't multiply sequence by non-int of type 'float'` — `input()` hands back a `str`
 * and `forward()` wants a number, which is the entire lesson.
 *
 * The shim recorded `{"op": "forward", "args": ["100"]}` and raised nothing. `protocol.ts` then
 * computed `NaN` and drew a blank canvas, so the learner got no drawing, no error, and no way to
 * tell the two apart. Verified in Pyodide before the fix and after it.
 *
 * The module docstring's "nothing here raises" is a rule about `done()` and `shape()` — lines
 * whose failure would kill a working program for a cosmetic reason. It was never a licence for
 * `forward()` to accept a string, and the two had to be told apart in writing.
 */
describe('the shim raises where real Python raises', () => {
  /** Every op whose argument CPython's turtle multiplies, and therefore validates by arithmetic. */
  const ARITHMETIC = ['forward', 'backward', 'right', 'left', 'setheading', 'goto', 'circle'];

  it('multiplies every arithmetic argument, so CPython reports the type', () => {
    // Read from the source: `_record("forward", distance * 1.0)`, one per op. `* 1.0` is the
    // multiplication CPython's `Vec2D.__mul__` performs, so the learner is told what he would be
    // told on his own machine rather than something this repository made up.
    const unguarded = ARITHMETIC.filter(
      (op) => !new RegExp(`_record\\("${op}"(?:, [a-z]+ \\* 1\\.0)+\\)`).test(turtleSource),
    );
    expect(unguarded).toEqual([]);
  });

  /**
   * Inline, and that is the requirement rather than a style note — **the learner reads these
   * lines.** A `_number()` helper did the same job and put a second frame in the traceback
   * ending on `return 1.0 * value`, which reads as a trick played on him rather than as work
   * his own program asked for. One frame, naming the parameter he passed.
   */
  it('does the multiplication inline, so the traceback stops at the call he made', () => {
    // `def`, not the bare name: the comment above `forward` names the helper it replaced, and
    // an assertion that forbade the word would forbid explaining why it is gone.
    expect(turtleSource).not.toContain('def _number');
    expect(turtleSource).toContain('_record("forward", distance * 1.0)');
  });

  /** The other half: a cosmetic call still must not raise, or a working program dies on its last line. */
  it('leaves the cosmetic calls unguarded', () => {
    for (const op of ['done', 'exitonclick', 'speed', 'shape']) {
      expect(new RegExp(`_record\\("${op}"[^)]*\\* 1\\.0`).test(turtleSource)).toBe(false);
    }
  });
});
