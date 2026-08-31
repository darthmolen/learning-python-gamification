# Accounts, And Who Is Allowed To Ask

**Status:** Planned
**Version:** v2 — checked against `main` at `36ab69c` on 2026-08-31. Seven of v1's claims had gone
stale in the day since it was written; see *What changed in v2*
**Track:** `auth` — **a gate. It runs alone.** See *Track discipline*
**Date:** 2026-08-30
**Author:** Claude (Opus 5)
**Lane:** A

## Objective

Give the game accounts and a session, so that the player id stops being a constant compiled into
the SPA and every request the API answers is one it knows the asker for.

## What changed in v2, and why a day mattered

Between v1 and this revision, `main` took two plans to `completed/` — the seeded household and
the end-to-end wiring — and the ground under three of v1's sections moved.

- **`PLAYER_ID = 'peer'` was v1's evidence and is now half fixed.** It is still that on `main`
  (`gateway/index.ts:114`), but the `spa` track has an uncommitted answer in the working tree:
  `apps/web/src/household.ts`, holding the two seeded uuids. That module names this plan as the
  thing that deletes it. v1 described a bug; this describes a stopgap to retire.
- **The Console is not a frame any more.** `ConsoleScreen.tsx` is 303 lines and serves the
  sign-off queue. Phase 3 gives it a *second panel*, not a body.
- **The API does not return tracebacks.** v1's password criterion said it did.
  `apps/api/src/errors.ts` turns every unexpected throw into `internal` with a fixed message and
  keeps the cause in the server log. The hazard is real and it runs in the other direction.
- **A seeded household now exists, with no credentials.** v1 listed the seed as a thing that gets
  easier afterwards. It landed first, and it hands this plan a question v1 did not have to answer.
- **`sessions` is taken.** Migration `0004` owns that word, and it means a *teaching* session.
- **The migration is `0006`.** Five exist.
- **"Promoted from" was false.** This file was authored at `planning/` in `751fb06`; the backlog
  path it named has never existed. Removed rather than corrected.

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
mutilated. A seventh landed on 2026-08-31 and is the closest analogue of all: the SPA asked for
player `peer`, the API rejects any non-uuid before it reaches the database, and **every**
player-scoped screen answered 404 while both halves' own tests were green. Auth is exactly that
shape — three layers and one handshake — and the handshake is the part no unit test sees.

**The scariest piece is also the smallest.** The bootstrap is perhaps forty lines and it is the
one thing that is awkward to change once a household exists. It goes first.

## Success Criteria

- [ ] A generated single-use secret, written by a script, claims the DM seat exactly once
- [ ] `POST /api/session` exchanges credentials for a token; every other route requires one
- [ ] **A request with no token, a bad token or an expired token is refused** — asserted per
      route shape, not assumed from the middleware existing
- [ ] The DM can create a player, reset a password and promote a role, from the Console
- [ ] `apps/web/src/household.ts` is deleted, and both `PLAYER_ID` and `DM_ID` are replaced by
      the session's own player. No uuid literal survives in `apps/web` outside the fixtures
- [ ] Passwords are hashed with argon2id. **No test, log or traceback ever contains one** — and
      the place to look is the *server log*, not the wire: `asFailure` chains the original error
      as `cause` into the log deliberately, so a driver's complaint about a failed insert is
      exactly where a plaintext password would surface
- [ ] The credential table is **not** called `sessions`, and neither is the token's
- [ ] `player_roles` is written with the stored roles it already names, and peer sign-off is
      checked as a relation — authenticated and not the submitter — rather than as a role
- [ ] The seed still runs, still converges on a second run, and `resetHousehold` still leaves
      nothing behind — credentials included
- [ ] `npm test`, `npm run typecheck` and the build gate's `npm run build --workspace @pyquest/web`
      are clean

## What already exists, and what is missing

`players` (migration `0001`) is closer than expected:

| Column | Type | For |
|---|---|---|
| `id` | uuid | the key everything references, `DEFAULT gen_random_uuid()` |
| `handle` | citext, **unique** | the username — already case-insensitive, already unique |
| `display_name` | text, non-empty | the name |
| `created_at` | timestamptz | when |

