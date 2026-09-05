/**
 * The glossary mark's own tests.
 *
 * `[[print]]` in a lesson says *this word has a definition, and the reader may open it*. It is
 * authored deliberately — the alternative, matching concept ids against every inline code span,
 * was measured and rejected because Area 1's lesson would light up seventeen times and an author
 * could not opt one occurrence out.
 *
 * **Three things parse this and only one of them shows a card**, which is why the parser is here
 * rather than in a renderer: the Tome screen marks terms, the Quest screen and the Field Manual
 * render the display text plain, and `validate:content` refuses an id that is not a concept. A
 * heading rule written three times is three chances to disagree — the argument `parseGlossary`
 * already makes, applied to the second piece of syntax the curriculum carries.
 */

import { describe, expect, it } from 'vitest';
import { parseMarks, stripMarks } from '../src/marks.ts';

describe('parseMarks', () => {
  it('finds a bare mark and reports the id as its own display text', () => {
    expect(parseMarks('Use [[print]] to see the value.')).toEqual([
      { id: 'print', text: 'print', start: 4, end: 13 },
    ]);
  });

  it('finds a piped mark and reports the display text', () => {
    // Target first, MediaWiki's order. The display text may be anything, including a phrase the
    // sentence needs — which is the whole reason the pipe exists.
    expect(parseMarks('Read the [[reading-errors|error message]] on purpose.')).toEqual([
      { id: 'reading-errors', text: 'error message', start: 9, end: 41 },
    ]);
  });

  it('finds every mark in a paragraph, in order', () => {
    const marks = parseMarks('[[print]] and [[input]] and [[str|strings]].');
    expect(marks.map((m) => m.id)).toEqual(['print', 'input', 'str']);
    expect(marks.map((m) => m.text)).toEqual(['print', 'input', 'strings']);
  });

  it('leaves a mark inside a fenced block alone', () => {
    /**
     * The same case `parseGlossary` guards, for the same reason: a lesson that teaches this
     * syntax will show it, and a parser that could not tell the example from the thing would
     * make the page documenting marks impossible to write.
     */
    const text = ['Before.', '', '```markdown', 'Use [[print]] here.', '```', '', '[[input]] after.'].join('\n');
    expect(parseMarks(text).map((m) => m.id)).toEqual(['input']);
  });

  it('leaves a mark inside an inline code span alone', () => {
    // Same argument at a smaller scale. `` `[[print]]` `` is how a sentence names the syntax.
    expect(parseMarks('Write `[[print]]` to mark it.')).toEqual([]);
  });

  it('treats a backslash as an escape and finds no mark', () => {
    expect(parseMarks(String.raw`A literal \[[print]] stays put.`)).toEqual([]);
  });

  it('does not match across a line break, so an unclosed mark cannot swallow a paragraph', () => {
    /**
     * The failure this prevents is silent and large: an author who types `[[print` and moves on
     * would otherwise have every following `]]` in the file close it, and the mark would eat
     * whatever lay between. Marks are small by construction.
     */
    expect(parseMarks('An unclosed [[print\nand the next line.')).toEqual([]);
  });

  it('ignores an empty id', () => {
    expect(parseMarks('[[]] and [[|words]]')).toEqual([]);
  });
});

describe('stripMarks', () => {
  it('replaces each mark with its display text', () => {
    expect(stripMarks('Use [[print]] and [[str|strings]].')).toBe('Use print and strings.');
  });

  it('leaves a fenced example exactly as written', () => {
    const text = ['```markdown', '[[print]]', '```'].join('\n');
    expect(stripMarks(text)).toBe(text);
  });

  it('resolves the escape to a literal', () => {
    expect(stripMarks(String.raw`A literal \[[print]] stays.`)).toBe('A literal [[print]] stays.');
  });

  it('leaves prose with no marks untouched', () => {
    const text = 'Nothing to do here — no marks, and a [single] bracket.';
    expect(stripMarks(text)).toBe(text);
  });

  it('is what every renderer without a lookup falls back to', () => {
    /**
     * The rule that makes each surface safe by default rather than by remembering: **a mark that
     * cannot or should not open renders as its display text.** The Field Manual is static HTML
     * and the Quest screen deliberately shows no cards over the editor; both call this, and
     * neither can print a bracket at a learner.
     */
    expect(stripMarks('The [[reading-errors|error message]] is the point.')).not.toContain('[[');
  });
});
