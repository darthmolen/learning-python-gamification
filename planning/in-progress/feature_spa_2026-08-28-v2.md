# The SPA

**Status:** In Progress
**Version:** v2 — revised 2026-08-29 after two reviews; admitted to the `spa` track 2026-08-29
**Track:** spa
**Date:** 2026-08-28
**Author:** Claude (Opus 5)
**Lane:** A — **not blocked by the API**
**Supersedes:** v1, whose review is the audit trail at
`planning/needs-review/completed/2026-08-29-the-spa.md`

## What changed in v2, and what did not

The first review raised twelve points. Seven were accepted, four were merged with changes,
one was rejected, and one was resolved by a scope decision rather than a design.

**Accepted and now in the plan:** the nine screens and their routes are enumerated; Phase 4
is a phase rather than a heading; Phase 5's swap has a named seam (`src/gateway/`) built in
Phase 2 instead of assumed; the phase dependency graph is stated; the son's laptop check is a Phase 2
exit condition instead of an unowned criterion; `apps/` is said outright not to exist; and
Phase 2's contract dependency is narrowed to the schemas.

**Merged with changes, because the reviewer was half right:**

- *The vitest claim.* The review called "no alias in `vitest.config.ts`" false. It is not —
  the plan said no alias **for `apps/web`**, which is true of a leaf nothing imports. But
  underneath sat a real problem the review missed, and it is worse: root `test` is a bare
  `vitest run` that does not fan out, so it collects `apps/web`'s DOM tests into a `node`
  environment with no jsdom. `packages/contract/dist/` also exists on disk, so an app-local
  config without the source alias parses fixtures against compiled output. Both are now
  written up, and `pyquest/vitest.config.ts` has joined **Files Expected to Change**.
- *The schema naming.* The review wanted `DueInvasionSchema` and `DueInvasionsSchema` both
  named to stop an implementer wiring the wrong one. The sharper point is that the collection
  schema carries the §5.4 cap and the dedup refinement that the entry schema cannot, so a
  fixture checked entry-by-entry is green while violating the spec. That became a rule, not a
  naming note.
- *Phase 1 "needs nothing".* It meant no upstream dependency, which is true and is the plan's
  whole point. Scaffolding is still real work, so the marker is now `[no upstream dependency]`
  and the scaffold is listed.
- *Accessibility.* The plan already required querying by role and accessible name, but that is
  a test method, not an acceptance bar. There is now a criterion.

**Rejected:** the review said Phase 3 was not implementable because "the prototype" had no
citation and, by implication, no existence. The prototype exists at
`docs/design/pyquest/pyquest-campaign-ui.html` and the plan's claim about it is true — its
Submit handler reads the editor state through an `isFixed` check rather than counting clicks.
The missing citation was fair and has been added; the conclusion drawn from it was not.

**Resolved by scope decision, not design:** offline behaviour. The review wanted disabled,
error and retry states defined before Phase 2. v1 has none of them, deliberately — the stack
is always available by household arrangement. The item moved to
`planning/backlog/feature_offline-and-eventual-consistency_2026-08-29.md`, reframed as the
eventual-consistency problem it becomes if PyQuest ever leaves the house. See **Out of Scope**.

**What a second review should look hardest at:** this track now touches a root file
(`pyquest/vitest.config.ts`), which is a change to its own track-discipline claim.

## Objective

Build the nine screens from `docs/design/pyquest/` as a Vite + React application, against
`@pyquest/contract` with stubs, so it can be finished and reviewed before the API exists.

## Why it is not blocked, and what makes that safe

The SPA never talks to the API directly — it talks to the contract. Stubs implement the
same zod schemas the API's handlers will, so "unblocked" does not mean "guessing". Without
that shared contract this plan would be inventing shapes and discovering the mismatch at
integration, which is exactly the cost it claims to avoid.

Phase 1 needs no upstream work: the shell, the rail, breadcrumbs, routing and the design
system are pure presentation. It is not free — the app does not exist yet and has to be
scaffolded — but nothing it needs is waiting on another track.

## The nine screens, and their routes

Six rail destinations (§6.8), which have no ancestor and therefore no breadcrumb:

