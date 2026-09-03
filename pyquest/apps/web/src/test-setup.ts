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

/**
 * jsdom implements `Range` without `getClientRects`, and CodeMirror measures with it.
 *
 * The failure is worth describing because of *how* it fails. CodeMirror measures inside a
 * `requestAnimationFrame`, so the `TypeError` escapes the test that caused it and arrives as an
 * unhandled error attributed to whatever was running at the time — and vitest says so plainly:
 * "This might cause false positive tests." A suite carrying an unhandled error is a suite whose
 * green is worth less than it looks, which is the one thing `test-filter-development` is for.
 *
 * Empty rectangles rather than plausible ones. Nothing in this app asserts on editor geometry,
 * and inventing coordinates would let a test believe it had measured a layout jsdom never laid
 * out — the same argument as the null canvas context above.
 */
if (typeof Range !== 'undefined' && Range.prototype.getClientRects === undefined) {
  Range.prototype.getClientRects = () =>
    Object.assign([] as DOMRect[], { item: () => null }) as unknown as DOMRectList;
  Range.prototype.getBoundingClientRect = () => new DOMRect();
}
