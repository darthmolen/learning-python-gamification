---
kind: plan
status: in-progress
track: area-3
date: 2026-08-28
---

# Area 3 — Collections

**Status:** In progress
**Track:** area-3
**Date:** 2026-08-28
**Author:** Claude (Opus 5)
**Lane:** B
**Rewritten:** 2026-08-31 — the shim landed and the tree moved underneath this plan; see
*Rewritten against the two-tree layout* below

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
- [ ] **`curriculum/area-3/lesson.md`** — the draft is published today; this plan is what
      promotes it. Renaming `lesson.draft.md` to `lesson.md` is the act, and it may only
      happen once the sessions exist to have tested the prose against a real evening
- [ ] **Everything educational lands under `curriculum/area-3/`** — sessions, drills, briefs,
      starters and hidden tests. `game/area-3/quests/` gets the quest YAML and nothing else.
      `rm -rf game/` must still leave Area 3 valid and publishable
- [ ] **The glossary and the marks stay valid** — added 2026-09-06, after
      `feature_the-lesson-defines-its-own-words_2026-09-04` landed two validator rules this
      plan predates. `glossary-gap`: every concept `concepts.ts` assigns to area 3 needs a
      `## <id>` section in `curriculum/area-3/glossary.md`, and every heading there must be a
      concept of *this* area. `unknown-mark`: every `[[id]]` in a lesson or a brief must name
      a real concept. Area 3 satisfies both today — all seventeen are defined — so this
      criterion is about not breaking them. **Marks are lesson-and-brief syntax only.**
      Session plans, the DM guide and the area README are not lesson-shaped and must not
      carry `[[marks]]`; the validator does not scan them, so a mark there would render as
      literal brackets to a reader

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

> **Corrected 2026-09-06 — the paragraph above is wrong, and the session was authored
> against the correction.** The exception breakpoint belongs to `debugger` at **Area 7**, not
> to `breakpoints` at Area 3. The split was settled on 2026-08-29 (`c90202e`) and is recorded
> in `tools/vscode/README.md` under *The concept ids, settled*:
>
> > `breakpoints` is registered at **area 3** — stepping and the Variables panel. `debugger`
> > stays at **area 7** for the deep pass: conditional breakpoints, exception breakpoints,
> > logpoints, the call stack. Two concepts, two passes, per §3 principle 7.
> >
> > … It belongs to `debugger` at Area 7, not to `breakpoints` at Area 3, and **Area 7's
> > author should be told so.**
>
> Building session 8 around break-on-raise would have authored Area 7 material into Area 3 —
> and tagging it honestly would have failed `concept-above-area`, which is the validator
> working as designed rather than an obstacle.
>
> **What session 8 teaches instead:** setting a breakpoint, stepping, and reading the
> Variables panel — with a `KeyError` on a dict as the bug being *hunted*. The KeyError is
> still the vehicle; the break-on-raise feature is not. `a3-set-a-breakpoint` is unaffected,
> because its `peer-signoff` win condition is already the Area 3 half: the DM watches them
> set a breakpoint and step to the failing line.
>
> **Area 7's author is hereby told**, per the instruction above: the exception breakpoint is
> the strongest debugger feature for this curriculum, and Area 3 session 8 leaves it a
> ready-made example — `s8e2_the_key_that_is_not_there.py` raises exactly the `KeyError`
> worth stopping on.

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

**No `journal/` directory, following Area 2 — corrected 2026-09-06.** This plan's file list
originally said `journal/**`, which was the Area 0 and Area 1 layout. Area 2 dropped it
deliberately and argued it in its README: the learner's `journal.md` moved into *their* own
repository at session 2a-2, and duplicating `TEMPLATE.md` into every area would produce eight
copies of one file that must never disagree. Area 0's template and first-entry prompt remain
the only copies. Journal *prompts* still appear in each session plan's Beat 5, which is where
a DM actually reads them; only the directory goes.

## Dependencies / Prerequisites

- [x] **`feature_world-shim_2026-08-28.md` is complete** — closed to `planning/completed/`,
  and `curriculum/lib/world.py` exists with its laptop measurement taken. **This track uses
  that file and never writes it**; `curriculum/lib/` is not in Files Expected to Change below,
  and an exercise that needs the shim changed is an edit to the shim plan, argued there. The
  stop/go rule in Phase 1 no longer governs anything and is left as the record of how this
  plan expected to proceed while blocked.