| Screen | Route | Artboard |
|---|---|---|
| Map | `/map` | `CampaignMap.dc.html` |
| Tome | `/tome` | `Tome.dc.html` |
| Defend | `/defend` | `Defend.dc.html` |
| Party | `/party` | `Party.dc.html` |
| Journal | `/journal` | `Journal.dc.html` |
| Console | `/console` | `Console.dc.html` |

Three sub-areas, reached through a place and never from the rail, each carrying the full
breadcrumb trail:

| Screen | Route | Artboard |
|---|---|---|
| Area | `/area/:areaId` | `Area.dc.html` |
| Quest | `/area/:areaId/quest/:questId` | `Main.dc.html` |
| Boss | `/area/:areaId/boss` | `Boss.dc.html` |

`Main.dc.html` is the Quest screen — it is the artboard carrying Run, Submit, Datamine and
the medal slots, which is §6.8's definition of that surface. The name is a leftover; the
route and the component are `Quest`.

The Tome is both a rail destination and an overlay, and the same component serves both. As
an overlay it expands in place and closes rather than navigating, so it has no breadcrumb
in either role.

## Success Criteria

- [ ] Nine screens matching the artboards — values lifted from them, not re-derived
- [ ] Every sub-area carries a working breadcrumb; nothing is reachable without a way back
- [ ] The Tome expands in place and pushes content down. **No modal, no overlay, no scrim**
- [ ] Run executes in Pyodide and records nothing; Submit posts to the API (§6.3)
- [ ] Turtle renders in Pyodide (§8)
- [ ] No button label changes with state — asserted per screen, not eyeballed
- [ ] Every screen reachable and operable by keyboard, every control carrying an accessible
      name. Not a full WCAG pass — that is a different plan — but a screen no keyboard can
      reach is not finished
- [ ] Every screen is legible on the son's laptop at 1366×768, checked on his machine rather
      than in a devtools viewport. **This is a Phase 2 exit condition** (see below)
- [ ] Every fixture parses through its `@pyquest/contract` schema **at the collection level**;
      a drifted fixture fails the suite instead of rendering
- [ ] `npm run typecheck` from `pyquest/` covers this app and its tests, and `npm test`
      runs its DOM tests in an environment that has a DOM

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

**Parse at the collection schema, not the entry schema.** The contract exports both halves
of several shapes — `DueInvasionSchema` and `DueInvasionsSchema`, `QuestCardSchema` and
`AvailableQuestsSchema`, `StandingSchema` and `StandingsSchema`, `XpSourceSchema` and
`XpSourcesSchema` — and **the rules live on the collection**. `DueInvasionsSchema` carries
the §5.4 queue cap and the one-entry-per-concept refinement; `DueInvasionSchema` cannot
carry either, because a single entry cannot know about the others. A fixture validated
entry-by-entry is green while violating the spec. Bind the outer schema.

**`xpSources` has nothing to swap to.** Its shape ships in the contract so this app is not
blocked, but no engine function and no endpoint stands behind it yet; whether it lands in the
engine or the API is still open. Every other stub becomes a real fetch at Phase 5. This one
does not, so Phase 5's "one module changes" is true of eight screens and the Party screen is
the exception. Better said here than discovered there.

**The gateway seam, which is what makes Phase 5 cheap.** Phase 5 claims one module changes.
That is only true if there is a module — so build it in Phase 2, before there is anything to
swap. Every contract surface is reached through `src/gateway/`, which owns the fixture in
Phase 2 and the `fetch` in Phase 5, and nothing under `src/screens/` imports from
`src/fixtures/` at all. A test asserts that: a screen reaching past the gateway fails the
suite rather than being found at integration. Without this the swap is a nine-screen edit
wearing a one-module claim.

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
an estimated total; drop the DC ≥ 20 warning; validate a fixture against the entry schema
instead of the collection schema; import a fixture straight into a screen. A suite that
survives those is measuring that React ran.

**The workspace wiring, which is less than it looks in one direction and more in another.**
Nothing imports an app — `apps/*` are leaves, and only `packages/*` are depended upon — so
`apps/web` needs no entry in `pyquest/tsconfig.json`'s `references` and no *new* alias in
`vitest.config.ts` pointing at itself. That is why this track shares no build file with `api`
or `db`. The existing package aliases stay exactly as they are.

