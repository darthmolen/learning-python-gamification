/**
 * The glossary surfaces, against the **authored** Area 0 content rather than a fixture.
 *
 * Every other test here builds its own concepts, which keeps them fast and hermetic and also keeps
 * them ignorant of what the curriculum actually looks like. Three of this feature's real defects
 * were invisible to fixtures, and each one reached a browser:
 *
 * * no fixture definition contained a fenced example, so nothing had ever rendered one — and the
 *   entry that broke the hover card was `variables`, whose example spilled out as raw backticks;
 * * no fixture lesson was long enough to show that `print` was live once in a dozen occurrences;
 * * `str`, `int`, `float` and `bool` carry no authored mark anywhere, so only the real lesson
 *   could show that they were unreachable.
 *
 * It reads `curriculum/area-0/` directly. That couples the SPA suite to authored content on
 * purpose: if somebody rewrites an entry into a shape these surfaces cannot show, this is what
 * says so.
 */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseGlossary } from '@pyquest/content/browser';
import { ConceptList } from '../shell/ui';
import { Markdown } from '../tome/Markdown';

/** Relative to `pyquest/`, which is where vitest runs from. */
const glossary = parseGlossary(readFileSync('../curriculum/area-0/glossary.md', 'utf8'));

const concepts = ['print', 'input', 'str', 'f-strings', 'variables'].map((id) => ({
  id,
  label: id,
  definition: glossary.get(id),
}));

describe('every real area-0 definition opens on a chip', () => {
  it('is reading real entries, or every case below is vacuous', () => {
    expect(concepts.every((c) => (c.definition ?? '').length > 50)).toBe(true);
  });

  for (const c of concepts) {
    it(`opens ${c.id}`, async () => {
      render(<ConceptList concepts={concepts} expandable />);
      const chip = within(screen.getByRole('list', { name: 'Concepts' })).getByRole('button', {
        name: c.id,
      });

      await userEvent.click(chip);

      expect(chip).toHaveAttribute('aria-expanded', 'true');
      // The opening words of the real entry, backticks removed because the renderer turns them
      // into elements. Enough to prove the definition arrived rather than an empty panel.
      const opening = (c.definition ?? '').split('\n')[0]!.slice(0, 30).replace(/`/g, '');
      expect(document.body.textContent).toContain(opening);
    });
  }
});

/**
 * How many words of a real lesson a learner can actually hover.
 *
 * The failure this pins was a ratio, not a crash: Area 0 writes `print` as code a dozen times and
 * exactly one occurrence — an authored mark in one sentence — used to open. "I see the word but I
 * can't hover in the text." A reference that works one time in twelve teaches a reader to stop
 * trying, so the number is the thing worth asserting.
 */
describe('the real area-0 lesson, rendered', () => {
  const lesson = readFileSync('../curriculum/area-0/lesson.md', 'utf8');
  const term = (id: string) => {
    const definition = glossary.get(id);
    return definition === undefined ? undefined : { id, label: id, definition };
  };

  it('makes more than the one authored occurrence of `print` live', () => {
    /**
     * The number is the finding. Before inline code resolved, this lesson had exactly **one**
     * openable `print` — an authored `[[print]]` in a single sentence — while writing the word as
     * code a dozen times. One in twelve is worse than none: it teaches a reader that hovering does
     * not work, so they stop.
     *
     * Three now: the authored mark plus the two bare `` `print` `` spans in the prose. Asserted as
     * "more than one" rather than "exactly three", because the right number is the author's to
     * change and this check is about the ratio, not the count.
     */
    render(<Markdown text={lesson} term={term} />);

    expect(
      screen.getAllByRole('button', { name: 'print' }).length,
      'only the authored mark is live again',
    ).toBeGreaterThan(1);
  });

  it('covers the words the lesson teaches, including ones nobody marked', () => {
    /**
     * `str`, `int`, `float` and `bool` carry **no authored mark anywhere** — they appear in Area 0
     * only inside code, which is exactly why the authored-marks-only pass could never reach them
     * and why the DM could see `str` and not hover it.
     */
    render(<Markdown text={lesson} term={term} />);

    for (const id of ['print', 'input', 'str', 'int', 'float', 'bool']) {
      expect(
        screen.getAllByRole('button', { name: id }).length,
        `${id} is never hoverable in the lesson`,
      ).toBeGreaterThan(0);
    }
  });

  it('leaves an expression that merely uses a concept as plain code', () => {
    // `turtle.forward(100)` and `int(sides)` are uses, not the word. Underlining part of an
    // expression would make the live region unguessable.
    render(<Markdown text={lesson} term={term} />);

    expect(screen.queryByRole('button', { name: 'turtle.forward(100)' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'int(sides)' })).not.toBeInTheDocument();
  });
});

/**
 * Two surfaces, two amounts — asserted on the entry that showed the problem.
 *
 * Opening the `Variables` heading in a lesson produced a card carrying the whole entry: two
 * paragraphs, a fenced `python` block and an italic aside, as raw markdown, in the heading's bold,
 * over the text being read. "The mouse-over should have stopped at *hunting for every copy*."
 */
describe('the card glances and the chip reads', () => {
  const variables = glossary.get('variables') ?? '';
  const concept = { id: 'variables', label: 'variables', definition: variables };

  it('is reading the real entry, or both assertions below are vacuous', () => {
    expect(variables).toContain('hunting for every copy');
    expect(variables, 'the entry no longer carries an example').toContain('```');
  });

  it('gives the hover card the first paragraph and nothing after it', async () => {
    render(<Markdown text="See [[variables|Variables]] here." term={() => concept} />);
    await userEvent.click(screen.getByRole('button', { name: 'Variables' }));

    const card = screen.getByRole('tooltip');
    expect(card.textContent).toContain('hunting for every copy');
    // The three things that spilled into it: the fence, the code, and the aside below it.
    expect(card.textContent).not.toContain('```');
    expect(card.textContent).not.toContain('turtle.forward');
    expect(card.textContent).not.toContain('equals of mathematics');
  });

  it('gives the chip the whole entry, rendered', async () => {
    render(<ConceptList concepts={[concept]} expandable />);
    await userEvent.click(
      within(screen.getByRole('list', { name: 'Concepts' })).getByRole('button', { name: 'variables' }),
    );

    // Everything the card left out, and the code as an actual code block rather than backticks.
    expect(document.body.textContent).toContain('hunting for every copy');
    expect(document.body.textContent).toContain('equals of mathematics');
    expect(document.querySelector('pre')?.textContent).toContain('turtle.forward(length)');
    expect(document.body.textContent).not.toContain('```');
  });
});
