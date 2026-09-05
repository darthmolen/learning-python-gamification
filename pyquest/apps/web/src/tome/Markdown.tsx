import { Fragment, type ReactNode } from 'react';
import type { ConceptView } from '@pyquest/contract';
import { color, font } from '../design/tokens';
import { GlossaryTerm } from './GlossaryTerm';
import { familyFor } from './families.ts';

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

/**
 * One table row, split into cells on the pipes that are actually separators.
 *
 * **A pipe inside `[[id|words]]` is not a separator**, and a plain `.split('|')` cannot tell the
 * difference: a two-cell row carrying one piped glossary mark comes out as three, so the table
 * renders wrong rather than failing, which is the worse of the two. The scan below walks the line
 * and steps over a mark whole.
 */
const cells = (line: string): string[] => {
  const inner = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const out: string[] = [];
  let current = '';

  for (let i = 0; i < inner.length; i += 1) {
    if (inner.startsWith('[[', i)) {
      const close = inner.indexOf(']]', i);
      if (close !== -1) {
        current += inner.slice(i, close + 2);
        i = close + 1;
        continue;
      }
    }
    if (inner[i] === '|') {
      out.push(current.trim());
      current = '';
      continue;
    }
    current += inner[i];
  }
  out.push(current.trim());

  return out;
};

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
/**
 * A glossary mark is matched here, before code, bold and italic — and **before a table row is
 * ever split**, which is the part that matters.
 *
 * `cells()` splits a row on `|`, and `[[reading-errors|the error message]]` contains one. A row
 * of two cells carrying a piped mark would come out as three, silently, and the table would be
 * wrong rather than broken. So `cells()` is mark-aware, and this pattern is what it and `inline`
 * agree on.
 */
const MARK = /\[\[[^\]]+\]\]/;

const INLINE = /(\[\[[^\]]+\]\]|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;

const codeStyle: React.CSSProperties = {
  fontFamily: font.mono,
  fontSize: '0.92em',
  color: color.accent,
};

/**
 * Resolves a concept id to what a card would show, or `undefined`.
 *
 * The Tome screen passes one. **The Quest screen deliberately does not**, and that is the whole
 * of how CLAUDE.md's no-pop-over rule is kept: with no lookup a mark renders as the author's
 * words, so nothing floats above the editor. The Field Manual never reaches this code at all —
 * it strips marks at build time.
 */
export type TermLookup = (id: string) => ConceptView | undefined;

/**
 * The concept id a code span names, if any.
 *
 * `print` and `print()` are the same word and both resolve. `int(sides)` does **not**: that is a
 * *use* of `int` rather than the word, and matching it would underline text whose live part the
 * reader cannot identify — half a call is not a term. Predictability beats reach here, because the
 * underline is the only signal that anything is behind the word.
 */
function conceptIn(code: string): string {
  return code.endsWith('()') ? code.slice(0, -2) : code;
}

/** `[[id]]` or `[[id|words]]`, already known to be a mark. Target first, MediaWiki's order. */
function splitMark(part: string): { id: string; text: string } {
  const body = part.slice(2, -2);
  const bar = body.indexOf('|');
  const id = (bar === -1 ? body : body.slice(0, bar)).trim();
  const words = bar === -1 ? '' : body.slice(bar + 1).trim();
  return { id, text: words === '' ? id : words };
}

function inline(text: string, term?: TermLookup): ReactNode {
  return text.split(INLINE).map((part, index) => {
    const key = `${index}-${part}`;
    if (MARK.test(part) && part.startsWith('[[')) {
      const { id, text: words } = splitMark(part);
      const concept = term?.(id);
      /*
       * No lookup, or an id the lookup does not know: the author's words, plain. `validate:content`
       * refuses an unknown id so the second case cannot ship — but a screen that printed `[[` at a
       * learner because a check was skipped would be a worse failure than the one being guarded.
       */
      if (concept === undefined || term === undefined) return <Fragment key={key}>{words}</Fragment>;
      return <GlossaryTerm key={key} concept={concept} text={words} family={familyFor(concept, term)} />;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
      const code = part.slice(1, -1);
      /**
       * **Inline code that names a concept is live, and every occurrence of it.**
       *
       * Authored `[[marks]]` cover prose, where the concept is named in words no matcher would
       * find — "Variables", "Reading an error". This covers the other half, and the half a learner
       * actually meets: the curriculum writes every Python word as code, so `print` appears a
       * dozen times in Area 0 and, before this, exactly one of them opened.
       *
       * That was worse than none. "I see the word but I can't hover in the text" — a reference
       * that works one time in twelve teaches a reader that hovering does not work.
       *
       * The earlier objection was that automatic matching "lights up seventeen spans", and it was
       * measured. It was also about the wrong thing: it feared decoration added to *prose*. A code
       * span is already accent mono, set apart from the sentence around it. Making it live adds a
       * dotted underline and nothing else.
       */
      const concept = term?.(conceptIn(code));
      if (concept !== undefined && term !== undefined) {
        return (
          <GlossaryTerm
            key={key}
            concept={concept}
            text={code}
            code
            family={familyFor(concept, term)}
          />
        );
      }
      return (
        <code key={key} style={codeStyle}>
          {code}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 3) {
      return <strong key={key}>{inline(part.slice(2, -2), term)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 1) {
      return <em key={key}>{inline(part.slice(1, -1), term)}</em>;
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
export function Markdown({
  text,
  baseLevel = 3,
  term,
}: {
  text: string;
  baseLevel?: number;
  /**
   * Optional, and the default is the case that matters. Two of the three surfaces that render a
   * lesson pass nothing: the Quest screen, because a card must never float above the editor, and
   * anything else that has not thought about it. With no lookup a mark is the author's words.
   */
  term?: TermLookup;
}): ReactNode {
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
              {inline(block.text, term)}
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
                  {inline(item, term)}
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
                      {inline(heading, term)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${cellIndex}-${cell}`} style={cellStyle}>
                        {inline(cell, term)}
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
            {inline(block.text, term)}
          </p>
        );
      })}
    </div>
  );
}
