# The Engine Query Layer, and the Shared Contract

**Status:** Planned
**Track:** engine
**Date:** 2026-08-28
**Author:** Claude (Opus 5)
**Lane:** A

## Objective

Build the half of `packages/engine` that was deliberately deferred, now that real screens
exist to say what it must return — and publish those shapes as a contract the API and the
SPA both build against, so the two lanes cannot drift apart.

## Why this exists

The Phase 0 plan split the engine in two. The arithmetic the spec pins to the number —
`effectiveDC`, the XP table, medal deltas, the 3-of-5 boss unlock, the invasion ladder —
was built and mutation-tested. The projection over it was not, on the grounds that only a
real screen can settle what a quest card or a Defend queue actually needs. That was the
whole argument for designing before building the teaching system.

The design session happened. These shapes are now knowable, and **this work blocks the
API**, which serves exactly them.

## Success Criteria

- [ ] `availableQuests`, `areaProgress`, `bossState`, `dueInvasions`, `standings`, `level`
- [ ] Still **no I/O, no database, no network, and no clock** — "now" is a parameter (§6.7)
- [ ] `packages/contract` published, with the SPA's stubs and the API's handlers both
      typed against it
- [ ] Every function has a RED capture, a GREEN capture, and a killed mutant
- [ ] A test asserts no return type carries a presentation field (`risk`, `warning`,
      `label`) — the §5.1 layer boundary, pinned

## Approach

Read the artboards in `docs/design/pyquest/` before writing signatures. They are the
requirement; the sections below are what they imply.

**`areaProgress`** returns `{ cleared, total, estimated }` (§5.1a). The `estimated` flag
comes from the area manifest's `authoring: partial`; whether it renders as a `~` is the
UI's decision.

**`bossState`** is not a boolean. The map and the area screen both show *how close* he is,
so it returns cleared-of-required alongside the unlock — `{ cleared, required, unlocked }`.

**`dueInvasions`** merges two sources: the ladder in `invasions.ts`, and the forced
reviews a Datamine schedules at +3 and +10 days (§5.5). Ordered most-overdue first,
capped at the 3–5 §5.4 specifies. Takes `now` as an argument.

**`level(xp)`** — **done.** `15·L·(L−1)`, in `src/level.ts`, ruled and built on
2026-08-28. `levelAt` returns the §5.1a denominator alongside the number. The query layer
consumes it; it does not need rebuilding.

**`packages/contract`** holds the zod schemas and inferred types for everything the API
returns. The engine's query results are most of it. This is the piece that makes "the SPA
is not blocked by the API" safe rather than merely true: without it, the SPA invents stub
shapes, the API invents response shapes, and they meet for the first time at integration.

## Phases

### Phase 1 — the contract package

`pyquest/packages/contract`, depending on `@pyquest/content` and nothing else. Zod schemas
per endpoint payload. No logic.

### Phase 2 — the query layer [ASYNC with Phase 3]

The six functions, full test-filter discipline. Named mutants that must be caught: return
a constant progress; drop the `estimated` flag; let `dueInvasions` ignore the cap; make
`bossState.unlocked` true at two cleared; off-by-one on a ladder rung.

### Phase 3 — property tests

XP totals are order-independent (already pinned for medals — extend across areas). Progress
never exceeds its total. A due queue never exceeds its cap. No function reads `Date`.

## Dependencies / Prerequisites

- The artboards, which exist
- ~~A ruling on the level curve~~ — **settled 2026-08-28**: `15·L·(L−1)`, built and
  mutation-tested in `pyquest/packages/engine/src/level.ts`. Nothing blocks this plan

## Files Expected to Change

- `pyquest/packages/contract/**` — new
- `pyquest/packages/engine/src/queries.ts` + `tests/queries.test.ts` — new
- `pyquest/packages/engine/src/level.ts` — no change; consumed by the query layer
- `pyquest/packages/engine/src/index.ts` — exports

## Track discipline

`packages/contract` is a shared file set: the API implements it and the SPA stubs against
it. The `engine` track creates and owns it for the duration of this plan — neither `api`
nor `spa` may edit it while this runs, because a change to a shape they both consume is a
change to this plan. Once this is in `completed/`, contract edits belong to `main`.

## Out of Scope

Anything that touches Postgres or HTTP. If a function here needs a database, it belongs in
the API and this plan has gone wrong.

