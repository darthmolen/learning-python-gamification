/**
 * What Python wrote, assembled from the bytes Pyodide hands over.
 *
 * `setStdout({ write })` takes raw bytes rather than lines, which is deliberate and is why this
 * exists at all: the line-buffered alternative strands anything without a trailing newline, and
 * `input("How long should each side be? ")` writes its prompt without one. See `runner.worker.ts`
 * for what that cost — a learner shown an `EOFError` and *not* the question he had been asked.
 *
 * **A decoder holds state, and that state must not outlive a run.** A multi-byte character can be
 * split across two `write` calls, so decoding needs `{ stream: true }` to hold the leading bytes
 * until the rest arrive. The consequence is that a run ending mid-character leaves bytes inside
 * the decoder — and a decoder shared across runs surfaces them at the top of the *next* one,
 * attached to output that did nothing to deserve them.
 *
 * That was the bug, found in review on PR #3. It is the same leak this module's own history
 * already records one layer up, where a stranded `input()` prompt survived into the following Run
 * and the console read "How long should each side be? How long should each side be? Done." In
 * bytes it would have been worse: not a repeated sentence anyone could recognise, but a single
 * wrong glyph at the start of a correct run, with nothing on screen connecting it to the run
 * before.
 *
 * So the stream is **ended** rather than merely emptied, and `take()` is the only way to read it.
 */
export interface StreamingStdout {
  /** Pyodide's `write` hook. Returns the number of bytes consumed, which is its whole contract. */
  write(buffer: Uint8Array): number;
  /**
   * Everything written since the last call, with the stream ended and the buffer reset.
   *
   * Ending it flushes any half-finished character as U+FFFD rather than discarding it. That is
   * the honest answer — something was written and could not be decoded — and it beats silently
   * printing less than the program produced.
   */
  take(): string;
}

export function streamingStdout(): StreamingStdout {
  let decoder = new TextDecoder();
  let text = '';

  return {
    write(buffer) {
      text += decoder.decode(buffer, { stream: true });
      return buffer.length;
    },
    take() {
      // `decode()` with no argument ends the stream and emits whatever was held back. The decoder
      // is replaced as well: one call, one guarantee, rather than relying on the reader of this
      // code to know that flushing also resets.
      const out = text + decoder.decode();
      text = '';
      decoder = new TextDecoder();
      return out;
    },
  };
}
