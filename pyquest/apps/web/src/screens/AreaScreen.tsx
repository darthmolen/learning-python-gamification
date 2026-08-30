import { Link, useParams } from 'react-router';
import { color, font } from '../design/tokens';
import { getAreaIdentity, getAreaProgress, getAvailableQuests, getBossState } from '../gateway/index.ts';
import { formatTotal } from '../present/index.ts';
import { Breadcrumbs } from '../shell/Breadcrumbs';
import { Cube, Display, Eyebrow, MedalSlots, Mono, Panel, RiskWarning } from '../shell/ui';

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

export function AreaScreen() {
  const { areaId = '' } = useParams();
  const area = Number(areaId);
  const identity = getAreaIdentity(area);

  if (identity === undefined) {
    return (
      <>
        <Breadcrumbs trail={[{ label: 'Map', to: '/map' }]} here={`Area ${areaId}`} />
        <div style={{ padding: '30px 40px' }}>
          <Display>Not a place in this campaign</Display>
          <p style={{ color: color.secondary }}>The campaign runs from Area 0 to Area 7.</p>
        </div>
      </>
    );
  }

  const progress = getAreaProgress(area);
  const boss = getBossState(area);
  const quests = getAvailableQuests(area);

  return (
    <>
      <Breadcrumbs
        trail={[{ label: 'Map', to: '/map' }]}
        here={`Area ${area} · ${identity.title}`}
        aside={`weeks ${identity.weeks.from}–${identity.weeks.to}`}
      />

      <div style={{ padding: '30px 40px 50px', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '22px' }}>
          <Cube size={62} />
          <div style={{ minWidth: 0 }}>
            <Eyebrow style={{ color: color.accent }}>{`Area ${area}`}</Eyebrow>
            <h1 style={{ margin: '4px 0', fontFamily: font.display, fontSize: '32px', letterSpacing: '-.015em' }}>
              {identity.title}
            </h1>
            <p style={{ margin: 0, color: color.secondary, fontSize: '13px' }}>
              {`Weeks ${identity.weeks.from}–${identity.weeks.to} · ${identity.blurb}`}
            </p>
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
          <p style={{ margin: 0, color: color.fgBright }}>{identity.blurb}</p>
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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '13px',
                  padding: '14px 16px',
                  background: quest.status === 'cleared' ? '#1a2119' : color.panel,
                  borderLeft: `2px solid ${quest.status === 'cleared' ? color.accent : 'transparent'}`,
                }}
              >
                <span aria-hidden="true" style={{ color: color.muted, fontSize: '13px', width: '12px' }}>
                  {STATUS_MARK[quest.status]}
                </span>
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  {quest.status === 'locked' ? (
                    <div style={{ fontWeight: 600, color: color.muted }}>{quest.title}</div>
                  ) : (
                    <Link
                      to={`/area/${area}/quest/${quest.id}`}
                      style={{ fontWeight: 600, color: color.fg, textDecoration: 'none' }}
                    >
                      {quest.title}
                    </Link>
                  )}
                  <Mono style={{ display: 'block' }}>{quest.concepts.join(' · ')}</Mono>
                </div>
                <RiskWarning dc={quest.dc} />
                <Mono style={{ fontSize: '12px', width: '46px', textAlign: 'right' }}>{`DC ${quest.dc}`}</Mono>
                <MedalSlots held={quest.medals} />
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
