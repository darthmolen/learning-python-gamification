# The Compose File the Lane A Tracks Cannot Own

**Status:** Completed
**Track:** main
**Date:** 2026-08-29
**Author:** Claude (Opus 5)
**Lane:** A — infrastructure, and the seam three tracks would otherwise fight over

## Objective

Split `infra/docker-compose.yml` into per-service fragments so that `api`, `db` and `spa`
each own a file nobody else edits, and the root compose file changes once — here — instead
of three times in parallel.

## Why this exists

`plan-workflow` admits a plan to `in-progress/` only when its `Files Expected to Change` is
disjoint from every other in-progress plan's. Three queued Lane A plans name the same file:

- `feature_spa_2026-08-28.md` — the `web` service, development only
- `feature_progress-schema_2026-08-28.md` — the migration job
- `feature_api-and-runner_2026-08-28.md` — the `api` and `runner` services

They are otherwise disjoint and were written to run in parallel. On this one file they
cannot, so any two of the three are blocked from starting together — which defeats the
point of splitting Lane A into tracks at all.

This is the same shape as `concepts.ts` before
`planning/completed/feature_shared-index-and-concepts_2026-08-29.md`, and the same shape as
`pyquest/tsconfig.json`, which the engine plan had to claim in a Track discipline section
because every Lane A track eventually appends one line to its `references` array. Twice is
a coincidence. Three times is the pattern, and the pattern is worth fixing structurally
rather than with another ownership note.

**The difference from the `concepts.ts` case:** that one was solved by landing the shared
change and getting out of the way, because there was exactly one change to land. Here there
are three, none of which can be written before the code it runs exists. So the fix is not to
land them early — it is to give each one a file of its own.

## Success Criteria

- [x] `infra/compose/api.yml`, `web.yml` and `migrate.yml` exist, each defining its services
      and starting none of them
- [x] `docker compose config --services` from `infra/` lists exactly `postgres` and `gitea`,
      as it does today
- [x] Each fragment's services appear only when its profile is named
- [x] `./smoke.sh` still passes — the stack comes up, gitea's schema is in the shared
      Postgres, and restore still round-trips
- [x] The three queued plans name their own fragment, not the root compose file, and their
      `Files Expected to Change` sets are disjoint — verified, not assumed
- [x] The root file's RESERVED comment block is gone, because it has been made real

## Approach

**`include:`, not a second `-f` flag.** Compose has supported `include:` since v2.20 and
this machine runs v2.39.1. Layering with `-f` would work too, but it changes every
invocation — `smoke.sh`, `backup.sh`, `restore.sh`, the README, and every command the parent
types for the next 48 weeks. `include:` keeps `docker compose up` meaning what it means today.

**`profiles:` is what makes an unbuilt service safe.** A service carrying a profile is not
started unless that profile is named, so the fragments can exist long before the code does.
Verified before writing this plan:

```
docker compose config --services              -> postgres          (web absent)
docker compose --profile web config --services -> postgres, web
```

**No Dockerfiles, and no build contexts.** A build context that does not exist yet is a trap
waiting for whoever first runs the wrong command. Every fragment uses a stock image with the
workspace mounted and an `npm run` command, which is what a development service needs and all
these are until the API ships for real. The api plan may replace its fragment with a real
build; that is its business, inside its own file.

**A missing fragment fails immediately and loudly** — `open compose/absent.yml: The system
cannot find the file specified` — which is why all three are created here rather than left
for each track to add. A track adding its own `include:` line would put every track back in
the root file, which is the problem this plan exists to remove.

## Phases

### Phase 1 — the fragments

`infra/compose/api.yml` (api and runner), `web.yml`, `migrate.yml`. Each carries the host
port the RESERVED block already reserved — api 3081, web 3082, runner none — so nothing
re-litigates a decision that was already made.

### Phase 2 — the root file

