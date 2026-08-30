import { useState } from 'react';
import { Link } from 'react-router';
import type { AreaIdentity } from '@pyquest/contract';
import { color, font } from '../design/tokens';
import { getAreaIdentities, getAreaProgress, getBossState, getDueInvasions, getLevel } from '../gateway/index.ts';
import { formatTotal } from '../present/index.ts';
import { Eyebrow, Mono } from '../shell/ui';

/**
 * The campaign as eight islands on a path (`docs/design/pyquest/CampaignMap.dc.html`).
 *
 * The geometry is the artboard's own: a 3×3 isometric platform per area, quest markers standing
 * on it, and the current area's boss pillar raised "so 'where am I' reads at a glance". Locked
 * islands are drawn dark rather than omitted — §5.3: "Locked nodes stay visible and greyed, so
 * `class` sits in view for weeks before he reaches it. Anticipation, not frustration."
 *
 * Selecting an island fills the panel; **entering the area is a separate, deliberate click**.
 * The quests, the brief and the boss live inside an area — they are things about a place, not
 * places of their own — so the Map's job is to let him look before he goes.
 */

/** The biome palette, one hue per area, straight off the artboard. */
const BIOME: readonly string[] = [
  '#d9a441', '#d97742', '#8b95a5', '#5aa860',
  '#3f9fb5', '#7a72c9', '#b968a8', '#cc5a5a',
];

/** Two rows of four, the path snaking left-to-right then back. */
const SPOTS: readonly { x: number; y: number }[] = [
  { x: 150, y: 150 }, { x: 385, y: 205 }, { x: 620, y: 150 }, { x: 855, y: 205 },
  { x: 855, y: 455 }, { x: 620, y: 400 }, { x: 385, y: 455 }, { x: 150, y: 400 },
];

/**
 * `started` is the state the first version of this file was missing. It derived `here` as the
 * first unfinished area and made everything after it `lock`, which drew Area 3 as a dark locked
 * island while its own label read `3 of ~5`. §361 lets him attempt any boss early, so progress
 * scattered across several areas is a supported state rather than an anomaly — and an area he
 * has cleared quests in is, observably, not locked.
 */
type State = 'done' | 'here' | 'started' | 'next' | 'lock';

const shade = (hex: string, f: number): string => {
  const n = parseInt(hex.slice(1), 16);
  const c = (shift: number) => Math.round(((n >> shift) & 255) * f);
  return `rgb(${c(16)},${c(8)},${c(0)})`;
};

interface Face {
  pts: string;
  fill: string;
}

/** One isometric cube at a grid position, returned as its three visible faces plus a sort key. */
function cube(gx: number, gy: number, gz: number, fill: string): { order: number; faces: Face[] } {
  const w = 24;
  const d = 12;
  const h = 19;
  const cx = (gx - gy) * w;
  const cy = (gx + gy) * d - gz * h;

  return {
    order: gx + gy + gz * 0.6,
    faces: [
      { pts: `${cx},${cy - d} ${cx + w},${cy} ${cx},${cy + d} ${cx - w},${cy}`, fill },
      { pts: `${cx - w},${cy} ${cx},${cy + d} ${cx},${cy + d + h} ${cx - w},${cy + h}`, fill: shade(fill, 0.68) },
      { pts: `${cx + w},${cy} ${cx},${cy + d} ${cx},${cy + d + h} ${cx + w},${cy + h}`, fill: shade(fill, 0.46) },
    ],
  };
}

/** The platform, its quest markers, and — for the area you are standing on — the boss pillar. */
function island(state: State, hue: string, cleared: number): Face[] {
  const lit = state === 'done' || state === 'here' || state === 'started';
  const base = lit ? hue : state === 'next' ? shade(hue, 0.52) : '#2b323d';
  const raw: { order: number; faces: Face[] }[] = [];

  for (let gx = 0; gx < 3; gx++) {
    for (let gy = 0; gy < 3; gy++) raw.push(cube(gx - 1, gy - 1, 0, base));
  }

  const marks: readonly [number, number][] = [[-1, -1], [1, -1], [0, 1]];
  marks.forEach(([mx, my], k) => {
    const fill = k < cleared ? '#dfe6ef' : state === 'here' ? '#8fd196' : lit ? hue : '#39414e';
    raw.push(cube(mx, my, 1, fill));
  });

  if (state === 'here') {
    raw.push(cube(1, 1, 1, '#8fd196'));
    raw.push(cube(1, 1, 2, color.badge));
  }

  return raw.sort((a, b) => a.order - b.order).flatMap((c) => c.faces);
}

const LEGEND: readonly { label: string; hue: string }[] = [
  { label: 'cleared', hue: '#8b95a5' },
  { label: 'you are here', hue: color.accent },
  { label: 'next', hue: '#3f9fb5' },
  { label: 'locked, still visible', hue: '#2b323d' },
];

