# The Engine Query Layer, and the Shared Contract

**Status:** Completed
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

- [x] `availableQuests`, `areaProgress`, `bossState`, `dueInvasions`, `standings`, `level`
- [x] Still **no I/O, no database, no network, and no clock** — "now" is a parameter (§6.7)
- [x] `packages/contract` published, with the SPA's stubs and the API's handlers both
      typed against it
- [x] `npm run typecheck` from `pyquest/` builds the new package — root `tsconfig.json`
      references it, or `tsc -b` silently skips it
- [x] Every function has a RED capture, a GREEN capture, and a killed mutant
- [x] A test asserts no return type carries a presentation field — the §5.1 layer
      boundary, pinned. The artboards name the real offenders: `accent`, `bg`, `fg`,
      `dcFill`, `markFill`, and `risky`, which is the DC ≥ 20 warning the UI owns

## Approach

Read the artboards in `docs/design/pyquest/` before writing signatures. They are the
requirement; the sections below are what they imply. Where a shape below looks arbitrary,
it was lifted from a `{{ binding }}` in the artboard that renders it.

**The engine works in ids, not names.** §6.2 already keys medals on `player_id`. Display
names and roles are roster data that lives in Postgres, so a query that returned them
would be reaching across the §6.7 line to do a join. The API joins; the engine counts.

**`availableQuests`** returns, per quest, `{ id, title, dc, concepts, medals, status }` —
the `Area.dc.html` bindings that are not colours. `status` is the state behind `q.mark`;
the glyph is the UI's. `q.risky` is deliberately absent, per the criterion above.

**`areaProgress`** returns `{ cleared, total, estimated }` (§5.1a). The `estimated` flag
comes from the area manifest's `authoring: partial`; whether it renders as a `~` is the
UI's decision.

**`bossState`** is not a boolean. The map and the area screen both show *how close* he is,
so it returns cleared-of-required alongside the unlock — `{ cleared, required, unlocked }`.

**`dueInvasions`** merges two sources: the ladder in `packages/engine/src/invasions.ts`,
and the forced reviews a Datamine schedules at +3 and +10 days (§5.5). Ordered
most-overdue first, capped at the 3–5 §5.4 specifies. Takes `now` as an argument.

Each entry carries `{ conceptId, area, lastSeen, overdueDays, source }` — the
`Defend.dc.html` bindings, minus `d.why` and `d.prompt`, which are content the caller
looks up by id rather than payload the engine copies.

**A concept due on both paths is one entry, not two.** It can be overdue on the ladder and
carry a Datamine review in the same session, and at a cap of five, letting it take two
slots costs a fifth of the queue. Deduplicate on `conceptId`, keeping the more overdue of
the two, and let `source` record that both fired. This is the mutant most worth seeding.

**`standings` is the completion board and nothing else** — per player,
`{ playerId, level, toNext, areaXp, areas: [{ area, cleared, medals }] }`. §5.8 as ruled on
2026-08-29: a record of what each player completed and which medals they took, not a
ranking. Nothing on it gates anything.

**It never resets, so the engine implements no reset.** A board recomputed from the whole
completion history has nothing to wipe — the old "reset each area" wording described a
rubber-band mechanic the rest of the design contradicts, and it is gone. If
reset-by-agreement lands later (modes backlog), it arrives as one more timestamp in the
state this query already takes and the filter is a single line. Do not build it now, and
do not leave a hook for it.

`Party.dc.html` binds three other collections on the same screen, and they are not this:

- `sources` — the XP-provenance panel. A pure projection over the same completions, so it
  belongs in the engine eventually. Its **shape ships in the contract in Phase 1** so the
  SPA is not blocked; whether the function lands here or with the API is a call for
  whoever gets there first. It is not in this plan's success criteria.
- `bounties` — player-authored records that live in Postgres. Projecting them would drag
  state across §6.7. API.
- `medalTotals` — a sum over `standings[].medals`. The UI adds up five numbers.

**`level(xp)`** — **done.** `15·L·(L−1)`, in `src/level.ts`, ruled and built on
2026-08-28. `levelAt` returns the §5.1a denominator alongside the number. The query layer
consumes it; it does not need rebuilding.

