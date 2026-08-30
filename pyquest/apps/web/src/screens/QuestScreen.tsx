import { useState } from 'react';
import { useParams } from 'react-router';
import { color, font } from '../design/tokens';
import { getAreaIdentity, getAvailableQuests } from '../gateway/index.ts';
import { Editor } from '../quest/Editor';
import { isUnchanged, statusLine } from '../quest/runner.ts';
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

const STARTER = `import turtle

# Draw a square.
for side in range(4):
    turtle.forward(100)
    turtle.right(90)

turtle.done()
`;

interface QuestScreenProps {
  /** Injected in tests. jsdom has no `Worker`, and Pyodide is ten megabytes of wasm. */
  makeWorker?: WorkerFactory;
}

export function QuestScreen({ makeWorker }: QuestScreenProps = {}) {
  const { areaId = '', questId = '' } = useParams();
  const area = Number(areaId);
  const identity = getAreaIdentity(area);
  const quest = getAvailableQuests(area).find((q) => q.id === questId);

  const [code, setCode] = useState(STARTER);
  const { state, run, stop } = useRunner(makeWorker);
  const running = state.phase === 'running';
  const untouched = isUnchanged(code, STARTER);

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

      <div style={{ padding: '26px 32px 50px', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <h1 style={{ margin: 0, fontFamily: font.display, fontSize: '30px', letterSpacing: '-.015em' }}>
            {quest?.title ?? questId}
          </h1>
          {quest !== undefined && <RiskWarning dc={quest.dc} />}
          {quest !== undefined && <Mono style={{ fontSize: '13px' }}>{`DC ${quest.dc}`}</Mono>}
          <div style={{ flexGrow: 1 }} />
          {quest !== undefined && <MedalSlots held={quest.medals} />}
        </div>

        {quest !== undefined && (
          <Mono style={{ display: 'block', marginTop: '8px' }}>{quest.concepts.join(' · ')}</Mono>
        )}

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
                onClick={() => run(code, `${questId}.py`)}
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
