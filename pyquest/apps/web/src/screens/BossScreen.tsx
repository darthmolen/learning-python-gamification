import { useCallback } from 'react';
import { useParams } from 'react-router';
import type { AreaView } from '@pyquest/contract';
import { color, font } from '../design/tokens';
import { getArea } from '../gateway/index.ts';
import { usePlayer } from '../session/SessionProvider.tsx';
import { useResource } from '../gateway/useResource.ts';
import { Awaiting } from '../shell/Loading';
import { Breadcrumbs } from '../shell/Breadcrumbs';
import { Display, Eyebrow, Mono, Panel } from '../shell/ui';

/** Specification, framings, attempt log, scars, sign-off (§6.8). */
export function BossScreen() {
  const playerId = usePlayer();
  const { areaId = '' } = useParams();
  const area = Number(areaId);
  const load = useCallback(() => getArea(playerId, area), [area]);
  const view = useResource(load, [area]);

  return (
    <Awaiting resource={view} label={`Boss ${areaId}`}>
      {(value) => <Boss view={value} areaId={areaId} />}
    </Awaiting>
  );
}

/**
 * The boss reads from the area's own view rather than a route of its own. §6.8 is explicit that
 * the boss is an aspect of a place rather than a place — and one request for both is what the
 * API was shaped for.
 */
function Boss({ view, areaId }: { view: AreaView; areaId: string }) {
  const area = view.area;
  const boss = view.boss;
  const identity = view.identity;

  const title = identity === undefined ? `Area ${area}` : `Area ${area} · ${identity.title}`;

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
