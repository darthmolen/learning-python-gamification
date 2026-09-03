import { Fragment, type ReactNode } from 'react';
import { color, font } from '../design/tokens';

/**
 * The lessons, rendered — a documented subset of markdown, straight to React elements.
 *
 * `curriculum/area-N/lesson.md` is the teaching, and until now the only thing that could read it
 * was the static Field Manual. This is what lets the Tome show it in the SPA.
 *
 * **No library and no `dangerouslySetInnerHTML`.** The contract already ruled on where this work
 * belongs — "The brief's markdown, read from the content root. Rendering is the UI's" — and the
 * app has no HTML-injection surface today, which is a property worth keeping for the sake of one
 * dependency. The cost is coverage, and the rule that pays for it is `passthrough` below: a
 * construct this does not know renders as its own text. A lesson arriving with a stray `>` in it
 * is a blemish; a lesson arriving three paragraphs short is a child taught less than we wrote.
 *
 * The supported set is what the lessons actually use, counted rather than guessed: headings,
 * paragraphs, bullet and numbered lists, fenced code, pipe tables, and inline code, bold and
 * italic.
 */

type Block =
  | { kind: 'heading'; hashes: number; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'code'; code: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'table'; header: string[]; rows: string[][] };

const FENCE = /^\s*```/;
const HEADING = /^(#{1,6})\s+(.+)$/;
const BULLET = /^\s*[-*]\s+(.+)$/;
const NUMBERED = /^\s*\d+\.\s+(.+)$/;
const TABLE_ROW = /^\s*\|.*\|\s*$/;
/** The `|---|---|` line, which is what separates a table from a paragraph full of pipes. */
const TABLE_RULE = /^\s*\|[\s:|-]+\|\s*$/;

const cells = (line: string): string[] =>
  line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());

/**
 * Markdown to blocks.
 *
 * The leading `# H1` is dropped, the same way `apps/field-manual/src/build.ts` drops it: every
 * lesson opens by repeating the area's title and the screen has already printed that, so
 * rendering both reads as a stutter.
 */
function parse(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  let titleDropped = false;

  while (i < lines.length) {
    const line = lines[i] ?? '';

    if (line.trim() === '') {
      i += 1;
      continue;
    }

    if (FENCE.test(line)) {
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !FENCE.test(lines[i] ?? '')) {
        code.push(lines[i] ?? '');
        i += 1;
      }
      // Past the closing fence, or past the end when the author never wrote one.
      i += 1;
      blocks.push({ kind: 'code', code: code.join('\n') });
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      i += 1;
      if (!titleDropped && heading[1] === '#' && blocks.length === 0) {
        titleDropped = true;
        continue;
      }
      blocks.push({ kind: 'heading', hashes: heading[1]?.length ?? 1, text: heading[2] ?? '' });
      continue;
    }

    if (TABLE_ROW.test(line) && TABLE_RULE.test(lines[i + 1] ?? '')) {
      const header = cells(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && TABLE_ROW.test(lines[i] ?? '')) {
        rows.push(cells(lines[i] ?? ''));
        i += 1;
      }
      blocks.push({ kind: 'table', header, rows });
      continue;
    }

    const ordered = NUMBERED.test(line);
    const matcher = ordered ? NUMBERED : BULLET;
    if (ordered || BULLET.test(line)) {
      const items: string[] = [];
      while (i < lines.length) {
        const item = matcher.exec(lines[i] ?? '');
        if (!item) break;
        items.push(item[1] ?? '');
        i += 1;
      }
      blocks.push({ kind: 'list', ordered, items });
      continue;
    }

    /*
     * A paragraph runs to the next blank line, and the author's own line breaks are not breaks.
     * The lessons are hard-wrapped at about 95 columns; honouring those newlines would ragged
     * every paragraph at whatever width the author's editor happened to be.
     *
     * **The first line is taken unconditionally, and that is the loop's only guarantee of
     * progress.** This is the fallthrough branch: anything the cases above declined lands here,
     * including lines the break conditions below would reject — a `|` row with no `|---|` under
     * it is the real one. Testing before consuming left `i` where it was and spun until the tab
     * ran out of memory.
     */
    const paragraph: string[] = [line.trim()];
    i += 1;
    while (i < lines.length) {
      const next = lines[i] ?? '';
      if (next.trim() === '' || FENCE.test(next) || HEADING.test(next)) break;
      if (BULLET.test(next) || NUMBERED.test(next) || TABLE_ROW.test(next)) break;
      paragraph.push(next.trim());
      i += 1;
    }
    blocks.push({ kind: 'paragraph', text: paragraph.join(' ') });
  }

  return blocks;
}

