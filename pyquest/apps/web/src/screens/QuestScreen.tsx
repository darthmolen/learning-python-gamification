import { useCallback, useState } from 'react';
import { useParams } from 'react-router';
import type { PublicVerifier, QuestView } from '@pyquest/contract';
import { color, font } from '../design/tokens';
import { getQuest } from '../gateway/index.ts';
import { usePlayer } from '../session/SessionProvider.tsx';
import { useResource } from '../gateway/useResource.ts';
import { Awaiting } from '../shell/Loading';
import { Editor } from '../quest/Editor';
import { isUnchanged, statusLine } from '../quest/runner.ts';
import { inFlight, submitStatus, type SubmitState } from '../quest/submit.ts';
import { useSubmit } from '../quest/useSubmit.ts';
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
 * Submit also refuses untouched code on a `hidden-tests` quest — the prototype's Submit parses
 * the editor rather than counting clicks, and a Submit that passes on unchanged code is a lie
 * about the mechanic.
 */

interface QuestScreenProps {
  /** Injected in tests. jsdom has no `Worker`, and Pyodide is ten megabytes of wasm. */
  makeWorker?: WorkerFactory;
  /** How often to poll a running job. Injected in tests so they do not wait on a real interval. */
  pollMs?: number;
}

export function QuestScreen({ makeWorker, pollMs }: QuestScreenProps = {}) {
  const playerId = usePlayer();
  const { areaId = '', questId = '' } = useParams();
  const load = useCallback(() => getQuest(playerId, questId), [questId]);
  const quest = useResource(load, [questId]);

  return (
    <Awaiting resource={quest} label={questId}>
      {(view) => (
        <Quest view={view} areaId={areaId} makeWorker={makeWorker} pollMs={pollMs} playerId={playerId} />
      )}
    </Awaiting>
  );
}

/**
 * What Submit will do on this quest, said before it is pressed.
 *
 * One sentence per verifier, because they are four genuinely different acts and a single
 * "submit your work" would be wrong about three of them. `local-repo` is the one that most
 * needs saying: it grades what was **pushed** (§6.4), so a learner staring at unsaved work in
 * this editor is looking at something the API will never see.
 */
function submitExplains(verifier: PublicVerifier): string {
  switch (verifier.type) {
    case 'hidden-tests':
      return 'Submit sends your code to the API, where the hidden tests live. Run stays in your browser and records nothing.';
    case 'local-repo':
      return 'Submit grades what you pushed, not what is in this editor. Commit and push first — that is what the API reads (§6.4).';
    case 'peer-signoff':
      return `Submit asks the ${verifier.by === 'dm' ? 'DM' : 'peer'} to sign this off. Nothing runs; somebody reads it and decides.`;
    case 'git-signal':
      return `Submit reads your git history for a ${verifier.signal}. Nothing runs — the evidence is already there or it is not.`;
  }
}

/** Green for a pass, red for a fault, amber for the two that are neither. */
function verdictColor(state: SubmitState): string {
  switch (state.phase) {
    case 'passed':
      return color.accent;
    case 'failed':
    case 'errored':
      return color.danger;
    case 'timed-out':
    case 'killed':
      return color.badge;
    default:
      return color.secondary;
  }
}

/**
 * What came back, once something has. Absent entirely until the first Submit.
 *
 * **`killed` and `timed-out` get their own sentences, and neither says his code is wrong.**
 * §6.6's limits fired — memory, processes, output, wall clock — and a learner told "failed"
 * when the sandbox stopped his program learns to distrust his own reading of an error, which is
 * the exact opposite of what Area 0 spends two weeks teaching.
 *
 * `truncated` is said out loud for the same reason it is a field rather than an ellipsis: a
 * traceback that was cut off reads as a program that stopped there.
 */
