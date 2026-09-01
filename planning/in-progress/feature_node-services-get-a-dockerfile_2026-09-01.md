# The node services get a Dockerfile, and the stack gets one command

**Status:** In Progress
**Version:** v2 — revised 2026-09-01 after review. Six points accepted, one merged, none rejected,
and one flagged question answered by the DM. The review changed the design: see *What v1 got wrong*
**Track:** `infra`
**Date:** 2026-09-01
**Author:** Claude (Opus 5)
**Lane:** A
**Promoted from:** `planning/backlog/feature_compose-services-cannot-start-on-windows_2026-08-29.md`,
filed 2026-08-29 and diagnosed inline in `api.yml` ever since
**Signed off:** the `spa` track owns `pyquest/apps/web/**` and this plan adds a Dockerfile there.
**The DM signed off explicitly on 2026-09-01**, which is what the review required and what the
one-plan-per-track rule needs to be satisfied rather than assumed

## Objective

Make `api`, `web` and `migrate` start on this machine, and give the household one command to run
the stack and one to push a change into it.

## Why this is one plan and not three

**The bug is a single decision made once and inherited three times.** When the compose fragments
were split, none of the three services had code yet, so each took the same shape: a stock Node
image, the workspace mounted, an `npm run --workspace` command. That was reasonable then and it is
the whole of the fault.

`npm install` on Windows writes `pyquest/node_modules/@pyquest/*` as symlinks to **absolute
Docker-VM paths** (`/mnt/host/c/dev/.../packages/content`). They resolve on the host and inside the
VM, and not inside a container that mounts only `/workspace` — so `import '@pyquest/contract'`
fails with `ERR_MODULE_NOT_FOUND` before the api reads a line of its own code.

## What v1 got wrong, and the review caught

**v1 said "modelled on `apps/runner`… mount source only, and the image's `node_modules` is what
resolves." `apps/runner` does the opposite, and that sentence cannot work.**

- `apps/runner/Dockerfile` **`COPY`s** `src/`, `tests/` and `pyproject.toml` into the image. Its
  only volume is `runner_spool:/spool`. It mounts no source at all.
- A bind mount of `../../pyquest:/workspace` *replaces* `/workspace` wholesale. Anything the image
  built at `/workspace/node_modules` is masked by the host's — the broken-symlink one. Same
  failure, three new Dockerfiles to show for it.
- v1 also forbade a `node_modules` volume in its own success criteria, so as written it required a
  mount, forbade the mask, and had no third option.

**The fix is to follow the control properly: `COPY` the source in, mount nothing.** Rebuild and
recreate becomes the loop — which is exactly the push-and-bounce loop that was asked for.

## The decision the review flagged, and the DM's answer

**`web` serves a production build, not a dev server.**

`web.yml` runs `npm run dev` today. With source copied rather than mounted, a dev server would need
an image rebuild per keystroke, which is pointless. The ruling, in the DM's words: *always move it a
little down the road; let's not invent stuff that we throw away later.*

So the container becomes **what the son's laptop actually hits over the LAN** (§6.4) — `vite build`
output served statically — rather than a development convenience that gets deleted the first time
anybody needs the real thing. Development stays on the host with `npm run dev`, which is where it
already happens.

**One consequence, and it is the reason this needed a decision rather than a default:**
`VITE_API_URL` is read at *build* time by Vite, not at run time. It becomes a build arg, so the
api's address is baked into the image and changing it means a rebuild. That is honest for a
household with one api on one desk, and it is the trade the alternative was hiding.

## Success Criteria

- [ ] `api`, `web` and `migrate` each build from a Dockerfile that installs **and copies source**
      inside the image
- [ ] All three **start and stay up** on this Windows host — the failure this was filed for
- [ ] **No service bind-mounts the workspace**, and no `node_modules` volume exists. Both were
      routes back to the same bug
- [ ] `infra/smoke.sh` asserts `api` reaches healthy on `GET /health` — the route at
      `server.ts:370`, which touches no database and so stays true while Postgres restarts
- [ ] `infra/start-full.cmd` brings the stack up in one command, **exits non-zero** if `.env` is
      missing, if the migration job fails, or if a service does not reach healthy
- [ ] `infra/bounce.cmd <profile>` rebuilds that profile's images and recreates **only its own
      services**, named explicitly — see the mapping below
- [ ] From `pyquest/`: `npm test`, `npm run typecheck`, `npm run validate:content` and
      `npm run build --workspace @pyquest/web` all clean

## Approach

### One Dockerfile shape, three services

Modelled on `apps/runner/Dockerfile` — accurately this time:

