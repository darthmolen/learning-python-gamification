# The Console's account panel

**Status:** Backlog
**Track:** `spa`
**Date Discovered:** 2026-09-01
**Discovered During:** `planning/**/feature_accounts-and-auth_2026-08-30.md` Phase 3

## Context

Phase 3 built the DM's three acts as routes and stopped there. All four are served, tested and
guarded:

```text
GET  /api/players                       the roster
POST /api/players                       create — always a player, never a dm
POST /api/players/:playerId/password    reset, and sign that player out
POST /api/players/:playerId/roles       promote or demote, and sign that player out
```

`ConsoleScreen.tsx` still renders only the sign-off queue.

**It stopped for a track reason rather than a technical one.** `apps/web/src/screens/**` belongs
to the `spa` track, which yielded to the auth gate on 2026-09-01 rather than closing. A gate that
is allowed to run alone because it touches three tracks' files should not also spend that
permission drawing screens the yielding track owns.

## Known Scope

A second panel on the Console, beside the sign-off queue:

- **The roster** — handle, display name, roles, and when the password last changed
  (`player_credentials.updated_at` exists for this and is not yet on the wire)
- **Create a player** — three fields. `POST /api/players` answers 409 for a handle somebody
  already has, and the screen should say so rather than reporting a generic failure
- **Reset a password** — the one a learner will need on a Saturday morning. It signs that player
  out, so the screen has to say that plainly: somebody is about to be logged out of a laptop in
  another room
- **Promote and demote** — one control with a boolean, because they are one decision.
  `POST /roles` refuses a DM removing their own `dm` with a 403 and a sentence; render the
  sentence rather than "forbidden"

## What is already decided and should not be re-litigated

- **Everyone created here is a `player`.** There is no path to `dm` except the bootstrap and
  promotion, and the api has no parameter that would accept one
- **There is no self-service anything.** No signup, no password reset by the person who forgot it,
  no email — §6.5 collects no address, so there is nowhere to send a link
- **Roles are `player` and `dm`.** `peer` is a relation computed against a submission, not a row,
  and nothing on this screen should offer it

## Trigger for Promotion

With the `spa` track's next session, or sooner if a second person needs an account before then.
**Until it lands the DM can still do all three**, from `curl` or from the api directly — the
capability exists, the screen does not.
