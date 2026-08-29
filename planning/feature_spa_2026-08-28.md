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
- [ ] No button label changes with state
- [ ] Every screen is legible on the son's laptop at 1366×768

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

## Phases

### Phase 1 — shell and design system [needs nothing]

Tokens from the artboards, the 72px rail with its six destinations, breadcrumbs as a
component, routing, and the Tome's expand-in-place behaviour. No data.

### Phase 2 — screens against stubs

The nine screens rendering contract shapes from fixtures. Reviewable, clickable, and
honest about being stubbed.

### Phase 3 — the Quest screen for real [ASYNC]

CodeMirror, Pyodide, Run. The prototype's Submit already parses the editor rather than
counting clicks — keep that property: a Submit that passes on unchanged code is a lie
about the mechanic.

### Phase 4 — the turtle shim [ASYNC, and do not schedule it last]

### Phase 5 — swap stubs for the API

One module changes. If more than one does, the contract was not doing its job.

## Dependencies / Prerequisites

- `packages/contract` from `planning/feature_engine-query-layer_2026-08-28.md`
- The artboards, which exist
- The API, **only at Phase 5**

## Files Expected to Change

- `pyquest/apps/web/**` — new
- `infra/compose/web.yml` — the `web` service, development only; this track owns the
  file, and the root `docker-compose.yml` is not the place

## Out of Scope

Authoring. §6.10 makes `new:quest` and `validate:content` a CLI on purpose; a content
editor in the browser is a different product.

## Anticipated Backlog

- Whether the son's 1366×768 laptop wants a narrower rail or smaller type — measurable
  only on his machine
- Offline behaviour when the parent's machine is off. He can still write code; he cannot
  Submit. What the app says then is unanswered and he will meet it on a Saturday
