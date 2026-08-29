# The SPA

**Status:** Planned
**Track:** spa
**Date:** 2026-08-28
**Author:** Claude (Opus 5)
**Lane:** A — **not blocked by the API**

## Objective

Build the nine screens from `docs/design/pyquest/` as a Vite + React application, against
`@pyquest/contract` with stubs, so it can be finished and reviewed before the API exists.

## Why it is not blocked, and what makes that safe

The SPA never talks to the API directly — it talks to the contract. Stubs implement the
same zod schemas the API's handlers will, so "unblocked" does not mean "guessing". Without
that shared contract this plan would be inventing shapes and discovering the mismatch at
integration, which is exactly the cost it claims to avoid.

Phase 1 needs nothing at all: the shell, the rail, breadcrumbs, routing and the design
system are pure presentation.

## Success Criteria

- [ ] Nine screens matching the artboards — values lifted from them, not re-derived
- [ ] Every sub-area carries a working breadcrumb; nothing is reachable without a way back
- [ ] The Tome expands in place and pushes content down. **No modal, no overlay, no scrim**
- [ ] Run executes in Pyodide and records nothing; Submit posts to the API (§6.3)
- [ ] Turtle renders in Pyodide (§8)
- [ ] No button label changes with state — asserted per screen, not eyeballed
- [ ] Every screen is legible on the son's laptop at 1366×768, checked on his machine rather
      than in a devtools viewport
- [ ] Every fixture parses through its `@pyquest/contract` schema; a drifted fixture fails
      the suite instead of rendering
- [ ] `npm run typecheck` from `pyquest/` covers this app and its tests

## Approach

**The artboards are the specification.** Colours, type ramp, spacing and the biome palette
come from `docs/design/pyquest/*.dc.html`. Read the values; do not round them to a 4/8px
grid or substitute a framework default.

Type is Archivo Black over IBM Plex Sans and Mono. Icons are the inline SVGs already drawn
in the rail — copy them rather than reaching for an icon library.

**The turtle-to-canvas shim (§8, roughly one to two days).** Turtle does not render in
Pyodide unaided, and Area 0 and 1 are turtle graphics start to finish. Six weeks of
text-only drills will lose a learner who chose creative art as an interest. This is the
one piece of SPA work that is on the *curriculum's* critical path rather than the app's,
so it should not be scheduled last.

Its tests are the filter kind: draw a square, assert four strokes at the right
coordinates. A canvas that renders something is not evidence — an untouched turtle canvas
already holds items, which the Area 0 harness learned the hard way.

**What the UI owns, and the engine does not.** The DC ≥ 20 warning triangle. The `~` on an
estimated total. A zero payout rendering as `brag`. Greyed-but-present medal slots. Every
one of these is a presentation decision the engine deliberately does not make (§5.1).

**The contract is a parser, not a promise.** `packages/contract` landed on 2026-08-29 and
exports the schemas this app renders: `AvailableQuestsSchema`, `AreaProgressSchema`,
`BossStateSchema`, `DueInvasionsSchema`, `StandingsSchema`, `XpSourcesSchema`, `LevelSchema`.

Every fixture goes through `.parse()` in a test. This is the SPA's half of a discipline the
engine already keeps in the other direction, and without it "stubs implement the same zod
schemas the API's handlers will" is an intention rather than a fact — a fixture is just an
object literal, and an object literal agrees with whatever you believed when you typed it.

**`xpSources` has nothing to swap to.** Its shape ships in the contract so this app is not
blocked, but no engine function and no endpoint stands behind it yet; whether it lands in the
engine or the API is still open. Every other stub becomes a real fetch at Phase 5. This one
does not, so Phase 5's "one module changes" is true of eight screens and the Party screen is
the exception. Better said here than discovered there.

**What a filter test is, when the output is a DOM.** `test-filter-development` is not
satisfied by a screen that renders. The plan already says this about the turtle canvas — "a
canvas that renders something is not evidence" — and the same holds for every screen here.

