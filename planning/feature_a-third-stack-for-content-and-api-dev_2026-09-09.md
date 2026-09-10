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
| **dev stack** | vite :5173, `VITE_API_LIVE=true` | **`npm start`, from source**, :3081 | the repository, directly |

A content edit and an API edit then reload by the same gesture, and neither is a build.

**The port is the switch.** Both the container and a host process want :3081, and
`apps/web/vite.config.ts` already proxies `/api` there. So `docker compose stop api`, start
the host one, and nothing else in the stack or the SPA changes. Postgres, Gitea and the
runner keep running as they are.

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
- [ ] Prod is untouched: `pyquest-web` and the `pyquest-api` image behave exactly as now
- [ ] The port collision is documented rather than discovered — starting the host API with the
      container API still up must fail in a way that says so
- [ ] `DATABASE_URL` for a host process is answered, and no secret is committed

## Approach

**1. A script, not a paragraph.** `infra/dev-stack.sh` or an npm script: stop the container
api, export the environment the host api needs, start it from source on :3081. It should
refuse with a clear message if :3081 is held.

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
- `infra/README.md` — the three modes, and the port switch
- `pyquest/apps/api/README.md` if one exists, or `main.ts`'s header — how to run it from source
- Possibly `apps/web/vite.config.ts`, only if the proxy target needs to become configurable

**Not changed:** `apps/web/src/fixtures/**`, the vitest alias, `api.yml`, and the prod
compose stack.

## Out of scope

Making the fixtures richer. They are sparse on purpose and this plan is the alternative to
that, not a step toward it.

The stale-`dist` problem — that is
`the-build-and-the-tests-see-the-same-code_2026-09-09`, and it bites this plan (a host API
imports `@pyquest/*` and `npm start` already runs `tsc -b ../..` first, which is the right
instinct and the reason that plan exists).