**`packages/contract`** holds the zod schemas and inferred types for everything the API
returns. The engine's query results are most of it. This is the piece that makes "the SPA
is not blocked by the API" safe rather than merely true: without it, the SPA invents stub
shapes, the API invents response shapes, and they meet for the first time at integration.

**The export rule:** the contract owns every public schema and type, in both directions; the
engine returns plain data that satisfies it. A test parses engine output through the contract
schema — that is where the two are proved equal.

The engine may `import type` from the contract for its parameter types, and nothing else.
Under `verbatimModuleSyntax` a type-only import is erased, so no runtime edge exists and
§6.7's purity argument is untouched — that section forbids I/O, not package references. A
value import from the contract into the engine is the thing to refuse: it would put zod on
the engine's runtime path for no gain, since the engine validates nothing. `packages/engine`
gains a project reference to `../contract` for the types alone.

## Phases

### Phase 1 — the contract package, and the workspace that builds it

`pyquest/packages/contract`. Zod schemas per endpoint payload, including `sources`. No
logic.

Three pieces of wiring, none of which is automatic here:

- Root `pyquest/tsconfig.json` is `{ "files": [], "references": [...] }` — an explicit
  list, not a glob. Without a fourth entry, `npm run typecheck` skips the package and
  reports success.
- A package-local `tsconfig.json` and `package.json` mirroring `packages/engine`'s.
- `zod` as a real dependency, pinned to `^3.24.1` to match `@pyquest/content`. Two zod
  majors in one workspace produce schemas that do not typecheck against each other.

**Phase 1 ruled and built, 2026-08-29.** Contract **does** depend on `@pyquest/content`.
Areas, medals and the 5–30 DC scale are already defined there against §5.1, §5.2 and §5.10,
and a second definition of `Medal` in the contract is a second definition that can disagree
with the first. `package.json` says so. One duplication was accepted rather than widening a
package this plan does not own: content's `IdSchema` is not exported, so the kebab-case id
pattern is restated in the contract with a comment naming content as the source of truth.

`zod` is pinned `^3.24.1`, resolving to 3.25.76 alongside content's.

**Phase 1 is not done until the inputs land too.** The output half shipped on 2026-08-29;
the input half was missed, and `feature_progress-schema_2026-08-28.md` is the reason it
cannot be skipped. That plan's Dependencies name `packages/contract` as "the shapes the
repository returns", and its Phase 2 builds "thin functions returning the shapes
`@pyquest/contract` declares". So the contract is already the agreed vocabulary in both
directions: what the API sends out, and what the database hands the engine. Left undefined,
`packages/db` invents row shapes and the engine invents parameter shapes, which is the exact
drift this package was created to stop — just on the side nobody was looking at.

One schema per table the six queries actually read. The rest of the db plan's tables —
`attempts`, `sessions`, `journal_entries`, `bounties`, `runner_jobs` — are not engine inputs
and must not appear here:

- `QuestMedalRecord` — `{ playerId, questId, medal, earnedAt, xpAwarded }`, the `quest_medals`
  row as §6.2 writes it. `xpAwarded` is what the medal paid at the time; §5.10 prices the
  delta once, so re-deriving it later would be a lie and the engine must read the recorded
  number rather than recompute one.
- `ConceptReview` — `{ playerId, conceptId, lastReviewedAt, rung }`. `rung` indexes
  `INVASION_LADDER`, so it is bounded by `FIRST_RUNG`/`TOP_RUNG` and the schema says so.
- `ForcedReview` — `{ playerId, conceptId, dueOn }`, §5.5's +3 and +10 guarantees. The second
  source `dueInvasions` merges, and the reason `source: 'both'` exists.
- `PlayerProgress` — the bundle of the three, per player. What the API hands the engine.

Dates are ISO 8601 calendar strings, matching `lastSeen` on the way out. The engine still
reads no clock: `now` arrives as a parameter (§6.7).

