# Three Compose Services Cannot Start on Windows

**Status:** Backlog
**Date Discovered:** 2026-08-29
**Discovered During:** `planning/in-progress/feature_api-and-runner_2026-08-28.md`, Wave 3

## Context

`infra/compose/api.yml`, `web.yml` and `migrate.yml` all take the same shape, chosen when the
fragments were split: a stock Node image with the workspace mounted and an `npm run` command, so
no service needed a Dockerfile before the code it runs existed.

That shape does not start on this machine. `npm install` on Windows writes
`node_modules/@pyquest/*` as symlinks to absolute host paths, and those do not resolve inside a
Linux container, so every workspace import fails at boot. The api service was the first to try
it and hit it; `migrate.yml` and `web.yml` have the identical structure and are not exempt —
they simply have not been run yet.

`apps/runner` does not have the problem, because it was built with a real Dockerfile that
installs its dependencies for Linux inside the image.

## Known Scope

One decision, applied three times, and it belongs to `main` rather than to any one track:
**give each service a Dockerfile that installs inside the image**, the way `apps/runner`
already does, keeping the workspace mount for source only.

The alternative — a container-local `node_modules` volume that shadows the host's — works and is
worse: it is invisible, it goes stale silently, and the first person to debug it will not know
it exists.

Whichever is chosen, `infra/smoke.sh` should assert one of the three actually boots. It asserts
postgres and gitea reach healthy today, and those two are the services that never had this
problem.

## Trigger for Promotion

The first time anyone needs to run the stack rather than the test suite — a real Submit through
the api service, the migration job in place of `npm run migrate`, or the son opening the SPA
from his own machine. Diagnosed and documented inline in `api.yml`; nothing is broken that was
previously working.
