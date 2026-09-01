/**
 * A signed-in player, for the suites that drive routes directly.
 *
 * Four test files build a server and call routes, and after the guard landed every one of them
 * needed a token. **One helper rather than four**, because four would be four places to get the
 * header slightly different and four places to forget when the scheme changes.
 *
 * ## Where the guarantee actually lives
 *
 * A wrapper that attaches a header is invisible by design, and an invisible credential is the
 * thing the plan warned about: a suite that always signs in cannot tell a guarded route from an
 * open one, so removing the guard would turn nothing red *here*.
 *
 * That is why `auth.test.ts` walks `API_ROUTES` and requires a 401 from every route but the two
 * that issue tokens — from the contract's own list, so a route added tomorrow is covered on the
 * day it is added rather than when somebody remembers. **The division is deliberate**: these four
 * suites prove their routes work for somebody who has signed in, and that one proves nobody else
 * gets in. Neither file is weaker for not doing the other's job, and the token stays a parameter
 * here so it is at least legible at the call site.
 */

import { createPlayer, issueToken, setRole } from '@pyquest/db';
import type { FastifyInstance, InjectOptions } from 'fastify';
import type { Queryable } from '@pyquest/db';

export interface SignedIn {
  readonly id: string;
  readonly handle: string;
  readonly token: string;
}

/**
 * Make a player, give them a token, and hand back both.
 *
 * `roles` defaults to a plain player because that is what most routes need, and a suite that
 * signed everything in as a DM would not notice a route that had quietly become DM-only.
 */
export async function signIn(
  client: Queryable,
  options: { handle?: string; password?: string; dm?: boolean; id?: string } = {},
): Promise<SignedIn> {
  const handle = options.handle ?? 'tester';
  const account =
    options.id === undefined
      ? await createPlayer(client, {
          handle,
          displayName: handle,
          password: options.password ?? 'a test password',
        })
      : { id: options.id, handle };

  if (options.id !== undefined) {
    await client.query(
      `INSERT INTO player_roles (player_id, role) VALUES ($1::uuid, 'player') ON CONFLICT DO NOTHING`,
      [options.id],
    );
  }
  if (options.dm === true) await setRole(client, account.id, 'dm', true);

  const { token } = await issueToken(client, account.id, 'test');
  return { id: account.id, handle, token };
}

/** `app.inject`, with the bearer token this api now requires on every route but two. */
export const inject = (app: FastifyInstance, token: string, options: InjectOptions) =>
  app.inject({
    ...options,
    headers: { ...(options.headers ?? {}), authorization: `Bearer ${token}` },
  });