The table is complete apart from a credential, and the credential does **not** belong on it: a
secret gets its own table so that reading a player never risks reading a hash. **Migrations
`0001`–`0005` exist, so this one is `0006`.**

**No date of birth, and none is wanted.** §6.5 argues it from another angle — "no age gate, and
nothing he writes leaves the house" — and the curriculum's own age references were narrowed to a
range for the same reason. The game needs a name to greet somebody by and a handle to identify
them. It needs nothing more, and every field it does not have is a field that cannot leak.

### `sessions` is already taken, and it means something else

Migration `0004` has:

```sql
CREATE TABLE sessions (
  id            bigserial PRIMARY KEY,
  scheduled_for date      NOT NULL UNIQUE,
  attended      boolean   NOT NULL DEFAULT false,
  forgiven_by   uuid      NULL REFERENCES players (id),
  ...
);
```

That is a **teaching** session — a Saturday morning, attended or forgiven. It is one of the words
the whole spec is built on, and an auth table called `sessions` would put two unrelated meanings
one letter apart in the same schema. Pick another name for the token store — `api_tokens` reads
straight — and notice that `POST /api/session` on the route side is *also* this collision. The
route is a defensible pun on "sign in", but it should be a decision rather than an accident.
Settle both names in Phase 1, before anything references either.

## Two vocabularies, not one — and there is no collision

`player_roles` carries `CHECK (role IN ('player', 'dm'))`, and the first draft of this plan
called that a collision with the lexicon's `peer` / `dm`. **It is not.** They are two different
vocabularies describing two different things, and the database is right.

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

**And `PLAYER_ID = 'peer'` was a bug of exactly this confusion** — a sign-off capacity used as an
identity, which is why it read oddly and why nothing could ever have matched it. It was diagnosed
on 2026-08-31 by driving the real gateway against the live API (`/api/players/peer/campaign`
answered 404; `getTome()`, the one route that is not player-scoped, answered fine) and written up
as `planning/backlog/feature_spa-player-id-is-not-a-uuid_2026-08-31.md`.

**The `spa` track has since patched it, and the patch is this plan's to remove.** The working
tree carries `apps/web/src/household.ts` — the two seeded uuids, with a header that says outright
"this module goes when accounts lands and a real player can be named". That item's own criterion
was that the SPA "does not hardcode a UUID either", which a constants module satisfies only in
the sense that there is now exactly one place to delete. Its **option 2** — an endpoint that says
who is playing — is what Phase 1 builds, and the item closes when it does.

The lexicon's `peer` / `dm` line still stands and still means what it says: the ban is on
`parent` and `son`, because "a two-person family in the content contract becomes a migration the
moment a sibling, a class, or a teacher appears" (§9). Nothing here touches that.

## The seeded household, and what the bootstrap walks into

`packages/db/src/seed.ts` landed 2026-08-31 and writes two players with fixed uuids:

| handle | roles | id |
|---|---|---|
| `peer` | `player` | `5eed0000-…-0001` |
| `dm` | `dm`, `player` | `5eed0000-…-0002` |

**So "the bootstrap claims the DM seat" is no longer a claim against an empty table.** Three
things follow, and none is optional:

- **`handle` is unique citext.** A bootstrap that creates a player called `dm` fails outright
  against a seeded database. It must claim an *existing* seat when one is there, or take a handle
  from the operator — and it must say which it did, because "the DM seat was already held" and
  "the DM seat is yours" are different sentences and only one of them means somebody else can
  sign in.
- **The seed must stay credential-free.** Its header says so in as many words — "There are no
  passwords here and nothing a person would type" — and that line is what stops a fixture from
  quietly deciding how the product onboards people. A seeded household that cannot sign in is the
  correct outcome; the bootstrap is how it gets a way in, run separately and on purpose.
- **`resetHousehold` must drop credentials too.** It deletes from `HOUSEHOLD_TABLES` by player id
  and then deletes the players, so `ON DELETE CASCADE` on the credential's `player_id` makes that
  work by itself; anything else leaves an orphan or breaks the reset outright. Whichever is
  chosen, the seed's own test is where it gets proved, and the mutant is a credential surviving a
  reset.

