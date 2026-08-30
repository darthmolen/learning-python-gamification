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

- [ ] `curriculum/area-3/` complete in the Area 0 layout, **thirteen sessions** — 12 or 14
      only by an explicit merge or split, named and argued in the README
- [ ] All sixteen Area 3 concepts covered, with the README naming the thinnest and saying so
      honestly
- [ ] **Every exercise imports `world` from `curriculum/lib/` and none of them touches raw
      Ursina.** Enforced, not asserted: `verify.py` greps every file under `exercises/` and
      `reference/` for `Entity(`, `from ursina` and `import ursina`, and **fails on any hit**.
      A rule nothing checks is a wish
- [ ] **No exercise or quest places more than the measured block cap**, and `verify.py`
      asserts the placement count rather than trusting the author's arithmetic. The cap is
      whatever the shim plan measured on the son's laptop, not the spike's RTX 5090 number
- [ ] `py -3.14 verify.py` reports N of N, running headless with no window — by
      monkeypatching `world.start`, per the contract below
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
Take the number from the shim plan's the son's laptop measurement and write every exercise under it.

An exercise that invites a triple nested loop needs its ranges chosen so the product stays
under the cap. That is a design constraint on the *exercise*, and `verify.py` should assert
it rather than trust it.

**What the shim does not do, so nobody designs into it.** The surface is three names and the
negative space is as load-bearing as the positive. There is:

- **no block removal** — nothing deletes or replaces a placed block
- **no rotation and no scale** — every block is axis-aligned and one unit
- **no colour outside `BLOCKS`** — a kind maps to a colour, and that mapping is the only
  palette. `place(x, y, z, 'lime')` is a `ValueError`, by design
- **no camera control** — `start()` frames what was placed and that is the whole camera story
- **no animation, no per-frame update, no input handling, no collision, no physics**
- **no persistence** — nothing saves or loads a world. That is Area 6

So an Area 3 exercise cannot ask him to mine a block, spin a shape, tint one cube red, fly
the camera, or reload yesterday's build. Those all read like natural Minecraft beats, which
is exactly why they need naming — an author reaching for one will find nothing there.

**If a session genuinely needs a fourth name, that is a change to
`planning/feature_world-shim_2026-08-28.md`, argued there, not a workaround here.** Each
addition costs vocabulary he has not earned, which is the whole reason the shim exists.

### DC band

Area 0 ran 5–18, Area 1 runs 8–20, Area 2 runs 5–22. **Area 3 runs 10–24**, and the floor
rises for a reason: by week nine nothing in this area is a single new idea. A list is a list
*and* iteration *and* indexing on the first day, because an inventory that cannot be read is
not an inventory.

Boss 3 sits at **24**. It is a working crafting simulator with a real recipe book — nested
structures, lookup, validation and a person judging the result — and it is the first item
that asks him to hold a data shape in his head across a whole file.

Six weeks is long enough that the band should be visibly climbing across it. Sessions 1–4
sit at 10–14, sessions 5–9 at 14–18, sessions 10–13 at 18–22, boss at 24. The README records
the number and the reason, the way Area 0 did.

### Verifiers — `local-repo` from here on

He left the sandbox at 2b and does not go back. `scaffold.ts` already defaults to
`local-repo` for any area above 1, so the tooling agrees.

Quests are `local-repo`: tests run against a path in **his** repository. Boss 3 — a working
crafting simulator with a real recipe book — is `local-repo` plus `peer-signoff`, with three
theme framings per §5.2, and §5.3's rule holds as it does for every boss: **it must run from
a clean clone on the other person's machine.**

§5.2 target again: **five quests, any three unlocking the boss.** Do not chain them.

### The VS Code rung

`planning/backlog/feature_vscode-profile-and-tool-quests_2026-08-28.md` restores breakpoints
and the Run and Debug view here, because nested loops and dict iteration are where stepping
becomes revelatory. It is a `peer-signoff` quest: the parent watches him set a breakpoint and
step to the failing line, then presses the button.

That stub already names the single best feature for this curriculum — **the exception
breakpoint, which stops at the moment `KeyError` is raised with the whole inventory still on
screen.** That is Area 0's *errors are readable* promise made interactive, three areas later,
on a bug this area produces naturally. Build a session around it.

**The `breakpoints` prerequisite is satisfied.** `main` landed it on 2026-08-29 —
`planning/completed/feature_shared-index-and-concepts_2026-08-29.md`, commits `d3eb9f7`
(spec §4) and `c90202e` (the registry) — and it was proved in both directions before that
plan closed: an area 3 quest tagged `breakpoints` scaffolds and validates, and the same tag
at area 2 is still refused. This track is not blocked on it and does not add it; the id is
already there.

### The quest matrix

Seven items: five quests, Boss 3, and the VS Code rung. The verifier column earns its place
here because the rung is the one `peer-signoff` item in an otherwise `local-repo` area.

