import { useCallback } from 'react';
import type { DueInvasion } from '@pyquest/contract';
import { color, font } from '../design/tokens';
import { getDefend } from '../gateway/index.ts';
import { usePlayer } from '../session/SessionProvider.tsx';
import { useResource } from '../gateway/useResource.ts';
import { Awaiting } from '../shell/Loading';
import { Eyebrow, Mono, Panel } from '../shell/ui';

const SOURCE_LABEL: Readonly<Record<string, string>> = {
  ladder: 'ladder',
  datamine: 'datamine',
  both: 'ladder + datamine',
};

/**
 * The session's invasions (§5.4). The queue is capped at five and a concept appears once —
 * both rules live on `DueInvasionsSchema`, so a queue that broke either would have failed in
 * the gateway rather than rendered here.
 *
 * An empty queue is a real and good state: nothing is due. It says so plainly rather than
 * showing an empty list, because a blank panel reads as broken.
 */
export function DefendScreen() {
  const playerId = usePlayer();
  const load = useCallback(() => getDefend(playerId), []);
  const queue = useResource(load, []);

  return (
    <Awaiting resource={queue} label="the invasion queue">
      {(due) => <Queue due={due} />}
    </Awaiting>
  );
}

function Queue({ due }: { due: DueInvasion[] }) {

  return (
    <div style={{ padding: '26px 32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
        <h1 style={{ margin: 0, fontFamily: font.display, fontSize: '24px', letterSpacing: '-.015em' }}>Defend</h1>
        <Eyebrow>{`${due.length} due this session`}</Eyebrow>
      </div>

      {due.length === 0 ? (
        <Panel style={{ marginTop: '24px' }}>
          <Mono>Nothing is due. The ladder is clear.</Mono>
        </Panel>
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '2px', listStyle: 'none', padding: 0, margin: '24px 0 0' }}>
          {due.map((invasion) => (
            <li
              key={invasion.conceptId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 16px',
                background: color.panel,
                borderLeft: `2px solid ${invasion.overdueDays > 0 ? color.badge : color.crumbRule}`,
              }}
            >
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontFamily: font.mono, fontSize: '13px' }}>{invasion.conceptId}</div>
                <Mono style={{ display: 'block' }}>
                  {`area ${invasion.area} · ${SOURCE_LABEL[invasion.source]} · last seen ${invasion.lastSeen}`}
                </Mono>
              </div>
              <Mono style={{ color: invasion.overdueDays > 0 ? color.badge : color.muted }}>
                {invasion.overdueDays > 0 ? `${invasion.overdueDays} days overdue` : 'due today'}
              </Mono>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
