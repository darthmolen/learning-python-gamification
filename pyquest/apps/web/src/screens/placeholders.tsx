import { useParams } from 'react-router';
import { Breadcrumbs } from '../shell/Breadcrumbs';
import { color, font } from '../design/tokens';

/**
 * Phase 1 placeholders.
 *
 * These exist so the shell, the rail, the breadcrumbs and the nine routes can be built and
 * tested before there is any data — which is the whole point of a phase that needs nothing
 * upstream. Phase 2 replaces each body with the artboard's real content, read through
 * `src/gateway/`. The headings are real because the routing tests assert them; nothing else
 * here is load-bearing.
 */

function Title({ children }: { children: string }) {
  return (
    <h1
      className="disp"
      style={{ margin: 0, fontSize: '24px', fontFamily: font.display, letterSpacing: '-.015em' }}
    >
      {children}
    </h1>
  );
}

function Stub({ note }: { note: string }) {
  return (
    <p style={{ marginTop: '10px', color: color.muted, fontFamily: font.mono, fontSize: '11px' }}>
      {note}
    </p>
  );
}

function Overland({ title, note }: { title: string; note: string }) {
  return (
    <div style={{ padding: '26px 32px' }}>
      <Title>{title}</Title>
      <Stub note={note} />
    </div>
  );
}

export const MapScreen = () => <Overland title="The Campaign" note="Phase 2 — the eight areas, locked ones drained of colour." />;
export const TomeScreen = () => <Overland title="Tome" note="Phase 2 — the field manual and the whole syllabus." />;
export const DefendScreen = () => <Overland title="Defend" note="Phase 2 — the session's invasions (§5.4)." />;
export const PartyScreen = () => <Overland title="Party" note="Phase 2 — players, levels, area standings, open bounties (§5.8). xpSources stays stubbed." />;
export const JournalScreen = () => <Overland title="Journal" note="Phase 2 — entries, prompts, parent replies (§5.6)." />;
export const ConsoleScreen = () => <Overland title="Console" note="Phase 2 — sign-off, authoring, streak forgiveness (§5.11)." />;

export function AreaScreen() {
  const { areaId = '' } = useParams();

  return (
    <>
      <Breadcrumbs trail={[{ label: 'Map', to: '/map' }]} here={`Area ${areaId}`} />
      <div style={{ padding: '30px 40px' }}>
        <Title>{`Area ${areaId}`}</Title>
        <Stub note="Phase 2 — the brief, its five quests, and its boss. One page, three aspects." />
      </div>
    </>
  );
}

export function QuestScreen() {
  const { areaId = '', questId = '' } = useParams();

  return (
    <>
      <Breadcrumbs
        trail={[
          { label: 'Map', to: '/map' },
          { label: `Area ${areaId}`, to: `/area/${areaId}` },
          { label: 'Quests', to: `/area/${areaId}` },
        ]}
        here={questId}
      />
      <div style={{ padding: '30px 40px' }}>
        <Title>{questId}</Title>
        <Stub note="Phase 3 — brief, CodeMirror, Run and Submit, Datamine, medal slots." />
      </div>
    </>
  );
}

export function BossScreen() {
  const { areaId = '' } = useParams();

  return (
    <>
      <Breadcrumbs
        trail={[
          { label: 'Map', to: '/map' },
          { label: `Area ${areaId}`, to: `/area/${areaId}` },
        ]}
        here={`Boss ${areaId}`}
      />
      <div style={{ padding: '30px 40px' }}>
        <Title>{`Boss ${areaId}`}</Title>
        <Stub note="Phase 2 — specification, framings, attempt log, scars, sign-off." />
      </div>
    </>
  );
}
