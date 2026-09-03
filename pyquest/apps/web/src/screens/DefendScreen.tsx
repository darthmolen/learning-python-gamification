import { useCallback, useState } from 'react';
import { Link } from 'react-router';
import type { DrillOutcome, DueInvasion } from '@pyquest/contract';
import { getConcept } from '@pyquest/content/browser';
import { color, font } from '../design/tokens';
import { getDefend, postDrill } from '../gateway/index.ts';
import { usePlayer } from '../session/SessionProvider.tsx';
import { useResource } from '../gateway/useResource.ts';
import { Awaiting } from '../shell/Loading';
import { Eyebrow, Mono, Panel } from '../shell/ui';

const SOURCE_LABEL: Readonly<Record<string, string>> = {
  ladder: 'ladder',
  datamine: 'datamine',
  both: 'ladder + datamine',
};

/** §5.1 prices an invasion flat, and only a repelled one is work done. */
const INVASION_XP = 5;

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
  const load = useCallback(() => getDefend(playerId), [playerId]);
  const queue = useResource(load, [playerId]);

  return (
    <Awaiting resource={queue} label="the invasion queue">
      {(due) => <Queue due={due} playerId={playerId} />}
    </Awaiting>
  );
}

/**
 * What has become of one row since the screen loaded.
 *
 * `sending` is its own state because the request is a write and a second press would record a
 * second drill — §5.4's ladder would then move twice for one answer.
 */
type RowState =
  | { kind: 'due' }
  | { kind: 'sending' }
  | { kind: 'done'; outcome: DrillOutcome }
  | { kind: 'failed'; error: string };

