# Wave 3 — The Application

**Status:** Open
**Level:** Wave — coordinates plans, does not replace them
**Date:** 2026-08-29
**Author:** Claude (Opus 5)
**Tracks:** `main`, `db`, `content-wire`, `api`, `spa`, `area-0`, `area-2`, `area-3`, `world-shim`

## What a wave is, and why this is one

A plan owns a track. A **wave** owns the order the tracks start in.

The word is already this repository's. `feature_phase0-tier0-foundation` reasons about
Wave 0 and Wave 1; three backlog items record what they were discovered during; and
`feature_scoring-model-single-source` says the Datamine table lands "in Wave 3, which is the
first moment Datamine needs a real table." This document is that Wave 3, written down instead
of carried in someone's head.

**A wave is written when the plans stop fitting in a head, not before.** Nine live plans across
nine tracks is where that happened here. Two or three plans need no wave; they need a glance at
`in-progress/`.

## The problem this wave exists to solve

Nine plans are live. Four are running. **None of the five queued can start**, and not one of
them is blocked by the work it actually depends on. They are blocked by file ownership and
track capacity:

| Held plan | Held by | Kind |
|---|---|---|
| Progress Schema (`db`) | `pyquest/vitest.config.ts`, in use by `spa` | shared file |
| Content Surface (`db`) | the `db` track, plus `content/areas/area-2.yml` | track capacity |
| API and Runner (`api`) | in review; then `vitest.config.ts` | review, then shared file |
| Curriculum's Voice (`main`) | area-0 declares no file set, so nothing can be cleared against it | missing declaration |
| Area 3 (`area-3`) | world-shim and area-2, both mid-flight | **a real dependency** |

Only the last is queued for an honest reason. The other four are the same failure this project
has now hit four times — **one file doing two jobs** — after `concepts.ts`,
`pyquest/tsconfig.json`, `infra/docker-compose.yml` and `packages/contract/src/index.ts`.

## The sequence

Two short gates on `main`, then five plans start within a day of each other.

### Gate 1 — Area 0 declares its file set  *(`main`, minutes)*

`planning/in-progress/feature_area-0-quest-backfill_2026-08-28.md` has no
`Files Expected to Change` section. The rule that admits plans in parallel is a comparison of
those lists, and one of them is absent — so every judgement about what may run beside it is a
guess wearing the clothes of a rule. Cheapest item in the wave; unblocks a whole plan.

### Gate 2 — split `vitest.config.ts` per workspace  *(`main`, about an hour)*

Vitest's `projects` accepts globs. Point it at `packages/*` and `apps/*`, give each workspace
its own config, and the root file stops being something every track needs a line in. Exactly
the move `infra/compose/` and `packages/contract/src/` already got.

Verified the way those were: the suite reports the same count before and after, and no test
file is edited. A count that moves means the split changed behaviour, which it is not allowed
to do.

### Gate 3 — re-track the Content Surface  *(`main`, minutes)*

It declares `Track: db` and so queues behind the Progress Schema. They are not the same work —
one writes SQL and a repository layer, the other writes wire shapes and YAML. Give it
`content-wire` and the bottleneck disappears.

### Then, in parallel

- **`db`** — Progress Schema. Reviewed twice; its own reviewer said nothing blocks Phase 1.
- **`main`** — Curriculum's Voice, once Gate 1 proves it disjoint from area-0.
- **`api`** — when v4 returns. Its Phase 1 writes `endpoints.ts`, which the SPA is stubbing
  against right now; this is the oldest debt on the board.
- **`content-wire`** — Content Surface, once area-2 releases `content/areas/area-2.yml`.
- **`area-3`** — after world-shim and area-2. Correctly queued; nothing to fix.

## Exit criteria

- [ ] Every in-flight plan declares a file set
- [ ] No file appears in two in-flight plans' `Files Expected to Change`
- [ ] `pyquest/vitest.config.ts` is not in any plan's file set, because no plan needs it
- [ ] Five queued plans are running or complete
- [ ] The API's endpoint half exists, so the SPA is no longer stubbing against prose

## What this wave does not do

It does not re-plan anything. Every plan named here keeps its own objective, phases, criteria
and review history; a wave that starts editing the substance of its plans has become a very
large plan and should be split back up.

It also does not schedule Lane B. `area-0`, `area-2` and `area-3` appear because they hold
files Lane A wants, not because a wave decides when curriculum gets written. Lane B is never
the thing that gets postponed.
