# Area 3 — Collections

**Weeks 9–14. Thirteen sessions of 45–60 minutes.**
Spec: `docs/specs/2026-08-26-gamified-python-curriculum-design.md`, §4 Area 3.

`list` · `indexing` · `slicing` · `mutation` · `list-methods` · `tuple` · `dict` ·
`dict-methods` · `set` · `iteration` · `nested-structures` · `len` · `in` · `sorted` ·
`min` · `max` · `breakpoints`

**Vehicle: Minecraft data.** Inventories are lists. Crafting recipes are dicts. Block
palettes are sets. The mapping is not a metaphor — it is what those things are, and it is
the reason §4 chose Ursina over `mcpi` despite the slower start.

**This is the area the design has been walking toward.** Areas 0 and 1 drew pictures; Area
2 got them out of the sandbox. Here the subject becomes the thing they actually care about,
and every week of it survives into the capstone rather than being discarded at week 37.

Graphics arrive through **`curriculum/lib/world.py`**, a three-name shim, never through
Ursina directly. `dm-guide.md` §3 has the surface and — more importantly — the six things
that are deliberately not in it.

---

## Authoring status

**Partially authored. Sessions 1–7 are complete; sessions 8–13 are not written.**

| Part | State |
|---|---|
| `area.yml` | **complete** — title, weeks, blurb, `authoring: partial` |
| `glossary.md` | **complete** — all seventeen concepts defined |
| `lesson.draft.md` | **a draft, deliberately** — see below |
| `dm-guide.md` | **complete for sessions 1–7**; §4 grows a second stall section with 8–13 |
| `verify.py` | **complete**, and proven against six seeded mutants |
| Sessions 1–7 and their drills | **complete** |
| Sessions 8–13 and their drills | **not started** |
| `reference/` | **complete for sessions 1–7** |
| `exercises/` — seven briefs | **not started** |
| `game/area-3/quests/` — seven YAML | **not started** |

**`lesson.draft.md` stays a draft, and the rename is the sign-off rather than a
formality.** The Field Manual publishes it today, labelled a draft on the page and on the
index. It is promoted to `lesson.md` when thirteen sessions exist to have tested the prose
against real evenings. A draft promoted without a session behind it is exactly the
"authored, plausible, never run" failure this repository keeps finding — most recently in
its own harnesses, which had silently stopped measuring anything at all.

`area.yml` stays `authoring: partial` until the five quests exist. `estimatedQuests: 5` is
§5.2's rule of five, not a count of anything written, and the UI renders it with a tilde.

---

## The sessions

The spine. Sessions 8–13 are fixed here **before** they are written, because two halves
authored against different assumptions silently disagree, and the disagreement surfaces at
Boss 3 where it is most expensive.

| # | Title | Introduces | Resurfaces | Quest |
|---|---|---|---|---|
| 1 | The Row Of Blocks | `list`, `iteration` | `for`, `range`, `print` | — |
| 2 | The Inventory | `indexing`, `len` | `list`, `iteration` | `a3-the-inventory` · 10 |
| 3 | It Changes | `mutation` | `list`, `variables` | — |
| 4 | Pick It Up | `list-methods` | `mutation`, `iteration` | `a3-pick-it-up` · 12 |
| 5 | Do I Have Enough | `in`, `min`, `max`, `sorted` | `list`, `comparison-operators` | — |
| 6 | The Hotbar | `slicing` | `indexing`, `len`, `range` | `a3-the-hotbar` · 14 |
| 7 | A Coordinate Cannot Change | `tuple` | `list`, `mutation` | — |
| 8 | Things By Name | `dict`, `breakpoints` | `list`, `in`, `vscode` | `a3-set-a-breakpoint` · 12 |
| 9 | The Recipe | `dict-methods` | `dict`, `iteration`, `in` | `a3-the-recipe` · 16 |
| 10 | A Bag With No Order | `set` | `list`, `in`, `len` | — |
| 11 | What Am I Missing | — | `set`, `dict`, `in` | `a3-what-am-i-missing` · 18 |
| 12 | A Recipe Book | `nested-structures` | `dict`, `list`, `iteration` | — |
| 13 | The Crafting Table | — | all seventeen | **Boss 3** · 24 |

**Thirteen, and the count is a commitment.** Twelve or fourteen only by an explicit merge
or split, named and argued here.

### Why this order

**Each collection arrives because the previous one could not do the job.** That is §4's
sequencing rule applied inside an area rather than between them, and it is the whole
argument for this ordering. A list is not introduced and then exercised; it is introduced,
and then it fails at something, and the failure is the next session.

**`list` and `iteration` are one session, not two.** An inventory that cannot be read is
not an inventory. Splitting them would produce a session whose payoff is a variable holding
three words and nothing to do with them.

**Session 3 is the quiet one and it is scheduled early on purpose.** Two names for one list
is the first thing this year that is true and invisible at the same time — no error, no
wrong picture, just a second name that was never a second list. It lands in session 3 rather
than session 9 because everything after it involves passing lists around, and a learner who
has not met aliasing will meet it as a mystery instead of as a lesson.

