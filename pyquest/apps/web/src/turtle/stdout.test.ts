import { describe, expect, it } from 'vitest';
import { streamingStdout } from './stdout.ts';

/**
 * What the console shows, and — the part that was wrong — what it stops showing.
 *
 * Raised by review on PR #3: the worker created **one** `TextDecoder` in `boot()`, used it with
 * `{ stream: true }`, and never flushed or replaced it. `run()` cleared the `stdout` string and
 * left the decoder alone, so bytes held back mid-character at the end of one run were still held
 * at the start of the next.
 *
 * **This module already carries a scar the exact shape of that bug.** Its own docstring records a
 * stranded `input()` prompt surviving into the next Run — "the console read *How long should each
 * side be? How long should each side be? Done.*" The decoder was the same leak one layer down, in
 * bytes rather than in lines, and it would have been far harder to recognise: not a repeated
 * sentence, but one wrong character at the top of an otherwise correct run.
 */

const bytes = (s: string): Uint8Array => new TextEncoder().encode(s);

describe('streamingStdout', () => {
  it('joins what the program wrote, in order', () => {
    const out = streamingStdout();
    out.write(bytes('side '));
    out.write(bytes('100\n'));

    expect(out.take()).toBe('side 100\n');
  });

  it('reassembles a character split across two writes', () => {
    /**
     * The reason `{ stream: true }` is there at all. `—` is three bytes, and Python is free to
     * hand them over in separate `write` calls; decoding each buffer independently would print
     * two replacement characters where the em dash was.
     */
    const em = bytes('—');
    const out = streamingStdout();
    out.write(em.slice(0, 1));
    out.write(em.slice(1));

    expect(out.take()).toBe('—');
  });

  it('does not carry a half-finished character into the next run', () => {
    /**
     * The defect. A run that ends mid-character leaves bytes in the decoder; without a flush they
     * are still there when the next run starts, and they surface prepended to whatever it writes
     * first. The learner sees a corrupted glyph at the top of a run that did nothing wrong, and
     * nothing on the screen connects it to the run before.
     */
    const out = streamingStdout();
    out.write(bytes('done').slice(0, 4));
    out.write(bytes('—').slice(0, 2)); // cut off mid-character
    out.take();

    out.write(bytes('clean\n'));
    expect(out.take()).toBe('clean\n');
  });

  it('shows a truncated character rather than dropping it silently', () => {
    // U+FFFD is the honest answer: something was written and could not be decoded. Dropping it
    // would tell the learner their program printed less than it did.
    const out = streamingStdout();
    out.write(bytes('—').slice(0, 2));

    expect(out.take()).toBe('�');
  });

  it('empties between runs, so nothing is printed twice', () => {
    const out = streamingStdout();
    out.write(bytes('first'));

    expect(out.take()).toBe('first');
    expect(out.take()).toBe('');
  });

  it('reports the byte count Pyodide expects from a write', () => {
    // `setStdout`'s contract: the number of bytes consumed. Returning anything else makes Pyodide
    // believe the write was short and retry it.
    const out = streamingStdout();
    const buffer = bytes('hello');

    expect(out.write(buffer)).toBe(buffer.length);
  });
});
