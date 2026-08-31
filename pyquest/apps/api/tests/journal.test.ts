import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { splitEntries } from '../src/journal.ts';

/**
 * Splitting one `journal.md` back into the entries the ledger paid for.
 *
 * Every case here is a string, because `journal.ts` has no I/O — which is the point of it being a
 * module rather than a few lines inside the route handler. The rules it encodes are §5.6's and
 * ADR 0004's, and they are worth more than the twenty lines that implement them.
 */

const REPO_ROOT = fileURLToPath(new URL('../../../..', import.meta.url));

/** An entry as the template produces one, so the fixtures are not a private idea of the format. */
const entry = (date: string, body: string, reply?: string): string =>
  [
    `## ${date} — Session 01`,
    '',
    '### What I built',
    '',
    '<!-- Specific. Names of files, names of variables. -->',
    '',
    body,
    '',
    '### DM reply',
    '',
    reply === undefined
      ? '<!-- Dad writes here. Reply to what was written, not to how it was written. -->'
      : reply,
    '',
  ].join('\n');

describe('splitting a journal into entries', () => {
  it('finds each dated entry and keys it the way the ledger does', () => {
    const file = ['# Journal', '', entry('2026-08-31', 'A hexagon.'), entry('2026-09-07', 'A spiral.')].join('\n');

    const entries = splitEntries(file);

    expect([...entries.keys()]).toEqual(['2026-08-31', '2026-09-07']);
    expect(entries.get('2026-08-31')?.body).toContain('A hexagon.');
    expect(entries.get('2026-09-07')?.body).toContain('A spiral.');
  });

  /**
   * **The reply assertion is the load-bearing half, and it was missing.** A mutant that ran every
   * entry to the end of the file survived a version of this test that checked only `body` — the
   * next entry does not leak into the body, because `sectionOf` stops at this entry's own
   * `### DM reply`. It leaks into the **reply**, so an unanswered entry comes back answered with
   * the whole rest of the year. Caught by seeding it, which is the entire argument for doing so.
   */
  it('does not leak one entry into the next, in the body or in the reply', () => {
    const file = [entry('2026-08-31', 'A hexagon.'), entry('2026-09-07', 'A spiral.')].join('\n');

    const first = splitEntries(file).get('2026-08-31');
    expect(first?.body).not.toContain('A spiral.');
    expect(first?.reply).toBeUndefined();
  });

  /** His `# Journal` title and anything above entry one belong to nobody. */
  it('drops the preamble rather than attaching it to the first entry', () => {
    const file = ['# Journal', '', 'This is my log for the year.', '', entry('2026-08-31', 'A hexagon.')].join('\n');

    expect(splitEntries(file).get('2026-08-31')?.body).not.toContain('log for the year');
  });

  /* -----------------------------------------------------------------------------------------
   * The reply — §5.6's half that makes it a conversation
   * --------------------------------------------------------------------------------------- */

  it('lifts the DM reply out of the body, because the two have different authors', () => {
    const entries = splitEntries(entry('2026-08-31', 'A hexagon.', 'Which side did you count first?'));

    expect(entries.get('2026-08-31')?.reply).toBe('Which side did you count first?');
    expect(entries.get('2026-08-31')?.body).not.toContain('Which side did you count first?');
  });

  /**
   * The case the success criteria name, and the one a naive implementation gets wrong.
   *
   * The template ships `### DM reply` with coaching under it from the first entry, so the section
   * is never literally empty. A screen testing it for text would render every unanswered entry as
   * answered — with a note addressed to the parent.
   */
  it('reads an unanswered reply as no reply, not as the template’s coaching', () => {
    const entries = splitEntries(entry('2026-08-31', 'A hexagon.'));

    expect(entries.get('2026-08-31')?.reply).toBeUndefined();
  });

  it('accepts the older ## DM reply heading, since an entry may be copied from an old one', () => {
    const file = ['## 2026-08-31', '', 'A hexagon.', '', '## DM reply', '', 'Nice.'].join('\n');

    expect(splitEntries(file).get('2026-08-31')?.reply).toBe('Nice.');
  });

  /* -----------------------------------------------------------------------------------------
   * The coaching comments
   * --------------------------------------------------------------------------------------- */

  it('strips the template’s comments, which are the curriculum talking rather than him', () => {
    const entries = splitEntries(entry('2026-08-31', 'A hexagon.'));

    expect(entries.get('2026-08-31')?.body).not.toContain('Specific.');
    expect(entries.get('2026-08-31')?.body).not.toContain('<!--');
  });

  /* -----------------------------------------------------------------------------------------
   * What must not parse
   * --------------------------------------------------------------------------------------- */

  it('ignores a heading whose date is not a date', () => {
    const file = ['## Aug 31 — Session 01', '', 'A hexagon.'].join('\n');

    expect(splitEntries(file).size).toBe(0);
  });

  /**
   * `## 2026-08-311` must not become 2026-08-31. Without the trailing `\b` it does, and a day's
   * writing gets attached to a different day's paid row — wrong, and silent.
   */
  it('does not truncate a longer number into a valid date', () => {
    expect(splitEntries('## 2026-08-311\n\nA hexagon.').size).toBe(0);
  });

  it('is not fooled by a ### heading, which is a prompt rather than an entry', () => {
    expect(splitEntries('### 2026-08-31\n\nA hexagon.').size).toBe(0);
  });

  it('keeps the last section when a date appears twice, because the ledger holds one row', () => {
    const file = [entry('2026-08-31', 'First sitting.'), entry('2026-08-31', 'Second sitting.')].join('\n');

    const entries = splitEntries(file);
    expect(entries.size).toBe(1);
    expect(entries.get('2026-08-31')?.body).toContain('Second sitting.');
  });

  it('finds nothing in an empty file rather than throwing', () => {
    expect(splitEntries('').size).toBe(0);
  });

  /* -----------------------------------------------------------------------------------------
   * Against the real template
   * --------------------------------------------------------------------------------------- */

  /**
   * The fixtures above are this test's idea of the format. This one is the curriculum's.
   *
   * `journal-path.test.ts` spans the same seam for the *path*; this spans it for the *shape*. If
   * somebody edits `TEMPLATE.md` into a form the parser cannot read, the learner's Journal stops
   * rendering and nothing else in the suite would notice — which is exactly the failure that cost
   * this feature two days.
   */
  it('parses an entry pasted from the curriculum’s own TEMPLATE.md', () => {
    const template = readFileSync(`${REPO_ROOT}/curriculum/area-0/journal/TEMPLATE.md`, 'utf8');
    const pasted = template
      .slice(template.indexOf('## YYYY-MM-DD'))
      .replace('## YYYY-MM-DD — Session NN', '## 2026-08-31 — Session 01');

    const entries = splitEntries(pasted);

    expect([...entries.keys()]).toEqual(['2026-08-31']);
    expect(entries.get('2026-08-31')?.reply).toBeUndefined();
    expect(entries.get('2026-08-31')?.body).toContain('What I built');
    expect(entries.get('2026-08-31')?.body).not.toContain('<!--');
  });
});
