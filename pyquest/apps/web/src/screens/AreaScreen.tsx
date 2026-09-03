import { useCallback, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import type { AreaView } from '@pyquest/contract';
import { color, font } from '../design/tokens';
import { getArea } from '../gateway/index.ts';
import { usePlayer } from '../session/SessionProvider.tsx';
import { useResource } from '../gateway/useResource.ts';
import { Awaiting } from '../shell/Loading';
import { byDifficulty, formatTotal } from '../present/index.ts';
import { Breadcrumbs } from '../shell/Breadcrumbs';
import { ConceptList, Cube, Display, Eyebrow, MedalSlots, Mono, Panel, RiskWarning } from '../shell/ui';

/**
 * One page holding the three things about a place: the brief, its five quests, and its boss.
 *
 * §6.8 is explicit that these are aspects of an area rather than destinations — "putting them
 * in the rail implied you could be in Quests without being anywhere" — which is why they are
 * sections here and not routes.
 */

const STATUS_MARK: Readonly<Record<string, string>> = {
  cleared: '◆',
  available: '◇',
  locked: '·',
};

/**
 * A quest row: an anchor when it can be entered, an identically-shaped `div` when it cannot.
 *
 * A locked quest renders the same box rather than a disabled link, so nothing shifts when one
 * unlocks and there is still no link for a keyboard to land on. `data-row` is the hook for the
 * hover and focus treatment in `index.css` — the one thing an inline style cannot express.
 */
function QuestRow({
  status,
  to,
  label,
  children,
}: {
  status: string;
  to: string;
  label: string;
  children: ReactNode;
}) {
  const style: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '13px',
    padding: '14px 16px',
    background: status === 'cleared' ? '#1a2119' : color.panel,
    borderLeft: `2px solid ${status === 'cleared' ? color.accent : 'transparent'}`,
    color: 'inherit',
    textDecoration: 'none',
  };

  if (status === 'locked') return <div style={style}>{children}</div>;

  return (
    <Link data-row="quest" to={to} aria-label={label} style={style}>
      {children}
    </Link>
  );
}

export function AreaScreen() {
  const playerId = usePlayer();
  const { areaId = '' } = useParams();
  const area = Number(areaId);
  const load = useCallback(() => getArea(playerId, area), [area]);
  const view = useResource(load, [area]);

  return (
    <Awaiting resource={view} label={`Area ${areaId}`}>
      {(value) => <Area view={value} />}
    </Awaiting>
  );
}

