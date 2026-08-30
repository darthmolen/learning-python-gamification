import { NavLink } from 'react-router';
import { color, font, metric } from '../design/tokens';

/**
 * The six overland destinations (§6.8). They are "true wherever you are standing, so they are
 * always one click away and never nested" — which is why this list is flat, fixed, and has no
 * conditional members. A seventh entry would mean something was promoted out of the place it
 * belongs to; a fifth would mean something became unreachable.
 *
 * The icons are the artboards' own inline SVGs, copied rather than matched from an icon set.
 * A library's nearest equivalent is a different drawing, and these are drawn to sit together.
 */
export type RailKey = 'map' | 'tome' | 'defend' | 'party' | 'journal' | 'console';

interface Destination {
  key: RailKey;
  label: string;
  to: string;
  icon: (stroke: string) => React.ReactNode;
}

const DESTINATIONS: readonly Destination[] = [
  {
    key: 'map',
    label: 'Map',
    to: '/map',
    icon: (s) => (
      <>
        <path d="M10 3 17 7 10 11 3 7Z" fill="none" stroke={s} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M3 11 10 15 17 11" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    key: 'tome',
    label: 'Tome',
    to: '/tome',
    icon: (s) => (
      <>
        <path d="M10 5.6c-1.9-1.3-4.1-1.7-6.6-1.4v9.8c2.5-.3 4.7.1 6.6 1.4" fill="none" stroke={s} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M10 5.6c1.9-1.3 4.1-1.7 6.6-1.4v9.8c-2.5-.3-4.7.1-6.6 1.4" fill="none" stroke={s} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M10 5.6v9.8" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
  },
  {
    key: 'defend',
    label: 'Defend',
    to: '/defend',
    icon: (s) => (
      <>
        <path d="M10 2.8 16 5.1V10.3c0 3.4-2.5 5.8-6 6.9-3.5-1.1-6-3.5-6-6.9V5.1Z" fill="none" stroke={s} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M10 6.5V13.3" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7.9 8.9H12.1" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
  },
  {
    key: 'party',
    label: 'Party',
    to: '/party',
    icon: (s) => (
      <>
        <circle cx="7.9" cy="7.3" r="2.7" fill="none" stroke={s} strokeWidth="1.5" />
        <path d="M3.4 16.8v-.7c0-2.5 2-4.1 4.5-4.1s4.5 1.6 4.5 4.1v.7" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="14.7" cy="5.9" r="2" fill="none" stroke={s} strokeWidth="1.3" />
        <path d="M14.1 10.1c2 0 3.4 1.5 3.4 3.7v.6" fill="none" stroke={s} strokeWidth="1.3" strokeLinecap="round" />
      </>
    ),
  },
  {
    key: 'journal',
    label: 'Journal',
    to: '/journal',
    icon: (s) => (
      <>
        <path d="M4.5 3.5h11v13h-11z" fill="none" stroke={s} strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 3.5v13M10.5 7.5h3M10.5 11h3" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
  },
  {
    key: 'console',
    label: 'Console',
    to: '/console',
    icon: (s) => (
      <path d="M3 6.5h14M3 13.5h14" fill="none" stroke={s} strokeWidth="1.5" strokeLinecap="round" />
    ),
  },
];

/** The brand mark: one isometric cube, the same solid the Map draws its islands from. */
function Mark() {
  return (
    <svg width="22" height="24" viewBox="-14 -8 28 30" style={{ marginBottom: '16px', flexShrink: 0 }} aria-hidden="true">
      <polygon points="0,-7 13,0 0,7 -13,0" fill={color.accent} />
      <polygon points="-13,0 0,7 0,18 -13,11" fill={color.accentMid} />
      <polygon points="13,0 0,7 0,18 13,11" fill={color.accentDark} />
    </svg>
  );
}

interface RailProps {
  /**
   * Counts to badge. A key that is absent or zero renders no badge at all — a badge showing
   * "0" tells a learner he has work waiting when he does not, which is worse than silence.
   */
  counts?: Partial<Record<RailKey, number>>;
  /** The player chip in the foot. Kitchen Table mode has one household (§5.11). */
  initial?: string;
}

export function Rail({ counts, initial = 'K' }: RailProps) {
  return (
    <nav
      aria-label="Overland"
      style={{
        width: `${metric.railWidth}px`,
        flexShrink: 0,
        background: color.railBg,
        borderRight: `1px solid ${color.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: `${metric.railPaddingY}px 0`,
      }}
    >
      <Mark />

      {DESTINATIONS.map((d) => {
        const count = counts?.[d.key] ?? 0;

        return (
          <NavLink
            key={d.key}
            to={d.to}
            className="pq-rail-item"
            style={({ isActive }) => ({
              position: 'relative',
              width: `${metric.railWidth}px`,
              padding: '9px 0 7px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: `${metric.railItemGap}px`,
              background: isActive ? color.railActiveBg : 'transparent',
              borderLeft: `${metric.railActiveBorder}px solid ${isActive ? color.accent : 'transparent'}`,
              textDecoration: 'none',
            })}
          >
            {({ isActive }) => {
              const ink = isActive ? color.fg : color.muted;

              return (
                <>
                  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                    {d.icon(ink)}
                  </svg>
                  <span
                    style={{
                      fontFamily: font.mono,
                      fontSize: '8.5px',
                      letterSpacing: '.05em',
                      textTransform: 'uppercase',
                      color: ink,
                    }}
                  >
                    {/* The label is the same word in both states. See CLAUDE.md. */}
                    {d.label}
                  </span>
                  {count > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '6px',
                        right: '12px',
                        minWidth: '14px',
                        height: '14px',
                        background: color.badge,
                        color: color.bg,
                        fontFamily: font.mono,
                        fontSize: '9px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </>
              );
            }}
          </NavLink>
        );
      })}

      <div style={{ flexGrow: 1 }} />

      <div
        style={{
          width: '32px',
          height: '32px',
          background: color.avatarBg,
          border: `1px solid ${color.accentMid}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontFamily: font.display, fontSize: '13px', color: color.avatarFg }}>
          {initial}
        </span>
      </div>
    </nav>
  );
}
