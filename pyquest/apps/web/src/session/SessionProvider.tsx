import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Account } from '@pyquest/contract';
import { getMe, offlineAccount, signOut as endSession, usesApi } from '../gateway/index.ts';

/**
 * Who is signed in, for the whole app.
 *
 * **This is what replaced `PLAYER_ID`.** Six screens imported that constant and made every request
 * as it; each now asks `usePlayer()` and gets the id the *api* says the token belongs to. The
 * difference is the plan's objective in one sentence: the client stops asserting who it is.
 *
 * A context rather than a prop threaded through six screens, because every player-scoped screen
 * needs the same answer and the alternative is a parameter on every route component that nobody
 * can forget in only one place.
 *
 * ## Three states, not two
 *
 * `loading` is a state of its own, and collapsing it into "signed out" is the bug worth naming:
 * on every reload there is a moment before `GET /api/me` answers, and an app that treats that
 * moment as signed-out flashes the sign-in screen at somebody who is already signed in. Rendering
 * nothing for that beat is the correct answer and costs one enum member.
 */
export interface SessionState {
  readonly status: 'loading' | 'in' | 'out';
  readonly account: Account | undefined;
  readonly signedIn: (account: Account) => void;
  readonly signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionState | undefined>(undefined);

/**
 * The raw context, for `test-support/session.tsx` only.
 *
 * Exported under a name that says so, because the alternative is a test wrapping the real
 * provider and therefore stubbing `GET /api/me` just to render a screen. Nothing in `src/`
 * outside the tests may use this: `useSession` is the way in, and it throws a named error when
 * the provider is missing rather than handing back `undefined`.
 */
export const SessionContextForTests = SessionContext;

export function SessionProvider({ children }: { children: ReactNode }) {
  /*
   * With no api there is nothing to sign in to, so the fixture app starts signed in rather than
   * resolving into it. Doing this in the initial state rather than in an effect is what stops the
   * sign-in screen appearing for one frame on every load of the offline app.
   */
  const offline = !usesApi();
  const [account, setAccount] = useState<Account | undefined>(offline ? offlineAccount() : undefined);
  const [status, setStatus] = useState<SessionState['status']>(offline ? 'in' : 'loading');

  useEffect(() => {
    if (offline) return;
    let live = true;
    void getMe()
      .then((found) => {
        if (!live) return;
        setAccount(found);
        setStatus(found === undefined ? 'out' : 'in');
      })
      .catch(() => {
        /*
         * The api being unreachable is not the same as being signed out, but for this screen it
         * has the same answer: there is nothing to show and signing in is the thing to try. The
         * sign-in form reports the real failure when it is submitted.
         */
        if (!live) return;
        setStatus('out');
      });
    return () => {
      live = false;
    };
  }, [offline]);

  const signedIn = useCallback((found: Account) => {
    setAccount(found);
    setStatus('in');
  }, []);

  const signOut = useCallback(async () => {
    await endSession();
    setAccount(undefined);
    setStatus('out');
  }, []);

  const value = useMemo<SessionState>(
    () => ({ status, account, signedIn, signOut }),
    [status, account, signedIn, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/** The session, or a thrown error naming the missing provider rather than a silent undefined. */
export function useSession(): SessionState {
  const session = useContext(SessionContext);
  if (session === undefined) {
    throw new Error('useSession was called outside a SessionProvider');
  }
  return session;
}

/**
 * The signed-in player's id, for the screens that used to import `PLAYER_ID`.
 *
 * Throws when nobody is signed in, and that is deliberate: `App` renders the sign-in screen
 * instead of the routes, so a player-scoped screen can only mount when there *is* a player.
 * Returning `undefined` would push that impossible case into six components, each of which would
 * have to invent an answer for it.
 */
export function usePlayer(): string {
  const { account } = useSession();
  if (account === undefined) {
    throw new Error('a player-scoped screen rendered with nobody signed in');
  }
  return account.id;
}

/** Whether the signed-in player holds the DM seat. The Console asks; nothing else should. */
export function useIsDm(): boolean {
  const { account } = useSession();
  return account?.roles.includes('dm') ?? false;
}
