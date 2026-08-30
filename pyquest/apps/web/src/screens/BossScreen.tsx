import { useParams } from 'react-router';
import { color, font } from '../design/tokens';
import { getAreaIdentity, getBossState } from '../gateway/index.ts';
import { Breadcrumbs } from '../shell/Breadcrumbs';
import { Display, Eyebrow, Mono, Panel } from '../shell/ui';

/** Specification, framings, attempt log, scars, sign-off (§6.8). */
export function BossScreen() {
  const { areaId = '' } = useParams();
  const area = Number(areaId);
  const identity = getAreaIdentity(area);
  const boss = getBossState(area);

  const title = identity === undefined ? `Area ${areaId}` : `Area ${area} · ${identity.title}`;

  return (
    <>
      <Breadcrumbs
        trail={[
          { label: 'Map', to: '/map' },
          { label: title, to: `/area/${areaId}` },
        ]}
        here={`Boss ${areaId}`}
      />
      <div style={{ padding: '30px 40px' }}>
        <h1 style={{ margin: 0, fontFamily: font.display, fontSize: '32px', letterSpacing: '-.015em' }}>
          {`Boss ${areaId}`}
        </h1>
        <Mono style={{ display: 'block', marginTop: '8px' }}>
          {`${boss.cleared} of ${boss.required} required quests cleared`}
        </Mono>

        <Eyebrow style={{ margin: '30px 0 12px' }}>Specification</Eyebrow>
        <Panel>
          {boss.unlocked ? (
            <p style={{ margin: 0, color: color.fgBright }}>
              The boss is open. §361 also lets you attempt it early — beating it skips the
              area&rsquo;s remaining quests and pays a bonus.
            </p>
          ) : (
            <p style={{ margin: 0, color: color.secondary }}>
              {`Any three quests unlock this boss. ${boss.required - boss.cleared} to go — or attempt it cold.`}
            </p>
          )}
        </Panel>

        <Eyebrow style={{ margin: '30px 0 12px' }}>Attempts</Eyebrow>
        <Panel>
          <Display size={15}>Phase 2 — the attempt log and scars</Display>
          <Mono style={{ display: 'block', marginTop: '6px' }}>
            Attempts are progress rows the API owns; this waits on the endpoint.
          </Mono>
        </Panel>
      </div>
    </>
  );
}
