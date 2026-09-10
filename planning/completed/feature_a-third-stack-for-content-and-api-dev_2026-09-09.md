---
kind: plan
status: completed
track: dev-stack
date: 2026-09-09
completed: 2026-09-10
---

# A third stack, for content and API development

**Status:** Complete
**Track:** dev-stack
**Date:** 2026-09-09
**Author:** Claude (Opus 5)
**Lane:** A

## Objective

A way to run the SPA against **real content and a real API** where a change to either shows
up in a browser refresh, without rebuilding an image.

## Why this exists

There are two ways to run the SPA today and neither is right for authoring.

**Prod.** Everything containerized — `pyquest-web` on :3082 serving a built bundle,
`pyquest-api` on :3081 from `pyquest-api:local`. This is the son's. A content change reaches
it only after the api container is restarted, and an API change only after the image is
rebuilt.

**App dev.** `npm run dev`, and the gateway answers from `apps/web/src/fixtures`. Hermetic,
offline, and the right default — but the fixtures are *deliberately* sparse. The Tome fixture
carries three areas and seven concepts against the real 95, omits identity for two areas, and
leaves `iteration` undefined on purpose so the empty state is visible offline. Its own comment
says why. **Nothing is wrong with it and nothing about content can be judged from it**, which
is what prompted this plan: a Tome showing "2 concepts" reads as a catastrophe and is a stub
behaving correctly.

Neither serves the question *"I changed a brief — does it look right?"*

## The shape, and why one stack covers both

The first framing of this was "a content-dev mode that reuses the API image". That is wrong,
and the reason is worth keeping: **`api.yml` builds `pyquest-api:local` from source**, so an
API change would need an image rebuild — which is the pain this plan removes from content,
reintroduced one layer down.

Run the API **from source on the host** instead, and content dev and API dev become the same
stack:

| | serves the SPA | serves the API | content comes from |
|---|---|---|---|
| **prod** | `pyquest-web` image, :3082 | `pyquest-api` image, :3081 | bind mount, reloaded on container restart |
| **app dev** | vite :5173 | nothing — fixtures | nothing |
| **dev stack** | vite :5173, `VITE_API_LIVE=true` | **`npm start`, from source, :3083** | the repository, directly |

A content edit and an API edit then reload by the same gesture, and neither is a build.

### Production stays up, and that decides the ports

**The dev stack takes its own port. It does not borrow 3081.** An earlier draft of this plan
proposed stopping the api container and letting the host process take its place — "the port
is the switch". That is wrong. §6.4 puts the api on this machine and the son's code on his,
`web` is bound on all interfaces because it is his front door, and **production ports stay up
and bound to the images**. A dev stack that requires taking production down is a dev stack
nobody runs on a weeknight.

So: **api-dev on `3083`**, `127.0.0.1` only, continuing the 3080–3082 block the port table
already documents and for the same reason the api has — nothing off this machine dials it.

That makes one thing in the SPA a real change rather than a configuration: **the vite proxy
hardcodes `http://localhost:3081`**. It has to become overridable, defaulting to the dev port,
so that pointing dev at production is a deliberate act rather than the default.

### The dev stack needs its own database

The part that would actually hurt, and the reason this is not simply "another port".

Signing in **writes** — a token row per session — and clicking around writes attempts, medals
and journal entries. A dev api pointed at the production database does content review by
mutating the son's progress. Content lives in git and progress lives in Postgres (§6.7), and
this is the seam where a dev tool would cross it.

Cheapest answer that holds: **a second database on the existing Postgres instance**, not a
second container. `pyquest_dev` beside the real one, on the same 5433, migrated the same way
`migrate.yml` migrates the first. Seeding it with `seedHousehold` gives a household to click
through that nobody is graded on.

## What already works, proven 2026-09-09

Not assumed — measured, because most of this plan is discovering the plumbing is present.

- **Content is already bind-mounted live**, read-only: `../../curriculum:/content/curriculum`
  and `../../game:/content/game`. Content changes need no image rebuild, only a reload.
- **Reload is cheap.** `docker compose restart api` took about fourteen seconds and logged
  `content loaded, items: 30, areas: 8` — every Area 3 item, from a container image built days
  before that content existed.
- **The vite proxy exists and reaches the API.** `VITE_API_LIVE=true npx vite` then
  `GET http://127.0.0.1:5173/api/tome` returns **401**, not a connection error: the request
  crossed the proxy and the API declined it for want of a token. The proxy's own comment
  anticipated this — *"sits unused until someone deliberately points dev at a running stack."*

