import { useParams } from 'react-router';
import { color, font } from '../design/tokens';
import { getAreaIdentity, getAvailableQuests } from '../gateway/index.ts';
import { Breadcrumbs } from '../shell/Breadcrumbs';
import { Tome } from '../tome/Tome';
import { Eyebrow, MedalSlots, Mono, Panel, RiskWarning } from '../shell/ui';

/**
 * Brief, editor, Run and Submit, Datamine, medal slots (§6.8).
 *
 * Phase 2 renders everything the contract carries. **Phase 3 brings CodeMirror, Pyodide and
 * Run** — the editor is deliberately absent rather than faked, because a Submit that passes on
 * unchanged code is a lie about the mechanic and a disabled textarea invites exactly that.
 */
export function QuestScreen() {
  const { areaId = '', questId = '' } = useParams();
  const area = Number(areaId);
  const identity = getAreaIdentity(area);
  const quest = getAvailableQuests(area).find((q) => q.id === questId);

  const areaLabel = identity === undefined ? `Area ${areaId}` : `Area ${area} · ${identity.title}`;

  return (
    <>
      <Breadcrumbs
        trail={[
          { label: 'Map', to: '/map' },
          { label: areaLabel, to: `/area/${areaId}` },
          { label: 'Quests', to: `/area/${areaId}` },
        ]}
        here={quest?.title ?? questId}
      />
      <div style={{ padding: '30px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <h1 style={{ margin: 0, fontFamily: font.display, fontSize: '30px', letterSpacing: '-.015em' }}>
            {quest?.title ?? questId}
          </h1>
          {quest !== undefined && <RiskWarning dc={quest.dc} />}
          {quest !== undefined && <Mono style={{ fontSize: '13px' }}>{`DC ${quest.dc}`}</Mono>}
        </div>

        {quest !== undefined && (
          <>
            <Mono style={{ display: 'block', marginTop: '8px' }}>{quest.concepts.join(' · ')}</Mono>
            <Eyebrow style={{ margin: '28px 0 10px' }}>Medals</Eyebrow>
            <MedalSlots held={quest.medals} />
          </>
        )}

        {/*
          * The in-place Tome, mounted where §6.8's argument actually applies: "If looking
          * something up costs a learner the code in his editor, he stops looking things up."
          * The rail's Tome is a place; this one expands over the work without closing it.
          */}
        <div style={{ marginTop: '28px' }}>
          <Tome>
            <p style={{ margin: 0, color: color.fgBright }}>
              The field manual for this area opens here, in place. Nothing above is covered and
              nothing is lost — your editor keeps whatever is in it.
            </p>
          </Tome>
        </div>

        <Eyebrow style={{ margin: '30px 0 12px' }}>The work</Eyebrow>
        <Panel>
          <p style={{ margin: 0, color: color.secondary }}>
            Phase 3 — CodeMirror, Pyodide, and Run in the browser. Submit posts to the API,
            because hidden tests shipped to the client are not hidden (§6.3).
          </p>
        </Panel>
      </div>
    </>
  );
}
