# Area 3 — Collections

**Status:** Planned
**Track:** area-3
**Date:** 2026-08-28
**Author:** Claude (Opus 5)
**Lane:** B — **blocked by `feature_world-shim_2026-08-28.md`**

## Objective

Author the largest area in the campaign — sixteen concepts over six weeks, weeks 9–14 —
plus Boss 3 The Crafting Table, with Minecraft data as the vehicle and Ursina arriving
behind the three-name shim.

## Why this exists

This is the area the whole design has been walking toward. Areas 0 and 1 draw pictures;
Area 2 gets him out of the sandbox. **Area 3 is where the subject becomes the thing he
actually cares about**, because inventories are lists, crafting recipes are dicts and block
palettes are sets — the mapping is exact, and it is the reason §4 chose Ursina over `mcpi`
despite the slower start. Every area's work survives into the next and the capstone is the
culmination rather than a fresh start.

It is also the longest and the most likely to sag. Six weeks and sixteen concepts is more
than twice Area 0, and the plan needs to say where the mid-area slump lands and what carries
it.

## Success Criteria

- [ ] `curriculum/area-3/` complete in the Area 0 layout, twelve to fifteen sessions
- [ ] All sixteen Area 3 concepts covered, with the README naming the thinnest and saying so
      honestly
- [ ] **Every exercise imports `world` from `curriculum/lib/` and none of them touches raw
      Ursina.** A single `Entity(` in the exercises directory is a failure of this plan
- [ ] **No exercise or quest places more than the measured block cap.** The cap is whatever
      the shim plan measured on the son's laptop, not the spike's RTX 5090 number
- [ ] `py -3.14 verify.py` reports N of N, running headless with no window
- [ ] Five `a3-` quests plus Boss 3, all `local-repo`, `npm run validate:content` exits 0
- [ ] The Area 3 VS Code rung ships: breakpoints and the Run and Debug view, as a
      `peer-signoff` quest tagged `breakpoints`
- [ ] Area 3 reported to the `main` track for the `curriculum/README.md` status table

## Approach

**The sixteen concepts**, verbatim from `pyquest/packages/content/src/concepts.ts`:
`list` · `indexing` · `slicing` · `mutation` · `list-methods` · `tuple` · `dict` ·
`dict-methods` · `set` · `iteration` · `nested-structures` · `len` · `in` · `sorted` ·
`min` · `max`.

Plus `breakpoints`, which the Area 2 plan registers at area 3 for exactly this area's rung.

### The vehicle carries the ordering

Lean on the Minecraft mapping rather than inventing a second framing. Each collection type
should arrive **because the previous one could not do the job**, which is §4's stated
sequencing rule: each area's project makes the next concept necessary, and inside this area
each session's project should make the next collection necessary.

A defensible spine, to be argued in the README:

1. **`list`, `indexing`, `len`, `iteration`** — an inventory. A row of blocks placed from a
   list is the first payoff and it arrives in session 1.
2. **`mutation`, `list-methods`** — picking up and dropping. `append` and `remove` are what
   an inventory *is*.
3. **`in`, `min`, `max`, `sorted`** — "do I have enough stone", "what is my tallest tower".
   Small, cheap, and they make session 2's list answer questions.
4. **`slicing`** — the hotbar is the first nine slots of the inventory.
5. **`tuple`** — a coordinate. It arrives when he needs a thing that should *not* be mutated,
   which is the only honest reason tuples exist, and `place(x, y, z, kind)` has been handing
   him coordinates since session 1.
6. **`dict`, `dict-methods`** — a recipe. This is the midpoint and the strongest session in
   the area.
7. **`set`** — a block palette, and "which blocks does this recipe need that I do not have".
   Set difference is the first time a one-liner replaces a loop he already wrote.
8. **`nested-structures`** — a recipe book: a dict of dicts. This is Boss 3's shape and the
   last two sessions rehearse it.

**Where the slump is.** Weeks 11–12, after `slicing` and before `dict` — the material is
correct and unglamorous. Schedule the weakest sessions there deliberately, the way Area 0
scheduled session 4 between its two strongest and said in writing that cutting it short was
fine. `tuple` is the thinnest concept in the area and it should be allowed to be.

### The shim, and the hard authoring cap

Every exercise begins `import world` and uses `BLOCKS`, `place(x, y, z, kind)` and `start()`.
Nothing else. The shim's whole justification is that 9 of 9 raw-Ursina lines would be
vocabulary he has not earned.

**The block cap is a hard authoring constraint, not a guideline.** Three nested `range(20)`
loops — which this area actively teaches him to write in the `nested-structures` sessions —
is 8,000 blocks, and unfused that measured 14.9 fps. `start()` fuses, so the fused number is
what matters, but the cap exists because his machine is not the machine the spike ran on.
Take the number from the shim plan's laptop measurement and write every exercise under it.

An exercise that invites a triple nested loop needs its ranges chosen so the product stays
under the cap. That is a design constraint on the *exercise*, and `verify.py` should assert
it rather than trust it.

### Verifiers — `local-repo` from here on

He left the sandbox at 2b and does not go back. `scaffold.ts` already defaults to
`local-repo` for any area above 1, so the tooling agrees.

