import { render, screen, within } from '@testing-library/react';
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
