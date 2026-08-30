/**
 * The palette, type and metrics of `docs/design/pyquest/*.dc.html`.
 *
 * Every value here was read out of an artboard. None of them is rounded to a 4/8px grid or
 * swapped for a framework's nearest equivalent, because the artboards are the specification
 * and a palette that drifts toward Tailwind's defaults is a redesign nobody agreed to.
 *
 * These are plain values rather than CSS custom properties on purpose: jsdom does not resolve
 * `var()` in `getComputedStyle`, so a token expressed only in a stylesheet is a token no test
 * can see. The artboards themselves use inline styles, so this also happens to be their idiom.
 */

export const color = {
  /** The canvas behind everything. */
  bg: '#12151c',
  /** Primary text. */
  fg: '#e8ecf2',
  /** Brighter than `fg`, used for the few things that must out-rank it. */
  fgBright: '#c6ced9',

  /** The rail is darker than the canvas — it reads as a chrome, not a column. */
  railBg: '#0d1014',
  /** The rail's active destination. Nearly black, faintly green. */
  railActiveBg: '#171d17',

  /** Side panels and cards. */
  panel: '#161a22',
  /** The breadcrumb bar, which sits above the canvas rather than on it. */
  crumbBar: '#1a1f28',

  /** Hairlines: panel edges, rail edge, section rules. */
  border: '#232a35',
  /** The heavier line, for a boundary between two regions rather than within one. */
  borderStrong: '#333c4a',
  /** The breadcrumb underline and its separator chevron. */
  crumbRule: '#3d4757',

  /** The green ramp. `accent` is the brand; the rest build the isometric cubes. */
  accent: '#5aa860',
  accentHover: '#7cc182',
  accentMid: '#3f7844',
  accentDark: '#2d5731',

  /** Secondary text — captions, supporting copy. */
  secondary: '#98a3b3',
  /** Muted text — eyebrows, inactive rail labels, things deliberately quiet. */
  muted: '#5d6878',

  /** Counts that want attention without alarm: due invasions, pending sign-offs. */
  badge: '#d9a441',
  /** Failure. Scars, raised exceptions. */
  danger: '#cc5a5a',
  /** Information that is neither good nor bad. */
  info: '#3f9fb5',

  /** The player chip in the rail's foot. */
  avatarBg: '#1e2a20',
  avatarFg: '#8fd196',
} as const;

export const font = {
  display: "'Archivo Black','IBM Plex Sans',sans-serif",
  sans: "'IBM Plex Sans',ui-sans-serif,system-ui,sans-serif",
  mono: "'IBM Plex Mono',ui-monospace,Menlo,monospace",
} as const;

export const metric = {
  /** The rail, in every one of the nine artboards. */
  railWidth: 72,
  /** The breadcrumb bar, in every artboard that has one. */
  crumbBarHeight: 46,
  /** The rail's own padding, and the gap between a destination's icon and its label. */
  railPaddingY: 13,
  railItemGap: 5,
  /** The stripe that marks the active destination. */
  railActiveBorder: 2,
} as const;

/** The eyebrow: mono, wide-tracked, uppercase, quiet. Used above almost every heading. */
export const eyebrow = {
  fontFamily: font.mono,
  fontSize: '11px',
  letterSpacing: '.14em',
  textTransform: 'uppercase',
  color: color.muted,
} as const;
