import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import type { CampaignView, Tome as TomeContent } from '@pyquest/contract';
import { color, font } from '../design/tokens';
import { getCampaign, getTome } from '../gateway/index.ts';
import { usePlayer } from '../session/SessionProvider.tsx';
import { useResource } from '../gateway/useResource.ts';
import { Awaiting } from '../shell/Loading';
import { ConceptList, Eyebrow, Mono } from '../shell/ui';
import { Markdown } from '../tome/Markdown';

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
  const playerId = usePlayer();
  /*
   * Two requests, in parallel, because the two halves belong to different owners. `/api/tome`
   * carries concepts by area and deliberately no player state — "the syllabus is the same for
   * everyone, and the SPA already holds the player's areas from /campaign." The names and week
   * ranges come from the campaign; the concepts come from the Tome.
   */
  const load = useCallback(async () => {
    const [campaign, content] = await Promise.all([getCampaign(playerId), getTome()]);
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

  /**
   * One row per area: the name content knows, and the syllabus and lesson the Tome knows.
   *
   * **The concepts travel as the list, not as its length.** This was `page?.concepts.length ?? 0`,
   * which was all the screen needed while it only printed a number — and it is exactly how a
   * count and a list come to disagree later, because nothing structural stops the two being fed
   * separately. A syllabus that says seventeen beside a list of twelve is worse than one that
   * says nothing, since it looks authoritative. One source, counted where it is printed.
   */
  const syllabus = campaign.areas.map((card) => {
    const page = content.areas.find((a) => a.area === card.area);
    return {
      area: card.area,
      identity: card.identity,
      concepts: page?.concepts ?? [],
      lesson: page?.lesson,
      lessonIsDraft: page?.lessonIsDraft ?? false,
    };
  });

  const entry = syllabus[selected];

  /**
   * Every concept in the Tome, not just this area's.
   *
   * **Area-scoped would break on the first real lesson.** `curriculum/area-3/lesson.draft.md`
   * already writes `print` and `range` — Area 0 and Area 1 concepts in an Area 3 lesson, which is
   * exactly what a curriculum that builds on itself looks like. Worse, `validate:content` would
   * pass them, because it checks the registry rather than the area: a cross-area mark would
   * validate green and render dead, and nobody would find out from a test.
   *
   * The whole response is already in hand, so the lookup costs one map.
   */
  const term = useMemo(() => {
    const byId = new Map(content.areas.flatMap((a) => a.concepts.map((c) => [c.id, c] as const)));
    return (id: string) => byId.get(id);
  }, [content]);

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
                    {`${item.concepts.length} concepts`}
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
                ? `${entry.concepts.length} concepts · everything below is on the Boss ${entry.area} specification.`
                : `Weeks ${entry.identity.weeks.from}–${entry.identity.weeks.to} · ${entry.concepts.length} concepts · everything below is on the Boss ${entry.area} specification.`}
            </p>
            <div style={{ height: '1px', background: color.border, margin: '24px 0' }} />

            <p style={{ margin: '0 0 20px', color: color.fgBright, fontSize: '14.5px', lineHeight: 1.75 }}>
              {entry.identity?.blurb ?? 'This area carries no blurb on the wire yet.'}
            </p>

            {/*
              * The words the header just counted.
              *
              * **Above the lesson, because an area's vocabulary is its index.** The count sits two
              * lines up; the terms belong with it rather than past a full page of teaching, and a
              * reader who came here to look one word up should not have to read the area to find
              * it. As terms it is three rows — nine to seventeen per area — and only one
              * definition is open at a time, so the lesson is pushed down rather than buried.
              *
              * `expandable` is the same control the Quest screen's chips are, deliberately. Two
              * screens doing the same job with two interactions is how they start behaving
              * differently, and this one is already tested against the Tome's own rules: no
              * dialog, no scrim, in flow, nothing underneath unmounted.
              *
              * An area the syllabus does not carry renders nothing here rather than an empty
              * heading — `payloads.ts` declines to invent a blurb for the same reason.
              */}
            {entry.concepts.length > 0 && (
              <div style={{ margin: '0 0 24px' }}>
                <Eyebrow style={{ marginBottom: '8px' }}>Vocabulary</Eyebrow>
                <ConceptList concepts={entry.concepts} label="Vocabulary" expandable />
              </div>
            )}

            {/*
              * The teaching itself, from `curriculum/area-N/lesson.md`. An area with none says so
              * rather than showing an empty page — the same honesty §5.1a asks of the tilde, and
              * the rule `apps/field-manual/src/build.ts` already keeps for the same prose.
              */}
            {entry.lessonIsDraft && (
              <Mono style={{ display: 'block', marginBottom: '18px', lineHeight: 1.7, color: color.badge }}>
                This lesson is a draft. It was written ahead of the sessions that will correct it.
              </Mono>
            )}
            {entry.lesson === undefined ? (
              <Mono style={{ display: 'block', lineHeight: 1.7 }}>
                The lesson for this area is not written yet. The syllabus beside it is real, and
                every area in it is open.
              </Mono>
            ) : (
              <Markdown text={entry.lesson} term={term} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
