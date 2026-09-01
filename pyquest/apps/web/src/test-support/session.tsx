import type { ReactNode } from 'react';
import type { Account } from '@pyquest/contract';
import { SessionContextForTests } from '../session/SessionProvider.tsx';

/**
 * A signed-in session, for tests that render a player-scoped screen.
 *
 * Every screen below `/map` now asks `usePlayer()`, which throws when nobody is signed in —
 * deliberately, because `App` does not mount those routes while signed out. That guarantee is
 * what keeps six components from each inventing an answer for an impossible case, and the cost
 * is that a test rendering one of them in isolation has to say who is looking at it.
 *
 * It provides the context directly rather than wrapping `SessionProvider`, because the provider
 * calls `GET /api/me` on mount. A test that wanted a signed-in screen would otherwise have to
 * stub the network to get one, which is a lot of machinery to answer a question the test already
 * knows the answer to.
 */
export const SIGNED_IN: Account = {
  id: '5eed0000-0000-4000-8000-000000000001',
  handle: 'peer',
  displayName: 'The Peer',
  roles: ['player', 'dm'],
};

export function AsSignedIn({
  children,
  account = SIGNED_IN,
}: {
  children: ReactNode;
  account?: Account;
}) {
  return (
    <SessionContextForTests.Provider
      value={{
        status: 'in',
        account,
        signedIn: () => undefined,
        signOut: async () => undefined,
      }}
    >
      {children}
    </SessionContextForTests.Provider>
  );
}