| id | Title | Session | Primary concepts | Resurfaces | Verifier | DC |
|---|---|---|---|---|---|---|
| `a3-the-inventory` | The Inventory | 2 | `list`, `indexing`, `len`, `iteration` | `for`, `range` | `local-repo` | 10 |
| `a3-pick-it-up` | Pick It Up | 4 | `mutation`, `list-methods` | `list`, `iteration` | `local-repo` | 12 |
| `a3-the-hotbar` | The Hotbar | 6 | `slicing`, `indexing` | `list`, `len` | `local-repo` | 14 |
| `a3-set-a-breakpoint` | Set A Breakpoint | 8 | `breakpoints` | `dict`, `nesting` | `peer-signoff: dm` | 12 |
| `a3-the-recipe` | The Recipe | 9 | `dict`, `dict-methods`, `in` | `list`, `iteration` | `local-repo` | 16 |
| `a3-what-am-i-missing` | What Am I Missing | 11 | `set`, `in` | `dict`, `list` | `local-repo` | 18 |
| `a3-the-crafting-table` | **Boss 3 — The Crafting Table** | 13 | `nested-structures`, all sixteen | everything | `local-repo` | **24** |

That is six quests against §5.2's five, because the breakpoints rung is a tool quest rather
than a collections quest and should not displace one. Any three of the five collections
quests unlock the boss; the rung is elective depth. Boss 3 carries `requires: []` for the
reason Area 1's plan sets out — the 3-of-5 rule is `bossUnlocked(clearedQuestCount)` in the
engine and nothing reads `requires`. Three theme framings per §5.2.

**One verifier per item, never two.** `VerifierSchema` is a discriminated union on `type`, so
"`local-repo` + `peer-signoff`" — which an earlier draft of this matrix wrote for Boss 3 — is
not expressible. Boss 3 is **`local-repo`**: a crafting simulator is testable, recipes in and
items out, which is exactly what `local-repo` runs against his repository. That differs from
Boss 2, whose win condition *is* the clone and so needs a person. §5.3's clean-clone rule
still binds here — it binds every boss — but it is a standing rule the dm enforces, not the
verifier type.

**File counts follow the verifier column**, and Area 3's are not Area 1's. `scaffold.ts`
writes a starter only for `hidden-tests`, which §6.3 confines to Areas 0–1, so **Area 3 ships
no starters.** It writes a test file for `hidden-tests` and `local-repo`, so the five
`local-repo` items get one each and the `peer-signoff` breakpoints rung gets none: **seven
YAML, seven briefs, no starters, five tests.**

`tuple`, `sorted`, `min` and `max` are taught and drilled but carry no quest of their own.
That is honest rather than an oversight, the way Area 0 said `bool` was thin: a quest whose
whole content is "call `sorted`" is make-work, and they appear inside the six above.

### `verify.py` for a headless 3D area

Area 0's harness suppressed a turtle window and counted pen-down moves. This one has a
different problem: `start()` opens a real OpenGL window and calls `app.run()`, which blocks.

The harness needs to run every exercise **without** reaching `app.run()`, and assert on what
was placed instead of on what was drawn — block count, kinds used, coordinates in range,
and the cap. The shim plan's requirement that `import world` be safe without a display is what
makes this possible, so the two plans have to agree on it.

**The mechanism, named rather than left to the implementer.** For each exercise, in order:

1. `import world`, then **replace `world.start` with a recording no-op** before the exercise
   is imported. Nothing else is patched, and the exercise is not edited to suit the harness —
   it ships the same `start()` call he types.
2. Import the exercise as a module. Its top-level code runs, places blocks, and calls the
   stand-in `start`, which returns instead of opening a window.
3. Assert against `world`'s placement record: count within the cap, every kind a real
   `BLOCKS` key, coordinates inside the exercise's stated bounds, and `start` called exactly
   once — a file that places blocks and never calls `start()` draws nothing when he runs it.
4. Reset the shim's module state between exercises, since `BLOCKS` and the placement list are
   module-level and one exercise's blocks must not leak into the next file's count.

Monkeypatching the seam is chosen over authoring exercises with a `verify.py` entry point on
purpose: **the file he runs is the file the harness runs.** Area 0's `verify.py` earned that
rule the hard way, and an exercise shaped to be testable is an exercise that no longer looks
like the thing he writes.

Plus the raw-Ursina grep from the success criteria — `Entity(`, `from ursina`, `import
ursina` anywhere under `exercises/` or `reference/` fails the run.

## Phases

### Phase 1 — the DM guide, and the shim's numbers

`dm-guide.md` first, as always. Named stalls for this area: the off-by-one on `range` inside a
nested loop; mutating a list while iterating it; `dict` key errors on a typo; the tuple he
tried to assign into; the set he expected to keep its order. Each with the exact question.

