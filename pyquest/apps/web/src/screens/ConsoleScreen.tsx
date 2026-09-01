import { useCallback, useState } from 'react';
import type { PendingSignoff, SignoffAward } from '@pyquest/contract';
import { color, eyebrow, font } from '../design/tokens';
import { getSignoffs, postSignoff } from '../gateway/index.ts';
import { useIsDm, usePlayer } from '../session/SessionProvider.tsx';
import { AccountsPanel } from './AccountsPanel.tsx';
import { useResource } from '../gateway/useResource.ts';
import { formatPayout, sinceSubmitted } from '../present/index.ts';
import { Awaiting } from '../shell/Loading';
import { Eyebrow, Mono } from '../shell/ui';

/**
 * The Console's sign-off queue — §6.3, §5.11, `docs/design/pyquest/Console.dc.html`.
 *
 * §6.8 gives the Console three jobs and this is one of them. **Authoring is deliberately not
 * here**: §6.10 makes `new:quest` and `validate:content` a CLI on purpose, and the SPA plan puts
 * a content editor in the browser out of scope in as many words. **Streak forgiveness is not
 * here either** — the artboard draws it, and nothing in the twelve routes serves it, so a
 * panel would be a picture of a feature. The artboard's right-hand column goes the same way:
 * attendance, the challenge run and the backup report all have artwork and no endpoint.
 *
 * What is left is the piece that is actually served, and it is the piece that matters most —
 * a sign-off is the mechanism by which a medal means anything.
 */
export function ConsoleScreen() {
  const load = useCallback(() => getSignoffs(), []);
  const queue = useResource(load, []);

  return (
    <Awaiting resource={queue} label="the sign-off queue">
      {(pending) => <Queue pending={pending} />}
    </Awaiting>
  );
}

/**
 * What has become of a row since the screen loaded.
 *
 * `refusing` is the expanded note field and nothing more — no request has been made. The other
 * three are terminal, and they are three rather than two because a refusal and a failure arrive
 * on the same wire: the API records the denial and answers 403 either way, and a screen that
 * collapsed them would tell the DM his deliberate "not yet" had been lost.
 */
type RowState =
  | { kind: 'open' }
  | { kind: 'refusing' }
  | { kind: 'granted'; award: SignoffAward }
  | { kind: 'refused'; reason: string }
  | { kind: 'failed'; error: string };

/** The seat the quest names, and the artboard accent that goes with it. */
const SEAT: Readonly<Record<'peer' | 'dm', { label: string; accent: string; why: string }>> = {
  peer: {
    label: 'PEER SIGN-OFF',
    accent: color.accent,
    why: 'A teach-back runs both directions (§5.11). Sign it only if the explanation actually landed.',
  },
  dm: {
    label: 'DM SIGN-OFF',
    accent: color.badge,
    why: 'The DM seat verifies this one (§6.3). The win condition is not that tests passed — it is that you checked it yourself.',
  },
};

function Queue({ pending }: { pending: PendingSignoff[] }) {
  const isDm = useIsDm();
  const playerId = usePlayer();
  const [rows, setRows] = useState<Readonly<Record<string, RowState>>>({});
  const stateOf = (attemptId: string): RowState => rows[attemptId] ?? { kind: 'open' };
  const set = (attemptId: string, state: RowState) => setRows((all) => ({ ...all, [attemptId]: state }));

  const waiting = pending.filter((row) => {
    const kind = stateOf(row.attemptId).kind;
    return kind === 'open' || kind === 'refusing';
  }).length;

  const resolve = async (row: PendingSignoff, granted: boolean, note: string) => {
    const trimmed = note.trim();
    try {
      const outcome = await postSignoff(row.attemptId, {
        by: playerId,
        granted,
        ...(trimmed === '' ? {} : { note: trimmed }),
      });
      set(
        row.attemptId,
        outcome.granted
          ? { kind: 'granted', award: outcome.award }
          : { kind: 'refused', reason: outcome.reason },
      );
    } catch (cause: unknown) {
      set(row.attemptId, {
        kind: 'failed',
        error: cause instanceof Error ? cause.message : String(cause),
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flexGrow: 1 }}>
      {/* The artboard's 56px bar. It is not a breadcrumb — the Console is a rail destination
        * and has no ancestor to go back to. */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '0 32px',
          height: '56px',
          borderBottom: `1px solid ${color.borderStrong}`,
          background: color.crumbBar,
          flexShrink: 0,
        }}
      >
        <h1 style={{ margin: 0, fontFamily: font.display, fontSize: '24px', letterSpacing: '-.015em' }}>Console</h1>
        <Mono>both players have one — sign-off runs both directions</Mono>
        <div style={{ flexGrow: 1 }} />
        {/* Nothing when nothing waits. "0 waiting on you" is the badge showing zero, which the
          * rail already refuses: it announces work that is not there. */}
        {waiting > 0 && <Mono style={{ fontSize: '12px', color: color.badge }}>{`${waiting} waiting on you`}</Mono>}
      </header>

      <div style={{ flexGrow: 1, padding: '32px 40px', overflow: 'auto', minWidth: 0 }}>
        <Eyebrow style={{ marginBottom: '14px' }}>Waiting on your sign-off</Eyebrow>

        {pending.length === 0 ? (
          <Mono style={{ display: 'block' }}>Nothing is waiting on a sign-off.</Mono>
        ) : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', listStyle: 'none', margin: 0, padding: 0 }}>
            {pending.map((row) => (
              <Row
                key={row.attemptId}
                row={row}
                state={stateOf(row.attemptId)}
                onOpenRefusal={() => set(row.attemptId, { kind: 'refusing' })}
                onResolve={(granted, note) => void resolve(row, granted, note)}
              />
            ))}
          </ul>
        )}

        {/*
          * §6.8's second job, and it only renders for the seat that can act on it.
          *
          * Hidden rather than disabled for a player: every control in it would answer 403, and a
          * control guaranteed to fail is a lie about what the screen can do — the same rule the
          * sign-off buttons already follow for a submission of your own. The api refuses
          * regardless; this is about not offering.
          */}
        {isDm && <AccountsPanel />}
      </div>
    </div>
  );
}