What this app does need is its own `typecheck` and `test` scripts. Root `npm run typecheck`
fans out with `--workspaces --if-present` as of 2026-08-29, so a workspace without the script
is not checked and does not say so. The fan-out was added after `tsc -b` alone was found blind
to every test file in the repository.

**Root `test` does not fan out, and that is a trap.** Root `test` is a bare `vitest run`. It
globs every test file from `pyquest/`, excluding only `node_modules` and `dist`, so it
**will** collect `apps/web`'s tests — into a run whose `environment` defaults to `node` and
which has no jsdom. Every DOM test fails on a missing `document`, and it will look like the
tests are wrong rather than the config.

Worse, and quieter: `packages/contract/dist/` exists on disk right now. A separate
`apps/web`-local vitest config that does not replicate the `@pyquest/contract` → source alias
resolves fixtures against **compiled output**, so `fixtures.test.ts` can be green against a
contract that has since changed. That is precisely the failure the root config's comment was
written to prevent, and inheriting the aliases is the whole fix.

So Phase 1 configures vitest `projects` (vitest is 4.1.11 — the old `workspace` file is gone),
giving `apps/web` the jsdom environment while inheriting the source aliases.

## Phases

### Phase 1 — shell and design system [no upstream dependency]

`pyquest/apps/` **does not exist**. All of this is net-new, and the `apps/*` workspace glob in
the root `package.json` currently matches nothing.

The workspace entry first: `apps/web` with its own `package.json`, `tsconfig.json`, and the
`typecheck` and `test` scripts the root fan-out looks for. Scaffold Vite, Vitest, jsdom,
Testing Library and the React plugin, and add the vitest `projects` entry described above —
without it Phase 2's first DOM test fails for a reason that has nothing to do with Phase 2.

Then tokens from the artboards, the 72px rail with its six destinations, breadcrumbs as a
component, routing for all nine routes, and the Tome's expand-in-place behaviour. No data.

### Phase 2 — screens against stubs [requires Phase 1]

The nine screens rendering contract shapes from fixtures. Reviewable, clickable, and
honest about being stubbed.

`src/gateway/` lands here, one module per contract surface, and screens read only from it.

Fixtures live in one module and are parsed, not asserted to be right: a `fixtures.test.ts`
that runs every one through its **collection** schema is the cheapest possible guard against
the SPA and the API drifting while both believe they agree.

**Exit condition: the son's laptop check.** Before this phase is reviewed, all nine screens are
opened at 1366×768 on the son's actual laptop. A devtools viewport does not answer the
question — it has his resolution and none of his font rendering, scaling, or browser.

**The check is an observation, not a gate.** If a screen comes back cramped, that opens a
backlog item and gets noted in the Phase 2 review; it does not block Phase 2, and Phases 3
and 4 start regardless. The point of running it here is to learn the answer while the layout
is still soft, not to hold nine finished screens hostage to a rail that is eight pixels too
wide. The one thing that would block is a screen he cannot *use* at that resolution — content
he cannot reach at all, rather than content that is tight.

### Phase 3 — the Quest screen for real [requires Phase 2; parallel with Phase 4]

CodeMirror, Pyodide, Run.

The reference is `docs/design/pyquest/pyquest-campaign-ui.html`, whose Submit already parses
the editor rather than counting clicks — its handler reads `this.state.code` through an
`isFixed` check rather than incrementing on click. Keep that property: a Submit that passes
on unchanged code is a lie about the mechanic.

Note that the file is a **compiled** single-file export — it is a behavioural reference to
read, not source to copy. Its status vocabulary is worth keeping too (`Submit · passed`,
`Submit · failed`, `Run · browser`), because it puts state next to the button instead of
inside its label, which is how the no-changing-labels rule survives contact with a status.

### Phase 4 — the turtle shim [requires Phase 2; parallel with Phase 3; **do not schedule it last**]

§8 budgets one to two days. Areas 0 and 1 are turtle graphics start to finish, so this sits on
the curriculum's critical path rather than the app's — it gates teaching, not shipping.

**Deliverables:**

- A `turtle` module importable from learner Python in Pyodide, covering the subset Areas 0–1
  actually use: `forward`, `backward`, `left`, `right`, `goto`, `penup`, `pendown`, `pensize`,
  `pencolor`, `circle`, `speed`, and `done`/`exitonclick` as no-ops
