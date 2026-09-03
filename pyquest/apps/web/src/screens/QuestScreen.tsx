import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import type { MedalSlot, PublicVerifier, QuestView, TomeArea } from '@pyquest/contract';
import type { Medal } from '@pyquest/content/browser';
import { color, eyebrow, font } from '../design/tokens';
import { getQuest, getTome } from '../gateway/index.ts';
import { usePlayer } from '../session/SessionProvider.tsx';
import { useResource } from '../gateway/useResource.ts';
import { Awaiting } from '../shell/Loading';
import { Editor } from '../quest/Editor';
import { isUnchanged, statusLine } from '../quest/runner.ts';
import { inFlight, submitStatus, type SubmitState } from '../quest/submit.ts';
import { useSubmit } from '../quest/useSubmit.ts';
import { formatPayout, medalSlots } from '../present/index.ts';
import { useRunner, type WorkerFactory } from '../quest/useRunner.ts';
import { Breadcrumbs } from '../shell/Breadcrumbs';
import { ConceptList, Eyebrow, MedalSlots, Mono, Panel, RiskWarning } from '../shell/ui';
import { Markdown } from '../tome/Markdown';
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
  /*
   * Two requests, in parallel — the same shape `TomeScreen` uses, and for the same reason. The
   * quest is the player's; the lesson behind the Tome button is content, identical for everyone,
   * and §6.8 wants it here rather than one navigation away: "if looking something up costs a
   * learner the code in his editor, he stops looking things up."
   */
  const load = useCallback(async () => {
    const [view, tome] = await Promise.all([getQuest(playerId, questId), getTome()]);
    return { view, tome };
  }, [questId]);
  const quest = useResource(load, [questId]);

  return (
    <Awaiting resource={quest} label={questId}>
      {({ view, tome }) => (
        <Quest
          view={view}
          page={tome.areas.find((area) => area.area === view.area)}
          areaId={areaId}
          makeWorker={makeWorker}
          pollMs={pollMs}
          playerId={playerId}
        />
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
  page,
  areaId,
  makeWorker,
  pollMs,
  playerId,
}: {
  view: QuestView;
  /** This area's Tome page. Absent when the area is not in the syllabus at all. */
  page: TomeArea | undefined;
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

  /**
   * What he holds, refreshed when a submission passes.
   *
   * The screen used to show whatever the medals were when the page loaded, so he could watch
   * Submit go green and see Cleared still sitting there unearned — on the screen whose whole job
   * is to tell him what the work was worth.
   *
   * **Only the medals are re-read, and the editor is never remounted.** `useResource` sets
   * `loading` when it re-runs, which would take `Awaiting` back to its placeholder and unmount
   * the editor with his code in it. §6.8 spends a paragraph on that cost for the Tome; a
   * *refresh* that threw his work away would be a worse version of the same mistake.
   *
   * A failed refresh leaves the old medals and says nothing. The verdict panel has already told
   * him what happened, and a second error about bookkeeping would bury it.
   */
  const [awarded, setAwarded] = useState<{ held: readonly Medal[]; slots: readonly MedalSlot[] }>({
    held: view.medalsHeld,
    slots: view.medalSlots,
  });
  /**
   * What `input()` reads when he presses Run.
   *
   * A worker has no `prompt()`, so Run takes its answers up front rather than pausing for them.
   * That is a trade, and it buys the thing Area 0 session 5 actually asks for: **the run is
   * repeatable.** "Type 150, then try 40" is editing a box and pressing Run again, which is a
   * better shape than answering a modal twice — and it is how the hidden tests feed the same
   * program, so Run and Submit read the same way.
   */
  const [stdin, setStdin] = useState('');
  const { state, run, stop } = useRunner(makeWorker);
  const submitter = useSubmit(playerId, view.id, view.verifier, pollMs);

  /*
   * Re-read the medals when a submission passes, and only then. `awardMedal` runs server-side on
   * the verdict, so what he holds is knowable only by asking again.
   */
  const passed = submitter.state.phase === 'passed';
  useEffect(() => {
    if (!passed) return;
    let live = true;
    getQuest(playerId, view.id).then(
      (fresh) => {
        if (live) setAwarded({ held: fresh.medalsHeld, slots: fresh.medalSlots });
      },
      () => {
        /* Deliberately silent — see `awarded`. */
      },
    );
    return () => {
      live = false;
    };
  }, [passed, playerId, view.id]);
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
          <MedalSlots held={awarded.held} />
        </div>

        <ConceptList concepts={view.concepts} style={{ marginTop: '10px' }} />

        <Medals held={awarded.held} slots={awarded.slots} />

        {/*
          * The Tome, above the work rather than below it.
          *
          * It used to sit under the editor, the canvas and the console — fifty lines of scrolling
          * past his own code to reach the reference. §6.8's rule is that looking something up must
          * cost nothing, and making him leave the work to find the manual is that cost by another
          * name. Opening it still pushes the editor down; nothing is covered and nothing is lost.
          */}
        <div style={{ marginTop: '22px' }}>
          <Tome>
            {page?.lesson === undefined ? (
              <Mono style={{ display: 'block', lineHeight: 1.7 }}>
                The lesson for this area is not written yet. Nothing above was closed to tell you
                so — your editor keeps whatever is in it.
              </Mono>
            ) : (
              <>
                {page.lessonIsDraft && (
                  <Mono style={{ display: 'block', marginBottom: '14px', lineHeight: 1.7, color: color.badge }}>
                    This lesson is a draft. It was written ahead of the sessions that will correct it.
                  </Mono>
                )}
                {/* `baseLevel={2}` — the quest title is this page's `h1`, so the lesson's own
                  * sections continue that outline instead of starting a second one. */}
                <Markdown text={page.lesson} baseLevel={2} />
              </>
            )}
          </Tome>
        </div>

        <div style={{ display: 'flex', gap: '18px', marginTop: '24px', alignItems: 'flex-start' }}>
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            {/*
              * The keyboard note sits beside the label rather than under the editor.
              *
              * Discoverability, not decoration: Tab indents in here because Python is
              * whitespace-significant, which makes the editor a keyboard trap, and an escape
              * hatch nobody is told about is the same as no escape hatch. Under the editor it
              * was forty lines below the thing it describes and read as a footnote to the code.
              * Beside the label it is where somebody about to type looks.
              */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '10px' }}>
              <Eyebrow>Your code</Eyebrow>
              <Mono>Tab indents. Press Escape, then Tab, to move on.</Mono>
            </div>
            <Editor value={code} onChange={setCode} label="Python editor" />

            {/*
              * The answers `input()` will read, one per line — under the editor and above Run,
              * which is the order he uses them in.
              *
              * It sat in the right-hand column beside the drawing, which put the one thing he
              * has to fill in before pressing Run furthest from the button, and next to the two
              * panels that only mean anything *after* he presses it. Left column, between the
              * code and the Run that consumes it.
              *
              * It is always here rather than appearing only for quests that call `input()` —
              * the screen would have to read his code to know that, and a panel that comes and
              * goes as he types is worse than one that is simply present and empty.
              */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', margin: '14px 0 8px' }}>
              <Eyebrow>Input</Eyebrow>
              <Mono>
                Run has no keyboard to ask with, so it reads these instead. Ask for more than you
                wrote here and Python raises EOFError, the same as on your own machine.
              </Mono>
            </div>
            <label htmlFor="stdin" style={{ ...eyebrow, position: 'absolute', left: '-9999px' }}>
              Answers for input, one per line
            </label>
            <textarea
              id="stdin"
              value={stdin}
              onChange={(event) => setStdin(event.target.value)}
              rows={2}
              spellCheck={false}
              placeholder="one answer per line"
              style={{
                display: 'block',
                width: '100%',
                boxSizing: 'border-box',
                background: color.bg,
                border: `1px solid ${color.border}`,
                color: color.fg,
                fontFamily: font.mono,
                fontSize: '12px',
                padding: '10px 12px',
                resize: 'vertical',
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
              {/*
                * Two buttons, two words, and neither word changes. State lives in the line to
                * their right — a Run button that reads "Running…" is the same mistake as "Take
                * it cold" on a screen showing three quests cleared.
                */}
              <button
                type="button"
                onClick={() => run(code, `${view.id}.py`, stdin)}
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

          {/* What the run produced: the drawing and the console, both of which only mean
            * something after Run. What he has to fill in *before* Run is in the left column
            * beside the code that uses it. */}
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

      </div>
    </>
  );
}

/**
 * The medal slots, priced — and honest about which of them can actually be taken.
 *
 * §5.10 makes every medal a difficulty modifier: it raises the quest's effective DC and pays the
 * difference, once. That is the whole scoring model and it is the thing the old one-line-per-slot
 * row failed to say, at 11px, in the same grey as everything around it.
 *
 * **The note at the bottom is not a caveat, it is the state of the game.** `SubmitRequest` carries
 * no medal claim and every award path in the API writes `cleared`, so four of these five prices
 * are quotes for a purchase nobody can make. §5.1a already settled how this repository handles
 * that: the tilde on an estimated total exists because "an estimate rendered as a fact is
 * dishonest, and this is a curriculum a child is measuring himself against." A price list is a
 * stronger claim than an estimate.
 */
function Medals({ held, slots }: { held: readonly Medal[]; slots: readonly MedalSlot[] }) {
  const priced = new Map(slots.map((slot) => [slot.medal, slot]));

  return (
    <div style={{ marginTop: '18px' }}>
      <Eyebrow style={{ marginBottom: '8px' }}>Medals</Eyebrow>
      <div role="group" aria-label="Medals" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {medalSlots(held).map((slot) => {
          const offer = priced.get(slot.medal);

          return (
            <div
              key={slot.medal}
              style={{
                padding: '8px 13px',
                minWidth: '108px',
                background: slot.held ? '#1a2119' : color.panel,
                border: `1px solid ${slot.held ? color.accentMid : color.border}`,
              }}
            >
              <span
                style={{
                  display: 'block',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  color: slot.held ? color.accent : color.fgBright,
                }}
              >
                {slot.medal}
              </span>
              <Mono style={{ display: 'block', marginTop: '3px' }}>
                {/*
                  * Held pays nothing more, and says so as a fact rather than as `0 xp`. An offer
                  * §5.12 forbids — Conjured beside Ironman — never reaches `medalSlots` at all,
                  * and "not while you hold Ironman" is the true reason for its absence where a
                  * zero would have read as "available, worth nothing".
                  */}
                {slot.held
                  ? 'earned'
                  : offer === undefined
                    ? 'not with a medal you hold'
                    : `DC ${offer.effectiveDC} · ${formatPayout(offer.xp)}`}
              </Mono>
            </div>
          );
        })}
      </div>
      <Mono style={{ display: 'block', marginTop: '8px', lineHeight: 1.6 }}>
        Each medal raises this quest's DC and pays the difference, once. Only Cleared is awarded
        today — there is no way to claim the others yet.
      </Mono>
    </div>
  );
}
