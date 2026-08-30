import { describe, expect, it } from 'vitest';
import { INITIAL, isUnchanged, reduce, statusLine, type RunState } from './runner.ts';

const after = (...events: Parameters<typeof reduce>[1][]): RunState =>
  events.reduce(reduce, INITIAL);

/**
 * Run's state machine, apart from React, the worker and Pyodide.
 *
 * Run is browser-side and records nothing (§6.3); Submit is the one the game sees. Everything
 * worth being sure about here is a transition, so the transitions are a pure function and the
 * worker is left with nothing to decide.
 */
describe('running', () => {
  it('starts idle with an empty console', () => {
    expect(INITIAL.phase).toBe('idle');
    expect(INITIAL.ops).toEqual([]);
  });

  it('goes to running, and clears what the last run left behind', () => {
    const stale = after({ kind: 'finished', ops: [{ op: 'forward', args: [10] }], stdout: 'old', error: null });
    const fresh = reduce(stale, { kind: 'start' });

    expect(fresh.phase).toBe('running');
    expect(fresh.ops).toEqual([]);
    expect(fresh.stdout).toBe('');
    expect(fresh.error).toBeNull();
  });

  it('lands on ran when the program finished clean', () => {
    const state = after({ kind: 'start' }, { kind: 'finished', ops: [], stdout: 'hello\n', error: null });

    expect(state.phase).toBe('ran');
    expect(state.stdout).toBe('hello\n');
  });

  it('lands on raised when it threw, and keeps the traceback', () => {
    const state = after({ kind: 'start' }, { kind: 'finished', ops: [], stdout: '', error: 'NameError: x' });

    expect(state.phase).toBe('raised');
    expect(state.error).toBe('NameError: x');
  });

  /**
   * The property the whole shim is built around: a program that raises halfway through keeps
   * every stroke it managed. The drawing he got to keep sits beside the traceback, because that
   * is what he needs in order to see *where* it broke.
   */
  it('keeps the strokes a failed program managed before it failed', () => {
    const partial = [{ op: 'forward', args: [100] }, { op: 'right', args: [90] }];
    const state = after({ kind: 'start' }, { kind: 'finished', ops: partial, stdout: '', error: 'ZeroDivisionError' });

    expect(state.phase).toBe('raised');
    expect(state.ops).toEqual(partial);
  });

  /**
   * The payoff of ADR 0003. A worker can be terminated; a main thread running a hot loop cannot
   * service the click that would stop it. `while True:` is week-three material, so this is not
   * a hypothetical.
   */
  it('can be stopped mid-run, and says so rather than pretending it finished', () => {
    const state = after({ kind: 'start' }, { kind: 'stopped' });

    expect(state.phase).toBe('stopped');
    expect(state.error).toBeNull();
  });

  it('ignores a result that arrives after it was stopped', () => {
    const state = after(
      { kind: 'start' },
      { kind: 'stopped' },
      { kind: 'finished', ops: [], stdout: 'too late', error: null },
    );

    expect(state.phase).toBe('stopped');
    expect(state.stdout).toBe('');
  });
});

/**
 * The prototype's vocabulary, kept: `Run · browser`, `Run · raised`, `Console`.
 *
 * State goes in the line beside the button, never in the button's label — "Labels never change
 * with state" (CLAUDE.md), and this is the screen where the temptation is strongest.
 */
describe('the status line', () => {
  it('says Console before anything has run', () => {
    expect(statusLine(INITIAL)).toBe('Console');
  });

  it('names the browser, because Run is not what the game sees', () => {
    expect(statusLine(after({ kind: 'start' }, { kind: 'finished', ops: [], stdout: '', error: null })))
      .toBe('Run · browser');
  });

  it('says raised rather than failed, because nothing was being judged', () => {
    expect(statusLine(after({ kind: 'start' }, { kind: 'finished', ops: [], stdout: '', error: 'boom' })))
      .toBe('Run · raised');
  });

  it('says it is running while it runs', () => {
    expect(statusLine(after({ kind: 'start' }))).toBe('Run · working');
  });

  it('says it was stopped by him, not that it broke', () => {
    expect(statusLine(after({ kind: 'start' }, { kind: 'stopped' }))).toBe('Run · stopped');
  });
});

/**
 * "The prototype's Submit already parses the editor rather than counting clicks — keep that
 * property: a Submit that passes on unchanged code is a lie about the mechanic."
 *
 * The API does not exist yet, so Submit cannot be wired. This is the half of it that can be
 * built now and is the half that carries the meaning.
 */
describe('Submit refuses to pretend', () => {
  const starter = 'def can_craft(inventory, recipe):\n    pass\n';

  it('knows untouched code when it sees it', () => {
    expect(isUnchanged(starter, starter)).toBe(true);
  });

  it('is not fooled by reformatting, because reformatting is not work', () => {
    expect(isUnchanged('def can_craft(inventory,recipe):\n  pass', starter)).toBe(true);
  });

  it('accepts code that actually changed', () => {
    expect(isUnchanged(`${starter}    return True\n`, starter)).toBe(false);
  });
});
