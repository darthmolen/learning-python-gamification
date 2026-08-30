# Accounts, And Who Is Allowed To Ask

**Status:** Planned
**Track:** `auth` — **a gate. It runs alone.** See *Track discipline*
**Date:** 2026-08-30
**Author:** Claude (Opus 5)
**Lane:** A
**Promoted from:** `planning/backlog/feature_accounts-and-auth_2026-08-30.md`

## Objective

Give the game accounts and a session, so that `PLAYER_ID = 'peer'` stops being a constant and
every request the API answers is one it knows the asker for.

## The shape, decided 2026-08-30

**The DM creates every account, from the Console.** There is no signup screen, no self-service
registration, no approval queue. A household is one adult and the people at their kitchen table;
the DM is in the room, and a flow where somebody asks to join and waits to be let in only earns
its keep when the asker is a stranger.

The one exception is the bootstrap, because somebody has to be first.

**Self-service registration is deliberately deferred**, and to a specific event rather than to
"later": it arrives with real OAuth, if this ever becomes an institutional teaching tool. That
is a different product with a different threat model, and designing for it now would buy a
password-reset-by-email flow that a household does not want and cannot use.

## Why vertical, not layer by layer

Three phases, each cutting through `db`, `api` and `spa`, each ending in something that works.

**A half-built auth is a fault, not a partial feature.** Building it in layers gives you either
"every route guarded, no way to get a token" — locked out of your own game — or "tokens issued,
routes still open", which is the appearance of protection and none of the substance. Neither is
a state to stop in. A vertical slice leaves the system coherent after every phase.

**The integration is the risk, and this repository has the receipts.** The SPA's own plan
records six occasions where a layer was green while the chain through it was broken: a suite
that never loaded, a build broken behind a passing gate, a dev server serving a module it had
mutilated. Auth is exactly that shape — three layers and one handshake — and the handshake is
the part no unit test sees.

**The scariest piece is also the smallest.** The bootstrap is perhaps forty lines and it is the
one thing that is awkward to change once a household exists. It goes first.

## Success Criteria

- [ ] A generated single-use secret, written by a script, claims the DM seat exactly once
- [ ] `POST /api/session` exchanges credentials for a token; every other route requires one
- [ ] **A request with no token, a bad token or an expired token is refused** — asserted per
      route shape, not assumed from the middleware existing
- [ ] The DM can create a player, reset a password and promote a role, from the Console
- [ ] `PLAYER_ID` is gone from `apps/web`, replaced by the session's own player
- [ ] Passwords are hashed with argon2id. **No test, log or traceback ever contains one** —
      including the API's error paths, which already return tracebacks to the browser
- [ ] `player_roles` is written with the stored roles it already names, and peer sign-off is
      checked as a relation — authenticated and not the submitter — rather than as a role
- [ ] `npm test`, `typecheck` and `vite build` clean

## What already exists, and what is missing

`players` is closer than expected:

| Column | Type | For |
|---|---|---|
| `id` | uuid | the key everything references |
| `handle` | citext, **unique** | the username — already case-insensitive, already unique |
| `display_name` | text, non-empty | the name |

Two of the three fields exist. What is missing is a credential, and it does **not** belong on
`players`: a secret gets its own table so that reading a player never risks reading a hash.

**No date of birth, and none is wanted.** §6.5 argues it from another angle — "no age gate, and
nothing he writes leaves the house" — and the curriculum's own age references were narrowed to a
range for the same reason. The game needs a name to greet somebody by and a handle to identify
them. It needs nothing more, and every field it does not have is a field that cannot leak.

## Two vocabularies, not one — and there is no collision

`player_roles` carries `CHECK (role = ANY (ARRAY['player', 'dm']))`, and the first draft of this
plan called that a collision with the lexicon's `peer` / `dm`. **It is not.** They are two
different vocabularies describing two different things, and the database is right.

**A stored role is what you are.** §5.11: "The **player** does quests, earns XP and takes bosses.
The **DM** authors content, signs off, adjudicates, forgives a streak, and asks the Socratic
questions." Those are the two, they live in `player_roles`, and the check constraint already
names them correctly. **No migration.**

**`peer` is what you are being, to somebody, right now.** §6.3 defines `peer-signoff` as
"somebody other than the submitter presses the button", and the `by` field on a verifier says
which capacity is required. It is a *relation*, not a stored role — nobody is a peer on their
own, and there is no row to hold it.

The two are ordered, and only in one direction:

| `by` requires | Satisfied by |
|---|---|
| `peer` | any authenticated player who is **not the submitter** — including a DM, who is also a player in Kitchen Table mode |
| `dm` | only somebody holding the `dm` role |

So the DM is the super-admin: it can do everything a peer can and things no peer can, while a
peer cannot stand in for a DM. That asymmetry is the whole point of the second word existing.

**What that means for the guard**, and it is not what a role check would give you:

- **Role-based** — `dm`-only routes look up the role. Ordinary lookups need only a valid session.
- **Relation-based** — peer sign-off is *authenticated **and** not the submitter*, computed
  against the thing being signed rather than against the account. A `peer` role would be
  meaningless here: whether you qualify depends on whose work it is.

**And `PLAYER_ID = 'peer'` in `apps/web` is simply a bug**, of exactly this confusion. It uses a
sign-off capacity as an identity, which is why it reads oddly and why nothing could ever have
matched it — no row will ever have that handle. It becomes the session's own player, which is
what Phase 1 does anyway.

