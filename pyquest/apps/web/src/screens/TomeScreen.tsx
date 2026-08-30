import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import type { CampaignView, Tome as TomeContent } from '@pyquest/contract';
import { color, font } from '../design/tokens';
import { PLAYER_ID, getCampaign, getTome } from '../gateway/index.ts';
import { useResource } from '../gateway/useResource.ts';
import { Awaiting } from '../shell/Loading';
import { Eyebrow, Mono } from '../shell/ui';

/**
 * The Tome as a rail destination: **the whole field manual, open.**
 *
 * §6.8 lists the Tome twice on purpose, and the two are not the same control. Reached from the
 * rail it is a place — the syllabus, every page of it, nothing to reveal. Reached from a screen
 * where he is working it expands in place and pushes the work down, which is what
 * `src/tome/Tome.tsx` is for. Putting the expander here made him press a button to see the
 * thing he had just navigated to.
 *
 * Nothing in here locks. "Every page is open from day one — you may read ahead, and beating a
 * boss early is a legal move" (§361, §5.3). An area he has not reached is dimmer, never hidden.
 */
export function TomeScreen() {
  /*
   * Two requests, in parallel, because the two halves belong to different owners. `/api/tome`
   * carries concepts by area and deliberately no player state — "the syllabus is the same for
   * everyone, and the SPA already holds the player's areas from /campaign." The names and week
   * ranges come from the campaign; the concepts come from the Tome.
   */
  const load = useCallback(async () => {
    const [campaign, content] = await Promise.all([getCampaign(PLAYER_ID), getTome()]);
    return { campaign, content };
  }, []);
  const both = useResource(load, []);

  return (
    <Awaiting resource={both} label="the Tome">
      {(value) => <Manual campaign={value.campaign} content={value.content} />}
    </Awaiting>
  );
}

