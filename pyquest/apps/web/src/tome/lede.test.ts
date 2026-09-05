import { describe, expect, it } from 'vitest';
import { lede } from './lede.ts';

/**
 * A hover card is a glance, not a page.
 *
 * The DM, looking at a card opened from the `Variables` heading: the whole entry had spilled out —
 * two paragraphs, a fenced `python` block and an italic aside — as raw markdown, in the heading's
 * bold, over the lesson. "The mouse-over should have stopped at *hunting for every copy*."
 *
 * So the card takes the **lede**: the entry's first paragraph, which in every authored glossary
 * entry is the definition, with the elaboration and the examples below it. Those still exist and
 * are still worth reading — the concept chips at the top of the screen render the whole entry,
 * rich, which is the reading surface. Two surfaces, two jobs.
 */
describe('lede', () => {
  it('takes the first paragraph and stops', () => {
    expect(lede('A name for a value.\nIt can change.\n\nMore about it later.')).toBe(
      'A name for a value. It can change.',
    );
  });

  it('stops before a fenced example', () => {
    // The case from the screenshot: a ```python block ran into the card as literal backticks.
    expect(lede('Puts something in the terminal.\n\n```python\nprint("hi")\n```\n\nAnd more.')).toBe(
      'Puts something in the terminal.',
    );
  });

  it('never contains a fence marker, whatever the entry looks like', () => {
    expect(lede('```python\nx = 1\n```\n\nThe definition.')).not.toContain('```');
  });

  it('reads code as words rather than as backticks', () => {
    // `str` opens with "Text, in quotation marks: `"hello"`, `"7"`." — backticks in a card that
    // cannot render them are just punctuation the learner has to look past.
    expect(lede('Text, in quotation marks: `"hello"`, `"7"`.')).toBe(
      'Text, in quotation marks: "hello", "7".',
    );
  });

  it('drops bold and italic markers', () => {
    expect(lede('**What it hands back is always a `str`.** Always.')).toBe(
      'What it hands back is always a str. Always.',
    );
  });

  it('keeps an entry that is already one short line intact', () => {
    expect(lede('The branch you are on.')).toBe('The branch you are on.');
  });

  it('answers empty for an entry with nothing in it', () => {
    expect(lede('')).toBe('');
    expect(lede('\n\n')).toBe('');
  });
});