The lexicon's `peer` / `dm` line still stands and still means what it says: the ban is on
`parent` and `son`, because "a two-person family in the content contract becomes a migration the
moment a sibling, a class, or a teacher appears" (§9). Nothing here touches that.

## Phases

### Phase 1 — the walking skeleton

One account, one token, one guarded route, proved end to end.

- **db** — a migration: `player_credentials` keyed on `player_id`, and a home for the bootstrap
  secret. Repository functions to create a credential and verify one.
- **the script** — generates a secret, writes it, prints it once. Not an endpoint: an API that
  hands out a bootstrap secret is an API that hands out the household. Single-use, consumed on
  success, and idempotent in the safe direction — running it twice must not leave two ways in.
- **api** — `POST /api/session`, and the guard applied to exactly one route so the mechanism is
  proved before it is spread.
- **spa** — a sign-in screen, and the gateway sending `Authorization: Bearer`.

**Done when** the script prints a secret, that secret creates the first account with both roles,
signing in returns a token, and the guarded route answers with it and refuses without it.

### Phase 2 — the guard everywhere

Every remaining route requires a token. The gateway sends it on every call. A 401 takes the SPA
back to sign-in rather than rendering a failed resource — the one place `Loading.tsx`'s failed
state is the wrong answer, because the fix is an action rather than an explanation.

### Phase 3 — the Console

The DM's screen, and the reason the Console stops being a frame.

- **create a player** — handle, password, display name. Everyone created here is `player`;
  there is no path to `dm` except the bootstrap and promotion.
- **reset a password** — a requirement, not a nicety. The learner is a child, he will forget it,
  and a locked-out learner on a Saturday morning is the end of that session.
- **promote a role** — the DM's act, never self-service.

## Approach

**Basic to obtain a token, Bearer thereafter.** `POST /api/session` takes credentials once;
everything else carries the token. Basic on every request re-sends the password on every call,
which over the plain HTTP this runs on is the password crossing the LAN dozens of times a
session instead of once. A token also expires and can be revoked; a password can only be changed.

**The security posture, stated so nobody later assumes more.** Over HTTP on a home LAN this stops
casual mischief — a guest device, a curious sibling, a request from the wrong machine. It is
**not** confidential against anyone running `tcpdump` on the same network. TLS would fix that and
costs a self-signed certificate his laptop must be told to trust, which is a real tax on a
machine that exists to teach Python. For a threat model of *one household*, token-over-HTTP is
proportionate. **If that model ever changes, this paragraph is the thing to re-read** — and the
change that would trigger it is the same one that brings OAuth: this becoming an institutional
tool.

**The filter is the refusal, not the acceptance.** A guard that lets the right token through is
easy and proves little; the tests that matter hand it no token, a malformed one, an expired one,
and one belonging to a different player, and require a refusal each time. Seed the mutants that
decide it: return the player before checking the token, accept an expired token, compare the hash
with `==` rather than a verifier, and let the bootstrap secret be spent twice.

## Dependencies / Prerequisites

- None blocking. The schema, the API and the SPA all exist
- `planning/backlog/feature_seed-a-test-household_2026-08-30.md` becomes easier afterwards, not
  before — a seeded household with no credentials is a household nobody can sign in as

## Files Expected to Change

- `pyquest/packages/db/**` — the migration, credential and session repositories, the bootstrap
  script
- `pyquest/apps/api/src/**` — `POST /api/session`, the guard, account routes
- `pyquest/packages/contract/src/endpoints.ts` — the session and account shapes. **`api`'s file**
- `pyquest/apps/web/src/gateway/index.ts` — the header, and the death of `PLAYER_ID`
- `pyquest/apps/web/src/screens/**` — sign-in, and the Console gaining a body
- `content/` — nothing. Accounts are not content

## Track discipline

**A gate, not a parallel track.** It touches `db`, `api` and `spa` at once, which no single track
may own — so it runs alone, and the reason is not bookkeeping: adding a guard to every route
while another track adds routes is how a route ships unguarded.

One thing to settle before it starts:

- **`spa` is in-progress** (`feature_spa_2026-08-28-v2.md`) and owns
  `apps/web/src/gateway/index.ts`, which Phase 1 edits. That plan's remaining criteria are
  blocked on the API and on his laptop, so it is parked rather than moving — but it either closes
  or explicitly yields the gateway before this starts.
- **This closes one of that plan's open criteria.** "Nine screens matching the artboards" is
  unmet partly because the Console is a frame; Phase 3 gives it a body.

## Out of Scope

- **Self-service registration and DM approval.** Deferred to real OAuth, if this becomes an
  institutional tool. A household does not need to ask permission to sit at its own table.
- **Email anything.** No address is collected, so no reset link can be sent — which is why reset
  is the DM's act at the Console.
- **TLS.** Argued above. Revisit with the threat model, not on its own.

## Anticipated Backlog

- **Token lifetime and what expiry feels like.** An hour is safe and a session is 45–60 minutes,
  so a badly chosen number logs him out mid-quest. Needs a decision informed by an actual
  session rather than a default
- **Whether Gitea should share the account.** §6.5 gives him a Gitea login already, and two
  passwords for one household is the kind of friction that ends with both written on paper
