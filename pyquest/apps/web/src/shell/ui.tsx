import type { ReactNode } from 'react';
import { color, eyebrow, font } from '../design/tokens';
import { isRisky, medalSlots } from '../present/index.ts';

/** The mono, wide-tracked, uppercase label above almost every block on every artboard. */
export function Eyebrow({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <div style={{ ...eyebrow, ...style }}>{children}</div>;
}

export function Display({ children, size = 24 }: { children: ReactNode; size?: number }) {
  return (
    <span style={{ fontFamily: font.display, letterSpacing: '-.015em', fontSize: `${size}px` }}>
      {children}
    </span>
  );
}

/**
 * The small mono line under almost everything.
 *
 * 12px, not 11. The document is 14px and IBM Plex Mono runs small for its size, so 11px against
 * it came out as texture rather than as text — and what it is carrying is not decoration: the
 * concepts an area teaches, what a medal pays, why Submit is disabled. A line worth putting on
 * the screen is worth being able to read.
 */
export function Mono({
  children,
  style,
  id,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
  /** For `aria-describedby`, where a control needs to point at its own explanation. */
  id?: string;
}) {
  return (
    <span id={id} style={{ fontFamily: font.mono, fontSize: '12px', color: color.muted, ...style }}>
      {children}
    </span>
  );
}

/**
 * The concepts a quest teaches, as terms rather than as a sentence.
 *
 * They were joined with ` · ` into one muted line, which reads as prose and scans as noise. This
 * is a *vocabulary* — the words Area 7 expects him to know — and a list of terms should look like
 * one. A chip apiece also gives the eye somewhere to stop, which a middot does not.
 */
export function ConceptList({
  concepts,
  label = 'Concepts',
  style,
}: {
  concepts: readonly string[];
  /** Named per row on the Area screen, where several of these sit in one list. */
  label?: string;
  style?: React.CSSProperties;
}) {
  return (
    <ul
      aria-label={label}
      style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', listStyle: 'none', margin: 0, padding: 0, ...style }}
    >
      {concepts.map((concept) => (
        <li
          key={concept}
          style={{
            fontFamily: font.mono,
            fontSize: '11.5px',
            color: color.secondary,
            border: `1px solid ${color.border}`,
            padding: '2px 7px',
          }}
        >
          {concept}
        </li>
      ))}
    </ul>
  );
}

export function Panel({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: color.panel, border: `1px solid ${color.border}`, padding: '22px 26px', ...style }}>
      {children}
    </div>
  );
}

/**
 * §5.1's risk warning. The triangle is the artboard's own drawing, and it is titled rather than
 * left as decoration — a glyph a screen reader skips is a warning a blind reader never gets.
 */
export function RiskWarning({ dc }: { dc: number }) {
  if (!isRisky(dc)) return null;

  return (
    <svg width="15" height="15" viewBox="0 0 14 14" style={{ flexShrink: 0 }} role="img" aria-label={`High risk, DC ${dc}`}>
      <path d="M7 1.4 13 12.2 1 12.2 Z" fill="none" stroke={color.badge} strokeWidth="1.4" strokeLinejoin="round" />
      <line x1="7" y1="5.4" x2="7" y2="8.6" stroke={color.badge} strokeWidth="1.4" />
      <circle cx="7" cy="10.3" r="0.8" fill={color.badge} />
    </svg>
  );
}

/**
 * §5.10: every slot the quest offers, unearned ones greyed rather than absent. The diamond is
 * the artboard's, and each carries its own accessible name so the row does not announce as five
 * anonymous shapes.
 *
 * **Unearned is an outline, not a darker fill.** It was an 8px `--crumb-rule` diamond on
 * `--panel`, which is about 1.3:1 — drawn, and invisible. Depth he cannot see is depth he does
 * not know exists, and that is the whole argument §5.10 makes for showing the slot at all, so a
 * slot rendered below the threshold of sight fails the rule while appearing to keep it. An
 * outline separates from its background at this size where a fill does not, and it stays honestly
 * *unfilled* — the one thing the filled diamond has to mean.
 */
export function MedalSlots({ held }: { held: readonly string[] }) {
  return (
    <div style={{ display: 'flex', gap: '3px', width: '58px', justifyContent: 'flex-end' }}>
      {medalSlots(held).map((slot) => (
        <svg
          key={slot.medal}
          width="10"
          height="10"
          viewBox="0 0 10 10"
          role="img"
          aria-label={`${slot.medal}: ${slot.held ? 'earned' : 'not earned'}`}
        >
          <polygon
            points="5,0.6 9.4,5 5,9.4 0.6,5"
            fill={slot.held ? color.accent : 'none'}
            stroke={slot.held ? color.accent : color.muted}
            strokeWidth="1.1"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </div>
  );
}

/** The isometric cube the Map, the rail and the Area header all draw. */
export function Cube({ size = 18, drained = false }: { size?: number; drained?: boolean }) {
  const top = drained ? color.crumbRule : color.accent;
  const left = drained ? '#2b323d' : color.accentMid;
  const right = drained ? '#242b36' : color.accentDark;

  return (
    <svg width={size} height={size * 1.1} viewBox="-11 -7 22 26" style={{ flexShrink: 0 }} aria-hidden="true">
      <polygon points="0,-5.5 10,0 0,5.5 -10,0" fill={top} />
      <polygon points="-10,0 0,5.5 0,15 -10,9.5" fill={left} />
      <polygon points="10,0 0,5.5 0,15 10,9.5" fill={right} />
    </svg>
  );
}