function Row({
  row,
  state,
  onOpenRefusal,
  onResolve,
}: {
  row: PendingSignoff;
  state: RowState;
  onOpenRefusal: () => void;
  onResolve: (granted: boolean, note: string) => void;
}) {
  const playerId = usePlayer();
  const [note, setNote] = useState('');
  const seat = SEAT[row.by];
  const waited = sinceSubmitted(row.submittedAt);

  /**
   * §6.3: "a player cannot sign off their own submission". The row is still drawn — the queue is
   * household-wide on purpose — but the buttons are not, because pressing one could only ever
   * earn a 403, and a control that is guaranteed to fail is a lie about what the screen can do.
   */
  const mine = row.playerId === playerId;
  const noteId = `refusal-${row.attemptId}`;

  return (
    <li
      aria-label={`${row.questTitle}, ${seat.label}, asked ${waited}`}
      style={{
        background: color.crumbBar,
        borderLeft: `3px solid ${seat.accent}`,
        padding: '18px 22px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <span style={{ ...eyebrow, fontSize: '10.5px', letterSpacing: '.1em', color: seat.accent }}>{seat.label}</span>
        <span style={{ fontFamily: font.display, fontSize: '16px', letterSpacing: '-.015em' }}>{row.questTitle}</span>
        <div style={{ flexGrow: 1 }} />
        <Mono>{`asked ${waited}`}</Mono>
      </div>

      <p style={{ margin: '0 0 14px', color: color.secondary, fontSize: '13px' }}>{seat.why}</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {!mine && (state.kind === 'open' || state.kind === 'refusing') && (
          <>
            <button
              type="button"
              onClick={() => onResolve(true, '')}
              style={{
                padding: '8px 20px',
                background: seat.accent,
                color: color.bg,
                fontFamily: font.sans,
                fontWeight: 700,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Sign it off
            </button>
            {/*
              * The artboard's label, kept word for word — and kept the same word once the field
              * is open. "Labels never change with state" is the rule a toggle reading "Cancel"
              * on the second press would break.
              */}
            <button
              type="button"
              onClick={onOpenRefusal}
              aria-expanded={state.kind === 'refusing'}
              aria-controls={noteId}
              style={{
                padding: '8px 18px',
                background: 'transparent',
                border: `1px solid ${color.borderStrong}`,
                color: color.secondary,
                fontFamily: font.sans,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Not yet — say why
            </button>
          </>
        )}

        <div style={{ flexGrow: 1 }} />
        <Outcome row={row} state={state} mine={mine} />
      </div>

      {/*
        * Expanded in place and pushed down, never floated over. The Tome's rule is the app's
        * rule: "nothing is covered and nothing is lost" — the row it belongs to, its title and
        * its Sign it off button all stay on screen and stay readable while the reason is typed.
        */}
      {state.kind === 'refusing' && (
        <div id={noteId} style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label htmlFor={`${noteId}-text`} style={{ ...eyebrow }}>
            Why not yet
          </label>
          <textarea
            id={`${noteId}-text`}
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            style={{
              background: color.bg,
              border: `1px solid ${color.border}`,
              color: color.fg,
              fontFamily: font.mono,
              fontSize: '12px',
              padding: '12px 14px',
              resize: 'vertical',
            }}
          />
          <div>
            <button
              type="button"
              onClick={() => onResolve(false, note)}
              style={{
                padding: '8px 20px',
                background: color.border,
                color: color.fg,
                fontFamily: font.sans,
                fontWeight: 600,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Send it back
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

/**
 * The artboard's `s.pays`, which cannot be filled in before the fact: nothing in the queue
 * payload says what a sign-off would pay, because the engine decides that at the moment it is
 * granted (`medalDelta` reads what the player already holds). So the slot carries who is waiting
 * until there is an answer, and the answer afterwards.
 */
function Outcome({ row, state, mine }: { row: PendingSignoff; state: RowState; mine: boolean }) {
  if (state.kind === 'granted') {
    // §5.10: a medal that paid nothing is a brag, not a zero.
    return (
      <Mono style={{ color: color.accent }}>
        {`${state.award.medal} · ${formatPayout(state.award.xpAwarded)} to ${row.playerId}`}
      </Mono>
    );
  }

  if (state.kind === 'refused') return <Mono style={{ color: color.badge }}>{`sent back · ${state.reason}`}</Mono>;

  if (state.kind === 'failed') return <Mono style={{ color: color.danger }}>{`could not record it · ${state.error}`}</Mono>;

  if (mine) return <Mono>your own submission — the other seat signs this (§6.3)</Mono>;

  return <Mono>{`${row.playerId} · ${row.questId}`}</Mono>;
}
