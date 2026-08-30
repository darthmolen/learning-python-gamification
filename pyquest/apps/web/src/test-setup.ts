import '@testing-library/jest-dom/vitest';

/**
 * jsdom does not implement `getContext`, and logs a loud "Not implemented" for every call.
 * `TurtleCanvas` already handles a null context — that is asserted in `canvas.test.tsx` — so
 * the log is pure noise, and noise that buries the next real failure is worth removing.
 *
 * Stubbed to null rather than to a fake context on purpose: a fake would let a test believe it
 * had drawn something, and "a canvas that renders something is not evidence."
 */
// Guarded: this setup file runs for every file in the web project, and `boundary.test.ts`
// overrides itself to the node environment, where there is no DOM to patch.
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;
}
