import { Link } from 'react-router';
import { color, font, metric } from '../design/tokens';

export interface Crumb {
  /** What the crumb names. §6.8: a crumb names the activity, not the object. */
  label: string;
  to: string;
}

interface BreadcrumbsProps {
  /** The ancestors, outermost first. Every one is clickable. */
  trail: readonly Crumb[];
  /** Where you are. Plain text — you cannot navigate to where you already are. */
  here: string;
  /** The quiet line at the far end of the bar, e.g. "week 10 of 48". */
  aside?: string;
}

/**
 * The way back (§6.8).
 *
 * "No screen can be one you are able to enter and unable to leave except through browser
 * chrome — which in a single-page app is unreliable, and for an 11-14-year-old is not an
 * answer at all." That sentence is why the ancestors are real links with real targets rather
 * than styled text, and why the up-chevron resolves to the same place as the last of them.
 *
 * Rail destinations render no breadcrumb, because they have no ancestor. Overlays render none
 * either — they close rather than navigate.
 */
export function Breadcrumbs({ trail, here, aside }: BreadcrumbsProps) {
  const parent = trail.at(-1);

  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '0 26px',
        height: `${metric.crumbBarHeight}px`,
        borderBottom: `1px solid ${color.border}`,
        background: color.crumbBar,
        flexShrink: 0,
      }}
    >
      {parent !== undefined && (
        <Link
          to={parent.to}
          aria-label={`Up one level, to ${parent.label}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '26px',
            height: '26px',
            border: `1px solid ${color.borderStrong}`,
            flexShrink: 0,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path
              d="M7.4 2 3.4 6 7.4 10"
              fill="none"
              stroke={color.secondary}
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      )}

      {trail.map((crumb, i) => (
        <span key={crumb.to} style={{ display: 'contents' }}>
          {i > 0 && <span style={{ color: color.crumbRule, fontSize: '12px' }}>›</span>}
          <Link
            to={crumb.to}
            style={{
              fontFamily: font.mono,
              fontSize: '11.5px',
              color: color.secondary,
              textDecoration: 'underline',
              textDecorationColor: color.crumbRule,
              textUnderlineOffset: '3px',
            }}
          >
            {crumb.label}
          </Link>
        </span>
      ))}

      <span style={{ color: color.crumbRule, fontSize: '12px' }}>›</span>
      <span
        aria-current="page"
        style={{
          fontFamily: font.mono,
          fontSize: '11.5px',
          color: color.fg,
          fontWeight: 500,
        }}
      >
        {here}
      </span>

      <div style={{ flexGrow: 1 }} />

      {aside !== undefined && (
        <span style={{ fontFamily: font.mono, fontSize: '11.5px', color: color.secondary }}>
          {aside}
        </span>
      )}
    </nav>
  );
}
