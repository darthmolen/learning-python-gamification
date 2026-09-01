import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import type { Account } from '@pyquest/contract';
import { color, eyebrow, font } from '../design/tokens';
import { HandleTaken, createPlayer, getRoster, resetPassword, setRole } from '../gateway/index.ts';
import { useResource } from '../gateway/useResource.ts';
import { useSession } from '../session/SessionProvider.tsx';
import { Awaiting } from '../shell/Loading';
import { Eyebrow, Mono } from '../shell/ui';

/**
 * The Console's second job (§6.8): who is in this household, and the three acts on them.
 *
 * **It closes the gap the auth gate left.** The bootstrap creates one account — the DM — and
 * every account after that is the DM's act. Until this existed the routes were served and there
 * was nothing to press, so adding the learner meant a hand-written `curl` on a Saturday morning.
 *
 * **Nothing here can grant `dm` on creation.** The api has no parameter that would accept one,
 * and this screen has no control for it: the seat arrives by bootstrap or by promotion, both of
 * which are deliberate acts by somebody who already holds it.
 *
 * **Every act that changes a credential or a role says that it signs that person out**, before
 * the button rather than after. Somebody is about to be logged out of a laptop in another room,
 * and finding that out afterwards is how a reset becomes a mystery.
 */
export function AccountsPanel() {
  const { account } = useSession();
  const load = useCallback(() => getRoster(), []);
  const roster = useResource(load, []);
  const [reloadKey, setReloadKey] = useState(0);

  /*
   * The notice lives here rather than in `Roster`, and a test is why.
   *
   * `onChanged` bumps a key that remounts `Roster` so the roster re-reads — and a message held
   * inside `Roster` was therefore wiped by the very act that produced it. "Peer has been signed
   * out" appeared for no frames at all. State that outlives a remount has to sit above it.
   */
  const [notice, setNotice] = useState<string | undefined>(undefined);

  return (
    <section aria-label="Accounts" style={{ marginTop: '32px' }}>
      <Eyebrow style={{ marginBottom: '14px' }}>The household</Eyebrow>
      <Awaiting resource={roster} label="the household">
        {(people) => (
          <Roster
            key={reloadKey}
            people={people}
            me={account}
            notice={notice}
            onNotice={setNotice}
            onChanged={() => setReloadKey((n) => n + 1)}
          />
        )}
      </Awaiting>
    </section>
  );
}

/** What a row is currently doing. One at a time, because two open forms is two things to misread. */
type RowAction = 'none' | 'password';

function Roster({
  people,
  me,
  notice,
  onNotice,
  onChanged,
}: {
  people: Account[];
  me: Account | undefined;
  notice: string | undefined;
  onNotice: (message: string) => void;
  onChanged: () => void;
}) {
  return (
    <div>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', listStyle: 'none', margin: 0, padding: 0 }}>
        {people.map((person) => (
          <Row
            key={person.id}
            person={person}
            isMe={person.id === me?.id}
            onDone={(message) => {
              onNotice(message);
              onChanged();
            }}
            onFailed={onNotice}
          />
        ))}
      </ul>

      {notice !== undefined && (
        <p role="status" style={{ marginTop: '12px', fontSize: '13px', color: color.secondary }}>
          {notice}
        </p>
      )}

      <CreateForm
        onDone={(handle) => {
          onNotice(`${handle} can now sign in.`);
          onChanged();
        }}
      />
    </div>
  );
}