**Phase 1 ends when the signatures are settled — both directions.** That is the gate the
next two phases depend on, not either of them finishing. **Both halves landed 2026-08-29**:
54 contract tests, fifteen seeded mutants, two of which survived the first pass and were
killed only after the tests were fixed. Outstanding for Phase 2: the engine suite must assert
`INVASION_LADDER.length - 1 === TOP_RUNG_BOUND`, which is the only cross-package drift the
contract cannot catch alone.

### Phase 2 — the query layer [ASYNC with Phase 3, once Phase 1 lands]

**Content arrives as a parameter, like everything else.** The engine performs no I/O, so it
cannot read YAML: the caller passes already-parsed `ContentItem[]` and `AreaManifest` from
`@pyquest/content`. Progress arrives as the `PlayerProgress` the contract now declares. Those
two plus `now` are the whole input surface — if a function needs a third source, it is
reaching for something it should have been handed.

The signatures, which Phase 1 settles and this phase implements:

| Function | Takes | Returns |
|---|---|---|
| `availableQuests` | items, progress, area | `QuestCard[]` |
| `areaProgress` | items, manifest, progress, area | `AreaProgress` |
| `bossState` | items, progress, area | `BossState` |
| `dueInvasions` | progress, `now` | `DueInvasion[]` |
| `standings` | items, progress per player | `Standing[]` |
| `level` | totalXp | `Level` — **built** |

Full test-filter discipline on each.

Named mutants that must be caught: return a constant progress; drop the `estimated` flag;
let `dueInvasions` ignore the cap; make `bossState.unlocked` true at two cleared;
off-by-one on a ladder rung. And at the projection level, where the arithmetic mutants
cannot reach: drop a forced-review rung; schedule the Datamine at +3/+7 instead of +3/+10;
sort the queue least-overdue first; emit one concept twice; leak `risky` into a return.

Two more that only exist now that the inputs are named: **recompute `xpAwarded` instead of
reading it** — §5.10 pays a medal's delta once, so a query that re-prices history reports a
number the player was never paid; and **ignore `forced_reviews` entirely**, which leaves
`dueInvasions` looking healthy while §5.5's guarantee silently never fires.

### Phase 3 — property tests

Writing these against Phase 1's settled signatures *before* Phase 2 implements them is the
RED capture, not a sequencing error — that is `test-filter-development` working as
intended.

XP totals are order-independent (already pinned for medals — extend across areas).
Progress never exceeds its total. A due queue never exceeds its cap, and holds no
`conceptId` twice. Boss unlock is monotonic: clearing a quest never re-locks a boss. No
function reads `Date`, and the same inputs always produce the same output — the second
half being what a stray `Math.random` or a `Set` iteration order would break.

## Dependencies / Prerequisites

- The artboards, which exist
- ~~A ruling on the level curve~~ — **settled 2026-08-28**: `15·L·(L−1)`, built and
  mutation-tested in `pyquest/packages/engine/src/level.ts`. Nothing blocks this plan

## Files Expected to Change

- `pyquest/packages/contract/**` — new
- `pyquest/tsconfig.json` — a fourth project reference
- `pyquest/vitest.config.ts` — the source alias; found during execution, not planned for.
  Tests resolve `@pyquest/contract` through this map, never through `dist`
- `pyquest/packages/engine/src/queries.ts` + `tests/queries.test.ts` — new
- `pyquest/packages/engine/src/level.ts` — no change; consumed by the query layer
- `pyquest/packages/engine/tsconfig.json` — a project reference to `../contract`, types only
- `pyquest/packages/engine/src/index.ts` — exports, and the docblock that currently
  explains why these five functions are absent

## Track discipline

`packages/contract` is a shared file set: the API implements it and the SPA stubs against
it. The `engine` track creates and owns it for the duration of this plan — neither `api`
nor `spa` may edit it while this runs, because a change to a shape they both consume is a
change to this plan. Once this is in `completed/`, contract edits belong to `main`.

`pyquest/tsconfig.json` is the same problem in a smaller file. Every Lane A track — `db`,
`api`, `spa` — eventually appends one line to the same `references` array. It is held by
whichever track holds `in-progress/`; two tracks editing it concurrently is a conflict in
a four-line file, which is the annoying kind.