So the remaining work is a documented way in, one open question, and a decision about how
content reloads.

## The open question, closed — 2026-09-09

**Where the host API gets `DATABASE_URL`: `infra/.env`, which already exists.**

This was written up as unresolved after looking in `infra/compose/` and the repository root
and finding nothing. Both were the wrong place. `infra/docker-compose.yml` is the top-level
file — it `include:`s the three fragments under `compose/` — so **`infra/` is the Compose
project directory**, and `infra/.env` is where Compose reads variables from naturally. It is
gitignored, `infra/.env.example` is the tracked template beside it, and it already carries
`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` and `POSTGRES_PORT`.

So there is no new mechanism to invent. A host process sources the same file Compose does.

**Two keys were added to both, and neither is a secret:**

```
DEV_API_PORT=3083
DEV_POSTGRES_DB=pyquest_dev
```

`.env.example` carries them with the reasoning — why the dev api gets its own port rather
than borrowing production's, and why a third database is not tidiness but the thing standing
between a content review and the learner's real progress.

`DATABASE_URL` for the dev api is then composed the way `api.yml` composes production's,
with two substitutions: `127.0.0.1:${POSTGRES_PORT}` instead of the compose-network host, and
`${DEV_POSTGRES_DB}` instead of `${POSTGRES_DB}`.

## Success criteria

- [x] One documented command brings up the dev stack, and one line says what it is for
- [x] A change to a brief or a lesson is visible in the browser **without an image rebuild**,
      and the plan states the exact gesture and how long it takes
- [x] A change to API source is visible the same way
- [x] `npm run dev` still answers from fixtures with no stack running. **The default does not
      move** — it is correct, it is hermetic, and `vitest --project web` depends on it
- [x] **Production keeps running throughout.** `pyquest-web` on 3082 and `pyquest-api` on
      3081 stay up and bound; the dev stack never asks for either port and never stops a
      container. Bringing dev up while the son is mid-practice must be a non-event
- [x] The dev api runs on **3083**, `127.0.0.1` only, and the port table records it
- [x] **The dev api writes to its own database.** No dev sign-in, attempt or journal entry
      appears in the production one, and the plan says how that is verified rather than
      assumed
- [x] `DATABASE_URL` for a host process is answered — `infra/.env`, which Compose already
      reads because `infra/` is the project directory. No secret committed

## Approach

**1. A script, not a paragraph.** `infra/dev-stack.sh` or an npm script that starts the api
from source on **3083**, against `pyquest_dev`, with `CONTENT_ROOT` pointing at the
repository. It stops nothing and takes no production port. It should refuse with a clear
message if 3083 is held, and it should say out loud which database it is about to write to —
the one mistake worth making impossible is running it against production data.

Creating and migrating `pyquest_dev` is part of this: `migrate.yml` already knows how to
migrate a database, so the work is pointing it at a second one rather than inventing a path.

**1a. The proxy target becomes configurable.** `apps/web/vite.config.ts` hardcodes
`http://localhost:3081`. It defaults to 3083 — the dev api — so that reaching production from
a dev browser takes a deliberate override rather than being what happens by accident.

**2. Decide how content reloads, and say so.** Three options, cheapest first:

- **Restart the process.** Honest and already true; a few seconds from source. Costs nothing
  to implement and the plan can stop here.
- **A reload endpoint** — `POST /api/content/reload`, dev-only, re-running `loadContentRoot`.
  Fast, and it puts a route in the API that exists only for authors.
- **Watch the content root** and reload on change. The real "edit a brief, refresh the
  browser" loop, and the most work: `loadContentRoot` validates, so a save mid-edit produces
  invalid content and the watcher has to hold the last good tree rather than serve nothing.

Recommend the first, and record the other two rather than build them. The gesture being
*"restart the thing you were already restarting"* is not much worse than a watcher, and a
watcher that serves stale-or-broken content during an edit would be worse than both.

**3. Write the three modes down.** `infra/README.md` gains a short table: what each mode is
for, how to start it, and what it lies about. The fixture Tome reading as a catastrophe is
exactly what that table prevents.

## Files expected to change

- `infra/dev-stack.sh` (or `pyquest/package.json` script) — new
- `infra/README.md` — the three modes, and **3083 added to the port table**
- `apps/web/vite.config.ts` — the proxy target, overridable, defaulting to the dev port
- `pyquest/apps/api/main.ts`'s header — how to run it from source, and against which database
- whatever creates and migrates `pyquest_dev`

