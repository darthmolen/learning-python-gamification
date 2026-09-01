import { useCallback, useState } from 'react';
import { useParams } from 'react-router';
import type { QuestView } from '@pyquest/contract';
import { color, font } from '../design/tokens';
import { getQuest } from '../gateway/index.ts';
import { usePlayer } from '../session/SessionProvider.tsx';
import { useResource } from '../gateway/useResource.ts';
import { Awaiting } from '../shell/Loading';
import { Editor } from '../quest/Editor';
import { isUnchanged, statusLine } from '../quest/runner.ts';
import { formatPayout } from '../present/index.ts';
import { useRunner, type WorkerFactory } from '../quest/useRunner.ts';
import { Breadcrumbs } from '../shell/Breadcrumbs';
import { Eyebrow, MedalSlots, Mono, Panel, RiskWarning } from '../shell/ui';
import { Tome } from '../tome/Tome';
import { TurtleCanvas } from '../turtle/TurtleCanvas';

/**
 * Brief, editor, Run and Submit, Datamine, medal slots (§6.8).
 *
 * **Run and Submit are different paths on purpose** (§6.3). Run is Pyodide in a worker, gives
 * instant feedback, and records nothing. Submit goes to the API, because anything shipped to
 * the browser is readable and hidden tests shipped to the client are not hidden.
 *
 * So Submit cannot work until the API exists, and it says so rather than pretending. What it
 * *does* already do is refuse untouched code — the prototype's Submit parses the editor rather
 * than counting clicks, and a Submit that passes on unchanged code is a lie about the mechanic.
 */

interface QuestScreenProps {
  /** Injected in tests. jsdom has no `Worker`, and Pyodide is ten megabytes of wasm. */
  makeWorker?: WorkerFactory;
}

export function QuestScreen({ makeWorker }: QuestScreenProps = {}) {
  const playerId = usePlayer();
  const { areaId = '', questId = '' } = useParams();
  const load = useCallback(() => getQuest(playerId, questId), [questId]);
  const quest = useResource(load, [questId]);

  return (
    <Awaiting resource={quest} label={questId}>
      {(view) => <Quest view={view} areaId={areaId} makeWorker={makeWorker} />}
    </Awaiting>
  );
}