function Verdict({ state }: { state: SubmitState }) {
  if (state.phase === 'idle' || state.phase === 'sending') return null;

  const note =
    state.phase === 'killed'
      ? 'The sandbox stopped it — memory, processes or output went past what §6.6 allows. That is a limit, not a mistake in your code.'
      : state.phase === 'timed-out'
        ? 'It ran too long and was stopped. Usually a loop with no way out rather than slow code.'
        : state.phase === 'awaiting-signoff'
          ? 'Recorded. It sits in the Console until somebody signs it — nothing runs, and nothing is graded.'
          : null;

  return (
    <div style={{ marginTop: '18px' }}>
      <Eyebrow style={{ marginBottom: '10px' }}>Verdict</Eyebrow>
      <Panel style={{ padding: '14px 16px' }}>
        <Mono style={{ display: 'block', color: verdictColor(state) }}>{submitStatus(state)}</Mono>

        {note !== null && (
          <p style={{ margin: '10px 0 0', color: color.secondary, fontSize: '13px' }}>{note}</p>
        )}

        {state.error !== null && (
          <pre
            role="alert"
            style={{ margin: '10px 0 0', fontFamily: font.mono, fontSize: '12px', color: color.danger, whiteSpace: 'pre-wrap' }}
          >
            {state.error}
          </pre>
        )}

        {state.result !== null && (
          <>
            {state.result.stdout !== '' && (
              <pre style={{ margin: '10px 0 0', fontFamily: font.mono, fontSize: '12px', color: color.fgBright, whiteSpace: 'pre-wrap' }}>
                {state.result.stdout}
              </pre>
            )}
            {state.result.stderr !== '' && (
              <pre style={{ margin: '10px 0 0', fontFamily: font.mono, fontSize: '12px', color: color.danger, whiteSpace: 'pre-wrap' }}>
                {state.result.stderr}
              </pre>
            )}
            {state.result.truncated && (
              <Mono style={{ display: 'block', marginTop: '10px', color: color.badge }}>
                Output was cut off here — there was more than §6.6 sends.
              </Mono>
            )}
            <Mono style={{ display: 'block', marginTop: '10px' }}>
              {`${state.result.durationMs} ms`}
            </Mono>
          </>
        )}
      </Panel>
    </div>
  );
}

function Quest({
  view,
  areaId,
  makeWorker,
  pollMs,
  playerId,
}: {
  view: QuestView;
  areaId: string;
  makeWorker?: WorkerFactory;
  pollMs?: number;
  playerId: string;
}) {
  /*
   * The starter comes from content now, not from a constant in this file. `/quests/:questId`
   * carries it because Run happens in the browser (§6.1) — and a quest with no starter is
   * legal, which is what an empty editor means rather than a bug.
   */
  const starter = view.starter ?? '';
  const [code, setCode] = useState(starter);
  const { state, run, stop } = useRunner(makeWorker);
  const submitter = useSubmit(playerId, view.id, view.verifier, pollMs);
  const running = state.phase === 'running';
  const untouched = isUnchanged(code, starter);

  /**
   * Two reasons Submit cannot be pressed, and only one of them is a rule.
   *
   * A submission already in flight is bookkeeping. Untouched code on a `hidden-tests` quest is
   * the mechanic — and only there: `local-repo` grades what was pushed, and `peer-signoff` and
   * `git-signal` never read the editor at all, so gating them on it would refuse a submission
   * for a reason that does not apply to them.
   */
  const unchangedCode = view.verifier.type === 'hidden-tests' && untouched;
  const submitting = inFlight(submitter.state);

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
            {/*
              * Discoverability, not decoration. Tab indents in here because Python is
              * whitespace-significant, which makes the editor a keyboard trap — and an escape
              * hatch nobody is told about is the same as no escape hatch. Run, Stop and Submit
              * all sit after this in the tab order.
              */}
            <Mono style={{ display: 'block', marginTop: '6px' }}>
              Tab indents. Press Escape, then Tab, to move on.
            </Mono>

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

              {/* The artboard's accent button. Its word never changes; the line to its right
                * carries every state it can be in. */}
              <button
                type="button"
                onClick={() => submitter.submit(code)}
                disabled={submitting || unchangedCode}
                aria-describedby="submit-why"
                style={{
                  padding: '8px 20px',
                  background: submitting || unchangedCode ? color.avatarBg : color.accent,
                  border: `1px solid ${submitting || unchangedCode ? color.borderStrong : color.accent}`,
                  color: submitting || unchangedCode ? color.secondary : color.bg,
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: submitting || unchangedCode ? 'default' : 'pointer',
                  opacity: submitting || unchangedCode ? 0.6 : 1,
                }}
              >
                Submit
              </button>

              <div style={{ flexGrow: 1 }} />
              {/*
                * Two live regions, each named. A run that raises and a submission that fails
                * both have to announce themselves instead of only changing colour — and they
                * are separate, because a submission does not overwrite what the last run drew.
                *
                * The accessible names are not decoration: a screen with two unnamed `status`
                * roles is one no test can query and no screen reader can tell apart.
                */}
              <span
                role="status"
                aria-live="polite"
                aria-label="Run"
                style={{
                  fontFamily: font.mono,
                  fontSize: '11px',
                  color: state.phase === 'raised' ? color.danger : color.secondary,
                }}
              >
                {statusLine(state)}
              </span>
              <span
                role="status"
                aria-live="polite"
                aria-label="Submit"
                style={{
                  fontFamily: font.mono,
                  fontSize: '11px',
                  color: verdictColor(submitter.state),
                }}
              >
                {submitStatus(submitter.state)}
              </span>
            </div>

            <Mono id="submit-why" style={{ display: 'block', marginTop: '10px' }}>
              {unchangedCode
                ? 'Change something first — Submit reads the editor, not the click.'
                : submitExplains(view.verifier)}
            </Mono>

            <Verdict state={submitter.state} />
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