export function MapScreen() {
  const areas = getAreaIdentities();
  const level = getLevel();
  const invasions = getDueInvasions();
  const progress = areas.map((a) => getAreaProgress(a.area));

  /**
   * Where he is standing, derived rather than stored: the first area not yet finished. `next` is
   * the one after it. This is a presentation reading of progress the contract already carries —
   * and it gates nothing, because §361 lets him attempt any boss early.
   */
  const hereIndex = progress.findIndex((q) => q.cleared < q.total);
  const stateOf = (i: number): State => {
    const q = progress[i];
    if (q === undefined) return 'lock';
    if (q.cleared >= q.total) return 'done';
    if (i === hereIndex) return 'here';
    // Never locked once he has cleared something in it. The label would contradict the drawing.
    if (q.cleared > 0) return 'started';

    if (i === hereIndex + 1) return 'next';
    return 'lock';
  };

  const [selected, setSelected] = useState(hereIndex === -1 ? 0 : hereIndex);
  const area = areas[selected] as AreaIdentity;
  const p = progress[selected];
  const boss = getBossState(area.area);
  const dueHere = invasions.filter((i) => i.area === area.area).length;
  const clearedCount = progress.filter((q) => q.cleared >= q.total).length;

  return (
    <div style={{ display: 'flex', flexGrow: 1, minHeight: 0 }}>
      <div
        style={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          background: 'radial-gradient(ellipse 900px 620px at 46% 44%, #1b2230 0%, #12151c 72%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', padding: '26px 32px 0', flexShrink: 0 }}>
          <h1 style={{ margin: 0, fontFamily: font.display, fontSize: '24px', letterSpacing: '-.015em' }}>
            The Campaign
          </h1>
          {/*
            * The artboard also reads "· week 10" here. That needs a campaign start date, which is
            * household state in Postgres and does not exist yet, so it is absent rather than
            * guessed. Same reason `LevelSchema` gives no cumulative xp for the "1,260" opposite.
            */}
          <Eyebrow>{`8 areas · ${clearedCount} of 8 cleared`}</Eyebrow>
          <div style={{ flexGrow: 1 }} />
          <Mono style={{ fontSize: '12px', color: color.secondary }}>
            <strong style={{ color: color.fg }}>{`level ${level.level}`}</strong>
            {` · ${level.toNext} xp to next`}
          </Mono>
        </div>

        <svg viewBox="0 0 1000 700" style={{ flexGrow: 1, width: '100%', minHeight: 0 }} role="presentation">
          {SPOTS.slice(0, -1).map((spot, i) => {
            const walked = stateOf(i) === 'done';
            const to = SPOTS[i + 1] as { x: number; y: number };
            return (
              <line
                key={`path-${i}`}
                x1={spot.x}
                y1={spot.y + 34}
                x2={to.x}
                y2={to.y + 34}
                stroke={walked ? color.crumbRule : '#252c37'}
                strokeWidth="2"
                strokeDasharray={walked ? '0' : '5 6'}
              />
            );
          })}

          {areas.map((a, i) => {
            const spot = SPOTS[i] as { x: number; y: number };
            const state = stateOf(i);
            const lit = state === 'done' || state === 'here' || state === 'started';
            const hue = BIOME[i] as string;
            const q = progress[i];

            return (
              <g
                key={a.area}
                transform={`translate(${spot.x},${spot.y})`}
                role="button"
                tabIndex={0}
                aria-label={`Area ${a.area}, ${a.title}`}
                aria-pressed={i === selected}
                onClick={() => setSelected(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelected(i);
                  }
                }}
                /*
                 * `userSelect: none` because a focusable <g> lets the browser drop a text caret
                 * into the <text> children — a cursor blinking on "Area 2" that no screenshot
                 * catches, because a caret does not render in a capture.
                 */
                style={{
                  cursor: 'pointer',
                  outline: i === selected ? `1px solid ${color.accent}` : 'none',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                }}
              >
                {island(state, hue, q === undefined ? 0 : Math.min(q.cleared, 3)).map((face, k) => (
                  <polygon key={k} points={face.pts} fill={face.fill} />
                ))}
                <text x="0" y="-78" textAnchor="middle" fontFamily={font.mono} fontSize="10" letterSpacing="1.4" fill={lit ? hue : '#4a5361'}>
                  {`AREA ${a.area}`}
                </text>
                <text x="0" y="96" textAnchor="middle" fontFamily={font.display} fontSize="13" fill={lit ? color.fg : color.muted}>
                  {a.title}
                </text>
                <text x="0" y="113" textAnchor="middle" fontFamily={font.mono} fontSize="10" fill={state === 'here' ? '#8fd196' : '#4a5361'}>
                  {q === undefined ? '' : `${q.cleared} of ${formatTotal(q.total, q.estimated)}`}
                </text>
              </g>
            );
          })}
        </svg>

        <div style={{ display: 'flex', alignItems: 'center', gap: '26px', padding: '0 32px 22px', flexShrink: 0 }}>
          {LEGEND.map((entry) => (
            <div key={entry.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="15" height="16" viewBox="-9 -6 18 22" aria-hidden="true">
                <polygon points="0,-4.5 8,0 0,4.5 -8,0" fill={entry.hue} />
                <polygon points="-8,0 0,4.5 0,12 -8,7.5" fill={shade(entry.hue, 0.68)} />
                <polygon points="8,0 0,4.5 0,12 8,7.5" fill={shade(entry.hue, 0.46)} />
              </svg>
              <Mono style={{ color: color.secondary }}>{entry.label}</Mono>
            </div>
          ))}
        </div>
      </div>

      <aside
        aria-label={`Area ${area.area}, ${area.title}`}
        style={{
          width: '420px',
          flexShrink: 0,
          borderLeft: `1px solid ${color.borderStrong}`,
          background: color.panel,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <div style={{ padding: '26px 28px 20px', borderBottom: `1px solid ${color.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <svg width="18" height="20" viewBox="-11 -7 22 26" aria-hidden="true">
              <polygon points="0,-5.5 10,0 0,5.5 -10,0" fill={BIOME[selected] as string} />
              <polygon points="-10,0 0,5.5 0,15 -10,9.5" fill={shade(BIOME[selected] as string, 0.68)} />
              <polygon points="10,0 0,5.5 0,15 10,9.5" fill={shade(BIOME[selected] as string, 0.46)} />
            </svg>
            <Eyebrow style={{ color: BIOME[selected] as string }}>{`Area ${area.area}`}</Eyebrow>
          </div>

          <h2 style={{ margin: '0 0 4px', fontFamily: font.display, fontSize: '28px', letterSpacing: '-.015em' }}>
            {area.title}
          </h2>
          <p style={{ margin: 0, color: color.secondary, fontSize: '13px' }}>
            {`Weeks ${area.weeks.from}–${area.weeks.to} · ${area.blurb}`}
          </p>

          {p !== undefined && (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '20px' }}>
                <span style={{ fontFamily: font.display, fontSize: '34px', lineHeight: 1 }}>{p.cleared}</span>
                <span style={{ color: color.muted, fontSize: '16px' }}>of</span>
                <span style={{ fontFamily: font.display, fontSize: '34px', lineHeight: 1, color: color.secondary }}>
                  {formatTotal(p.total, p.estimated)}
                </span>
                <Eyebrow style={{ marginLeft: '2px' }}>cleared</Eyebrow>
              </div>

              <div style={{ display: 'flex', gap: '3px', marginTop: '12px' }} aria-hidden="true">
                {Array.from({ length: p.total }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      height: '5px',
                      flexGrow: 1,
                      background: i < p.cleared ? color.accent : 'transparent',
                      border: i < p.cleared ? 'none' : `1px dashed ${color.crumbRule}`,
                    }}
                  />
                ))}
              </div>

              {p.estimated && (
                <Mono style={{ display: 'block', marginTop: '12px', lineHeight: 1.6 }}>
                  The tilde is not decoration. This area is still being authored, so the total is
                  an estimate and says so. An estimate marked as an estimate is honest; one
                  presented as fact is not.
                </Mono>
              )}
            </>
          )}
        </div>

        <div style={{ flexGrow: 1, overflow: 'auto', padding: '22px 28px' }}>
          <p style={{ margin: '0 0 20px', color: color.fgBright, fontSize: '13.5px' }}>{area.blurb}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginBottom: '24px' }}>
            {/*
              * The artboard also lists "concepts 10 of 16 met". No contract shape carries a
              * per-area concept count, so it is absent rather than invented — the same rule that
              * removed the hardcoded area names.
              */}
            <SummaryRow k="quests" v={p === undefined ? '—' : `${p.cleared} of ${formatTotal(p.total, p.estimated)} cleared`} />
            <SummaryRow k="boss" v={boss.unlocked ? 'unlocked' : `${boss.required - boss.cleared} more to unlock`} fill={boss.unlocked ? color.accent : color.muted} />
            <SummaryRow k="invasions" v={dueHere === 0 ? 'none due' : `${dueHere} coming tonight`} fill={dueHere === 0 ? color.muted : color.badge} />
          </div>

          <Link
            to={`/area/${area.area}`}
            style={{
              display: 'block',
              padding: '12px 16px',
              background: color.avatarBg,
              border: `1px solid ${color.accentMid}`,
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '14px',
              color: color.fg,
              marginBottom: '9px',
              textDecoration: 'none',
            }}
          >
            Enter the area
          </Link>
          <Link
            to="/tome"
            style={{
              display: 'block',
              padding: '11px 16px',
              border: `1px solid ${color.borderStrong}`,
              textAlign: 'center',
              fontWeight: 600,
              fontSize: '13px',
              color: color.secondary,
              textDecoration: 'none',
            }}
          >
            Read it in the Tome first
          </Link>

          <Mono style={{ display: 'block', marginTop: '20px', lineHeight: 1.7 }}>
            The quests, the brief and the boss live inside the area — they are things about a
            place, not places of their own. The rail only carries what is true wherever you are
            standing.
          </Mono>
        </div>
      </aside>
    </div>
  );
}

function SummaryRow({ k, v, fill = color.fg }: { k: string; v: string; fill?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
      <Mono style={{ width: '82px', flexShrink: 0 }}>{k}</Mono>
      <Mono style={{ fontSize: '12.5px', color: fill }}>{v}</Mono>
    </div>
  );
}