---

## Plan Review

**Reviewed:** 2026-08-29 09:53
**Reviewer:** Claude Code (plan-review-intake)

### Strengths

- **Objective / Why this exists:** Correctly treats this as Lane A work that blocks the API while preserving SPA/API convergence through a shared contract.
- **Success Criteria / Approach:** Repeats the spec's hard boundary well: engine stays pure; presentation stays out of engine — the `risk`/`warning`/`label` assertion test is a good pin.
- **`areaProgress` / `bossState`:** Both grounded in existing content schema and spec §5.1a / §5.2.
- **Track discipline:** Good recognition that `packages/contract` is a shared seam needing single-plan ownership.

### Issues

#### Critical (Must Address Before Implementation)

- **Approach / Success Criteria — `availableQuests` and `standings` undefined**
  - Section: Success Criteria + Approach
  - What's wrong: Both appear in success criteria but neither their shape nor their rules are specified. `standings` is only implied by spec §5.8/§6.7 and not defined anywhere in the plan.
  - Why it matters: Unspecified shapes invite contract churn once the API and SPA start consuming guesses.
  - Suggested fix: Add explicit schemas, inputs, sort rules, and tie-break behavior for both before implementation begins.

- **Phase 2 / Phase 3 concurrency claim is wrong**
  - Section: Phases
  - What's wrong: "Phase 2 — the query layer [ASYNC with Phase 3]" conflicts directly with property tests in Phase 3 that operate on the same functions.
  - Why it matters: Property tests depend on settled signatures and semantics from Phase 2; they cannot run concurrently.
  - Suggested fix: Make Phase 3 sequential after Phase 2, or scope Phase 3 only to already-finalized primitives (e.g., `level`).

- **Phase 1 workspace setup is underspecified**
  - Section: Phase 1
  - What's wrong: The plan creates `packages/contract` but does not account for root `tsconfig.json` reference updates needed for `tsc -b` to include the new package.
  - Why it matters: New package won't participate in the build without root tsconfig changes.
  - Suggested fix: Add root `tsconfig.json` reference update and define package-local `tsconfig.json`/`package.json` requirements explicitly in Phase 1.

#### Important (Should Address)

- **Phase 1 — dependency claim likely wrong**
  - Says `packages/contract` depends on `@pyquest/content` and nothing else, but zod schemas need `zod`, and it may not need `@pyquest/content` at all unless re-exporting shared enums.
  - Suggested fix: State whether contract re-exports content-derived types or defines endpoint payload schemas independently.

- **`dueInvasions` under-specified**
  - Merge rules, payload shape, deduplication, and whether Datamine forced reviews bypass ladder timing are all unspecified.
  - Suggested fix: Define payload shape and merge semantics (ordering, tie-breaks, deduplication).

- **Named mutants are insufficient**
  - Missing mutants for: dropped forced-review rung, wrong +3/+10 Datamine schedule, wrong overdue sort, duplicate concept entries, presentation field leaked into contract.
  - Suggested fix: Expand mutant list to cover projection-level failures, not only arithmetic.

- **Property test list too thin**
  - Only four invariants listed; omits boss unlock monotonicity, `areaProgress.cleared <= total`, Datamine forced reviews appearing only at scheduled dates, and pure input-determinism.
  - Suggested fix: Add these invariants to Phase 3.

- **Named exports / API consumption unclear**
  - Plan says "`index.ts` — exports" but does not specify whether query input/output types come from engine, contract, or both.
  - Suggested fix: Specify exact export surface: engine returns contract-compatible plain data; contract owns public schemas/types.

#### Minor (Consider)

- **Grounding source mismatch:** `pyquest/packages/content/src/invasions.ts` does not exist; relevant manifest shape lives in `schema.ts`.
- **No rollback/incremental strategy:** Consider provisional versioned names or adapter functions until API integration proves shapes are correct.

### Recommendations

Define `availableQuests` and `standings` shapes first. Sequentialize Phase 2 → 3. Add root tsconfig/package setup as an explicit Phase 1 task. Fully specify `dueInvasions` payload and merge semantics. Expand mutants and property invariants.

### Assessment

**Implementable as written?** With fixes

**Reasoning:** The purity boundary is sound and most of the plan aligns with the codebase, but two success-criteria functions are still undefined and the workspace/test sequencing is not specified tightly enough to avoid rework.
