import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Account } from '@pyquest/contract';
import { color, font } from '../design/tokens';
import { claimBootstrap, signIn } from '../gateway/index.ts';
import { useSession } from '../session/SessionProvider.tsx';
import { Mono, Panel } from '../shell/ui';

/**
 * The only screen reachable without a token, and the first one a household ever sees.
 *
 * Two forms, and the second exists for exactly one evening: on the day the api is first stood up
 * there is nobody to sign in as, so the printed bootstrap secret claims the DM seat. After that
 * the DM makes accounts from the Console (§6.8) and this half is never used again — which is why
 * it is behind a link rather than beside the password box.
 *
 * **No "forgot your password".** Nothing here collects an address, so there is nowhere to send a
 * link; a reset is the DM's act at the Console. That is the design (§6.5 — nothing he writes
 * leaves the house), and a dead link promising otherwise would be worse than its absence.
 */
export function SignInScreen() {
  const { signedIn } = useSession();
  const [claiming, setClaiming] = useState(false);

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: '24px' }}>
      <div style={{ width: 'min(420px, 100%)' }}>
        <h1
          style={{
            margin: '0 0 4px',
            fontFamily: font.display,
            fontSize: '28px',
            letterSpacing: '-.02em',
          }}
        >
          PyQuest
        </h1>
        <Mono>{claiming ? 'Claim the DM seat' : 'Sign in'}</Mono>

        <div style={{ marginTop: '20px' }}>
          {claiming ? (
            <ClaimForm onDone={signedIn} />
          ) : (
            <SignInForm onDone={signedIn} />
          )}
        </div>

        <button
          type="button"
          onClick={() => setClaiming((was) => !was)}
          style={{
            marginTop: '18px',
            background: 'none',
            border: 'none',
            padding: 0,
            color: color.secondary,
            font: 'inherit',
            fontSize: '13px',
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
        >
          {claiming ? 'I already have an account' : 'Setting this up for the first time?'}
        </button>
      </div>
    </div>
  );
}

/** A field, its label tied to it by `htmlFor` so a screen reader announces the pair. */
function Field({
  label,
  value,
  onChange,
  type = 'text',
  id,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  type?: string;
  id: string;
}) {
  return (
    <label htmlFor={id} style={{ display: 'block', marginBottom: '12px', fontSize: '13px' }}>
      <span style={{ display: 'block', marginBottom: '4px', color: color.secondary }}>{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: '100%',
          padding: '8px 10px',
          font: 'inherit',
          border: `1px solid ${color.border}`,
          borderRadius: '4px',
        }}
      />
    </label>
  );
}

function Failure({ message }: { message: string }) {
  return (
    <Panel>
      <Mono>{message}</Mono>
    </Panel>
  );
}

function SignInForm({ onDone }: { onDone: (account: Account) => void }) {
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [failure, setFailure] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFailure(undefined);
    try {
      onDone(await signIn(handle, password));
    } catch {
      /*
       * One message for every failure, matching what the api does. It refuses to say whether the
       * handle exists, and a screen that guessed a friendlier wording would give away the thing
       * the api is being careful about.
       */
      setFailure('That handle and password do not go together.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <Field id="handle" label="Handle" value={handle} onChange={setHandle} />
      <Field id="password" label="Password" type="password" value={password} onChange={setPassword} />
      {failure !== undefined && <Failure message={failure} />}
      <button type="submit" disabled={busy} style={submitStyle}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

function ClaimForm({ onDone }: { onDone: (account: Account) => void }) {
  const [secret, setSecret] = useState('');
  const [handle, setHandle] = useState('dm');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [failure, setFailure] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setFailure(undefined);
    try {
      onDone(await claimBootstrap({ secret, handle, displayName, password }));
    } catch {
      setFailure('That secret cannot be used. It may already have been spent.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <Panel>
        <Mono>
          Run <code>npm run bootstrap --workspace @pyquest/db</code> on the machine running the
          api. It prints a secret once, and that secret claims this seat.
        </Mono>
      </Panel>
      <div style={{ height: '12px' }} />
      <Field id="secret" label="The printed secret" value={secret} onChange={setSecret} />
      <Field id="claim-handle" label="Handle" value={handle} onChange={setHandle} />
      <Field id="claim-name" label="Display name" value={displayName} onChange={setDisplayName} />
      <Field
        id="claim-password"
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
      />
      {failure !== undefined && <Failure message={failure} />}
      <button type="submit" disabled={busy} style={submitStyle}>
        {busy ? 'Claiming…' : 'Claim the DM seat'}
      </button>
    </form>
  );
}

const submitStyle = {
  marginTop: '8px',
  width: '100%',
  padding: '10px',
  font: 'inherit',
  fontWeight: 600,
  color: '#fff',
  background: color.accent,
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
} as const;
