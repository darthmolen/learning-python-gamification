/**
 * The glossary parser's own tests.
 *
 * One parser, three readers: the validator checks that every concept has a definition, the API
 * serves it to the Quest screen, and the Field Manual prints it. A `## ` regex written three
 * times is three chances to disagree about what a heading is, and the disagreement would be
 * silent — the validator would pass a file the API then read differently.
 *
 * So the split lives here, and these tests are what it is worth. The fenced-code case is the one
 * that matters: `## ` at the start of a line inside a code block is a comment, not a heading, and
 * the inline regex this replaces could not tell the difference.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseGlossary } from '../src/glossary.ts';

const glossary = (area: number): string =>
  readFileSync(
    fileURLToPath(new URL(`../../../../curriculum/area-${area}/glossary.md`, import.meta.url)),
    'utf8',
  );

describe('parseGlossary', () => {
  it('keys each definition by its heading', () => {
    const parsed = parseGlossary(['## alpha', '', 'The first one.', '', '## beta', '', 'The second.', ''].join('\n'));

    expect([...parsed.keys()]).toEqual(['alpha', 'beta']);
    expect(parsed.get('alpha')).toBe('The first one.');
    expect(parsed.get('beta')).toBe('The second.');
  });

  it('keeps everything up to the next heading, blank lines and all', () => {
    const parsed = parseGlossary(
      ['## alpha', '', 'One.', '', 'Two.', '', '## beta', '', 'Other.', ''].join('\n'),
    );

    expect(parsed.get('alpha')).toBe('One.\n\nTwo.');
  });

  it('does not start a new entry on a `##` inside a fenced block', () => {
    /**
     * The case the inline regex got wrong. A definition that shows Python code is free to write
     * a `##` comment at the start of a line, and it is not a new concept — it is the example.
     * Without this the parser invents a concept named after a comment, and the validator built
     * on it reports `\`# a heading-looking comment\` is not a concept` at an author who wrote
     * ordinary Python.
     */
    const parsed = parseGlossary(
      [
        '## alpha',
        '',
        '```python',
        '## not a heading',
        'x = 1',
        '```',
        '',
        'Still alpha.',
        '',
        '## beta',
        '',
        'Other.',
        '',
      ].join('\n'),
    );

    expect([...parsed.keys()]).toEqual(['alpha', 'beta']);
    expect(parsed.get('alpha')).toContain('## not a heading');
    expect(parsed.get('alpha')).toContain('Still alpha.');
  });

  it('leaves a `#` heading and a `###` subheading alone', () => {
    // The file's own title is `#`, and a definition may use `###` inside itself. Only `##` is a
    // concept boundary, which is the contract `glossaryIssues` has always assumed.
    const parsed = parseGlossary(
      ['# The glossary', '', 'Preamble.', '', '## alpha', '', '### A note', '', 'Body.', ''].join('\n'),
    );

    expect([...parsed.keys()]).toEqual(['alpha']);
    expect(parsed.get('alpha')).toBe('### A note\n\nBody.');
  });

  it('ignores prose before the first heading', () => {
    const parsed = parseGlossary(['# Title', '', 'Not a definition.', '', '## alpha', '', 'Is one.', ''].join('\n'));

    expect([...parsed.keys()]).toEqual(['alpha']);
  });

  it('returns nothing for a file with no headings', () => {
    expect(parseGlossary('# Title\n\nJust prose.\n').size).toBe(0);
  });

  it('reads the authored glossaries, and every entry has a body', () => {
    // The parser is only worth what it does to the real files. An entry that parses to an empty
    // string is a heading with no definition under it, which is the failure the validator's
    // `glossary-gap` rule cannot see — it counts headings.
    for (const area of [0, 1, 2, 3, 4, 5, 6, 7]) {
      const parsed = parseGlossary(glossary(area));
      expect(parsed.size, `area ${area} defines nothing`).toBeGreaterThan(0);
      for (const [id, body] of parsed) {
        expect(body.length, `area ${area}: \`${id}\` has an empty definition`).toBeGreaterThan(0);
      }
    }
  });

  it('finds the same headings the validator has always found', () => {
    /**
     * The zero-delta measurement, held still. The parser replaces
     * `/^## ([^\n]+?)\s*$/gm` inside `glossaryIssues`, and no authored glossary currently puts a
     * `##` inside a fence — so the two must agree today, exactly. The day they stop agreeing is
     * the day somebody writes a Markdown example into a definition, and this test says so
     * rather than letting the validator quietly change its mind.
     */
    for (const area of [0, 1, 2, 3, 4, 5, 6, 7]) {
      const text = glossary(area);
      const old = [...text.matchAll(/^## ([^\n]+?)\s*$/gm)].map((m) => m[1]);
      expect([...parseGlossary(text).keys()], `area ${area}`).toEqual(old);
    }
  });
});
