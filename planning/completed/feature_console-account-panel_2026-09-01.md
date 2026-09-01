# The Console's account panel

**Status:** Completed
**Track:** `spa`
**Date:** 2026-09-01
**Promoted:** 2026-09-01 — the auth gate closed and left this as the only thing between a
bootstrapped DM and a second account. Without it, adding the learner needs `curl`
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

## Success Criteria

- [x] The DM sees the household roster: handle, display name, roles
- [x] The DM can create a player, and a handle somebody already has says so rather than failing
      generically
- [x] The DM can reset a password, and the screen says plainly that it signs that player out
- [x] The DM can promote and demote, and the refusal to demote oneself is rendered as its
      sentence rather than as "forbidden"
- [x] **A player who is not the DM never sees the panel** — asserted, not assumed from the api
      refusing
- [x] `npm test`, `npm run typecheck` and the web build are clean

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

---

## Status

**Final Status:** Completed
**Track:** `spa`
**Completed:** 2026-09-01
**Completed By:** Claude (Opus 5)

### Outcomes

All six criteria met. The first-run path is now complete end to end without a terminal after the
bootstrap: **migrate → bootstrap → paste the secret → add the learner from the Console.**

`AccountsPanel` renders inside the Console for the DM only, with the roster and the three acts.
Four gateway functions carry the routes the auth gate had already served and guarded.

### Deviations

None. The api was built in the auth gate and needed no change, which is the check on whether that
gate stopped in the right place — it did.

### Lessons Learned

**Two tests each found a real defect, which is the argument for writing them first.**

The reset test asked for the confirmation message and found nothing: `onChanged` bumps the key
that remounts `Roster`, so a notice held *inside* `Roster` was wiped by the very act that produced
it. "Peer has been signed out" appeared for zero frames. State that has to outlive a remount
belongs above it.

The sign-off queue's "nothing is waiting" assertion started failing because the shared test
account held `dm`, so the account panel rendered into a test that was only ever about sign-offs
and its roster rows were counted. **A default that can do everything makes every screen test a
test of the most privileged case** — the one case least worth defaulting to. The default is now a
plain player, matching the seeded `peer`.

**Hidden, not disabled.** Every control in the panel would answer 403 for a player, and a control
guaranteed to fail is a lie about what the screen can do. The panel also does not *fetch* the
roster for a player: a request certain to 403 is a failed resource the screen would then have to
explain, on a screen where nothing is wrong.

### Backlog Items Created

None.