RED must be a failing assertion, not a missing import: a component that does not exist yet
fails to resolve, which proves the runner works and nothing about the test.

The filter is the artboard. Assert the values it specifies, not that markup appeared: the
token a surface actually uses, the breadcrumb's presence *and* its target, that a label reads
the same in both states, that the Tome's expansion adds no element with a dialog role, that an
unearned medal slot is present and greyed rather than absent. Query by role and accessible
name, so a test breaks when the name a screen reader would announce changes.

Then seed mutants, because that is what decides whether any of the above was worth writing:
substitute a framework default for an artboard token; delete a breadcrumb; make a label
state-dependent; render the Tome as an overlay; hide an unearned medal slot; drop the `~` from
an estimated total; drop the DC ≥ 20 warning. A suite that survives those is measuring that
React ran.

**The workspace wiring, which is less than it looks.** Nothing imports an app — `apps/*` are
leaves, and only `packages/*` are depended upon — so `apps/web` needs no entry in
`pyquest/tsconfig.json`'s `references` and no alias in `vitest.config.ts`. That is why this
track shares no build file with `api` or `db`, and it is worth knowing, because the engine
plan's review was right that a package missing from those lists is silently skipped.

What this app does need is its own `typecheck` and `test` scripts. Root `npm run typecheck`
fans out with `--workspaces --if-present` as of 2026-08-29, so a workspace without the script
is not checked and does not say so. The fan-out was added after `tsc -b` alone was found blind
to every test file in the repository.

## Phases

### Phase 1 — shell and design system [needs nothing]

The workspace entry first: `apps/web` with its own `package.json`, `tsconfig.json`, and the
`typecheck` and `test` scripts the root fan-out looks for. Then tokens from the artboards, the
72px rail with its six destinations, breadcrumbs as a component, routing, and the Tome's
expand-in-place behaviour. No data.

### Phase 2 — screens against stubs

The nine screens rendering contract shapes from fixtures. Reviewable, clickable, and
honest about being stubbed.

Fixtures live in one module and are parsed, not asserted to be right: a `fixtures.test.ts`
that runs every one through its schema is the cheapest possible guard against the SPA and the
API drifting while both believe they agree.

### Phase 3 — the Quest screen for real [ASYNC]

CodeMirror, Pyodide, Run. The prototype's Submit already parses the editor rather than
counting clicks — keep that property: a Submit that passes on unchanged code is a lie
about the mechanic.

### Phase 4 — the turtle shim [ASYNC, and do not schedule it last]

### Phase 5 — swap stubs for the API

One module changes. If more than one does, the contract was not doing its job — with the
`xpSources` exception named above, which stays stubbed until something implements it.

## Dependencies / Prerequisites

- `packages/contract` — **done**, `planning/completed/feature_engine-query-layer_2026-08-28.md`.
  Both directions of the shapes, and the query layer behind them
- The artboards, which exist
- The API, **only at Phase 5**

## Files Expected to Change

- `pyquest/apps/web/**` — new
- `infra/compose/web.yml` — the `web` service, development only; this track owns the
  file, and the root `docker-compose.yml` is not the place

## Track discipline

This track shares no file with `api` or `db`. The one it used to — `infra/docker-compose.yml`
— became `infra/compose/web.yml`, which this track owns
(`planning/completed/feature_compose-fragments_2026-08-29.md`). `apps/web` is a leaf that
nothing imports, so it needs no line in the root `tsconfig.json` or `vitest.config.ts` either.

All three Lane A tracks can therefore run at once, which was the point of tracking them.

## Out of Scope

Authoring. §6.10 makes `new:quest` and `validate:content` a CLI on purpose; a content
editor in the browser is a different product.

## Anticipated Backlog

- Whether the son's 1366×768 laptop wants a narrower rail or smaller type — measurable
  only on his machine
- Offline behaviour when the parent's machine is off. He can still write code; he cannot
  Submit. What the app says then is unanswered and he will meet it on a Saturday