- A drawing protocol between the Python side and the canvas — a serialisable list of stroke
  commands, not direct canvas calls, so the strokes can be asserted without a canvas
- The Pyodide boundary decided and written down: worker or main thread. A worker keeps a
  `while True:` from freezing his tab, which is week-three material (§6.6) and is therefore
  the default; if it goes on the main thread instead, say why here
- The canvas renderer that consumes the protocol

**Acceptance:** `forward(100); right(90)` four times produces exactly four strokes at the
expected coordinates, asserted against the protocol rather than against pixels. `speed()` and
`done()` are callable and change nothing. A learner program that raises mid-drawing leaves the
strokes it already made on screen, because that is how he will debug.

**The mutant that decides it:** drop the fourth stroke and the suite must fail. A canvas that
renders something is not evidence — an untouched turtle canvas already holds items.

### Phase 5 — swap stubs for the API [requires the API]

`src/gateway/` changes and nothing else does. If a screen needs editing, the seam was not
doing its job — with the `xpSources` exception named above, which stays stubbed until
something implements it.

## Dependencies / Prerequisites

- `packages/contract` — **done**, `planning/completed/feature_engine-query-layer_2026-08-28.md`.
  Phases 1 through 4 need **only the schemas** — the query layer shipped behind them in the
  same plan, but nothing here calls the engine at runtime
- **The content surface — done, `81dc3ab`, Wave 3.** `AreaIdentitySchema`,
  `AreaIdentitiesSchema` and `WeekRangeSchema` in `packages/contract/src/payloads.ts`, sourced
  from `content/areas/*.yml`. Phase 1 discovered the contract carried no area title at all and
  shipped a hardcoded table instead; Phase 2's Map, Area screen and every area breadcrumb were
  blocked on this and are not any more. All eight manifests now carry `weeks` and `blurb`
- The artboards, which exist
- The API, **only at Phase 5**

## Files Expected to Change

- `pyquest/apps/web/**` — new
- `pyquest/vitest.config.ts` — the `projects` entry that gives `apps/web` a DOM. This is the
  one root file this track touches; it is additive, and no other track has a projects entry
- `infra/compose/web.yml` — the `web` service, development only; this track owns the
  file, and the root `docker-compose.yml` is not the place

## Track discipline

This track shares no file with `api` or `db` **except one**. The file it used to share —
`infra/docker-compose.yml` — became `infra/compose/web.yml`, which this track owns
(`planning/completed/feature_compose-fragments_2026-08-29.md`). `apps/web` is a leaf that
nothing imports, so it needs no line in the root `tsconfig.json` and no alias of its own in
`vitest.config.ts` — but it does need the `projects` entry above, which is why that file is
now listed as changing.

**`pyquest/vitest.config.ts` is a coordination point, not a disjoint file.** This track makes
the first `projects` entry there. That is additive and no other track has one *today*, but
that is an observation about right now rather than a structural guarantee: the moment the file
has a `projects` array, any later track needing an entry edits the same array. `api` and `db`
are node-side and have no obvious reason to want jsdom, so the collision is unlikely — but
"unlikely" is the honest word, not "impossible".

So: the three Lane A tracks can run at once **with explicit coordination on this one file**.
A later track that needs a `projects` entry coordinates rather than assuming disjointness, and
whoever hits it second should expect to merge rather than to own.

## Out of Scope

Authoring. §6.10 makes `new:quest` and `validate:content` a CLI on purpose; a content
editor in the browser is a different product.

**Offline and degraded states.** v1 treats the stack as always available — the parent's
machine stays on, locked-screen, by arrangement. No reachability flag, no disabled Submit, no
retry affordance. This is a scope decision rather than an oversight, and the reasoning is in
`planning/backlog/feature_offline-and-eventual-consistency_2026-08-29.md`: the thing that
reopens it is a second machine, and by then the problem is eventual consistency rather than
button copy.

## Anticipated Backlog

- Whether the son's 1366×768 laptop wants a narrower rail or smaller type — measurable
  only on his machine, and Phase 2's exit condition is when we find out
- Where `xpSources` is implemented, engine or API. The Party screen stays stubbed until
  it is answered