Add the `include:` block. Delete the RESERVED comment, which existed to hold these three
places and has now been superseded by three real files. Keep the pinning discipline and the
comment explaining it.

### Phase 3 — prove the stack is unchanged

`docker compose config --services` lists two services, `--profile` names each of the others,
and `./smoke.sh` passes. Configuration is the explicit exception to unit-test discipline that
`smoke.sh` already documents: what is worth asserting is that the services come up and can
reach each other, which is what that script does.

### Phase 4 — hand the fragments to their tracks

Rewrite `Files Expected to Change` in the three queued plans to name the fragment instead of
the root compose file, and re-run the disjointness check across all three. This phase is the
reason this is a gate rather than a parallel track: it edits three other plans.

## Dependencies / Prerequisites

- Docker Compose ≥ 2.20 for `include:`. This machine: v2.39.1 — confirmed
- The infra stack, which exists, is healthy, and has a rehearsed restore

## Files Expected to Change

- `infra/docker-compose.yml` — the `include:` block; the RESERVED comment removed
- `infra/compose/api.yml` — new, owned by the `api` track
- `infra/compose/web.yml` — new, owned by the `spa` track
- `infra/compose/migrate.yml` — new, owned by the `db` track
- `infra/README.md` — who owns which fragment, and why the root file is not the place
- `planning/feature_api-and-runner_2026-08-28.md` — file set
- `planning/feature_progress-schema_2026-08-28.md` — file set
- `planning/feature_spa_2026-08-28.md` — file set

## Track discipline

This is a **gate, not a parallel track.** It runs alone in `in-progress/`, completes, and
only then may `api`, `db` or `spa` start — because it rewrites all three of their file sets,
and a plan whose file set is being edited underneath it is not a plan anyone can trust.

`infra/docker-compose.yml` stays owned by `main` after this. It should now be a file nobody
else needs.

## Out of Scope

Making any of the three services actually run. This plan writes no API, no migration and no
Vite config; a fragment that starts a working service means this plan has gone wrong.
`infra/smoke.sh` is likewise untouched — the migration assertions in it belong to the db plan,
which already names that file.

---

## Status

**Final Status:** Completed
**Track:** main
**Completed:** 2026-08-29
**Completed By:** Claude (Opus 5)

### Outcomes

- `infra/compose/{api,migrate,web}.yml`, each profile-gated and owned by one track.
- `docker-compose.yml` includes all three; its RESERVED comment block is gone, having been
  made real. Default `docker compose up` is unchanged.
- Verified: `config --services` lists `postgres` and `gitea` only; each profile adds exactly
  its own services; `./smoke.sh` passes 28 of 28, restore round-trip included.
- All three queued Lane A plans now declare a track (`api`, `db`, `spa`) and name their own
  fragment. Their file sets are disjoint, checked by listing every path and looking for a
  duplicate rather than by reading them.

### Deviations

- The three plans gained `**Track:**` as well as new file sets. The plan only promised the
  file sets, but the tracks were the other half of the same problem and all three documents
  were already open.
- `infra/README.md` gained a section rather than a note. The table of which fragment belongs
  to which track is the thing a future author needs, and it does not fit in a sentence.

### Lessons Learned

- **A fabricated digest is worse than no digest.** The fragments were first written with an
  invented `node:22-alpine@sha256:...` to satisfy the file's own pin-by-digest rule. It would
  have failed on first pull, confusingly, months from now. Resolved with
  `docker buildx imagetools inspect` before anything was committed. Never invent a hash to
  satisfy a policy the hash exists to enforce.
- **`include:` fails loudly on a missing fragment**, which is a feature: it is why all three
  files had to land together, and it means no track can half-adopt this.
- Three plans colliding on one file was the third instance of this shape, after `concepts.ts`
  and `pyquest/tsconfig.json`. The first two were solved with ownership notes. Three is where
  a structural fix pays: `api`, `db` and `spa` can now start on the same afternoon.

### Backlog Items Created

None.