**Not changed:** `apps/web/src/fixtures/**`, the vitest alias, `api.yml`, and the prod compose
stack. **Nothing in this plan stops, rebuilds or re-ports a production container.**

## Out of scope

Making the fixtures richer. They are sparse on purpose and this plan is the alternative to
that, not a step toward it.

The stale-`dist` problem — that is
`the-build-and-the-tests-see-the-same-code_2026-09-09`, and it bites this plan (a host API
imports `@pyquest/*` and `npm start` already runs `tsc -b ../..` first, which is the right
instinct and the reason that plan exists).

## Status — 2026-09-10, complete

**Every success criterion is met and each one was verified rather than reasoned about.**
Full output in `planning/evidence/dev-stack-VERIFICATION.txt`.

Production was up throughout — 3081, 3082 and 5433 checked at the start, after every restart
and at the end. Nothing was stopped, rebuilt or re-ported, and a vite dev server the user had
already left running on 5173 was not touched either: every SPA check ran on a scratch port.

### What was built

| | |
|---|---|
| `infra/dev-stack.sh` | the script — env, three refusals, create, migrate, optional seed, then the api from source |
| `apps/web/vite.config.ts` | the proxy target: overridable, **defaulting to 3083** |
| `apps/web/.env.live` + `dev:live` | the deliberate act that turns fixtures off |
| `apps/api/src/main.ts` | `API_HOST`, and a header saying how to run it from source and against which database |
| `infra/README.md` | the three-mode table, the reload table, and 3083 in the port table |

`infra/.env` and `.env.example` were **not** touched — `DEV_API_PORT` and `DEV_POSTGRES_DB`
were already there, as the plan said.

### The two things the plan did not anticipate

**1. `apps/api` hardcoded `host: '0.0.0.0'`, so "127.0.0.1 only" was not configuration.** The
first run bound three interfaces and printed three listening lines. `API_HOST` now defaults to
`0.0.0.0`, so `compose/api.yml` needs nothing added — the container's loopback is invisible
from the host (§6.1) and that default is right there. On this host there is no such
indirection, and binding every interface would have put an api with no Gitea token and a
throwaway database on the LAN beside the real one.

**2. "Restart the process" is right, and coarser than the truth.** `apps/api/src/content.ts`
returns `items`, `manifests` and `practices` as values built once at boot — but `read` and
`howTo` as *functions* that `readFileSync` on every call. So:

| change | gesture |
|---|---|
| a brief, a lesson, a how-to page | **refresh the browser. No restart.** |
| `area.yml`, a quest's YAML, adding an exercise | restart — about 4 seconds |
| API source | restart — same 4 seconds |

Measured both ways: a marker appended to `curriculum/how-to/how-to-learn.md` appeared in
`/api/how-to` with no restart, and `estimatedQuests: 10 -> 99` in `curriculum/area-0/area.yml`
did **not** move `progress.total` until the process came back. Both edits were reverted
immediately and each file verified byte-identical by md5; `git diff HEAD -- curriculum/ game/`
is empty.

**This is better news than the plan expected.** The common case — writing the prose a learner
reads — is already the "edit a brief, refresh the browser" loop the watcher option was going
to be built for, and it has been all along. The recommendation to build neither the reload
endpoint nor the watcher therefore stands more firmly than when it was written: a watcher
would have been work to reproduce something the lazy reads already do, and it would have had
to serve the last good tree mid-save while doing it.

### The refusals, seen to fire

The script's safety is three refusals, and none of them is attestation — `infra/.env` was
backed up, doctored three ways and restored, with md5 checked before and after.

- `DEV_POSTGRES_DB == POSTGRES_DB` → refuses, exit 1, and names §6.7 in the message
- `DEV_API_PORT` is one of production's → refuses, exit 1
- 3083 already held → refuses, exit 1, **prints the holder and declines to kill it** — in the
  308x block the likeliest holder is production

### The isolation criterion, asserted both directions

A full bootstrap sign-in — the heaviest write there is, creating a player, a credential and a
token in one request:

```
BEFORE  prod: api_tokens=5 credentials=1 attempts=8 medals=26 players=2
BEFORE   dev: api_tokens=0 credentials=0 attempts=6 medals=27 players=2
AFTER   prod: api_tokens=5 credentials=1 attempts=8 medals=26 players=2   <-- byte-identical
AFTER    dev: api_tokens=1 credentials=1 attempts=6 medals=27 players=3   <-- it landed here
```