- **Copy `curriculum/lib/world.py` into his repository, at Area 3 start** — the shim plan
  completed 2026-08-31 and deliberately left this undone, so that one copy stays one copy
  while the shim's surface can still move; `curriculum/lib/README.md` carries the command and
  the rule that it is copied again whenever it changes.
- [x] **The `breakpoints` concept id is landed** — `main` did it on 2026-08-29 (`c90202e`),
  recorded in `planning/completed/feature_shared-index-and-concepts_2026-08-29.md`. Without
  it the VS Code rung quest would fail `validate:content` on `concept-above-area`. **This
  track never waited on Area 2 for it**, and does not now.
- Ursina installed and pinned on both machines.
- The son's repository exists and he can push to it — Area 2a.

## Files Expected to Change

**Rewritten 2026-08-31 for the two-tree layout.** `content/` no longer exists; everything
educational is in `curriculum/` and the game's overlay is `game/`.

- `curriculum/area-3/sessions/**` — new: thirteen session plans, each with its
  `session-<n>/` directory of drills beside it
- `curriculum/area-3/exercises/<slug>/**` — new, **seven**: `BRIEF.md` for every item, and
  `hidden/test.py` for the five `local-repo` ones. **No `starter/`** — starters are a
  `hidden-tests` artifact and §6.3 confines that to Areas 0–1
- `curriculum/area-3/lesson.md` — **promoted from `lesson.draft.md`**, not written fresh.
  The draft is live now; this plan earns the rename
- `curriculum/area-3/reference/**`, `dm-guide.md`, `README.md`, `verify.py` — new. The Area 0
  layout **minus `journal/`**, which Area 2 dropped on purpose; see Phase 5
- `curriculum/area-3/area.yml` — **held, not created.** It exists and carries the spec's
  title, weeks and blurb. This plan flips `authoring: partial` to `complete` when the five
  quests exist, which is an edit to one word
- `game/area-3/quests/a3-*.yml` — new, **seven**: five collections quests, the breakpoints
  rung, and Boss 3

Each quest's `brief:` and `verifier.tests:` are paths **into the curriculum root**, of the
form `area-3/exercises/<slug>/BRIEF.md`. That cross-root reference is validated; a typo is a
failed `validate:content` rather than a broken page.

**Owned by other tracks, not this one:** `curriculum/README.md` (`main`). The Area 3 rung
ships here and is recorded in `curriculum/area-3/README.md`; the status table is written once,
by the track that owns it.

## Out of Scope

Raw Ursina, in the curriculum or the quests. If an exercise needs something the shim's three
names cannot express, either the exercise is wrong for Area 3 or the shim needs a fourth name
— and the second one is a change to the shim plan, argued there, not a workaround here.

Anything under `pyquest/` or `infra/`. `concepts.ts` is **not** edited by this plan; Area 2
already did it.

Making these playable in a browser. Ursina needs a real OpenGL context and Pyodide has none.
Area 3 is `local-repo` and that is the design, not a limitation.

---

## Rewritten against the two-tree layout — 2026-08-31

This plan was written on 2026-08-28 against a repository that no longer exists in that shape.
Two things changed under it, and both were rewritten rather than annotated, because a queued
plan whose file list names deleted directories is a plan that fails on its first command.

**`content/` is gone.** `curriculum/` now holds every educational artifact — sessions, drills,
briefs, starters and hidden tests — and `game/` holds the quest overlay and nothing that
teaches. So the seven `a3-` briefs are no longer `content/briefs/a3-*.md`; they are
`curriculum/area-3/exercises/<slug>/BRIEF.md`, beside the sessions that teach them, and the
quest YAML points across the root boundary at them. `Files Expected to Change` is rewritten
accordingly. Nothing about the *work* changed — thirteen sessions, sixteen concepts, seven
items — only where it lands.

**The shim landed.** `feature_world-shim_2026-08-28.md` is in `completed/` with its laptop
measurement taken, so this plan is no longer blocked and Phase 1's stop/go rule no longer
governs anything. It is left in place as the record of how the plan expected to proceed while
it was blocked, which is worth more than a clean deletion.