## Phases

### Phase 1 — the walking skeleton

One account, one token, one guarded route, proved end to end.

- **db** — migration `0006`: `player_credentials` keyed on `player_id`, a token store (**not**
  `sessions`), and a home for the bootstrap secret. Repository functions to create a credential
  and verify one.
- **the script** — generates a secret, writes it, prints it once. Not an endpoint: an API that
  hands out a bootstrap secret is an API that hands out the household. Single-use, consumed on
  success, and idempotent in the safe direction — running it twice must not leave two ways in.
  It must behave sanely against the seeded household above, which is the case worth writing first.
- **api** — `POST /api/session`, `GET /api/me`, and the guard applied to exactly one route so the
  mechanism is proved before it is spread. `GET /api/me` is what closes the SPA's player-id item.
- **spa** — a sign-in screen, the gateway sending `Authorization: Bearer`, and `household.ts`
  deleted in the same commit that replaces its last reader.

**Done when** the script prints a secret, that secret claims the DM seat once, signing in returns
a token, `GET /api/me` names the player, and the guarded route answers with the token and refuses
without it.

### Phase 2 — the guard everywhere

Every remaining route requires a token. The gateway sends it on every call. A 401 takes the SPA
back to sign-in rather than rendering a failed resource — the one place `Loading.tsx`'s failed
state is the wrong answer, because the fix is an action rather than an explanation.

**This is where the API's own suite changes shape.** Four files in `apps/api/tests/` call
`buildServer` and drive routes directly — `server.test.ts`, `server.gitsignal.test.ts`,
`server.localrepo.test.ts` and `fixtures-agree.test.ts` — and every one of them starts needing a
token. Give them one helper rather than four, and make the helper's *absence* the thing a
refusal test asserts: a suite where the credential is invisible is a suite that cannot tell a
guarded route from an open one. `fixtures-agree.test.ts` is the one to watch. It is the test that
compares the SPA's fixtures against what the API actually returns, and it is worth exactly
nothing the moment it starts comparing two 401s.

### Phase 3 — the Console gains its second panel

The Console is **not** a frame — its sign-off queue landed 2026-08-31 and is 303 lines of
`ConsoleScreen.tsx`. §6.8 gives the Console three jobs; one is served, and account management is
the second.

- **create a player** — handle, password, display name. Everyone created here is `player`;
  there is no path to `dm` except the bootstrap and promotion.
- **reset a password** — a requirement, not a nicety. The learner is a child, he will forget it,
  and a locked-out learner on a Saturday morning is the end of that session.
- **promote a role** — the DM's act, never self-service.

The screen's existing rule holds for all three: nothing gets a panel that nothing serves. The
artboard's attendance, challenge-run and backup columns stayed out for exactly that reason, and
these three go in only because this plan builds the routes underneath them.

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

**CORS is already answered, and it answers the wrong thing for us.** `server.ts` sets
`access-control-allow-headers: accept, content-type` on the preflight it answers for every path.
`authorization` is not on that list and is not safelisted, so the browser refuses every guarded
request the moment the gateway starts sending the header — and it refuses *before* the request is
made, which reads as the API being down rather than as a missing header name. Add `authorization`
there in Phase 1, in the same commit as the gateway change, and watch the failing case once first.

**The filter is the refusal, not the acceptance.** A guard that lets the right token through is
easy and proves little; the tests that matter hand it no token, a malformed one, an expired one,
and one belonging to a different player, and require a refusal each time. Seed the mutants that
decide it: return the player before checking the token, accept an expired token, compare the hash
with `==` rather than a verifier, let the bootstrap secret be spent twice, and let a credential
survive `resetHousehold`.

## Dependencies / Prerequisites

- **None blocking.** The schema, the API and the SPA all exist, and the stack has been run end to
  end — `planning/completed/feature_the-stack-runs-end-to-end_2026-08-31.md`
- **The seeded household has landed** —
  `planning/completed/feature_seed-a-test-household_2026-08-31.md`, 2026-08-31. It is a
  prerequisite met rather than a dependency pending, and it is what makes the bootstrap's awkward
  case testable instead of hypothetical
