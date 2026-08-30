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

export function Mono({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <span style={{ fontFamily: font.mono, fontSize: '11px', color: color.muted, ...style }}>{children}</span>;
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
 */
export function MedalSlots({ held }: { held: readonly string[] }) {
  return (
    <div style={{ display: 'flex', gap: '2px', width: '46px', justifyContent: 'flex-end' }}>
      {medalSlots(held).map((slot) => (
        <svg
          key={slot.medal}
          width="8"
          height="8"
          viewBox="0 0 8 8"
          role="img"
          aria-label={`${slot.medal}: ${slot.held ? 'earned' : 'not earned'}`}
        >
          <polygon points="4,0 8,4 4,8 0,4" fill={slot.held ? color.accent : color.crumbRule} />
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
