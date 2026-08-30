import { useId, useState, type ReactNode } from 'react';
import { color, font } from '../design/tokens';

/**
 * The Tome expands in place and pushes the work down. It is not a modal, not a pop-over, and
 * not a drawer over a scrim.
 *
 * §6.8 gives the reason, and it is a teaching reason rather than a taste one: "If looking
 * something up costs a learner the code in his editor, he stops looking things up, and the
 * Tome is where the teaching lives." So whatever is underneath stays mounted, closing returns
 * to it exactly, and nothing is ever covered.
 *
 * The trigger reads "Tome" whether it is open or shut. State is announced through
 * `aria-expanded`, which is what a screen reader reads and what a sighted reader sees in the
 * chevron — never by rewriting the word.
 */
export function Tome({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <section>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '7px 14px',
          background: 'transparent',
          border: `1px solid ${color.borderStrong}`,
          color: color.fg,
          fontFamily: font.mono,
          fontSize: '11.5px',
          cursor: 'pointer',
        }}
      >
        Tome
      </button>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Tome"
          style={{
            // In flow. Nothing here is positioned, because a positioned panel is one that
            // covers rather than pushes — which is the whole distinction this component makes.
            marginTop: '12px',
            padding: '18px 20px',
            background: color.panel,
            border: `1px solid ${color.border}`,
          }}
        >
          {children}
        </div>
      )}
    </section>
  );
}
