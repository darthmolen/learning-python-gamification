import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Markdown } from './Markdown';

/**
 * The renderer exists so the Tome can show `curriculum/area-N/lesson.md` without shipping a
 * markdown library or injecting HTML into the page. That buys a smaller surface and costs
 * coverage, so the rule it must never break is the last test here: **a construct this does not
 * know renders as its own text.** A lesson that comes out blank because of a syntax nobody
 * anticipated is worse than one with a stray `>` in it.
 */

const md = (text: string) => render(<Markdown text={text} />).container;

describe('the Tome renders a lesson', () => {
  it('drops the leading H1, which the screen has already printed', () => {
    const container = md('# First Light\n\nBy the end of this area you will have typed a line.');

    expect(container.querySelector('h1')).toBeNull();
    expect(screen.getByText(/By the end of this area/)).toBeInTheDocument();
    expect(container.textContent).not.toContain('First Light');
  });

  it('makes headings headings, beneath whatever the page already has', () => {
    md('## The first line\n\n### The dot matters');

    expect(screen.getByRole('heading', { level: 3, name: 'The first line' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'The dot matters' })).toBeInTheDocument();
  });

  it('takes the heading level it is given, so the page keeps one outline', () => {
    render(<Markdown text={'## Reading errors'} baseLevel={2} />);

    expect(screen.getByRole('heading', { level: 2, name: 'Reading errors' })).toBeInTheDocument();
  });

  it('separates paragraphs on blank lines rather than on newlines', () => {
    const container = md('One line\nwrapped by the author.\n\nA second paragraph.');

    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]?.textContent).toBe('One line wrapped by the author.');
  });

  it('builds a bullet list and a numbered list', () => {
    md('- forward\n- right\n\n1. Run it\n2. Read the error');

    const lists = screen.getAllByRole('list');
    expect(lists[0]?.tagName).toBe('UL');
    expect(within(lists[0] as HTMLElement).getAllByRole('listitem')).toHaveLength(2);
    expect(lists[1]?.tagName).toBe('OL');
    expect(within(lists[1] as HTMLElement).getByText('Read the error')).toBeInTheDocument();
  });

  /**
   * The mutant this file exists for. Every lesson is mostly Python, and a fence that falls
   * through to the paragraph branch loses the indentation — which in Python is the meaning.
   */
  it('keeps a fenced block whole, indentation and all, and reads nothing inside it as markup', () => {
    const container = md('```python\nfor n in range(4):\n    # not a heading\n    turtle.forward(100)\n```');

    const code = container.querySelector('pre code');
    expect(code?.textContent).toBe('for n in range(4):\n    # not a heading\n    turtle.forward(100)');
    expect(container.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
  });

  it('renders inline code and bold without eating the text around them', () => {
    const container = md('The `forward` that belongs to **turtle**, and *nothing else*.');

    expect(container.querySelector('code')?.textContent).toBe('forward');
    expect(container.querySelector('strong')?.textContent).toBe('turtle');
    expect(container.querySelector('em')?.textContent).toBe('nothing else');
    expect(container.textContent).toBe('The forward that belongs to turtle, and nothing else.');
  });

  /** Area 0's types table is teaching, not decoration — `int`, `float`, `str`, `bool` in a grid. */
  it('renders a pipe table as a table', () => {
    md('| Type | What it is |\n|---|---|\n| `int` | A whole number |\n| `str` | Text, in quotes |');

    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('columnheader').map((c) => c.textContent)).toEqual([
      'Type',
      'What it is',
    ]);
    expect(within(table).getByText('A whole number')).toBeInTheDocument();
  });

  /**
   * Found by rendering `curriculum/area-0/lesson.md` rather than a fixture. The types section
   * opens `**\`7\` and \`"7"\` are not the same thing**` and the variables section says
   * `*make \`length\` mean 100 from now on.*` — emphasis wrapped around code, twice on the page
   * that teaches types. Flat matching printed the backticks as punctuation, so the one sentence
   * distinguishing `7` from `"7"` showed both of them in the same face.
   */
  it('reads code inside bold and italic, which is how the lessons write it', () => {
    const container = md('**`7` and `"7"` are not the same thing**, and *make `length` mean 100*.');

    const strong = container.querySelector('strong');
    expect(strong?.querySelectorAll('code')).toHaveLength(2);
    expect(container.querySelector('em code')?.textContent).toBe('length');
    expect(container.textContent).not.toContain('`');
  });

  /**
   * A pipe line with no `|---|` under it is not a table, and it used to be nothing else either:
   * the paragraph branch broke on it before consuming it, so the parser never advanced and the
   * tab died on an out-of-memory rather than on a wrong-looking line. Found by the fenced-code
   * mutant, which took the same path.
   */
  it('does not hang on a pipe line that is not a table', () => {
    const container = md('| a stray pipe line |\n\nAnd the lesson continues.');

    expect(container.textContent).toContain('| a stray pipe line |');
    expect(container.textContent).toContain('And the lesson continues.');
  });

  /**
   * The rule that keeps the subset honest. Nothing here understands blockquotes, and the
   * lesson still arrives intact rather than arriving short.
   */
  it('shows a construct it does not understand as its own text', () => {
    const container = md('> Ask him what he expected before you tell him.');

    expect(container.textContent).toContain('> Ask him what he expected before you tell him.');
  });
});

/**
 * Glossary marks — `[[print]]` and `[[reading-errors|error message]]`.
 *
 * **The default is the important half.** `Markdown` is given a lookup only by the Tome screen;
 * the Quest screen deliberately passes none, because a floating card above the editor is the one
 * thing CLAUDE.md's no-pop-over rule exists to prevent. So the no-lookup path is not a fallback
 * for an error, it is the normal case on two of the three surfaces — and it must render the
 * author's words, never a bracket.
 */