function Queue({ due, playerId }: { due: DueInvasion[]; playerId: string }) {
  const [rows, setRows] = useState<Readonly<Record<string, RowState>>>({});
  const stateOf = (conceptId: string): RowState => rows[conceptId] ?? { kind: 'due' };
  const set = (conceptId: string, state: RowState) =>
    setRows((all) => ({ ...all, [conceptId]: state }));

  /** How many are still waiting on him, which is not the same as how many the queue holds. */
  const remaining = due.filter((invasion) => {
    const kind = stateOf(invasion.conceptId).kind;
    return kind === 'due' || kind === 'sending';
  }).length;

  const answer = async (invasion: DueInvasion, repelled: boolean) => {
    set(invasion.conceptId, { kind: 'sending' });
    try {
      const outcome = await postDrill(playerId, invasion.conceptId, { repelled });
      set(invasion.conceptId, { kind: 'done', outcome });
    } catch (cause: unknown) {
      set(invasion.conceptId, {
        kind: 'failed',
        error: cause instanceof Error ? cause.message : String(cause),
      });
    }
  };

  return (
    <div style={{ padding: '26px 32px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
        <h1 style={{ margin: 0, fontFamily: font.display, fontSize: '24px', letterSpacing: '-.015em' }}>Defend</h1>
        <Eyebrow>{`${due.length} due this session`}</Eyebrow>
        <div style={{ flexGrow: 1 }} />
        {/* Nothing when nothing is left. "0 still to answer" is a badge showing zero. */}
        {remaining > 0 && due.length !== remaining && (
          <Mono style={{ color: color.badge }}>{`${remaining} still to answer`}</Mono>
        )}
      </div>

      {due.length === 0 ? (
        <Panel style={{ marginTop: '24px' }}>
          <Mono>Nothing is due. The ladder is clear.</Mono>
        </Panel>
      ) : (
        <>
          <p style={{ margin: '18px 0 0', color: color.secondary, maxWidth: '560px' }}>
            You learned each of these, then left it alone long enough that it came looking. Nothing
            here is new — that is the point. Say honestly whether you still have it.
          </p>

          <ul style={{ display: 'flex', flexDirection: 'column', gap: '2px', listStyle: 'none', padding: 0, margin: '24px 0 0' }}>
            {due.map((invasion) => (
              <Row
                key={invasion.conceptId}
                invasion={invasion}
                state={stateOf(invasion.conceptId)}
                onAnswer={(repelled) => void answer(invasion, repelled)}
              />
            ))}
          </ul>

          {/*
            * §5.4's ladder, said once at the bottom rather than on every row. The second sentence
            * is the one that matters to an 11–14-year-old: a miss costs one rung, never the lot.
            */}
          <Mono style={{ display: 'block', marginTop: '28px', maxWidth: '640px', lineHeight: 1.7 }}>
            Leave a concept alone for 1, 3, 7, 16, then 35 days and it comes for you. Beat it back
            and it waits longer. Let one through and it returns a single rung sooner — never from
            the beginning, because losing one evening should not cost you everything you held.
          </Mono>

          {/*
            * The artboard's journal nudge. A link, not invented data — the attendance streak, the
            * challenge run and the last-session recap beside it on the artboard have artwork and
            * no endpoint, so they are not drawn.
            */}
          <Panel style={{ marginTop: '22px', maxWidth: '640px' }}>
            <Mono style={{ display: 'block' }}>
              Tonight's journal entry is worth ten XP, paid for substance.{' '}
              <Link to="/journal" style={{ color: color.accent }}>
                The Journal
              </Link>{' '}
              has the template.
            </Mono>
          </Panel>
        </>
      )}
    </div>
  );
}

/**
 * One invasion, and the two answers to it.
 *
 * **The row is answered in place and keeps its position.** A row that vanished would move the
 * §5.4 count under his cursor and take with it the thing he just earned — and this queue is a
 * session's worth of work, not an inbox to empty.
 *
 * **What is not drawn: the artboard's recall prompt.** `DueInvasionSchema` says outright that
 * `why` and `prompt` "are content the caller looks up by concept id, not payload the engine
 * copies into every entry" — and that content does not exist. So the row shows what is served,
 * and the recall happens in his head or out loud, which is what §5.4's two-or-three-minute drill
 * was always going to be.
 */
function Row({
  invasion,
  state,
  onAnswer,
}: {
  invasion: DueInvasion;
  state: RowState;
  onAnswer: (repelled: boolean) => void;
}) {
  /* The label is content, read from the registry rather than prettified from the id here — an
   * id is `accumulator-pattern` and the label is "the accumulator pattern". */
  const label = getConcept(invasion.conceptId)?.label ?? invasion.conceptId;
  const overdue = invasion.overdueDays > 0;

  return (
    <li
      aria-label={`${label}, area ${invasion.area}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '14px 16px',
        background: color.panel,
        borderLeft: `2px solid ${overdue ? color.badge : color.crumbRule}`,
      }}
    >
      <div style={{ width: '190px', flexShrink: 0 }}>
        <div style={{ fontWeight: 600, fontFamily: font.mono, fontSize: '13px' }}>{label}</div>
        <Mono style={{ display: 'block' }}>
          {`area ${invasion.area} · ${SOURCE_LABEL[invasion.source]}`}
        </Mono>
      </div>

      <Mono style={{ flexGrow: 1, minWidth: 0 }}>{`last seen ${invasion.lastSeen}`}</Mono>

      <Mono style={{ color: overdue ? color.badge : color.muted, width: '130px', textAlign: 'right' }}>
        {overdue ? `${invasion.overdueDays} days overdue` : 'due today'}
      </Mono>

      <Answer state={state} onAnswer={onAnswer} />
    </li>
  );
}

/**
 * The two buttons, and what replaces them.
 *
 * Labels never change with state — including here, where the temptation is a single toggle. Two
 * fixed words and an honest question: did you still have it?
 */
function Answer({ state, onAnswer }: { state: RowState; onAnswer: (repelled: boolean) => void }) {
  if (state.kind === 'done') {
    const { outcome } = state;
    return (
      <div style={{ width: '250px', textAlign: 'right', flexShrink: 0 }}>
        <Mono style={{ display: 'block', color: outcome.xpAwarded > 0 ? color.accent : color.muted }}>
          {/*
            * §5.10's `brag` is the wrong word here and `formatPayout` is deliberately not used:
            * a concept let through paid nothing because it was let through, which is not a boast.
            */}
          {outcome.xpAwarded > 0 ? `repelled · ${outcome.xpAwarded} xp` : 'let through · no xp'}
        </Mono>
        {/* The engine's numbers, carried. `nextRung` is called server-side precisely so that
          * nobody writes `rung + 1` here. */}
        <Mono style={{ display: 'block' }}>{`rung ${outcome.rung} · back on ${outcome.dueOn}`}</Mono>
      </div>
    );
  }

  if (state.kind === 'failed') {
    return (
      <Mono style={{ width: '250px', textAlign: 'right', flexShrink: 0, color: color.danger }}>
        {`could not record it · ${state.error}`}
      </Mono>
    );
  }

  const sending = state.kind === 'sending';

  return (
    <div style={{ display: 'flex', gap: '8px', width: '250px', justifyContent: 'flex-end', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => onAnswer(true)}
        disabled={sending}
        style={{
          padding: '7px 16px',
          background: sending ? color.border : color.accent,
          border: 'none',
          color: sending ? color.muted : color.bg,
          fontFamily: font.sans,
          fontWeight: 700,
          fontSize: '12px',
          cursor: sending ? 'default' : 'pointer',
        }}
      >
        Held it
      </button>
      <button
        type="button"
        onClick={() => onAnswer(false)}
        disabled={sending}
        style={{
          padding: '7px 16px',
          background: 'transparent',
          border: `1px solid ${color.borderStrong}`,
          color: color.secondary,
          fontFamily: font.sans,
          fontSize: '12px',
          cursor: sending ? 'default' : 'pointer',
        }}
      >
        Let it through
      </button>
      <Mono style={{ alignSelf: 'center', width: '28px', textAlign: 'right' }}>{`+${INVASION_XP}`}</Mono>
    </div>
  );
}