function Quest({
  view,
  areaId,
  makeWorker,
}: {
  view: QuestView;
  areaId: string;
  makeWorker?: WorkerFactory;
}) {
  /*
   * The starter comes from content now, not from a constant in this file. `/quests/:questId`
   * carries it because Run happens in the browser (§6.1) — and a quest with no starter is
   * legal, which is what an empty editor means rather than a bug.
   */
  const starter = view.starter ?? '';
  const [code, setCode] = useState(starter);
  const { state, run, stop } = useRunner(makeWorker);
  const running = state.phase === 'running';
  const untouched = isUnchanged(code, starter);

  const areaLabel = `Area ${view.area}`;

  return (
    <>
      <Breadcrumbs
        trail={[
          { label: 'Map', to: '/map' },
          { label: areaLabel, to: `/area/${areaId}` },
          { label: 'Quests', to: `/area/${areaId}` },
        ]}
        here={view.title}
      />

      <div style={{ padding: '26px 32px 50px', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <h1 style={{ margin: 0, fontFamily: font.display, fontSize: '30px', letterSpacing: '-.015em' }}>
            {view.title}
          </h1>
          <RiskWarning dc={view.dc} />
          <Mono style={{ fontSize: '13px' }}>{`DC ${view.dc}`}</Mono>
          <div style={{ flexGrow: 1 }} />
          <MedalSlots held={view.medalsHeld} />
        </div>

        <Mono style={{ display: 'block', marginTop: '8px' }}>{view.concepts.join(' · ')}</Mono>

        {/*
          * What each medal would pay from here. §5.10: zero is legal and reads as a brag, which
          * is why `formatPayout` exists rather than a bare number — a `0 xp` beside something he
          * went back to earn on purpose says it counted for nothing.
          */}
        <div style={{ display: 'flex', gap: '18px', marginTop: '10px', flexWrap: 'wrap' }}>
          {view.medalSlots.map((slot) => (
            <Mono key={slot.medal} style={{ color: view.medalsHeld.includes(slot.medal) ? color.accent : color.muted }}>
              {`${slot.medal} · DC ${slot.effectiveDC} · ${formatPayout(slot.xp)}`}
            </Mono>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '18px', marginTop: '24px', alignItems: 'flex-start' }}>
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            <Eyebrow style={{ marginBottom: '10px' }}>Your code</Eyebrow>
            <Editor value={code} onChange={setCode} label="Python editor" />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
              {/*
                * Two buttons, two words, and neither word changes. State lives in the line to
                * their right — a Run button that reads "Running…" is the same mistake as "Take
                * it cold" on a screen showing three quests cleared.
                */}
              <button
                type="button"
                onClick={() => run(code, `${view.id}.py`)}
                disabled={running}
                style={{
                  padding: '8px 20px',
                  background: 'transparent',
                  border: `1px solid ${color.accentMid}`,
                  color: color.accent,
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: running ? 'default' : 'pointer',
                  opacity: running ? 0.5 : 1,
                }}
              >
                Run
              </button>

              {/* Only while there is something to stop. ADR 0003 is what makes this possible. */}
              {running && (
                <button
                  type="button"
                  onClick={stop}
                  style={{
                    padding: '8px 20px',
                    background: 'transparent',
                    border: `1px solid ${color.danger}`,
                    color: color.danger,
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Stop
                </button>
              )}

              <button
                type="button"
                disabled
                aria-describedby="submit-why"
                style={{
                  padding: '8px 20px',
                  background: color.avatarBg,
                  border: `1px solid ${color.borderStrong}`,
                  color: color.secondary,
                  fontWeight: 700,
                  fontSize: '13px',
                  opacity: 0.6,
                }}
              >
                Submit
              </button>

              <div style={{ flexGrow: 1 }} />
              {/*
                * A live region, so a run that raises announces itself instead of only changing
                * colour. It is also the only place run state is written down — the buttons keep
                * their words.
                */}
              <span
                role="status"
                aria-live="polite"
                style={{
                  fontFamily: font.mono,
                  fontSize: '11px',
                  color: state.phase === 'raised' ? color.danger : color.secondary,
                }}
              >
                {statusLine(state)}
              </span>
            </div>

            <Mono id="submit-why" style={{ display: 'block', marginTop: '10px' }}>
              {untouched
                ? 'Submit needs the API, and needs you to change something first — it reads the editor, not the click.'
                : 'Submit needs the API, which is not built yet. Run works now, in your browser, and records nothing.'}
            </Mono>
          </div>

          <div style={{ width: '520px', flexShrink: 0 }}>
            <Eyebrow style={{ marginBottom: '10px' }}>What it drew</Eyebrow>
            <TurtleCanvas ops={state.ops} />

            <Eyebrow style={{ margin: '20px 0 10px' }}>Console</Eyebrow>
            <Panel style={{ padding: '14px 16px', minHeight: '90px' }}>
              {state.stdout !== '' && (
                <pre style={{ margin: 0, fontFamily: font.mono, fontSize: '12px', color: color.fgBright, whiteSpace: 'pre-wrap' }}>
                  {state.stdout}
                </pre>
              )}
              {state.error !== null && (
                <pre
                  role="alert"
                  style={{ margin: 0, fontFamily: font.mono, fontSize: '12px', color: color.danger, whiteSpace: 'pre-wrap' }}
                >
                  {state.error}
                </pre>
              )}
              {state.stdout === '' && state.error === null && (
                <Mono>{running ? 'Working…' : 'Nothing yet. Press Run.'}</Mono>
              )}
            </Panel>
          </div>
        </div>

        <div style={{ marginTop: '28px' }}>
          <Tome>
            <p style={{ margin: 0, color: color.fgBright }}>
              The field manual for this area opens here, in place. Nothing above is covered and
              nothing is lost — your editor keeps whatever is in it.
            </p>
          </Tome>
        </div>
      </div>
    </>
  );
}