describe('glossary marks', () => {
  const lookup = (id: string) =>
    id === 'print' ? { id, label: 'print', definition: 'Puts a value on the screen.' } : undefined;

  it('renders display text and no brackets when given no lookup', () => {
    const container = md('Use [[print]] and [[reading-errors|the error message]].');

    expect(container.textContent).toContain('Use print and the error message.');
    expect(container.textContent).not.toContain('[[');
  });

  it('renders a control when given a lookup', () => {
    render(<Markdown text="Use [[print]] here." term={lookup} />);

    expect(screen.getByRole('button', { name: 'print' })).toBeInTheDocument();
  });

  it('renders the author display text on the control, not the id', () => {
    render(<Markdown text="Read [[print|the printed line]] again." term={lookup} />);

    expect(screen.getByRole('button', { name: 'the printed line' })).toBeInTheDocument();
  });

  it('falls back to display text for an id the lookup does not know', () => {
    // Cannot ship — `validate:content` refuses an unknown id — but a screen must not print
    // brackets at a learner if one ever gets through.
    const container = render(<Markdown text="A [[mystery|word]] here." term={lookup} />).container;

    expect(container.textContent).toContain('A word here.');
    expect(container.textContent).not.toContain('[[');
  });

  it('leaves a mark inside a fenced block alone', () => {
    const container = md(['```markdown', '[[print]]', '```'].join('\n'));

    expect(container.querySelector('pre')?.textContent).toContain('[[print]]');
  });

  it('does not split a table row when a mark carries a pipe', () => {
    /**
     * The collision the review found. A pipe table splits its cells on `|`, and
     * `[[reading-errors|the error]]` contains one — so a naive parse order turns one row of two
     * cells into a row of three and silently corrupts the table.
     */
    const container = md(
      ['| Term | Means |', '|---|---|', '| [[print|the print call]] | writes a line |', ''].join('\n'),
    );

    const cells = container.querySelectorAll('tbody td');
    expect(cells).toHaveLength(2);
    expect(cells[0]?.textContent).toBe('the print call');
    expect(cells[1]?.textContent).toBe('writes a line');
  });
});

/**
 * Inline code that names a concept is hoverable, wherever it appears.
 *
 * **The bug this fixes was mine, and it was worse than doing nothing.** Area 0's lesson writes
 * `print` as code a dozen times and exactly one occurrence — an authored `[[print]]` in one
 * sentence — could be opened. The DM, reading it: "I see the word but I can't hover in the text."
 * A reference that works one time in twelve teaches the learner that hovering does not work, and
 * they stop trying.
 *
 * Authored marks handle prose, where the concept is named in words a matcher would never find —
 * `Variables`, `Reading an error`. This handles the other half: the curriculum already writes
 * every Python word as inline code, which is precisely where the learner meets it.
 *
 * It adds no decoration to make that true. Code spans are already accent-coloured mono; the ones
 * that carry a definition simply become live, with a dotted underline to separate them from the
 * ones that do not.
 */
describe('inline code that is a concept', () => {
  const lookup = (id: string) =>
    ['print', 'str', 'int'].includes(id)
      ? { id, label: id, definition: `What ${id} does.` }
      : undefined;

  it('is a control, and keeps the code text exactly', () => {
    render(<Markdown text="Use `print` to see it." term={lookup} />);

    const control = screen.getByRole('button', { name: 'print' });
    expect(control).toBeInTheDocument();
    expect(control.textContent).toBe('print');
  });

  it('opens the same definition the chip would', async () => {
    render(<Markdown text="Use `print` to see it." term={lookup} />);

    await userEvent.click(screen.getByRole('button', { name: 'print' }));
    expect(screen.getByText('What print does.')).toBeInTheDocument();
  });

  it('lights up every occurrence, not the first', async () => {
    /**
     * Consistency is the whole repair. One live `print` among twelve identical ones is the state
     * that confused a reader; making it depend on position would be a second rule they cannot see.
     */
    render(<Markdown text="First `print`, then `print` again, and `str` too." term={lookup} />);

    expect(screen.getAllByRole('button', { name: 'print' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'str' })).toBeInTheDocument();
  });

  it('leaves code that is not a concept as plain code', () => {
    const { container } = render(
      <Markdown text="Call `turtle.forward(100)` to move." term={lookup} />,
    );

    expect(screen.queryByRole('button', { name: 'turtle.forward(100)' })).not.toBeInTheDocument();
    expect(container.querySelector('code')?.textContent).toBe('turtle.forward(100)');
  });

  it('matches a bare call, because `print()` is the same word', async () => {
    render(<Markdown text="Call `print()` on it." term={lookup} />);

    expect(screen.getByRole('button', { name: 'print()' })).toBeInTheDocument();
  });

  it('does not reach inside a call that carries an argument', () => {
    // `int(sides)` is a use of `int`, not the word itself. Matching it would make the underline
    // unpredictable — the learner cannot tell which half of the text is the live part.
    render(<Markdown text="Write `int(sides)` instead." term={lookup} />);

    expect(screen.queryByRole('button', { name: /int/ })).not.toBeInTheDocument();
  });

  it('stays plain code when no lookup is given', () => {
    // The Field Manual and any surface without a lookup. Code is code.
    const { container } = render(<Markdown text="Use `print` here." />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('code')?.textContent).toBe('print');
  });

  it('leaves a fenced block alone, however many concepts it names', () => {
    const { container } = render(
      <Markdown text={['```python', 'print("hi")', '```'].join('\n')} term={lookup} />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelector('pre')?.textContent).toContain('print("hi")');
  });
});