**`in`, `min`, `max` and `sorted` are one session, and it is the cheap one.** Four small
names that make session 2's list answer questions. It is deliberately the least demanding
session in the first half, and it sits directly after the mutation pair, which are the two
heaviest.

**Slicing comes sixth, after indexing has been wrong at least once.** `[0:2]` giving two
things is the same stopping rule as `range`, met for the third time. Third encounters are
where a rule stops being surprising, and this one is scheduled to be the last time it is.

**`tuple` is seventh and it is the thinnest concept in the area.** It gets one session, no
quest, and no padding. A tuple only has an honest reason to exist once there is something
that should *not* change, and `place(x, y, z, kind)` has been handing them coordinates
since session 1. The README says it is thin rather than pretending otherwise — the same
call Area 0 made about `bool`.

**Session 8 teaches `dict` and `breakpoints` together, which is heavier than average and
is the argument for the rung being elective.** A breakpoint needs a bug worth stopping on,
and `KeyError` on a dict is that bug: the exception breakpoint stops at the moment it is
raised, with the whole inventory still on screen. That is Area 0's *errors are readable*
promise made interactive, three areas later, on a failure this area produces naturally.
`a3-set-a-breakpoint` is a tool quest rather than a collections quest, which is why it does
not displace one of the five.

**Session 11 introduces nothing.** It is set difference doing in one line what a loop they
already wrote did in six — "which blocks does this recipe need that I do not have". A
session whose content is *a thing you already built, now smaller* needs no new vocabulary
and is the strongest possible argument for the concept in front of it.

### Where the slump is

**Session 7, and it is scheduled rather than stumbled into.** After slicing and before
dicts, the material is correct and unglamorous: one idea, no quest, and the least visually
rewarding hour in the area. Area 0 did the same thing with its session 4 and said in
writing that cutting it short was fine. So does this one.

### Compressing to eleven sessions

If the calendar bites:

- **Merge 5 into 2.** `in`, `len` and `sorted` are readable the moment indexing is.
- **Merge 7 into 6.** A tuple beside a slice is two shapes of "part of a thing", and
  session 7 is the area's designed slack.
- **Never cut session 3, never cut session 8, never cut session 12.** Session 3 is the only
  place aliasing is taught before it bites. Session 8 is the debugger, and every session
  after it assumes they can stop a program. Session 12 is the only rehearsal Boss 3 gets.

---

## DC choices

Spec §5.1 derives XP from Difficulty Class. **Area 3 runs 10–24**, against Area 0's 5–18,
Area 1's 8–20 and Area 2's 5–22.

**The floor rises, and that is the interesting number.** By week nine nothing in this area
is a single new idea. A list is a list *and* iteration *and* indexing on the first evening,
because an inventory that cannot be read is not an inventory. There is no honest DC 5 left
in the campaign.

The band climbs visibly across six weeks:

| Sessions | Band | Why |
|---|---|---|
| 1–4 | 10–14 | one collection, one operation at a time |
| 5–9 | 14–18 | two ideas at once, and the first invisible failures |
| 10–13 | 18–22 | collections chosen rather than given |
| Boss 3 | **24** | a data shape held in the head across a whole file |

**Boss 3 at 24 is the campaign's second item over 20**, after Boss 2 at 22. §5.1 renders
DC ≥ 20 with a warning and here the warning is wanted: a crafting simulator with a real
recipe book is the first thing they will build where the *shape of the data* is the design
decision, and getting it wrong is not a crash but a program that cannot answer the
question it was built for.

---

## Concept coverage

Seventeen concepts. **Twelve are taught in the seven sessions that exist**; the remaining
five arrive with sessions 8–13 and are listed here so the gap is a stated fact rather than
something a reader has to derive.

| Concept | Session | Where | Shipped? |
|---|---|---|---|
| `list` | 1 | `s1e1_a_row_of_blocks.py` | yes |
| `iteration` | 1 | `s1e1`, `s1e2` | yes |
| `indexing` | 2 | `s2e1_the_inventory.py` | yes |
| `len` | 2 | `s2e1`, `s2e2` | yes |
| `mutation` | 3 | `s3e1_two_names_one_list.py` | yes |
| `list-methods` | 4 | `s4e1_pick_it_up.py` | yes |
| `in` | 5 | `s5e1_do_i_have_enough.py` | yes |
| `min` | 5 | `s5e2_the_tallest_tower.py` | yes |
| `max` | 5 | `s5e2` | yes |
| `sorted` | 5 | `s5e3_tidy_it_up.py` | yes |
| `slicing` | 6 | `s6e1_the_hotbar.py` | yes |
| `tuple` | 7 | `s7e1_a_coordinate.py` | yes |
| `dict` | 8 | — | **not yet** |
| `breakpoints` | 8 | — | **not yet** |
| `dict-methods` | 9 | — | **not yet** |
| `set` | 10 | — | **not yet** |
| `nested-structures` | 12 | — | **not yet** |