function Area({ view }: { view: AreaView }) {
  const area = view.area;
  const identity = view.identity;
  const progress = view.progress;
  const boss = view.boss;
  /*
   * Cheapest first. The engine hands these over in the order content loaded them, which is the
   * order their YAML files sit on disk — see `byDifficulty`, which carries the argument for
   * deciding it here rather than there.
   */
  const quests = byDifficulty(view.quests);
  /* An area whose manifest carries no weeks or blurb has no identity to send. Its number is
   * still its name, and that is better than a title invented to fill the space. */
  const title = identity?.title ?? `Area ${area}`;

  return (
    <>
      <Breadcrumbs
        trail={[{ label: 'Map', to: '/map' }]}
        here={identity === undefined ? `Area ${area}` : `Area ${area} · ${identity.title}`}
        aside={identity === undefined ? undefined : `weeks ${identity.weeks.from}–${identity.weeks.to}`}
      />

      <div style={{ padding: '30px 40px 50px', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '22px' }}>
          <Cube size={62} />
          <div style={{ minWidth: 0 }}>
            <Eyebrow style={{ color: color.accent }}>{`Area ${area}`}</Eyebrow>
            <h1 style={{ margin: '4px 0', fontFamily: font.display, fontSize: '32px', letterSpacing: '-.015em' }}>
              {title}
            </h1>
            {identity !== undefined && (
              <p style={{ margin: 0, color: color.secondary, fontSize: '13px' }}>
                {`Weeks ${identity.weeks.from}–${identity.weeks.to} · ${identity.blurb}`}
              </p>
            )}
          </div>
          <div style={{ flexGrow: 1 }} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <Display size={34}>{String(progress.cleared)}</Display>
            <span style={{ color: color.muted, fontSize: '16px' }}>of</span>
            <span style={{ fontFamily: font.display, fontSize: '34px', color: color.secondary }}>
              {/* §5.1a: the tilde is not decoration. See src/present. */}
              {formatTotal(progress.total, progress.estimated)}
            </span>
            <Eyebrow style={{ marginLeft: '2px' }}>cleared</Eyebrow>
          </div>
        </div>

        <Eyebrow style={{ margin: '34px 0 12px' }}>The brief</Eyebrow>
        <Panel>
          {identity === undefined ? (
            <Mono>This area's manifest carries no blurb yet, so there is nothing to show here.</Mono>
          ) : (
            <p style={{ margin: 0, color: color.fgBright }}>{identity.blurb}</p>
          )}
        </Panel>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', margin: '34px 0 12px' }}>
          <Eyebrow>Quests</Eyebrow>
          <Mono>any three unlock the boss · you choose which</Mono>
        </div>

        {quests.length === 0 ? (
          <Panel>
            <Mono>Nothing authored here yet. The area exists; its quests do not.</Mono>
          </Panel>
        ) : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '2px', listStyle: 'none', margin: 0, padding: 0 }}>
            {quests.map((quest) => (
              <li
                key={quest.id}
                /*
                 * Named so the row announces as one thing — "The Recipe Book, DC 12, cleared" —
                 * rather than as a status glyph, a title, a concept list and five anonymous
                 * diamonds read out in sequence.
                 */
                aria-label={`${quest.title}, DC ${quest.dc}, ${quest.status}`}
              >
                {/*
                  * The whole row is the link, not the title inside it.
                  *
                  * It was the title alone, which left the padding, the concepts, the DC and the
                  * pips inert — a target that looks like a row and behaves like two words. And it
                  * stays an anchor rather than an `onClick` on the `<li>`: middle-click,
                  * ctrl-click, Tab and Enter are not click events, and a handler would take all
                  * four away in exchange for the same navigation.
                  *
                  * `aria-label` keeps its accessible name the quest's title. Without it the name
                  * is computed from everything inside — title, concepts, DC, five medal labels —
                  * and the link announces as a paragraph.
                  */}
                <QuestRow
                  status={quest.status}
                  to={`/area/${area}/quest/${quest.id}`}
                  label={quest.title}
                >
                  <span aria-hidden="true" style={{ color: color.muted, fontSize: '13px', width: '12px' }}>
                    {STATUS_MARK[quest.status]}
                  </span>
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: quest.status === 'locked' ? color.muted : color.fg }}>
                      {quest.title}
                    </div>
                    <ConceptList
                      concepts={quest.concepts}
                      label={`Concepts for ${quest.title}`}
                      style={{ marginTop: '5px' }}
                    />
                  </div>
                  <RiskWarning dc={quest.dc} />
                  <Mono style={{ width: '50px', textAlign: 'right' }}>{`DC ${quest.dc}`}</Mono>
                  <MedalSlots held={quest.medals} />
                </QuestRow>
              </li>
            ))}
          </ul>
        )}

        <Eyebrow style={{ margin: '34px 0 12px' }}>Boss</Eyebrow>
        <div style={{ border: `1px solid ${color.accentMid}`, background: '#182219', padding: '20px 24px' }}>
          <Display size={19}>{`Boss ${area}`}</Display>
          <Mono style={{ display: 'block', marginTop: '6px' }}>
            {`${boss.cleared} of ${boss.required} required quests cleared`}
          </Mono>
          {boss.unlocked ? (
            <Link to={`/area/${area}/boss`} style={{ display: 'inline-block', marginTop: '14px', padding: '8px 18px', border: `1px solid ${color.accentMid}`, color: color.accent, fontWeight: 600, fontSize: '13px' }}>
              Face the boss
            </Link>
          ) : (
            <Mono style={{ display: 'block', marginTop: '14px', color: color.muted }}>
              {`Clear ${boss.required - boss.cleared} more to unlock`}
            </Mono>
          )}
        </div>
      </div>
    </>
  );
}
