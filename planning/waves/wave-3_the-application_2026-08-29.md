# Wave 3 — The Application

**Status:** Open — three gates closed 2026-08-29, three plans running
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

### Gate 1 — Area 0 declares its file set  *(`main`, done 2026-08-29)*

`planning/in-progress/feature_area-0-quest-backfill_2026-08-28.md` has no
`Files Expected to Change` section. The rule that admits plans in parallel is a comparison of
those lists, and one of them is absent — so every judgement about what may run beside it is a
guess wearing the clothes of a rule. Cheapest item in the wave; unblocks a whole plan.

### Gate 2 — make the alias map derive itself  *(`main`, done 2026-08-29)*

**This gate was proposed wrongly and the fix is not what it says below.** The wave asked for
`vitest.config.ts` to be split per workspace, the way `infra/compose/` was. The `spa` track had
already argued against exactly that, in the file:

> **Defined once, on purpose.** An `apps/web`-local vitest config would be a second place for
> these to be written down, and the second place is the one that goes stale — a web project
> missing the contract alias would parse its fixtures against compiled output and stay green
> against a contract that moved.

That is the better argument. Per-workspace configs make every workspace restate the alias map,
and one that forgets an entry resolves silently through `dist/`.

**What landed instead:** the map stays in one file and derives itself, reading each package's
own `package.json`. That keeps the single definition the paragraph argues for *and* removes the
queue behind the file — `db` needed one alias line and `api` needed one, and now a package that
exists is aliased with no list to forget. `db` dropped the file from its set entirely.

Verified as this wave requires: 14 files and 243 tests before, 14 and 243 after.

**The lesson for the next wave:** a gate that proposes changing a file should read that file
first. The counter-argument was written down, in the place the change was going to be made.

### Gate 3 — re-track the Content Surface  *(`main`, done 2026-08-29)*

It declares `Track: db` and so queues behind the Progress Schema. They are not the same work —
one writes SQL and a repository layer, the other writes wire shapes and YAML. Give it
`content-wire` and the bottleneck disappears.

### Then, in parallel

- **`db`** — Progress Schema. Reviewed twice; its own reviewer said nothing blocks Phase 1.
- **`main`** — Curriculum's Voice, once Gate 1 proves it disjoint from area-0.
- **`api`** — when v4 returns. Its Phase 1 writes `endpoints.ts`, which the SPA is stubbing
  against right now; this is the oldest debt on the board.
- **`content-wire`** — Content Surface, **started**. It no longer waits for area-2: that track
  is blocked on the son's laptop, so rather than hold a plan behind hardware, the content
  surface lands the six manifests nobody holds and leaves `area-0.yml` and `area-2.yml` to the
  tracks that hold them, as deferred work carried in those plans.
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
