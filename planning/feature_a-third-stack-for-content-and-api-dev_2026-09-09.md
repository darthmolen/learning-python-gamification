---
kind: plan
status: queued
track: dev-stack
date: 2026-09-09
---

# A third stack, for content and API development

**Status:** Planned
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

## The open question

**Where the host API gets `DATABASE_URL`.** `api.yml` composes it from `${POSTGRES_USER}`,
`${POSTGRES_PASSWORD}` and `${POSTGRES_DB}`, and there is no `.env` beside the compose files
and no wrapper naming one — the running containers were configured when the stack first came
up, and `docker compose restart` reuses that rather than re-rendering it. The root `.env`
holds Gitea and DM credentials only, in lower case, so compose substitution would not see
them.

Postgres is reachable from the host on `127.0.0.1:5433`, so the connection is available; what
is missing is a sanctioned way for a host process to learn the credentials. Settle this before
writing the script, and settle it without putting secrets in a tracked file.

## Success criteria

- [ ] One documented command brings up the dev stack, and one line says what it is for
- [ ] A change to a brief or a lesson is visible in the browser **without an image rebuild**,
      and the plan states the exact gesture and how long it takes
- [ ] A change to API source is visible the same way
- [ ] `npm run dev` still answers from fixtures with no stack running. **The default does not
      move** — it is correct, it is hermetic, and `vitest --project web` depends on it
- [ ] **Production keeps running throughout.** `pyquest-web` on 3082 and `pyquest-api` on
      3081 stay up and bound; the dev stack never asks for either port and never stops a
      container. Bringing dev up while the son is mid-practice must be a non-event
- [ ] The dev api runs on **3083**, `127.0.0.1` only, and the port table records it
- [ ] **The dev api writes to its own database.** No dev sign-in, attempt or journal entry
      appears in the production one, and the plan says how that is verified rather than
      assumed
- [ ] `DATABASE_URL` for a host process is answered, and no secret is committed

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