**A third thing appeared that this plan could not have anticipated: `lesson.md`.** The Field
Manual now publishes a teaching body per area, and Area 3's is live today as
`lesson.draft.md` — written ahead of the sessions, labelled a draft on the page and on the
index. That changes this plan's job in a useful way: **the lesson is no longer something to
write, it is something to earn.** The rename from `lesson.draft.md` to `lesson.md` is the
plan's own sign-off that the prose survived contact with thirteen real evenings. A draft that
gets promoted without a session behind it is exactly the "authored, plausible, never run"
failure this repository keeps finding.

**What was deliberately not touched.** The Approach and Phases sections are the argument for
*how to teach Area 3* — where the mid-area slump lands, why Ursina behind a three-name shim,
which concepts carry which sessions. None of that depends on directory names and none of it
has been weakened by the move. Rewriting prose that is still correct would have buried the two
changes that matter.

---

## Status — 2026-09-06, Phases 1 and 2a

**Working record, not a close.** Sessions 8–13 and all seven content items remain.

### Done

| Phase | State |
|---|---|
| 1 — DM guide, and the spine | **complete** — `dm-guide.md` covers sessions 1–7; the spine is `README.md`'s session table, fixing all thirteen titles, concepts and quest beats before the second half is written |
| 2a — sessions 1–7 and their drills | **complete** — seven session plans, fifteen drills, two reference solutions |
| 3 — `verify.py` | **complete, and pulled forward** — see below |
| 4 — the content items | not started |
| 5 — README, board | README authored; the status line still has to be reported to `main` |

### The one deviation from the phase order, and why

**`verify.py` was built before the drills rather than after them.** The plan puts it in
Phase 3, after both halves of Phase 2. Writing twenty-odd drill files against no harness
would have shipped them unverified, which this plan's own success criteria forbid —
*"`verify.py` asserts the placement count rather than trusting the author's arithmetic"* and
*"a rule nothing checks is a wish."* Each drill was then verified as it was written.

That decision was vindicated within the hour, for a reason nobody planned: see below.

### Verification actually performed

```console
$ cd curriculum/area-3 && py -3.14 verify.py
17 of 17 exercises behaved as tagged.
EXIT: 0

$ py -3.14 -m ruff check curriculum/area-3/
All checks passed!

$ cd pyquest && npm run validate:content
OK  no problems found -- 23 items across 8 areas
EXIT: 0

$ cd pyquest && npx vitest run
Test Files  71 passed (71)
Tests  1128 passed | 1 skipped (1129)
```

The deletion test (`packages/content/tests/two-roots.test.ts`,
`apps/field-manual/tests/published.test.ts`) passes: `rm -rf game/` still leaves Area 3
validating and publishing. `apps/field-manual/tests/draft.test.ts` confirms Area 3 is still
labelled a draft, which it must be until session 13 exists.

**All six of the harness's checks were seen to fail against seeded mutants before being
trusted** — `planning/evidence/area-3-verify-RED-and-MUTANT.txt`, with
`area-3-verify-NOTES.txt` recording the one mutant that correctly survives and why.

