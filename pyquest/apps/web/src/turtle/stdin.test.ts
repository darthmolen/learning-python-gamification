import { describe, expect, it } from 'vitest';
import { stdinFrom } from './stdin.ts';

/**
 * What `input()` reads in the browser.
 *
 * The bug this exists for: Pyodide has no stdin unless it is given one, so Area 0's
 * `a0-ask-and-draw` — the quest that *teaches* `input()` — answered `OSError: [Errno 29] I/O
 * error` on Run. Its own starter tells the learner "Run it first and read what falls out before
 * you fix anything", and what fell out was a fault in the runner rather than the `TypeError` the
 * session is about.
 */

const drain = (text: string, times: number): (string | null)[] => {
  const next = stdinFrom(text);
  return Array.from({ length: times }, () => next());
};

describe('feeding input() from the box', () => {
  it('hands back one line per call, in order', () => {
    expect(drain('150\n40\n', 2)).toEqual(['150', '40']);
  });

  /**
   * Every text box ends with a newline when somebody presses Enter out of habit. A phantom `''`
   * would answer a question he meant to answer himself, and it would do it invisibly.
   */
  it('does not turn a trailing newline into a spare blank answer', () => {
    expect(drain('150\n', 2)).toEqual(['150', null]);
  });

  /**
   * `null` is how Pyodide signals end-of-stream, which is how Python raises `EOFError`. That is
   * the right error: it is what `python his_file.py < /dev/null` does, and it means "you asked
   * more questions than you gave answers". Handing back `''` instead would give his program a
   * silent empty string that fails later and somewhere else.
   */
  it('runs out rather than repeating the last answer', () => {
    expect(drain('150\n', 3)).toEqual(['150', null, null]);
  });

  it('treats an empty box as no input at all, not as one blank line', () => {
    expect(drain('', 1)).toEqual([null]);
  });

  /** A blank line he typed on purpose is an answer — pressing Enter at a prompt is legal. */
  it('keeps a blank line that is followed by another', () => {
    expect(drain('\n40\n', 3)).toEqual(['', '40', null]);
  });

  /** This repository checks out CRLF on Windows, and a stray `\r` reaches Python as text. */
  it('strips the carriage returns Windows puts in', () => {
    expect(drain('150\r\n40\r\n', 2)).toEqual(['150', '40']);
  });

  it('gives each run its own queue, so pressing Run twice reads from the top', () => {
    const first = stdinFrom('150\n');
    first();
    // Session 5 is "type 150, then try 40". A queue shared between runs would starve the second.
    expect(stdinFrom('150\n')()).toBe('150');
  });
});