Invasion drills now span Areas 0, 1 and 2 as well as 3 — thirty-nine concepts on the
1/3/7/16/35 ladder, hand-run until the engine ships. This is where doing it by hand gets
genuinely heavy, so the DM guide carries **a selection rule, not an instruction to
prioritise** — "prioritise rather than pretend" is the same empty advice as "ask a Socratic
question," and Area 0's guide exists to refuse exactly that.

The rule, keeping Area 0's three-questions-per-session format:

1. **One from the last session's material** — the 1-day rung, always due.
2. **One from the lowest rung anywhere across the thirty-nine** — the concept that has gone
   longest untouched. Ties broken by area, oldest first, since Area 0's vocabulary is the
   most at risk of quiet decay and the least likely to be missed.
3. **One from a concept this session is about to need.** Retrieval immediately before use is
   the cheapest kind, and it doubles as the session's warm-up.

Thirty-nine concepts at three per session over thirteen sessions is thirty-nine slots, so
rule 2 alone will not cover everything and is not meant to. The guide says which concepts are
deliberately drilled most and why, the way Area 1's coverage line does.

**The block cap gate, with a stop/go rule.** Confirm the measured cap from the shim plan
before any exercise is written. If `feature_world-shim_2026-08-28.md` has not landed its
the son's laptop measurement — as of 2026-08-29 it is still `Status: Planned` and `curriculum/lib/`
does not exist — then:

- **Stop:** anything that places a block. No exercise, no reference solution, no quest
  starter, no session beat with a coordinate in it. Writing against a guessed cap and
  rewriting later is worse than waiting, because the ranges are baked into the prose.
- **Go:** `dm-guide.md`, the README outline, the concept spine below, the invasion drills,
  the DC band, the quest matrix, and the parts of session plans that are about *collections*
  rather than *placement* — an inventory is a list whether or not it renders.

Roughly half this area can be written before the shim measures anything, and that half is
the half that takes longest.

### Phase 2 — sessions and exercises, in two halves [ASYNC internally]

**The spine is fixed first, as the last deliverable of Phase 1, and it is what makes the
split real.** Without it the two halves silently disagree. It is five things:

1. **Session count and titles** — thirteen, per the success criteria.
2. **The concept resurfacing map** — which concept is re-touched in which later session, so
   the second half knows what the first half has already established.
3. **The DC band per session block** — 10–14, 14–18, 18–22, boss at 24.
4. **The quest beats** — which session each of the seven items attaches to, per the matrix.
5. **The `world` usage rules** — the cap, the three-name surface, and the out-of-scope list.

Then sessions 1–7 (lists through tuples) and sessions 8–13 (dicts through nested structures)
can be authored independently. Roughly 35–45 `.py` files, each carrying `# concepts:`,
`# dc:`, `# expect:`, tagging what it **resurfaces** as well as what it introduces.

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

- **`feature_world-shim_2026-08-28.md` must be complete**, including its laptop measurement,
  before any block is placed. **It creates `curriculum/lib/world.py`; this track assumes that
  file exists and never writes it** — `curriculum/lib/` is not in Files Expected to Change
  below, and if an exercise needs the shim changed, that is an edit to the shim plan. As of
  2026-08-29 the shim is `Status: Planned` and `curriculum/lib/` does not exist, so the
  stop/go rule in Phase 1 governs what may be written meanwhile.
- [x] **The `breakpoints` concept id is landed** — `main` did it on 2026-08-29 (`c90202e`),
  recorded in `planning/completed/feature_shared-index-and-concepts_2026-08-29.md`. Without
  it the VS Code rung quest would fail `validate:content` on `concept-above-area`. **This
  track never waited on Area 2 for it**, and does not now.
- Ursina installed and pinned on both machines.
- The son's repository exists and he can push to it — Area 2a.

## Files Expected to Change

- `curriculum/area-3/**` — new, the whole area
- ~~`content/areas/area-3.yml` — new~~ — **transcribed on 2026-08-29** and no longer this
  plan's to create. It carries the spec's title and §5.2's estimate of five, marked
  `authoring: partial`. This plan flips that to `complete` when the five quests exist,
  which is an edit to one word rather than a new file
- `content/quests/a3-*.yml` — new, **seven**: five collections quests, the breakpoints rung,
  and Boss 3
- `content/briefs/a3-*.md` — new, **seven**: every item has a brief
- `content/tests/a3-*_test.py` — new, **five**, the `local-repo` items only
- `content/starters/a3-*.py` — **none**; starters are a `hidden-tests` artifact and §6.3
  confines that to Areas 0–1
**Owned by other tracks, not this one:** `curriculum/README.md` (`main`) and
`planning/backlog/feature_vscode-profile-and-tool-quests_2026-08-28.md` (`area-2`). The Area 3
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
