/**
 * The token this browser holds, and who it says you are.
 *
 * **This module replaces `household.ts`, and the difference is the plan's whole objective.** That
 * file held two uuids compiled into the app: every request was made as a constant, and the api
 * had no way to disagree. Now the app asks — `POST /api/session` for a token, `GET /api/me` for
 * the player it belongs to — and the answer comes from the server rather than from a build.
 *
 * ## Why `localStorage` and not a cookie
 *
 * A cookie would be sent automatically, which sounds like less code and is the wrong trade here.
 * The api is on a different origin (§6.4 puts it on the parent's machine, port 3081, while the
 * SPA is on 3082), so a cookie needs `SameSite=None` and therefore HTTPS — which this household
 * deliberately does not have, for reasons the plan argues at length. A bearer token in a header
 * works over plain HTTP on a LAN, and it is explicit at every call site.
 *
 * It also means signing out is deleting a string, and a token stolen from storage is worthless
 * after twelve hours.
 */

const KEY = 'pyquest.token';

/**
 * Reading storage can throw, not merely come back empty.
 *
 * A browser set to block site data raises on access rather than returning null, and a private
 * window can do the same. The app must render a sign-in screen in that case, not a white page —
 * so every read and write here is wrapped, and the failure mode is "you are signed out".
 */
export function storedToken(): string | undefined {
  try {
    return window.localStorage.getItem(KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

export function rememberToken(token: string): void {
  try {
    window.localStorage.setItem(KEY, token);
  } catch {
    /* Nothing to do: the session lasts as long as the tab, which is better than refusing to run. */
  }
}

export function forgetToken(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* Ignored for the same reason. */
  }
}

/**
 * Thrown when the api refuses a token.
 *
 * Its own type because the SPA does something different about it than about any other failure:
 * a 401 is not a resource that failed to load, it is a session that ended. `Loading.tsx`'s failed
 * state offers "try again", which is the wrong answer — the fix is to sign in, and only a
 * distinguishable error lets a screen say so.
 */
export class Unauthenticated extends Error {
  constructor() {
    super('this session has ended — sign in again');
    this.name = 'Unauthenticated';
  }
}
