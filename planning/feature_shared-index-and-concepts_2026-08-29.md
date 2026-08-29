# Shared Files the Area Tracks Cannot Own

**Status:** Planned
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
- [ ] `npm run validate:content` exits 0
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

Add the `breakpoints` entry to the Area 3 block of `concepts.ts`. `npm run validate:content`
exits 0. Own commit, so the crossing is legible from Lane B.

### Phase 3 — the index

Fix the two stale `packages/content/` paths in `curriculum/README.md`. Add a line naming
`main` as the owner of the status table and saying why — three tracks want it, one writes it.

### Phase 4 — the disjointness check

Re-run the check across the three area plans and the world shim plan; no path may appear in
two in-progress plans.

## Dependencies / Prerequisites

- None. This is the plan everything else waits on.

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