**`pyright` reports four and all four are wanted**, argued in `curriculum/area-3/README.md`:
three are `import world` failing to resolve for a checker pointed at the repository root
(the shim is copied beside the learner's own files, and all seventeen run), and one is the
deliberate `TypeError` in `s7e2_it_will_not_change.py`. No `# pyright: ignore` pragmas in
learner-facing drills.

### Where the plan turned out to be wrong, or incomplete

1. **Three shipped harnesses had silently stopped measuring anything.** Not this plan's
   fault and not in its scope, but found while looking for a harness to model Area 3's on.
   Commit `80e41a3` moved every drill from `exercises/session-<n>/` to
   `sessions/session-<n>/` and no `verify.py` had its `SEARCH` tuple updated. Measured:
   area-0 reported **2 of 22** against a README claiming 19 of 19; area-1 **5 of 15**
   against 35 of 35; area-2 **0 of 2** against 13 of 13. Sixty drill files across three
   areas were checked by nothing.

   Fixed here, on the user's instruction, as one line per file. All three came back to
   exactly the numbers their READMEs already claimed, so **no README needed editing — the
   documentation was right and the gates had drifted away from it.** Evidence in
   `planning/evidence/verify-search-drift-{BEFORE,GREEN-and-MUTANT}.txt`, including a
   mutant that correctly survives because computed values are the hidden tests' job.

   This is the failure this repository keeps naming — *"a check you have not seen fail is
   worth nothing"* — and it had reached the checks themselves.

2. **The in-process `placed.clear()` contract was not needed.** Phase 3's step 4 specifies
   resetting shim module state between exercises. Areas 0–2 run each file in a subprocess
   and Area 3 does the same, so isolation is free and there is no shared state to clear.
   The rest of the named mechanism — patch `world.start` *before* importing, assert on the
   placement record — is unchanged and load-bearing. The ordering especially: an exercise's
   `from world import place, start` binds whatever `world.start` is at that instant, so
   patching afterwards would bind the real one and block forever on `app.run()`.

3. **`# min-blocks:` was added to the tag vocabulary**, mirroring Area 1's `# min-strokes:`.
   Default 0, because plenty of Area 3 exercises are about a list and place nothing at all.
   Without it, an off-by-one in a loop that builds a row is invisible to the harness.

4. **The block cap needed reframing, not renumbering.** The cap stands at ~5,000, but the
   shim plan's measurement found framerate was never the binding constraint — 8,000 blocks
   still renders at 178 fps. Startup is what degrades, at about a millisecond a block. The
   harness's failure message therefore reports the cost in **seconds**, and `README.md` and
   `dm-guide.md` both argue it that way, because an author who believes the cap is about
   smoothness will reason wrongly about what they can spend.

5. **Ruff and the curriculum genuinely conflict in two places**, resolved with `# noqa` plus
   a stated reason, following `area-0/exercises/the-type-lab`'s precedent. `PLR1730` would
   rewrite session 5's teaching loop into `max()` — using the answer to demonstrate not
   needing the answer. `UP003`/`UP034` would delete the parentheses in `type((5))` that are
   the entire demonstration.

### What is still open, and who owns it

- **Sessions 8–13, and the seven content items.** This track.
- **`scaffold.ts` is stale** — it still writes the pre-split flat layout, so
  `npm run new:quest` will misplace Area 3's files. Hand-author the YAML or fix the
  scaffolder; the fix is Lane A's.
- **`pyquest/apps/api/tests/fixtures-agree.test.ts` will fail when Area 3 quests land.** It
  hard-codes five invented `a3-` ids that do not match this plan's matrix. Cross-track, and
  named here so it is not discovered at Phase 4.
- **Boss 3 is gated.** `planning/backlog/feature_area-4-functions_2026-08-28.md`: *"the
  Pygame Zero spike promotes earlier and separately: before Boss 3 is authored."*
- **Two stale files owned elsewhere**, filed as reminders: `curriculum/README.md`'s Area 3
  row still says "blocked on the shim's measurement" (`main`), and
  `curriculum/lib/README.md` still carries the "cap has not been placed on the scaling
  curve" warning box (the shim plan). Both were true until 2026-08-31.

---

## Status — 2026-09-06, Phase 2b (sessions 8–12)

**Working record. Session 13 — Boss 3 — is gated, not forgotten.**

### Done

Sessions 8–12 authored: five session plans, eleven drills, one walkthrough. Area 3 now has
twelve of thirteen sessions and **all seventeen concepts are taught**.

| Session | Introduces | Drills |
|---|---|---|
| 8 — Things By Name | `dict`, `breakpoints` | `s8e1`, `s8e2`, `s8e3`, `w8_the_variables_panel.md` |
| 9 — The Recipe | `dict-methods` | `s9e1`, `s9e2` |
| 10 — A Bag With No Order | `set` | `s10e1`, `s10e2` |
| 11 — What Am I Missing | — | `s11e1`, `s11e2` |
| 12 — A Recipe Book | `nested-structures` | `s12e1`, `s12e2` |

### Verification actually performed

```console
$ cd curriculum/area-3 && py -3.14 verify.py
28 of 28 exercises behaved as tagged.
1 walkthrough(s) are NOT covered here -- there is nothing to execute in them.

$ py -3.14 -m ruff check curriculum/area-3/
All checks passed!

$ cd pyquest && npm run validate:content     OK, 23 items across 8 areas
$ cd pyquest && npm run validate:plans       OK, 117 documents
```

Marks discipline, US spelling and singular-*they* re-checked across the new files; all
three clean. The spelling grep is run without a leading `\b` so it catches `frame_colour`.

### The correction that shaped session 8

**The plan told me to build session 8 around the exception breakpoint. That was wrong**, and
the correction is recorded in place in *The VS Code rung* above. `tools/vscode/README.md`
settled the split on 2026-08-29: `breakpoints` is Area 3 — stepping and the Variables panel
— and `debugger` keeps conditional breakpoints, **exception breakpoints**, logpoints and the
call stack for Area 7. Building the session as instructed would have authored Area 7
material into Area 3, and tagging it honestly would have failed `concept-above-area`.

Session 8 instead teaches setting a breakpoint, stepping, and reading the Variables panel,
with a `KeyError` on a dict as the bug being hunted. `w8_the_variables_panel.md` closes by
naming the feature they do *not* get yet and saying when it arrives, which turns a
limitation into a road marker.

Per that file's own instruction — *"Area 7's author should be told so"* — the record now
says it, and `s8e2_the_key_that_is_not_there.py` is left as a ready-made example.

### Where the plan turned out to be wrong, or incomplete

1. **`# stdin:` had to feed pdb twice, and the first attempt failed silently.**
   `s8e3_stop_and_look.py` calls `breakpoint()` inside a two-pass loop, so the program stops
   twice. Feeding one `c` left pdb reading an empty stdin at the second stop and the file
   failed with **no error text at all** — the emptiest failure the harness has produced. The
   tag carries a comment saying so, because the next author will hit it.

2. **`verify.py` gained walkthrough reporting.** Session 8's debugger rung is done in an
   editor and there is nothing in it to execute. Area 2's harness earned the rule — a run
   that silently ignores what it cannot cover makes its own bottom line mean less than the
   reader thinks — so the count is printed rather than skipped.

3. **Five ruff conflicts across the area, not two.** Sessions 10, 11 and 8 added three more,
   all the same shape: a duplicate set item that *is* the demonstration, `sorted(...)[0]`
   shown deliberately as the wrong answer, and `breakpoint()` itself. All carry `# noqa`
   plus a reason. One near-miss worth recording: a scripted replacement put the `breakpoint`
   pragma on the docstring's example line instead of the code, which would have shipped a
   lint directive inside prose a week-nine learner reads. Caught by grepping every pragma
   and checking it sat on a code line.

4. **`pyright` is now five, not four.** One more `import world`, from `s10e2`. The README
   tracks the count against the four drills that build a world.

### What is still open

- **Session 13 — Boss 3.** Gated on `feature_pygame-zero-viability-spike_2026-09-06.md`,
  which needs the learner's laptop for one sitting. `README.md` has a section arguing the
  gate so a reader does not mistake it for an omission.
- **Session 8's delivery** needs the Run and Debug view restorable on the target machine —
  `tools/vscode/` still records the Area 2 strip as pending verification. Authoring is not
  blocked; the session plan says what to check and what to say if the strip was never
  applied.
- **The seven content items**, and the two Phase 4 hazards already named: `scaffold.ts`
  writes the pre-split layout, and `fixtures-agree.test.ts` hard-codes five invented `a3-`
  ids that do not match the matrix.
- **`lesson.draft.md` stays a draft.** Twelve sessions is not thirteen.

---

## Status — 2026-09-06, the practice rename

**Caught up to `main`'s ADR 0007 rename.** Instructions came from
`planning/reminders/completed/follow-up_rename-area-3-sessions-to-practices_2026-09-06.md`,
which is now closed with the full record.

`sessions/` → `practices/`, 40 paths moved with `git mv`, 26 drills from `s<n>e<m>` to
`p<n>e<m>`, 228 reference lines rewritten across 45 files, and `practices.yml` added. Every
`exercises` list in it is empty, because `curriculum/area-3/exercises/` does not exist yet —
the quests are this plan's Phase 4, and a slug listed before its directory fails
`practice-missing-exercise`. Practice 13 is absent rather than empty; the numbers run 1..12.

Both spine rules were seeded and watched to fail against Area 3 before being trusted.

### The merge was clean and wrong

`SEARCH` had been repointed at `sessions` by this plan's own harness fix; `main` moved that
directory. Git saw edits to different files and merged them without a murmur. Afterwards
`curriculum/area-0/verify.py` reported **2 of 2 and passed**, having found only
`reference/` — a green gate measuring almost nothing, which is the exact failure the fix
existed to repair, arriving by a different road. All four harnesses now read `practices`.

**A clean merge is not a correct merge, and only running the thing showed the difference.**

### Two defects found in the shipped rename

Both in `curriculum/area-1/verify.py`, both fixed here because reconciling this collision is
this track's job:

1. The sort key was dead — `re.fullmatch(r"session-(\d+)", …)` matches no `practice-N`, so
   output order had collapsed to `practice-6, practice-10, practice-1, …` while its
   docstring still claimed otherwise.
2. A half-renamed sentence: *"Session 3 and Practice 6 each ship a loop…"*

Internal identifiers in areas 0–2 were left alone on purpose — another track's file, and
`main` chose not to rename them.

### One break inherited from `main`, not fixed here

`pyquest/packages/db/tests/schema.test.ts` fails: PR #5 added
`migrations/0007-practice-progress.sql`, which creates `practice_progress`, and the test's
expected table list was never updated. **This branch has not touched `pyquest/` at all** —
`git diff main -- pyquest/` is empty — and Lane A is out of this plan's scope. The fix is one
string in that array. Reported rather than taken.

### Verified

```console
area-0 19/19   area-1 35/35   area-2 13/13   area-3 28/28 (+1 walkthrough uncovered)
ruff curriculum/area-3/   clean          pyright   5, all argued in README.md
validate:content          OK, 23 items   validate:plans   OK, 122 documents
npx vitest run            72 of 73 files pass; the one failure is main's, above
```

---

## Status — 2026-09-06, Phase 4 (six of seven content items)

**Six items authored, proven and landed. Boss 3 remains gated.**

| Item | Practice | Verifier | DC | Tests |
|---|---|---|---|---|
| `a3-the-inventory` | 2 | local-repo | 10 | 9 |
| `a3-pick-it-up` | 4 | local-repo | 12 | 8 |
| `a3-the-hotbar` | 6 | local-repo | 14 | 10 |
| `a3-set-a-breakpoint` | 8 | peer-signoff: dm | 12 | — |
| `a3-the-recipe` | 9 | local-repo | 16 | 9 |
| `a3-what-am-i-missing` | 11 | local-repo | 18 | 11 |
| `a3-the-crafting-table` | 13 | local-repo | 24 | **gated** |

47 hidden tests, green against correct submissions; 23 mutants seeded, 22 caught and one
correctly survived. Each slug is claimed in `practices.yml`, so `unclaimed-exercise` stays
satisfied. `validate:content` reports 29 items across 8 areas.

### The shared design, and why a transcript would not do

Every one of these quests is about a program **answering from its data rather than
remembering an answer**. A test comparing output to a fixed transcript passes a hardcoded
submission — the exact thing being rejected — and reading their source for `len(` or `.get(`
rewards the token rather than the behavior.

So each does self-consistency and then **substitution**: change the data in a copy of their
program and require every answer to follow. Nothing writes to the repository it was given.

### Where the plan turned out to be wrong, or incomplete

1. **A hardcoded hotbar survived the growth check**, because adding items to the *end* leaves
   the first nine unchanged — which is what the check asserts of a correct program, and a
   literal is unchanged too. Fixed with a second substitution that renames the *first* item.
   The original check looked obviously sufficient; only seeding it showed otherwise.

2. **One mutant survived correctly and is recorded as such.** `pop(1)` in place of
   `remove("bread")` removes the same item, so there is no observable difference and the test
   asserts observables. Proven not to be a hole: a mutant whose *label* and *action* disagree
   is caught, naming the move.

3. **Two bugs in my own tests, found by the correct submission failing rather than by a
   mutant.** `\s*` crosses newlines, so an empty `short:` line swallowed the next line — live
   in four files, since every brief here allows an empty value. And the-recipe stocked the
   *recipe* dict instead of the inventory; it now identifies the dict by the keys the program
   printed, which does not depend on guessing variable names. **A test only ever run against
   wrong answers has not been tested.**

4. **`estimatedQuests` was stale at 5 with six quests authored.** Found by the ledger, not by
   a validator. The engine takes `Math.max(estimatedQuests, authored, cleared)` so nothing was
   broken — the API already said 6 — but the file is read by people, and it now says 6 with
   the reasoning written in.

### The ledger fired three times in one day

`fixtures-agree.test.ts` went red at one quest, again at six, and once more with a new
`progress.total` entry. **The fact being recorded — the fixture names quests that do not
exist — never changed; the sentence carrying it was rewritten three times.** That is the
argument for `feature_the-fixture-ledger-compares-facts_2026-09-06.md` made by events rather
than by assertion, and it is worth the plan's author knowing it happened.

### Still open

- **Boss 3**, gated on `feature_pygame-zero-viability-spike_2026-09-06.md` — practice plan,
  brief, hidden test, quest YAML with three themes, and a `## Boss 3` section in the DM guide,
  which has none.
- **`lesson.draft.md` → `lesson.md`**, earned when practice 13 exists.
- **`area.yml`'s `partial` → `complete`**, a person's decision.
- **`curriculum/README.md`'s Area 3 row**, owned by `main`.
- **Not proven and cannot be here:** that any hidden test passes over the real `local-repo`
  path. `PYQUEST_REPO` was pointed at a scratch directory by hand.

---

## Status — 2026-09-06, Boss 3 and the close of authoring

**Every artifact in this plan's Files Expected to Change now exists.**

Boss 3 landed: `exercises/the-crafting-table/BRIEF.md`, a 12-test hidden suite,
`game/area-3/quests/a3-the-crafting-table.yml` with three framings, practice plan 13, and
**`dm-guide.md` §9** — the Boss 3 run sheet, which this guide did not have and Area 2's did.

`lesson.draft.md` → `lesson.md` is done. That rename was this plan's own sign-off and its
condition — thirteen practices existing to have tested the prose against — was **met rather
than waived**.

### The gate was lifted by a decision, and that is recorded

`feature_pygame-zero-viability-spike_2026-09-06.md` gated Boss 3 and is **still queued**. It
was lifted on 2026-09-06 by an explicit instruction, not by the spike clearing, and
`README.md` says so in its own section rather than dropping the gate quietly — a gate that
vanishes without a note is indistinguishable from one nobody noticed.

What made it narrow: **Boss 3's content is pure data work** — a recipe book, an inventory, a
command loop. No graphics, no Pygame Zero, so nothing the spike could find would change a
line of the brief or the test. What the spike still protects is **Area 4's vehicle**, and
that is untouched by this.

### Verification

```console
six hidden suites      9 + 8 + 10 + 9 + 11 + 12 = 59 tests, all green
28 mutants seeded      27 caught, 1 correctly survived
area harnesses         19/19  35/35  13/13  28/28
ruff / pyright         clean
validate:content       OK, 30 items across 8 areas
validate:plans         OK
npx vitest run         73 files, 1151 passed
```

### Where the plan turned out to be wrong, or incomplete

1. **The DM guide had no boss section.** Area 2's carries one for Boss 2 and this plan never
   noticed the omission. A boss night is the one evening where the DM needs a procedure
   rather than a lesson plan. §9 now names what to type at the clean clone, and — the part
   worth having — **which failures count**: a program that crashes on `craft banana` has not
   broken a rule the brief fixes, and the DM says so rather than failing it.

2. **No copy of the boss brief beside the practice plan**, departing from Area 1. Area 1
   keeps `practices/practice-10/sigil-brief.md` alongside `exercises/the-sigil/BRIEF.md` —
   two files that must never disagree, which is the same liability that kept `journal/` out
   of this area. The practice plan points at the brief instead.

3. **Two boss scenarios skip rather than assert.** Crafting twice, and `can` changing its
   answer, cannot be built from every legitimate world — an inventory affording two of
   everything is a valid submission. They return early. Recorded because a test that
   silently does nothing is this repository's recurring failure.

4. **`server.test.ts` used Area 3 as its example of a draft area.** Promoting the lesson
   broke it. The assertion moved to area 4 rather than being weakened, and gained a second
   half asserting area 3 is now announced as finished. When area 7 is done that test wants a
   fixture rather than a real area.

### What is deliberately NOT done

**`area.yml` stays `authoring: partial`.** Every artifact exists, but Areas 1 and 2 set the
rule: `complete` is a person deciding an area is finished, not a consequence of the last file
landing. Two things are open — **no hidden test has run over the real `local-repo` path**,
and **no practice has been delivered to a learner.** Flipping it is the DM's call, not this
plan's.

### Still owned elsewhere

- `curriculum/README.md`'s Area 3 status row (`main`) — still reads "blocked on the shim's
  measurement", now very stale.
- The SPA fixture's five invented `a3-` ids and its five-practice spine
  (`feature_the-fixture-ledger-compares-facts_2026-09-06.md`, PR #7).
- `scaffold.ts`'s pre-split layout, which is why all seven YAML were hand-authored.