**The thinnest of the twelve is `tuple`**, at one drill and no quest, and §Why this order
argues that it should be. The next thinnest is `min`, which shares a file with `max`
because the two are one idea asked in opposite directions.

---

## The block cap, and what it is actually about

**Keep a world under about 5,000 blocks.** `verify.py` asserts it rather than trusting the
arithmetic in a session plan.

Measured on the learner's laptop — a 2017 mobile workstation, Intel HD Graphics 630,
ursina 8.3.0 — by the shim plan on 2026-08-31:

| Blocks | Fused fps | Fused startup |
|---|---|---|
| 1,000 | 296.1 | 2.21 s |
| 2,500 | 239.2 | 2.95 s |
| 5,000 | 213.8 | 5.32 s |
| 8,000 | 178.3 | 8.68 s |

**Framerate is not the constraint and the plan that set the cap assumed it was.** Eight
thousand blocks still renders at 178 fps on the weakest machine in the household. What
degrades is **startup**: `combine()` costs roughly a millisecond per block, paid once,
before anything appears at all.

So the cap is justified by build-and-fuse cost, and an author who reads "the cap is about
fps" will reason wrongly about what they can spend. `verify.py`'s failure message states
the cost in seconds for that reason.

**Sessions 1–7 stay well under it.** Nothing in this half places more than a few hundred
blocks, because these sessions are about what a collection *is* rather than about scale. A
row is ten blocks; the largest thing here is a 20 × 20 floor.

---

## Verifying the exercises

```console
py -3.14 verify.py
```

Last run: **17 of 17**, on Python 3.14.6, Windows 11. `ruff check curriculum/area-3/`
passes.

**`pyright` reports four, and all four are wanted.** Recorded here rather than suppressed,
because Area 1 lives with three of its own for the same reason and hiding them would make
the next author think this area had none.

- **Three × `Import "world" could not be resolved`**, in the files that build a world. The
  shim is at `curriculum/lib/world.py` and is *copied* next to the learner's own files, so
  `import world` resolves exactly where it matters and all seventeen files run. It does not
  resolve for a type checker pointed at the repository root, which is a fact about where
  pyright was standing rather than about the code.
- **One × `"__setitem__" method not defined on type "tuple[...]"`**, at
  `s7e2_it_will_not_change.py:39`. That line is `spawn[0] = 99`, the file is called *It Will
  Not Change*, and `# expect: TypeError` is in its header. Pyright has read the program
  correctly and found the bug the file was written to contain.

No `# pyright: ignore` pragmas in the drills, deliberately. These files are read by a
learner in week nine, and a suppression comment is vocabulary they have not earned sitting
at the top of the thing they are trying to understand.

**This harness never opens a window**, and that is the design rather than a convenience.
`world.start` is replaced with a recording stand-in *before* each exercise is imported, so
`app.run()` is never reached and no OpenGL context is ever built. What gets asserted is the
placement record, not pixels. Verifying Areas 0 and 1 opens and closes fifty turtle
windows; this opens none.

It checks each file against its own header tags, and three things the earlier areas had no
need for:

- **the block cap**, asserted rather than trusted;
- **`start()` called exactly once when anything was placed** — a file that places fifty
  blocks and never calls `start()` runs perfectly, exits zero and draws nothing, which is
  the quietest failure available in this area;
- **no raw Ursina anywhere** — `Entity(`, `from ursina` and `import ursina` fail the run
  wherever they appear under `sessions/`, `exercises/` or `reference/`.

**All six checks have been seen to fail against seeded mutants** before being trusted: a
`def` tag on an Area 3 file, an 80 × 80 loop placing 6,400 blocks, a file that places and
never starts, a direct `from ursina` import, a DC of 99, and a file tagged `ok` that prints
nothing and places nothing. The captures are in
`planning/evidence/area-3-verify-RED-and-MUTANT.txt`, with a note on the one mutant that
correctly survives.

---

## Directory map

```text
area-3/
  README.md          this file
  area.yml           the manifest; weeks, blurb, and the quest denominator
  dm-guide.md        the shim's negative space, stalls by session, the invasion rule
  glossary.md        one entry per concept, keyed to concepts.ts
  lesson.draft.md    the teaching body, published as a draft until session 13 exists
  verify.py          headless; asserts placements, never opens a window
  sessions/
    session-1-the-row-of-blocks.md      … through session-7
    session-1/  s1e1_a_row_of_blocks.py, …   drills live beside the session
  reference/         worked answers. Datamine payloads under §5.5, not handouts
```

**No `journal/`.** Their `journal.md` moved into their own repository at Area 2a session 2
and Area 0's `TEMPLATE.md` is still the only copy; eight copies of one file that must never
disagree is not a layout, it is a liability. Journal prompts live in each session plan's
Beat 5, which is where a DM actually reads them.

**No `exercises/` yet**, and no `game/area-3/`. Both arrive with the quest items in the
second half of the authoring.