/**
 * Inline code, bold and italic. Bold is matched before italic so `**turtle**` does not come out
 * as an emphasised `*turtle*`, and anything unmatched falls through as the text it was.
 *
 * **Emphasis recurses; code does not.** The lessons write `**\`7\` and \`"7"\` are not the same
 * thing**` and `*make \`length\` mean 100 from now on.*` — code inside emphasis, on the two pages
 * that teach types and assignment. Matching flat printed those backticks as punctuation, so the
 * sentence whose entire job is to distinguish `7` from `"7"` set both in the prose face. Code does
 * not recurse for the opposite reason: inside a code span an asterisk is an operator.
 */
const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;

const codeStyle: React.CSSProperties = {
  fontFamily: font.mono,
  fontSize: '0.92em',
  color: color.accent,
};

function inline(text: string): ReactNode {
  return text.split(INLINE).map((part, index) => {
    const key = `${index}-${part}`;
    if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
      return (
        <code key={key} style={codeStyle}>
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 3) {
      return <strong key={key}>{inline(part.slice(2, -2))}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 1) {
      return <em key={key}>{inline(part.slice(1, -1))}</em>;
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

const cellStyle: React.CSSProperties = {
  padding: '7px 14px 7px 0',
  borderBottom: `1px solid ${color.border}`,
  textAlign: 'left',
  verticalAlign: 'top',
};

/**
 * `baseLevel` is the heading the page has already used, so the lesson continues one outline
 * instead of starting a second one. The Tome screen prints an `h2` above this and takes the
 * default; the Quest screen's `h1` is the quest, so it passes 2.
 */
export function Markdown({ text, baseLevel = 3 }: { text: string; baseLevel?: number }): ReactNode {
  return (
    <div style={{ color: color.fgBright, fontSize: '14.5px', lineHeight: 1.75 }}>
      {parse(text).map((block, index) => {
        const key = `${block.kind}-${index}`;

        if (block.kind === 'heading') {
          const level = Math.min(6, Math.max(1, baseLevel + block.hashes - 2));
          const Tag = `h${level}` as 'h2';
          return (
            <Tag
              key={key}
              style={{
                margin: '26px 0 10px',
                fontFamily: font.display,
                fontSize: block.hashes <= 2 ? '18px' : '15px',
                letterSpacing: '-.01em',
                color: color.fg,
              }}
            >
              {inline(block.text)}
            </Tag>
          );
        }

        if (block.kind === 'code') {
          return (
            <pre
              key={key}
              style={{
                margin: '0 0 16px',
                padding: '13px 15px',
                // Darker than either surface this renders on, so the block reads as a block on
                // the Tome screen and inside the Quest screen's panel alike.
                background: color.bg,
                border: `1px solid ${color.borderStrong}`,
                overflowX: 'auto',
              }}
            >
              <code style={{ fontFamily: font.mono, fontSize: '12.5px', color: color.fgBright, lineHeight: 1.6 }}>
                {block.code}
              </code>
            </pre>
          );
        }

        if (block.kind === 'list') {
          const Tag = block.ordered ? 'ol' : 'ul';
          return (
            <Tag key={key} style={{ margin: '0 0 16px', paddingLeft: '22px' }}>
              {block.items.map((item, itemIndex) => (
                <li key={`${itemIndex}-${item}`} style={{ marginBottom: '6px' }}>
                  {inline(item)}
                </li>
              ))}
            </Tag>
          );
        }

        if (block.kind === 'table') {
          return (
            <table key={key} style={{ borderCollapse: 'collapse', margin: '0 0 18px', width: '100%' }}>
              <thead>
                <tr>
                  {block.header.map((heading, headingIndex) => (
                    <th
                      key={`${headingIndex}-${heading}`}
                      style={{ ...cellStyle, color: color.secondary, fontWeight: 600 }}
                    >
                      {inline(heading)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${cellIndex}-${cell}`} style={cellStyle}>
                        {inline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          );
        }

        return (
          <p key={key} style={{ margin: '0 0 16px' }}>
            {inline(block.text)}
          </p>
        );
      })}
    </div>
  );
}
