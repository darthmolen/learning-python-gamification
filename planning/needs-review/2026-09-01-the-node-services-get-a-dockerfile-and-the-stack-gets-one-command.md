# The node services get a Dockerfile, and the stack gets one command

**Status:** Planned — queued for review before execution
**Track:** `infra`
**Date:** 2026-09-01
**Author:** Claude (Opus 5)
**Lane:** A
**Promoted from:** `planning/backlog/feature_compose-services-cannot-start-on-windows_2026-08-29.md`,
filed 2026-08-29 and diagnosed inline in `api.yml` ever since
**Queued rather than started:** the `spa` track restarted the same afternoon and holds
`apps/web/**`. Nothing here touches those files, but a plan that adds a build step to the service
that serves them should be argued with first

## Objective

Make `api`, `web` and `migrate` start on this machine, and give the household one command to run
the stack and one to push a change into it.

## Why this is one plan and not three

**The bug is a single decision made once and inherited three times.** When the compose fragments
were split, none of the three services had code yet, so each took the same shape: a stock Node
image, the workspace mounted, an `npm run --workspace` command. That was the right call at the
time and it is the whole of the fault.

`npm install` on Windows writes `pyquest/node_modules/@pyquest/*` as symlinks to **absolute
Docker-VM paths** (`/mnt/host/c/dev/.../packages/content`). They resolve on the host and inside
the VM, and not inside a container that mounts only `/workspace` — so `import '@pyquest/contract'`
fails with `ERR_MODULE_NOT_FOUND` before the api reads a line of its own code.

`apps/runner` is the control: it has a real Dockerfile, installs inside the image, and works. The
fix is that shape, three more times.

## Success Criteria

- [ ] `api`, `web` and `migrate` each build from a Dockerfile that installs inside the image
- [ ] All three **start and stay up** on this Windows host — the failure this was filed for
- [ ] `infra/smoke.sh` asserts one of the three reaches healthy. It asserts postgres and gitea
      today, which are precisely the two services that never had this problem
- [ ] `infra/start-full.cmd` brings the stack up in one command and prints what is running and
      on which port
- [ ] `infra/bounce.cmd <profile>` rebuilds that profile's images and force-recreates **only**
      that profile
- [ ] The workspace mount stays **source-only**. No container-local `node_modules` volume
      shadowing the host's
- [ ] `npm test`, `npm run typecheck` and `validate:content` unaffected and clean

## Approach

### One Dockerfile shape, three services

Modelled on `apps/runner/Dockerfile`, which is in this repository and works:

- **Install inside the image.** `npm ci` at build time, against the workspace's own lockfile, so
  `node_modules` is Linux-resolved and owned by the image rather than by whatever the host wrote.
- **Mount source only.** The compose mount keeps `../../pyquest:/workspace` for the *code*, and
  the image's `node_modules` is what resolves. Editing a file on the host still changes what the
  container runs, which is the property the mount exists for.
- **Pin by tag and digest**, as every image in `infra/` already does. §48 weeks: a floating tag
  that drifts mid-campaign is a real failure mode for this project, not a hypothetical one.

`migrate` is a job (`restart: "no"`) rather than a service and needs no healthcheck; `api` and
`web` get one, because `smoke.sh` asserts on health rather than on "the container exists".

### Why not a `node_modules` volume

It works and it is worse, and the original item said so: it is invisible, it goes stale silently,
and the first person to debug it will not know it exists. A Dockerfile is a file somebody can
read; an anonymous volume shadowing a mounted directory is a fact about a machine.

### `start-full.cmd`

One command, and **it must not lie about what is running.** Bring up postgres and gitea, run the
migration job to completion, then bring up api, web and runner; print each port. A script that
returns 0 while a container is crash-looping is the thing `smoke.sh` was written against.

`.cmd` because it is asked for and because the household is on Windows. It shells out to
`docker compose`, so the logic stays in compose rather than in batch.

### `bounce.cmd <profile>` — the local push-and-bounce loop

```
docker compose --profile <p> build     # rebuild that profile's images
docker compose --profile <p> up -d --force-recreate --no-deps <services>
```

`--no-deps` is the point: bouncing the api must not restart Postgres underneath it, which would
take the database down to reload a route handler. A dependency is a thing to wait for at start,
not a thing to recycle on every edit.

**This is a local loop and deliberately not CI/CD.** `.github/workflows/build.yml` typechecks,
validates content and builds the SPA; it pushes no image anywhere and there is nowhere to push
one. §6.4 puts the api on the parent's machine, so "deploy" here means "the container on this
desk restarts", and pretending otherwise would buy a registry nobody needs.

## Phases

### Phase 1 — one service, proved

`migrate` first, because it is the smallest, it is a job rather than a long-running service, and
its success condition is already asserted by `smoke.sh` step 4b. If the Dockerfile shape is
wrong, this is where it costs least to find out.

**Done when** `docker compose --profile migrate run --rm migrate` applies the schema on this host
and is a no-op the second time.

### Phase 2 — the other two, and the health assertion

`api` and `web` take the same shape. `smoke.sh` gains a step asserting one of them reaches
healthy, which is the criterion this item was filed under and the one nothing currently covers.

### Phase 3 — the two scripts

`start-full.cmd` and `bounce.cmd`, written last so they are scripting something that already
works rather than being the thing under test.

## Dependencies / Prerequisites

- **None blocking.** Everything needed is in the repository
- The `spa` track holds `apps/web/**`. **This plan does not touch that directory** — `web.yml`
  and a Dockerfile at `apps/web/Dockerfile` are new infra files, not screen changes. Worth a
  glance from that track's owner anyway, since it changes how their dev server runs

## Files Expected to Change

- `pyquest/apps/api/Dockerfile` — **new**
- `pyquest/apps/web/Dockerfile` — **new**
- `pyquest/packages/db/Dockerfile` — **new**, for the migration job
- `infra/compose/api.yml`, `infra/compose/web.yml`, `infra/compose/migrate.yml` — `build:` in
  place of `image:`, and a healthcheck on the two long-running services
- `infra/smoke.sh` — the new assertion
- `infra/start-full.cmd`, `infra/bounce.cmd` — **new**
- `infra/README.md` — how to run it
- `pyquest/apps/web/src/**` — **nothing.** The `spa` track owns it

## Out of Scope

- **Anything that pushes an image off this machine.** §6.4 puts the api on the parent's machine;
  there is no registry and no second host, and adding one is a different decision
- **Running the api suite in CI.** It needs a live Postgres, which is why `build.yml` does not
  run it today. Worth doing and not here
- **Hot reload inside the container.** The mount already gives the api its source; whether Vite's
  HMR survives the container boundary is a `spa` question and this plan will not pre-empt it

## Anticipated Backlog

- **`build.yml` does not run the tests.** It typechecks, validates content and builds the SPA, and
  849 tests do not run because they want a database. A compose-backed CI job is the obvious fix
  and it is a bigger decision than this plan
- **Image build time on every bounce.** `npm ci` in a layer is cached until the lockfile moves, so
  a source edit should not reinstall. If it does in practice, the layer order is wrong and worth
  a note here rather than a shrug