## Out of Scope

Anything that touches Postgres or HTTP. If a function here needs a database, it belongs in
the API and this plan has gone wrong.

---

## Plan Review

Reviewed 2026-08-29; response evaluated the same day. Four points accepted, four merged
with narrower scope, two rejected — the reviewer looked for `invasions.ts` in
`packages/content` rather than `packages/engine`, and proposed provisional version names
for a private workspace package whose only two consumers do not exist yet.

The `standings` scope question it raised was ruled: leaderboard only, with `sources`,
`bounties` and `medalTotals` split out as above.

Full review: `planning/needs-review/completed/2026-08-29-the-engine-query-layer-and-the-shared-contract.md`

---

## Status

**Final Status:** Completed
**Track:** engine
**Completed:** 2026-08-29
**Completed By:** Claude (Opus 5)

### Outcomes

- `packages/contract` — schemas in both directions. Payloads for the six queries plus
  `sources`; progress rows for the three tables the queries read.
- `packages/engine/src/queries.ts` — `availableQuests`, `areaProgress`, `bossState`,
  `dueInvasions`, `standings`. `level` was already built on 2026-08-28 and is consumed here.
- 199 tests across the workspace, `tsc -b` clean from `pyquest/`.
- **Thirty-three seeded mutants, all killed.** Four survived their first pass and each was the
  test being wrong rather than the code; the tests were fixed and re-run before this closed.

### Deviations

- **Phase 1 was one-directional as written.** It specified what the API returns and said nothing
  about what the database hands the engine, while `feature_progress-schema` already depended on
  this package for "the shapes the repository returns". The input half was added mid-plan.
- **`standings` gained an `area` parameter.** The signature table said `(items, progress per
  player)`, but `areaXp` is "xp this area" on the Party artboard and cannot be computed without
  one. The completion record itself still spans every area, so a player ahead still shows the
  areas behind.
- **The engine imports the contract, which the plan originally forbade.** §6.7 forbids I/O, not
  package references; a type-only import is erased under `verbatimModuleSyntax`, so zod never
  reaches the engine's runtime path. Value imports are still refused in `src/`, which is why
  `INVASION_QUEUE_CAP` is restated there rather than imported.
- **Two files were not in `Files Expected to Change`:** `pyquest/vitest.config.ts`, whose alias
  map makes a package visible to the suite, and `pyquest/packages/engine/package.json`, which
  needed the dependency for the type import to resolve.
- **Two edges the plan did not name, ruled during execution.** An overtaken estimate holds the
  total at no less than what is cleared, so a partial area never reports "6 of 5"; and a forced
  review for a concept with no ladder row is skipped rather than thrown, since a ladder row is
  written when a concept is first taught and a corrupt row should not stop a session.
- Phase 3's property tests live in `tests/queries.test.ts` beside the examples rather than in a
  file of their own. They are four `it` blocks in a `properties` describe.

### Lessons Learned

- **A negative test passes vacuously against a module that does not exist.** The first RED
  reported 8 of 15 "passing", because `expect(() => X.parse(...)).toThrow()` is satisfied by `X`
  being `undefined`. A resolution-error RED proves the suite runs; it proves nothing about the
  assertions. Only the mutants did that.
- **Boundary tests written in terms of the constant they bound prove nothing.** `TOP_RUNG_BOUND`
  could drift from 4 to 9 with every rung test still green, because the cases were written as
  `TOP_RUNG_BOUND + 1`. Pin the literal, or assert against the other definition.
- **The blind spot was where the fixtures were uniform.** §5.10's "only Cleared unlocks anything"
  survived two mutants because every fixture carrying a medal also carried Cleared. A quest
  holding Ironman alone — elective depth, no progression — was a case the examples never built.
- Restating a constant across a dependency boundary is survivable if something holds both at
  once. `TOP_RUNG_BOUND` against `INVASION_LADDER` is asserted in the engine's suite, the only
  place both are in scope.

### Backlog Items Created

None. `xpSources` ships its shape in the contract but has no engine function yet; whether it
lands in the engine or the API is noted in the Approach and belongs to whoever gets there first.
