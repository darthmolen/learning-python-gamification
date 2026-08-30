import { color, font } from '../design/tokens';
import { getStandings, getXpSources } from '../gateway/index.ts';
import { Eyebrow, MedalSlots, Mono, Panel } from '../shell/ui';

/**
 * §5.8: "a record, not a race." There is no rank column and no ordering by score, because the
 * board exists to show what each player chose to go back for. `StandingSchema` carries no rank
 * field at all, which is the contract enforcing the same ruling one layer down.
 */
export function PartyScreen() {
  const standings = getStandings();
  const sources = getXpSources();

  return (
    <div style={{ padding: '26px 32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
        <h1 style={{ margin: 0, fontFamily: font.display, fontSize: '24px', letterSpacing: '-.015em' }}>Party</h1>
        <Eyebrow>a record, not a race</Eyebrow>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
        {standings.map((standing) => (
          <Panel key={standing.playerId}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <span style={{ fontFamily: font.display, fontSize: '18px' }}>{standing.playerId}</span>
              <Mono>{`level ${standing.level} · ${standing.toNext} to next · ${standing.areaXp} xp here`}</Mono>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '14px 0 0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {standing.areas.map((record) => (
                <li key={record.area} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Mono style={{ width: '58px' }}>{`area ${record.area}`}</Mono>
                  <Mono style={{ color: color.secondary, flexGrow: 1 }}>{`${record.cleared} cleared`}</Mono>
                  <MedalSlots held={record.medals} />
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>

      {/*
        * The one surface with nothing behind it. `xpSources` ships in the contract so this
        * screen is not blocked, but no engine function and no endpoint implements it — so it
        * stays stubbed through Phase 5 and says so rather than pretending.
        */}
      <Eyebrow style={{ margin: '34px 0 12px' }}>Where the XP came from</Eyebrow>
      <Panel>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sources.map((source) => (
            <li key={source.kind} style={{ display: 'flex', gap: '12px' }}>
              <Mono style={{ flexGrow: 1, color: color.secondary }}>{source.kind}</Mono>
              <Mono style={{ color: color.fg }}>{`${source.xp} xp`}</Mono>
            </li>
          ))}
        </ul>
        <Mono style={{ display: 'block', marginTop: '14px' }}>Stubbed — no endpoint implements this yet.</Mono>
      </Panel>
    </div>
  );
}