Quests are `local-repo`: tests run against a path in **his** repository. Boss 3 — a working
crafting simulator with a real recipe book — is `local-repo` plus `peer-signoff`, with three
theme framings per §5.2, and §5.3's rule holds as it does for every boss: **it must run from
a clean clone on the other person's machine.**

§5.2 target again: **five quests, any three unlocking the boss.** Do not chain them.

### The VS Code rung

`planning/completed/feature_vscode-profile-and-tool-quests_2026-08-28.md` restores breakpoints
and the Run and Debug view here, because nested loops and dict iteration are where stepping
becomes revelatory. It is a `peer-signoff` quest: the parent watches him set a breakpoint and
step to the failing line, then presses the button.

That stub already names the single best feature for this curriculum — **the exception
breakpoint, which stops at the moment `KeyError` is raised with the whole inventory still on
screen.** That is Area 0's *errors are readable* promise made interactive, three areas later,
on a bug this area produces naturally. Build a session around it.

The `breakpoints` concept id must already exist in `concepts.ts`. The Area 2 plan argues for
it; `main` lands it before either track starts, in
`planning/feature_shared-index-and-concepts_2026-08-29.md`. If it is missing, this plan is
blocked on that prerequisite and must not add it itself — that edit is `main`'s.

### `verify.py` for a headless 3D area

Area 0's harness suppressed a turtle window and counted pen-down moves. This one has a
different problem: `start()` opens a real OpenGL window and calls `app.run()`, which blocks.

The harness needs to run every exercise **without** reaching `app.run()`, and assert on what
was placed instead of on what was drawn — block count, kinds used, coordinates in range,
and the cap. The shim plan's requirement that `import world` be safe without a display is what
makes this possible, so the two plans have to agree on it.

## Phases

### Phase 1 — the DM guide, and the shim's numbers

`dm-guide.md` first, as always. Named stalls for this area: the off-by-one on `range` inside a
nested loop; mutating a list while iterating it; `dict` key errors on a typo; the tuple he
tried to assign into; the set he expected to keep its order. Each with the exact question.

Invasion drills now span Areas 0, 1 and 2 as well as 3 — thirty-nine concepts on the
1/3/7/16/35 ladder, hand-run until the engine ships. This is the area where doing that by hand
gets genuinely heavy, and the DM guide should say so and prioritise rather than pretend.

Confirm the measured block cap from the shim plan before any exercise is written.

### Phase 2 — sessions and exercises, in two halves [ASYNC internally]

Sessions 1–7 (lists through tuples) and sessions 8–13 (dicts through nested structures) can be
authored independently once the spine is fixed. Roughly 35–45 `.py` files, each carrying
`# concepts:`, `# dc:`, `# expect:`, tagging what it **resurfaces** as well as what it
introduces.

Reference solutions in `reference/` are Datamine payloads under §5.5 — the parent's copy.

### Phase 3 — `verify.py`

Headless. Assert on placements, not pixels. Enforce the block cap. Record the count.

### Phase 4 — the content items

Five quests and Boss 3, plus the breakpoints `peer-signoff` quest. Scaffold, fill, write the
hidden tests, `validate:content` to zero.

Note: `pyquest/packages/content/fixtures/broken/many-problems/quests/a3-the-crafting-table.yml`
exists and is a **deliberately broken validator fixture**. It is not prior art, it is not a
draft, and its README says do not fix it.

### Phase 5 — README, journal, board

Session table, the ordering argument, DC choices, concept coverage, the verify count, the
block cap and where it came from — all in `curriculum/area-3/README.md`. Journal entries
continue — committed and pushed now, since Area 2a shipped that. Report the status line to
`main` for `curriculum/README.md` rather than editing the index.

## Dependencies / Prerequisites

- **`feature_world-shim_2026-08-28.md` must be complete**, including its laptop measurement.
  The cap it produces is an input to every exercise here.
- **`main` must have landed the `breakpoints` concept id**, or the VS Code rung quest fails
  `validate:content` on `concept-above-area`. This is a prerequisite of the `main` track, not
  of `area-2` — with the id landed up front, this track does not wait on Area 2 at all.
- Ursina installed and pinned on both machines.
- The son's repository exists and he can push to it — Area 2a.

## Files Expected to Change

- `curriculum/area-3/**` — new, the whole area
- `content/areas/area-3.yml` — new
- `content/quests/a3-*.yml` + briefs and tests — new, seven items (five quests, one boss,
  one breakpoints quest)
**Owned by other tracks, not this one:** `curriculum/README.md` (`main`) and
`planning/completed/feature_vscode-profile-and-tool-quests_2026-08-28.md` (`area-2`). The Area 3
rung ships here and is recorded in `curriculum/area-3/README.md`; the stub's status note is
written once, by the track that owns it.

## Out of Scope

Raw Ursina, in the curriculum or the quests. If an exercise needs something the shim's three
names cannot express, either the exercise is wrong for Area 3 or the shim needs a fourth name
— and the second one is a change to the shim plan, argued there, not a workaround here.

Anything under `pyquest/` or `infra/`. `concepts.ts` is **not** edited by this plan; Area 2
already did it.

Making these playable in a browser. Ursina needs a real OpenGL context and Pyodide has none.
Area 3 is `local-repo` and that is the design, not a limitation.
