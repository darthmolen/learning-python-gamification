# The Engine Query Layer, and the Shared Contract

**Status:** Planned
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
- `pyquest/packages/engine/src/level.ts` — new, one constant and one function
- `pyquest/packages/engine/src/index.ts` — exports

## Out of Scope

Anything that touches Postgres or HTTP. If a function here needs a database, it belongs in
the API and this plan has gone wrong.
