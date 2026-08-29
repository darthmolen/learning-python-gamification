# Shared Files the Area Tracks Cannot Own

**Status:** In Progress
**Track:** main
**Date:** 2026-08-29
**Author:** Claude (Opus 5)
**Lane:** A and B — this is the seam, which is why no area track may hold it

## Objective

Land the two files that every Lane B area track would otherwise edit — `concepts.ts` and
`curriculum/README.md` — so that `area-1`, `area-2` and `area-3` have disjoint file sets and
can run in parallel.

## Why this exists

`plan-workflow` admits a plan to `in-progress/` only when its `Files Expected to Change` set
is disjoint from every other in-progress plan's. The three area plans failed that check on
two files, and one unlisted read dependency:

- `curriculum/README.md` — all three wanted its status table; Area 1 also wanted to fix two
  stale `packages/content/` paths in it.
- `pyquest/packages/content/src/concepts.ts` — Area 2 adds `breakpoints` at area 3, and Area
  3's VS Code rung quest fails `validate:content` without it. Area 1 and Area 3 never write
  this file but every one of them *reads* it through the validator, so an id moving under a
  running track breaks that track. An unlisted read is still a collision.

Pulling both to `main` and landing them first removes the collision and also removes the
Area 3 → Area 2 dependency entirely: with the id already in place, Area 3 waits on nothing
but the world shim.

## Success Criteria

- [ ] Spec §4 Area 3 vocabulary carries `breakpoints`, with `debugger` still at Area 7
- [ ] `concepts.ts` carries `{ id: 'breakpoints', label: 'breakpoints', area: 3 }`
- [ ] `cd pyquest && npm run validate:content` exits 0
- [ ] `curriculum/README.md`'s two `packages/content/` paths read `pyquest/packages/content/`
- [ ] `curriculum/README.md` states that its status table is maintained by the `main` track,
      so a future area track does not reach for it again
- [ ] All three area plans' file sets are disjoint — verified, not assumed

## Approach

**The `breakpoints` decision is not made here.** It is made and argued in
`planning/feature_area-2-scribes-rite-and-sandbox_2026-08-28.md`: `breakpoints` at area 3 for
stepping and the Variables panel, `debugger` at area 7 for the deep pass. This plan is the
hand that lands it, on a track no area holds.

**It is two files, not one.** `concepts.ts` opens by stating that it is authored directly
from the area vocabularies in spec §4, one entry per vocabulary item, and that nothing else
may add to it. So the spec's Area 3 vocabulary line gains `breakpoints` first, and the
registry follows it. Adding the id without the spec entry would break the rule the file
declares about itself — the same class of shortcut the validator exists to refuse.

**This touches the document of record.** §4's Area 3 vocabulary is a one-word addition to
one line, and it needs a human yes before it happens.

Noted while reading, not fixed here: `concepts.ts` carries `dict-methods` at area 3 and §4's
Area 3 line does not list it. The one-entry-per-vocabulary-item claim already has at least
one exception. Worth a sweep, on its own plan.

## Phases

### Phase 1 — the spec entry

Add `breakpoints` to §4's Area 3 vocabulary line. Confirm §4 Area 7 still carries the
debugger, so the two-passes reading survives. Own commit, `[SPEC]`.

### Phase 2 — the registry

Add the `breakpoints` entry to the Area 3 block of `concepts.ts`. `cd pyquest && npm run
validate:content` exits 0 — every npm command in this repository runs from `pyquest/`. Own
commit, so the crossing is legible from Lane B.

### Phase 3 — the index

Fix the two stale `packages/content/` paths in `curriculum/README.md`.

Then the ownership line, and **it has a place.** It goes directly after the status table,
beside the existing one-line spec pointer — not under `## Conventions`, which is scoped to
authoring rules "established by Area 0 and worth keeping". Track ownership is board
mechanics, and filing it there would bury it from the person it is written for. Say who
writes the table and why: three tracks want it, one writes it.

### Phase 4 — the disjointness check

**Disjointness is a property of plans that are in progress at the same time**, so check the
pairs that can actually coexist, and record the rest as sequenced rather than clean:

| Pair | Can coexist? | What must hold |
|---|---|---|
| area-1 ↔ area-2 ↔ area-3 | yes | file sets disjoint — this is the check that motivated the plan |
| world-shim ↔ area-1, area-2 | yes — the shim blocks only Area 3 | file sets disjoint |
| **this plan** ↔ world-shim | **no** — Track discipline gates it | nothing. Both edit the spec, and they are never open together |
| **this plan** ↔ any area | **no** — this is the gate | nothing |

The last two rows are the point: an overlap that cannot happen is not a collision to fix,
and treating it as one would deadlock a board that is working correctly.

## Dependencies / Prerequisites

- **Approval to edit spec §4.** One word on the Area 3 vocabulary line, but it is the
  document of record and Approach says it needs a human yes. **Phase 1 does not start
  without it**, and every later phase depends on Phase 1 — so this is the plan's only
  real blocker, and it is a person rather than a file.

Nothing else. Downstream, this is still the plan everything waits on.

## Files Expected to Change

- `docs/specs/2026-08-26-gamified-python-curriculum-design.md` — §4 Area 3 vocabulary, one word
- `pyquest/packages/content/src/concepts.ts` — one entry, `breakpoints` at area 3
- `curriculum/README.md` — two stale paths, plus the ownership note

## Track discipline

This plan is a **gate, not a parallel track.** It runs alone in `in-progress/`, completes,
and only then do the area tracks launch. That matters, because it edits the spec and so does
`feature_world-shim_2026-08-28.md` — the disjointness rule governs plans that are in progress
*at the same time*, and these two never are. Do not start the shim, or any area, until this
one is in `completed/`.

## Out of Scope

Any area content. This plan writes no session, no exercise and no quest — it clears the seam
and stops.

**Reconciling any other spec/registry mismatch, including the `dict-methods` discrepancy
noted in Approach.** That finding is worth keeping visible and worth a sweep; it is not
worth widening this plan. One word lands, and the plan closes. A gate that grows while it
is open stops being a gate.