function Row({
  person,
  isMe,
  onDone,
  onFailed,
}: {
  person: Account;
  isMe: boolean;
  onDone: (message: string) => void;
  onFailed: (message: string) => void;
}) {
  const [action, setAction] = useState<RowAction>('none');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const isDm = person.roles.includes('dm');

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await resetPassword(person.id, password);
      setAction('none');
      setPassword('');
      onDone(`${person.handle} has a new password, and has been signed out.`);
    } catch (cause) {
      onFailed(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };

  const toggleDm = async () => {
    setBusy(true);
    try {
      await setRole(person.id, 'dm', !isDm);
      onDone(
        isDm
          ? `${person.handle} is no longer a DM, and has been signed out.`
          : `${person.handle} is now a DM, and has been signed out.`,
      );
    } catch (cause) {
      /* The api's own sentence, which for a DM demoting themselves explains what to do instead. */
      onFailed(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li style={{ background: color.crumbBar, padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: font.display, fontSize: '15px' }}>{person.displayName}</span>
        <Mono>{person.handle}</Mono>
        <span style={{ ...eyebrow, fontSize: '10.5px', color: isDm ? color.badge : color.secondary }}>
          {isDm ? 'PLAYER · DM' : 'PLAYER'}
        </span>
        {isMe && <Mono style={{ fontSize: '12px' }}>you</Mono>}
        <div style={{ flexGrow: 1 }} />

        <button
          type="button"
          disabled={busy}
          onClick={() => setAction(action === 'password' ? 'none' : 'password')}
          style={quietButton}
        >
          Reset password
        </button>
        <button type="button" disabled={busy} onClick={() => void toggleDm()} style={quietButton}>
          {isDm ? 'Remove DM' : 'Make DM'}
        </button>
      </div>

      {action === 'password' && (
        <form onSubmit={submitPassword} style={{ marginTop: '12px' }}>
          <label htmlFor={`pw-${person.id}`} style={{ display: 'block', fontSize: '13px' }}>
            <span style={{ display: 'block', marginBottom: '4px', color: color.secondary }}>
              {`A new password for ${person.handle}. This signs them out wherever they are.`}
            </span>
            <input
              id={`pw-${person.id}`}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={inputStyle}
            />
          </label>
          <button type="submit" disabled={busy || password === ''} style={quietButton}>
            {busy ? 'Setting…' : 'Set it'}
          </button>
        </form>
      )}
    </li>
  );
}

function CreateForm({ onDone }: { onDone: (handle: string) => void }) {
  const [open, setOpen] = useState(false);
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [failure, setFailure] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFailure(undefined);
    try {
      await createPlayer({ handle, displayName, password });
      setHandle('');
      setDisplayName('');
      setPassword('');
      setOpen(false);
      onDone(handle);
    } catch (cause) {
      /* A taken handle is its own sentence — "failed" would send the DM looking for a fault. */
      setFailure(
        cause instanceof HandleTaken
          ? `${handle} is already somebody's handle. Pick another.`
          : cause instanceof Error
            ? cause.message
            : String(cause),
      );
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} style={{ ...quietButton, marginTop: '14px' }}>
        Add somebody
      </button>
    );
  }

  return (
    <form onSubmit={submit} style={{ marginTop: '14px', background: color.crumbBar, padding: '16px 18px' }}>
      <Eyebrow style={{ marginBottom: '10px' }}>Add somebody</Eyebrow>
      <Mono style={{ display: 'block', marginBottom: '10px' }}>
        Everybody added here is a player. The DM seat is given afterwards, on purpose.
      </Mono>

      <Labelled id="new-handle" label="Handle" value={handle} onChange={setHandle} />
      <Labelled id="new-name" label="Display name" value={displayName} onChange={setDisplayName} />
      <Labelled id="new-pw" label="Password" type="password" value={password} onChange={setPassword} />

      {failure !== undefined && (
        <p role="alert" style={{ margin: '4px 0 10px', fontSize: '13px', color: color.badge }}>
          {failure}
        </p>
      )}

      <button type="submit" disabled={busy} style={quietButton}>
        {busy ? 'Adding…' : 'Add them'}
      </button>
      <button type="button" onClick={() => setOpen(false)} style={{ ...quietButton, marginLeft: '8px' }}>
        Cancel
      </button>
    </form>
  );
}

function Labelled({
  id,
  label,
  value,
  onChange,
  type = 'text',
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  type?: string;
}) {
  return (
    <label htmlFor={id} style={{ display: 'block', marginBottom: '10px', fontSize: '13px' }}>
      <span style={{ display: 'block', marginBottom: '4px', color: color.secondary }}>{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={inputStyle}
      />
    </label>
  );
}

const inputStyle = {
  width: '100%',
  maxWidth: '320px',
  padding: '7px 9px',
  font: 'inherit',
  border: `1px solid ${color.border}`,
  borderRadius: '4px',
} as const;

const quietButton = {
  padding: '6px 12px',
  font: 'inherit',
  fontSize: '13px',
  color: color.fg,
  background: 'transparent',
  border: `1px solid ${color.borderStrong}`,
  borderRadius: '4px',
  cursor: 'pointer',
} as const;
