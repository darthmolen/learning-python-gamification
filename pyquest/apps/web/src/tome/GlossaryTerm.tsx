import { useState, type CSSProperties } from 'react';
import type { ConceptView } from '@pyquest/contract';
import { color, font } from '../design/tokens';
import { lede } from './lede.ts';

/**
 * A word in a lesson that carries a definition, and the card that shows it.
 *
 * The DM asked for this in the terms it deserves: "as the learner is reading, they can have a
 * reference … I always wanted that when I was younger, but the book medium didn't allow mouse
 * overs." A page cannot do it; this can.
 *
 * **It is marked as well as hoverable, and that ordering matters.** A reference nobody knows is
 * there is not a reference — the underline is what says *there is something behind this word*,
 * and the card is only what happens when you ask.
 *
 * **This is the one place the no-pop-over rule bends, and only here.** CLAUDE.md's rule protects
 * the learner's *work*: §6.8's argument is that "if looking something up costs a learner the code
 * in his editor, he stops looking things up." A reader in the Tome has no editor on screen. The
 * Quest screen does, and it passes no lookup at all — marks render as plain words there, and the
 * concept chips above the brief carry the same definitions.
 */
export function GlossaryTerm({
  concept,
  text,
  code = false,
  family,
}: {
  /** The concept this word names. */
  concept: ConceptView;
  /** What the author wrote, which may not be the concept's label. */
  text: string;
  /**
   * Whether this came from an inline code span rather than an authored mark.
   *
   * It keeps the code face. A `print` that changed typeface on becoming hoverable would read as
   * two different things in one sentence, and the learner is being taught that `print` is one
   * thing — the styling is part of the teaching, not decoration on top of it.
   */
  code?: boolean;
  /**
   * The whole construct, when the word is part of one.
   *
   * `if` alone, `elif` alone and `else` alone are not each worth a card — the chain is. A learner
   * meeting `elif` wants to see where it sits between the other two, so all three entries arrive
   * together under one heading.
   */
  family?: { readonly title: string; readonly members: readonly ConceptView[] };
}) {
  const [open, setOpen] = useState(false);
  const entries = family?.members ?? [concept];

  const mark: CSSProperties = {
    // A code term keeps `codeStyle`'s face and size, so a live `print` and a plain one are the
    // same word set the same way — the underline is the only difference, which is the point.
    fontFamily: code ? font.mono : 'inherit',
    fontSize: code ? '0.92em' : 'inherit',
    fontWeight: 'inherit',
    color: color.accent,
    background: 'none',
    border: 'none',
    borderBottom: `1px dashed ${color.accentMid}`,
    padding: 0,
    cursor: 'help',
  };

  return (
    <span style={{ position: 'relative' }}>
      <button
        type="button"
        aria-expanded={open}
        style={mark}
        /*
         * Opens, rather than toggles — and the difference is not pedantry. A pointer press fires
         * `mouseenter` first, which has already opened the card, so a toggle would *close* it on
         * the click that was meant to open it. Every way of dismissing it still works: leaving,
         * blurring, or Escape.
         */
        onClick={() => setOpen(true)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        /* Focus opens it too, and that is not decoration: a hover-only reference is a reference a
         * keyboard user does not have. WCAG 1.4.13 asks for hoverable, dismissible and persistent,
         * and Escape below is the dismissible half. */
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && open) {
            event.stopPropagation();
            setOpen(false);
          }
        }}
      >
        {text}
      </button>

      {open && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '12px',
            marginBottom: '6px',
            zIndex: 20,
            display: 'block',
            width: 'max-content',
            maxWidth: '360px',
            padding: '10px 13px',
            background: color.panel,
            border: `1px solid ${color.accentMid}`,
            boxShadow: '0 6px 18px rgba(0,0,0,.45)',
            /*
             * The card sets its own type and does not inherit the sentence it interrupts. A term
             * inside a heading gave its card the heading's weight, so the definition arrived in
             * 15px bold — and inside an `<em>` it would have arrived italic. A reference that
             * changes shape depending on the word it explains is harder to read every time.
             */
            fontFamily: font.sans,
            fontSize: '13px',
            fontWeight: 400,
            fontStyle: 'normal',
            lineHeight: 1.6,
            color: color.fgBright,
            textAlign: 'left',
            whiteSpace: 'normal',
            cursor: 'auto',
          }}
        >
          <span
            style={{
              display: 'block',
              fontFamily: font.mono,
              fontSize: '11px',
              color: color.accent,
              marginBottom: '5px',
            }}
          >
            {family?.title ?? concept.label}
          </span>

          {entries.map((entry) => (
            <span key={entry.id} style={{ display: 'block', marginTop: '4px' }}>
              {family !== undefined && (
                <span style={{ fontFamily: font.mono, fontSize: '11.5px', color: color.secondary }}>
                  {`${entry.label} — `}
                </span>
              )}
              {/* The **lede**, not the entry. The whole entry — elaboration, fenced examples —
                * belongs on the concept chips, which render it through `Markdown` with room to be
                * read. A card that reproduced it arrived as raw backticks over the sentence the
                * reader was in the middle of.
                *
                * §5.1a's honesty rule for the absent case, in the same words `ConceptList` uses:
                * an area authored later has no glossary, and saying so beats an empty box. */}
              {entry.definition === undefined ? 'no definition written yet.' : lede(entry.definition)}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
