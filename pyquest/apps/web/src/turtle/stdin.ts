/**
 * What `input()` reads, when the program is running in a browser.
 *
 * **A worker has no `prompt()` and Pyodide has no stdin unless it is given one.** Without this,
 * `input("How long should each side be? ")` raises `OSError: [Errno 29] I/O error` — which is
 * what Area 0's `a0-ask-and-draw` did on Run, on a quest whose own starter says *"Run it first
 * and read what falls out before you fix anything."* The error he was told to read is a
 * `TypeError` about passing a str to `forward()`; what he got was a fault in the runner, and an
 * evening spent debugging the tool instead of the bug.
 *
 * So Run takes its input up front, from a box beside the editor, and hands it to Python a line at
 * a time. It is not a live prompt — the program does not visibly pause — and that trade buys
 * something worth having: **the run is repeatable.** Session 5 asks him to type 150, then try 40,
 * and see that a submission which hardcodes the perimeter passes once and fails once. Editing a
 * box and pressing Run again is a better shape for that than answering a modal twice.
 */

/**
 * The lines of the input box, in order, then EOF.
 *
 * Returns `null` once they run out, which is how Pyodide signals end-of-stream and therefore how
 * Python raises `EOFError: EOF when reading a line`. **That is the correct error and it is worth
 * not smoothing over**: it is exactly what `python his_file.py < /dev/null` does, it means "you
 * asked more questions than you gave answers", and inventing an empty string instead would hand
 * his program a silent `""` that fails later and further away.
 *
 * A trailing newline does not become a phantom blank line — every text box ends with one when a
 * person presses Enter out of habit, and a spare `""` would answer a question he meant to answer
 * himself.
 */
export function stdinFrom(text: string): () => string | null {
  const lines = text.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');
  /* An empty box is no input at all, not one empty line. */
  const queue = text === '' ? [] : lines;
  let next = 0;

  return () => (next < queue.length ? (queue[next++] as string) : null);
}