The second line is not decoration. A sign-in that silently failed would also have left
production untouched and proved nothing.

### The default did not move

`npx vitest run --project web`: 394 passed. And the decisive check is what vite serves the
browser — in `--mode live` it injects `"VITE_API_LIVE":"true"` above the gateway module; in
mode `development` that line is **absent entirely**, with a live api reachable on 3083 at the
time. The switch is the mode, not the stack. `apps/web/Dockerfile` still sets
`ENV VITE_API_LIVE=true`, so the production image is untouched.

### Decisions taken, and why

**The proxy defaults to 3083, not 3081.** The old hardcoded `http://localhost:3081` was not
merely inflexible, it was the wrong default: a dev SPA pointed there signs in against the
learner's real database. Reaching production is now `PYQUEST_API_TARGET=http://127.0.0.1:3081`,
a deliberate act.

**`--mode live` rather than an environment variable**, because Windows has no `VAR=x cmd`
prefix and this repository is used from both Git Bash and PowerShell. A shell-specific
incantation in `package.json` would work in one and fail in the other.

**Migrated from the host, not through `compose/migrate.yml`.** The plan suggested pointing
that fragment at a second name. It cannot be the whole answer: `migrate.yml` is a container
that must be *built* before it runs, and it cannot create a database — only migrate one that
exists. The script is a host-process stack already, and `npm run migrate --workspace
@pyquest/db` is the same migrator reading the same `DATABASE_URL`. Routing half of it through
Docker would add an image build to a script whose entire point is not needing one. No new
mechanism was invented; the existing one was chosen differently than the plan guessed.

**Two terminals, not one.** The api is the half you restart; the vite server is the half you
leave alone, because it is holding the page you are looking at. A single script managing both
would also have to manage killing npm's child processes on Windows, which is where that kind
of script goes wrong.

### What the dev stack lies about, written down rather than discovered later

**Submissions.** The dev api's spool is a host directory under `infra/logs/`, and the runner
container cannot see it — it has no network at all (§6.6) and reaches the api only through a
Docker volume. A submission made against the dev stack queues and is never picked up. Sharing
the production spool instead would put dev jobs in the learner's queue, which is worse. It is
in the README's three-mode table under "what it lies about", beside the fixtures' sparseness.

### Found, not fixed, and it belongs to somebody else

**The production database is one migration behind.** `pyquest` has 6 rows in
`schema_migrations`; `pyquest_dev`, migrated today from the same directory, applied 7. The
missing one is `0007-practice-progress.sql`, from the practice spine on 2026-09-06.

Not applied. Migrating the learner's live database silently, overnight, unasked, is precisely
the class of act the dev-database refusal above exists to prevent, and the plan that owns it
is `practice-spine`. One command when somebody decides to:

```sh
cd infra && docker compose --profile migrate run --rm migrate
```

**Owner: the `practice-spine` track.**

## Addendum — 2026-09-10, `--with-spa`

Asked for after the plan closed: one command rather than two. Added as a flag rather than as a
change of default, because the two-terminal shape is still the better one for a long session —
every api restart under `--with-spa` bounces vite too, and vite is the half holding the page you
are looking at. The script's header now argues both and says which session wants which.

The only hard part is stopping. `npm run X` is not the process holding the port — it spawns node,
through `cmd.exe` on Windows — so signalling the pid bash knows about leaves the real listener
orphaned on 3083 or 5173, and the next run hits the port check and refuses. The trap therefore
kills the process **tree**, found by port. That is safe here for one reason, and only for that
reason: the checks above refuse to start unless both ports are free, so anything listening on them
afterwards is this script's own child. Without that ordering it would be a script that kills
strangers, and the comment in the file says so.

Verified: both up from one command (api 200, SPA 200, Tome through the proxy 8 areas / 95
concepts); both down on signal, with production still 200 on 3081 and 3082; `--with-spa
--migrate-only` refused as contradictory, exit 2; and the port check refused on 3083 while a
previous dev api still held it.

**One thing could not be verified from here, and it is worth writing down.** The `Ctrl-C` path
specifically — SIGINT — could not be exercised, because a job started in the background from a
non-interactive shell inherits SIGINT set to *ignore*, and bash will not let a trap override an
inherited ignore. Sending SIGINT to the script did nothing at all; SIGTERM and the EXIT trap both
ran correctly and stopped both children. An interactive terminal delivers SIGINT normally, so
Ctrl-C is expected to work — but that is inference from how bash documents the behavior, not a
measurement, and it is the one claim in this addendum that has not been seen to happen.
