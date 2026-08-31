# The Node Services Cannot Start On A Windows Host

**Status:** Backlog
**Track:** infra
**Date:** 2026-08-31
**Author:** Claude (Opus 5)
**Lane:** A
**Found by:** recorded in `infra/compose/api.yml` 2026-08-29; confirmed still open by
`planning/completed/feature_the-stack-runs-end-to-end_2026-08-31.md`

## Objective

Make `docker compose --profile api --profile web up` actually work on the machine this project
runs on, so the documented command is the command.

## Why this exists

`npm install` on Windows writes `pyquest/node_modules/@pyquest/*` as symlinks to **absolute
Docker-VM paths** (`/mnt/host/c/dev/.../packages/content`). Those resolve on the host and in the
VM, and not inside a container that mounts only `/workspace`. So `import '@pyquest/contract'`
fails with `ERR_MODULE_NOT_FOUND` before any of our code runs.

**All three node services share it** — `api`, `web` and `migrate` all mount the same workspace
and run the same `npm run --workspace`. It is recorded at length at the top of
`infra/compose/api.yml`, where the note also says the fix is one decision for all three and
therefore crosses tracks.

The cost is now concrete rather than theoretical. The plan that wired the SPA to the api could
not verify its own compose services; it ran both processes on the host with the same commands
and environment the fragments specify, which is a faithful reproduction and is **not the same as
having run the stack**. Everything `infra/README.md` now documents under "Running the whole
stack" carries that asterisk.

It also cost a real defect a container would have caught in seconds: `web.yml` bound the wrong
port and the wrong interface, and had done since it was written, because nobody could start it.

## Success Criteria

- [ ] `docker compose --profile api --profile web up -d api runner web` brings up all three on
      this Windows host, from a clean `node_modules`
- [ ] The browser on the host loads the SPA on 3082 and it fetches from the api on 3081 —
      the end-to-end check that has so far only been made process-to-process
- [ ] `docker compose --profile migrate run --rm migrate` works the same way
- [ ] `smoke.sh` extended to assert it, so this cannot silently regress
- [ ] Host development is unchanged — `npm run dev` and `npm run start` still work as they do

## Approach

`apps/runner` already has a Dockerfile and already works, and it is the template. Give the node
services one that runs `npm ci` **inside** the image, for Linux, so `node_modules` is the
container's rather than the host's — with the source still bind-mounted for the dev server,
which is the whole reason `web` has no build context today.

The usual shape is an anonymous volume over `/workspace/node_modules` so the bind mount does not
shadow the image's install. Confirm that interacts correctly with npm workspaces, which put most
dependencies at the root and a few in each app.

**One image or three is the open question.** All three run the same workspace with different
commands, so one image serving all three is tempting and probably right; `migrate` exiting and
`web` being long-lived is a command difference, not an image difference.

## Dependencies / Prerequisites

None, but it touches all three fragments in `compose/`, which are owned by three different
tracks. **That coordination is the reason this has not been done**, not difficulty — see the
note in `api.yml`. It probably wants the `infra` track to hold all three files for one plan,
declared as such.

## Files Expected to Change

- `pyquest/Dockerfile` (new), or one per app
- `infra/compose/api.yml`, `infra/compose/web.yml`, `infra/compose/migrate.yml`
- `infra/README.md` — delete "The Windows gap"
- `infra/smoke.sh`

## Out of Scope

- A production image for the api. §6.4 puts it on the parent's machine and §6.1 gives `web` no
  deployment story; this is about the development stack starting.