function Manual({ campaign, content }: { campaign: CampaignView; content: TomeContent }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(0);

  /** One row per area: the name content knows, and the concept count the syllabus knows. */
  const syllabus = campaign.areas.map((card) => ({
    area: card.area,
    identity: card.identity,
    concepts: content.areas.find((a) => a.area === card.area)?.concepts.length ?? 0,
  }));

  const entry = syllabus[selected];

  /*
   * Derived from what actually has weeks, not from a constant. ADR 0002 wanted `max(weeks.to)`
   * so the horizon stays true after a re-pace — and areas whose manifests carry no weeks simply
   * do not vote, rather than dragging the maximum to zero.
   */
  const ends = campaign.areas.flatMap((c) => (c.identity === undefined ? [] : [c.identity.weeks.to]));
  const totalWeeks = ends.length === 0 ? 0 : Math.max(...ends);

  if (entry === undefined) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '0 22px',
          height: '46px',
          borderBottom: `1px solid ${color.border}`,
          background: color.crumbBar,
          flexShrink: 0,
        }}
      >
        <Eyebrow style={{ color: color.accent }}>Tome</Eyebrow>
        <span style={{ color: color.crumbRule }}>·</span>
        <Mono style={{ fontSize: '11.5px', color: color.secondary }}>
          {entry.identity === undefined ? `Area ${entry.area}` : `Area ${entry.area} · ${entry.identity.title}`}
        </Mono>
        <div style={{ flexGrow: 1 }} />
        {/* The §6.8 promise, said out loud on the screen that keeps it. */}
        <Mono style={{ fontSize: '11.5px' }}>nothing was closed to open this</Mono>
        <button
          type="button"
          onClick={() => void navigate(-1)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '6px 14px',
            border: `1px solid ${color.accentMid}`,
            background: '#1a2119',
            marginLeft: '4px',
            cursor: 'pointer',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2.6 7.6 6 4.2 9.4 7.6" fill="none" stroke="#8fd196" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontWeight: 600, fontSize: '12.5px', color: '#8fd196' }}>Close Tome</span>
        </button>
      </div>

      <div style={{ flexGrow: 1, display: 'flex', minHeight: 0 }}>
        <nav
          aria-label="Syllabus"
          style={{
            width: '264px',
            flexShrink: 0,
            borderRight: `1px solid ${color.border}`,
            background: color.panel,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <div style={{ padding: '22px 20px 14px', borderBottom: `1px solid ${color.border}` }}>
            <h1 style={{ margin: '0 0 3px', fontFamily: font.display, fontSize: '20px', letterSpacing: '-.01em' }}>
              The Tome
            </h1>
            <Mono style={{ fontSize: '10.5px' }}>
              {`${totalWeeks} weeks · ${syllabus.length} areas · ${content.areas.reduce((n, a) => n + a.concepts.length, 0)} concepts`}
            </Mono>
          </div>

          <div style={{ flexGrow: 1, overflow: 'auto', padding: '10px 0' }}>
            {syllabus.map((item, i) => {
              const current = i === selected;

              return (
                <button
                  key={item.area}
                  type="button"
                  onClick={() => setSelected(i)}
                  aria-current={current ? 'page' : undefined}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '9px 20px',
                    background: current ? '#1a2119' : 'transparent',
                    borderLeft: `2px solid ${current ? color.accent : 'transparent'}`,
                    borderTop: 'none',
                    borderRight: 'none',
                    borderBottom: 'none',
                    cursor: 'pointer',
                    font: 'inherit',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <Mono style={{ fontSize: '10px', color: current ? color.accent : color.muted, width: '14px' }}>
                      {item.area}
                    </Mono>
                    <span style={{ fontSize: '13px', color: current ? color.fg : color.secondary, fontWeight: current ? 600 : 400, flexGrow: 1 }}>
                      {item.identity?.title ?? `Area ${item.area}`}
                    </span>
                    <Mono style={{ fontSize: '10px' }}>
                      {item.identity === undefined ? '' : `${item.identity.weeks.from}–${item.identity.weeks.to}`}
                    </Mono>
                  </span>
                  <Mono style={{ display: 'block', fontSize: '10px', color: '#4a5361', marginLeft: '22px' }}>
                    {`${item.concepts} concepts`}
                  </Mono>
                </button>
              );
            })}

            <div style={{ height: '1px', background: color.border, margin: '12px 20px' }} />
            <div style={{ padding: '4px 20px 12px' }}>
              <Mono style={{ fontSize: '10.5px', lineHeight: 1.7 }}>
                Every page is open from day one. Nothing here unlocks — you may read ahead, and
                beating a boss early is a legal move. Opening this pushes your work down the page
                — it never closes it.
              </Mono>
            </div>
          </div>
        </nav>

        <div style={{ flexGrow: 1, minWidth: 0, overflow: 'auto', padding: '34px 46px 60px' }}>
          <div style={{ maxWidth: '660px' }}>
            <Eyebrow style={{ color: color.accent, marginBottom: '8px' }}>
              {`Field manual · Area ${entry.area}`}
            </Eyebrow>
            <h2 style={{ margin: '0 0 6px', fontFamily: font.display, fontSize: '38px', lineHeight: 1.05, letterSpacing: '-.015em' }}>
              {entry.identity?.title ?? `Area ${entry.area}`}
            </h2>
            <p style={{ margin: '0 0 4px', color: color.secondary }}>
              {entry.identity === undefined
                ? `${entry.concepts} concepts · everything below is on the Boss ${entry.area} specification.`
                : `Weeks ${entry.identity.weeks.from}–${entry.identity.weeks.to} · ${entry.concepts} concepts · everything below is on the Boss ${entry.area} specification.`}
            </p>
            <div style={{ height: '1px', background: color.border, margin: '24px 0' }} />

            <p style={{ margin: '0 0 20px', color: color.fgBright, fontSize: '14.5px', lineHeight: 1.75 }}>
              {entry.identity?.blurb ?? 'This area carries no blurb on the wire yet.'}
            </p>

            {/*
              * The manual's sections, prose and code samples are authored content the API has yet
              * to serve — there is no contract shape for a Tome page. The syllabus above is real;
              * this is honest about not being.
              */}
            <Mono style={{ display: 'block', lineHeight: 1.7 }}>
              The written manual for this area is content the API has yet to serve. The syllabus
              beside it is real, and every area in it is open.
            </Mono>
          </div>
        </div>
      </div>
    </div>
  );
}