- **`npm ci` at build time**, against the workspace lockfile, so `node_modules` is Linux-resolved
  and owned by the image.
- **`COPY` the source in. Mount nothing.** No bind mount can then mask what the image built.
- **Layer order matters:** manifests and lockfile first, `npm ci`, then source. A source edit must
  not reinstall dependencies, and if it does the layer order is wrong rather than the approach.
- **Pin by tag and digest**, as every image in `infra/` already does. A 48-week campaign and a
  floating tag that drifts mid-campaign is a real failure mode here, not a hypothetical.

`migrate` is a job (`restart: "no"`) and needs no healthcheck. `api` gets one on `/health`. `web`
gets one on `/`, since a static server has no health route and serving the index *is* its health.

### The profile → service mapping, stated because compose cannot infer it

`docker compose --profile api up` starts profile-matching services **plus every unprofiled one** —
so postgres and gitea come up too, and `--no-deps` does not prevent it because they are not
dependencies, merely unprofiled. Bouncing therefore names its services:

```text
api      → api runner
web      → web
migrate  → migrate
```

`--no-deps` still earns its place: bouncing the api must not restart Postgres underneath it, which
would take the database down to reload a route handler.

### `start-full.cmd`

Preflight `infra/.env` and fail loudly if it is absent. Bring up postgres and gitea, wait for
healthy, run the migration job to completion and **stop if it fails**, then bring up api, web and
runner and poll until each is healthy. Print each service and its port.

**It must not return 0 while a container is crash-looping**, which is the failure `smoke.sh` was
written against and the reason `up -d` alone is not enough.

### Not CI/CD, deliberately

`.github/workflows/build.yml` typechecks, validates content and builds the SPA. It pushes no image
anywhere and there is nowhere to push one: §6.4 puts the api on the parent's machine, so "deploy"
here means the container on this desk restarts. A registry would be inventing something to throw
away.

## Phases

### Phase 1 — `migrate`, proved

Smallest first: a job rather than a long-running service, and `smoke.sh` step 4b already asserts its
success condition. If the Dockerfile shape is wrong, this is where it costs least to find out.

**Done when** `docker compose --profile migrate run --rm migrate` applies the schema on this host
and is a no-op the second time.

### Phase 2 — `api` and `web`, and the health assertion

Same shape. `web` gains its `vite build` and a static server, with `VITE_API_URL` as a build arg.
`smoke.sh` gains the assertion on `api`'s `/health`.

**Verify no new env is required.** `WEB_PORT`, `API_PORT`, `VITE_API_URL` and `CONTENT_ROOT` are
handled in the fragments today and named in none of `.env.example`. If the web build arg changes
that, `.env.example` joins the file list.

### Phase 3 — the two scripts

Written last, so they script something that already works rather than being the thing under test.

## Dependencies / Prerequisites

- **None blocking.**
- **The `spa` track signoff is given** (header). That track is mid-flight on `apps/web/src/**`;
  this plan touches `apps/web/Dockerfile` and `apps/web/.dockerignore` only, and **nothing under
  `src/`**.

## Files Expected to Change

- `pyquest/apps/api/Dockerfile` — **new**
- `pyquest/apps/web/Dockerfile` — **new**, signed off by the `spa` track
- `pyquest/packages/db/Dockerfile` — **new**, for the migration job
- `pyquest/.dockerignore` — **new**, so `node_modules` and `dist` never enter a build context
- `infra/compose/api.yml`, `web.yml`, `migrate.yml` — `build:` in place of `image:`, the workspace
  mount removed, healthchecks added
- `infra/smoke.sh` — the `/health` assertion
- `infra/start-full.cmd`, `infra/bounce.cmd` — **new**
- `infra/README.md` — how to run it
- `pyquest/apps/web/src/**` — **nothing.** The `spa` track owns it and is mid-flight there

## Out of Scope

- **Anything that pushes an image off this machine.** No registry, no second host.
- **Running the api suite in CI.** It needs a live Postgres, which is why `build.yml` does not run
  it. Worth doing and not here.
- **Hot reload inside a container.** Development happens on the host; the container serves a build.

## Anticipated Backlog

- **`build.yml` runs no tests at all.** It typechecks, validates content and builds the SPA, and
  849 tests do not run because they want a database. A compose-backed CI job is the obvious fix and
  a bigger decision than this plan.
- **`VITE_API_URL` is baked at build time.** The day the api moves — a different port, his laptop
  reaching it by LAN address — the web image needs rebuilding rather than restarting. Worth a line
  in `infra/README.md` and worth revisiting if it ever bites twice.