- **The Journal work should land first, and two documents already say so.**
  `planning/backlog/feature_journal-text-has-no-column_2026-08-29.md` and the ruling in
  `planning/reminders/completed/decide_where-the-journal-actually-lives_2026-08-31.md` record the
  same constraint from both ends: the Journal needs `packages/db/**`, `endpoints.ts` and
  `apps/api/src/**`, it is clear of everything in `in-progress/` today, and it stops being clear
  the moment this gate opens. It is half a day to a day of work. **Let it go first**
- `planning/backlog/feature_spa-player-id-is-not-a-uuid_2026-08-31.md` closes when Phase 1 lands
  `GET /api/me` and deletes `household.ts`

## Files Expected to Change

- `pyquest/packages/db/migrations/0006-*.sql` — credentials, the token store, the bootstrap secret
- `pyquest/packages/db/src/repository.ts`, `src/index.ts` — create and verify a credential
- `pyquest/packages/db/src/seed.ts` — `HOUSEHOLD_TABLES` and the reset, only as far as the cascade
  requires. **No credentials are seeded**
- `pyquest/packages/db/tests/**` — the schema, repository and seed tests
- `pyquest/apps/api/src/**` — `POST /api/session`, `GET /api/me`, the guard, the account routes,
  and `authorization` on the preflight's allowed headers
- `pyquest/apps/api/tests/**` — four suites gain a token helper; `fixtures-agree.test.ts` watched
- `pyquest/packages/contract/src/endpoints.ts` — the session, `me` and account shapes.
  **`api`'s file**
- `pyquest/apps/web/src/gateway/index.ts` — the header, and the last readers of the constants
- `pyquest/apps/web/src/household.ts` — **deleted**
- `pyquest/apps/web/src/fixtures/index.ts` — whatever the constants' removal reaches
- `pyquest/apps/web/src/screens/**` — sign-in, and the Console's second panel
- `content/` — nothing. Accounts are not content

## Track discipline

**A gate, not a parallel track.** It touches `db`, `api` and `spa` at once, which no single track
may own — so it runs alone, and the reason is not bookkeeping: adding a guard to every route
while another track adds routes is how a route ships unguarded.

Two things to settle before it starts:

- **`spa` is in-progress** (`feature_spa_2026-08-28-v2.md`) and owns
  `apps/web/src/gateway/index.ts`, `src/fixtures/**` and `src/screens/**` — all of which this plan
  edits. Its remaining blocker is now **the Journal's text**, a `JournalEntrySchema` correction
  and a Gitea read path. It is no longer the API and no longer the laptop: the laptop check
  cleared 2026-08-31, and the Console came off that line the same day. That plan either closes or
  explicitly yields those paths before this starts.
- **The working tree is not `main`.** `household.ts` and four modified files are the `spa` track's
  uncommitted player-id fix. They land, or they are abandoned, before this gate opens. A gate that
  starts on top of somebody else's uncommitted work cannot afterwards say what it changed.

## Out of Scope

- **Self-service registration and DM approval.** Deferred to real OAuth, if this becomes an
  institutional tool. A household does not need to ask permission to sit at its own table.
- **Email anything.** No address is collected, so no reset link can be sent — which is why reset
  is the DM's act at the Console.
- **TLS.** Argued above. Revisit with the threat model, not on its own.
- **Multi-household, and the modes beyond Kitchen Table.**
  `planning/backlog/feature_roles-modes-and-the-dm-seat_2026-08-28.md` owns those. This plan
  authenticates the two seats that mode already has and adds no third concept to hold them.

## Anticipated Backlog

- **Token lifetime and what expiry feels like.** An hour is safe and a session is 45–60 minutes,
  so a badly chosen number logs him out mid-quest. Needs a decision informed by an actual
  session rather than a default
- **Whether Gitea should share the account.** §6.5 gives him a Gitea login already, and two
  passwords for one household is the kind of friction that ends with both written on paper
- **The seed's stale pointer.** `packages/db/src/seed.ts:8` names this plan at `planning/backlog/…`,
  a path it has never had. One line, and it belongs to whichever plan next opens that file rather
  than to a commit of its own
