# Accounts, And Who Is Allowed To Ask

**Status:** Backlog
**Track:** unassigned — spans `db`, `api` and `spa`
**Date Discovered:** 2026-08-30
**Discovered During:** SPA Phase 5, deciding what `PLAYER_ID` should be instead of a constant

## Context

`apps/web/src/gateway/index.ts` reads:

```ts
export const PLAYER_ID = 'peer';
```

Every request the SPA makes is made as that constant, because there is no way to be anybody.
There is no login, no account, and no check on the API — every route is open to anyone who can
reach the port.

This plan answers two questions with one mechanism: **how a person gets into the game**, and
**how the game knows who is asking.** Doing them together also keeps personal data out of the
seed, which is the other reason to do it now:
`planning/backlog/feature_seed-a-test-household_2026-08-30.md` exists for tests and holds
nothing a person would type.

## What the schema already has, and what it lacks

`players` is closer than expected:

| Column | Type | For |
|---|---|---|
| `id` | uuid | the key everything else references |
| `handle` | citext, **unique** | the username, already case-insensitive and already unique |
| `display_name` | text, non-empty | the name |
| `created_at` | timestamptz | — |

So **two of the three fields exist.** What is missing is a credential — there is no password
column, and there should not be one on `players`: a secret belongs in its own table with its own
access pattern, so that reading a player never risks reading a hash.

**No date of birth, and none is wanted.** §6.5 already argues the point from a different angle —
"no age gate, and nothing he writes leaves the house" — and ADR-adjacent work has already
narrowed the curriculum's age references to a range for the same reason. A person needs a name
to be greeted by and a handle to be identified by; the game needs neither more.

## The lexicon collision, which will bite at integration

`player_roles` carries `CHECK (role = ANY (ARRAY['player', 'dm']))`.

CLAUDE.md's lexicon prescribes **`peer` / `dm`**, and `apps/web`'s constant is `'peer'`. The
database says `player`. Nothing has broken yet because nothing has ever written a role, but the
first request that filters by one will disagree with itself.

**This plan should not decide which word wins** — that is the lexicon's call and it touches the
spec — but it is the plan that will trip over it, so it is recorded here. `peer` is the
prescribed term and `player` is the one already committed to a check constraint, which means the
cheap answer and the correct answer are different. Worth settling before rows exist rather than
after.

## The three pieces

### 1. Bootstrap: an admin secret, and the first account becomes DM

A script writes a single-use secret to Postgres. The first account created with that secret
gets both roles — the household's DM seat and a player seat, which is what §5.11's Kitchen Table
mode describes: one household, the parent holding both.

Properties worth insisting on:

- **Generated, not chosen.** A secret somebody types is a secret somebody reuses.
- **Single-use, and consumed on success.** Not a password — a one-time claim on the DM seat.
- **Written by a script, not printed by the API.** An endpoint that hands out a bootstrap secret
  is an endpoint that hands out the household.
- **Idempotent in the safe direction.** Running the script twice should not create a second way
  in while the first is unused.

After it is spent, **every subsequent account is `player`.** There is no self-service route to
`dm`; promoting somebody is the DM's act, from the Console (§5.11 already puts sign-off and
authoring there).

### 2. A creation screen: handle, password, display name

Three fields and no more. It lives in the SPA and is the only screen reachable without a
session.

The learner is a child who will forget his password, so **the DM must be able to reset one.**
That is a requirement rather than a nicety — a locked-out learner on a Saturday morning is the
end of that session. The Console is the place.

### 3. Basic to get a token, Bearer thereafter

**Yes — and that pairing is the standard shape rather than a compromise.**

- `POST /api/session` accepts credentials once and returns a token.
- Every other route requires `Authorization: Bearer <token>`.

Why not Basic on every request, which is simpler: Basic re-sends the password on *every* call.
Over the plain HTTP this runs on, that is the password crossing the LAN dozens of times a
session instead of once. A token also expires and can be revoked; a password can only be
changed.

**The honest security posture, stated plainly so nobody later assumes more:** over HTTP on a
home LAN this stops casual mischief — a guest device, a curious sibling, an accidental request
from the wrong machine. It is **not** confidential against anyone running `tcpdump` on the same
network. TLS would fix that and costs a self-signed certificate his laptop has to be told to
trust, which is a real tax on a machine that exists to teach Python. For a threat model of *one
household*, token-over-HTTP is proportionate; if that model ever changes, this paragraph is the
thing to re-read.

Non-negotiable regardless: **passwords are hashed, argon2id by preference, never stored or
logged in the clear** — including in the traceback paths the API already returns to the browser.

## What this replaces

- `PLAYER_ID` in `apps/web/src/gateway/index.ts`, which is a constant with a comment pointing
  at this plan
- The open question in `planning/backlog/feature_roles-modes-and-the-dm-seat_2026-08-28.md`, in
  part — this decides how a role is *assigned*, not what the modes mean

## Known scope

- A migration: a credentials table keyed on `player_id`, and the bootstrap secret's home
- `packages/db`: the bootstrap script, and repository functions for credentials and sessions
- `apps/api`: `POST /api/session`, account creation, and a guard on every existing route
- `apps/web`: a creation screen, a session screen, token storage, and a gateway that sends the
  header — the gateway is the only place that changes, which is what the seam was for
- The Console gaining password reset and role promotion

## Trigger for promotion

Before anything is exposed beyond the parent's machine, and before the first real household
exists — because retrofitting accounts onto rows that were seeded without them means a
migration nobody enjoys. It is not urgent while the stack is one machine on one desk.
