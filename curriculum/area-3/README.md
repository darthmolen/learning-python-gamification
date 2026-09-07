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

**Authored in full. Thirteen practices, seven content items, and the lesson promoted.**

| Part | State |
|---|---|
| `area.yml` | **complete** — title, weeks, blurb, `authoring: partial` |
| `glossary.md` | **complete** — all seventeen concepts defined |
| `lesson.md` | **promoted 2026-09-06**, when the thirteenth practice landed |
| `dm-guide.md` | **complete** — stalls for all thirteen, and §9 is the Boss 3 run sheet |
| `verify.py` | **complete**, and proven against six seeded mutants |
| Practices 1–13 and their drills | **complete** — 28 drills, 13 plans, 1 walkthrough |
| Practice 13 — Boss 3 | **complete** — brief, hidden test, YAML, three framings |
| `reference/` | **complete for practices 1–7**; 8–13 check themselves |
| `exercises/` — seven briefs, six hidden tests | **complete** |
| `game/area-3/quests/` — seven YAML | **complete** |

**`lesson.md` was promoted on 2026-09-06, and the rename was the sign-off rather than a
formality.** It published as a draft — labelled as one on the page and on the index — until
thirteen practices existed to have tested the prose against. That was the plan's own
condition, and it was met rather than waived.

`apps/api/tests/server.test.ts` used Area 3 as its example of an area still in draft. That
assertion moved to area 4 rather than being weakened, and gained a second half asserting
that area 3 is now announced as finished. The day area 7 is done, that test wants a fixture
rather than a real area.

**`area.yml` stays `authoring: partial`, and that is a decision rather than an oversight.**
Every artifact exists, but Areas 1 and 2 set the rule and it is a good one: `complete` is a
person deciding an area is finished, not a consequence of the last file landing. Two things
are still open — **no hidden test has run over the real `local-repo` path** against a cloned
repository, and **no practice has been delivered to a learner.** Until then a tilde is the
honest rendering. `estimatedQuests` is 6, corrected from 5 when the sixth quest landed; a
boss is not a quest and is not counted.

---

## Practice 13 was gated, and the gate was lifted by a decision

`planning/feature_pygame-zero-viability-spike_2026-09-06.md` was, and still is, the stated
gate on authoring Boss 3 — *"the Pygame Zero spike promotes earlier and separately: before
Boss 3 is authored."* Its reasoning was that Boss 3 hands over to Area 4, and you do not
author a handover before you know the destination.

**It was lifted on 2026-09-06 by an explicit instruction, not by the spike clearing.** That
is recorded here rather than quietly dropped, because a gate that vanishes without a note is
indistinguishable from one nobody noticed.

What made it a narrow gate: **Boss 3's content is pure data work** — a recipe book, an
inventory, and a command loop. There is no graphics in it and no Pygame Zero anywhere near
it, so nothing the spike could find would change a line of the brief or the test. What the
spike still protects is Area 4's *vehicle*, and that remains queued and still needs the
learner's laptop for a sitting.

---

## The sessions

The spine. Practices 8–13 are fixed here **before** they are written, because two halves
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

**Practice 3 is the quiet one and it is scheduled early on purpose.** Two names for one list
is the first thing this year that is true and invisible at the same time — no error, no
wrong picture, just a second name that was never a second list. It lands in practice 3 rather
than practice 9 because everything after it involves passing lists around, and a learner who
has not met aliasing will meet it as a mystery instead of as a lesson.

**`in`, `min`, `max` and `sorted` are one session, and it is the cheap one.** Four small
names that make practice 2's list answer questions. It is deliberately the least demanding
session in the first half, and it sits directly after the mutation pair, which are the two
heaviest.

**Slicing comes sixth, after indexing has been wrong at least once.** `[0:2]` giving two
things is the same stopping rule as `range`, met for the third time. Third encounters are
where a rule stops being surprising, and this one is scheduled to be the last time it is.

**`tuple` is seventh and it is the thinnest concept in the area.** It gets one session, no
quest, and no padding. A tuple only has an honest reason to exist once there is something
that should *not* change, and `place(x, y, z, kind)` has been handing them coordinates
since practice 1. The README says it is thin rather than pretending otherwise — the same
call Area 0 made about `bool`.

**Practice 8 teaches `dict` and `breakpoints` together, which is heavier than average and
is the argument for the rung being elective.** A breakpoint needs a bug worth stopping on,
and `KeyError` on a dict is that bug: the exception breakpoint stops at the moment it is
raised, with the whole inventory still on screen. That is Area 0's *errors are readable*
promise made interactive, three areas later, on a failure this area produces naturally.
`a3-set-a-breakpoint` is a tool quest rather than a collections quest, which is why it does
not displace one of the five.

**Practice 11 introduces nothing.** It is set difference doing in one line what a loop they
already wrote did in six — "which blocks does this recipe need that I do not have". A
session whose content is *a thing you already built, now smaller* needs no new vocabulary
and is the strongest possible argument for the concept in front of it.

### Where the slump is

**Practice 7, and it is scheduled rather than stumbled into.** After slicing and before
dicts, the material is correct and unglamorous: one idea, no quest, and the least visually
rewarding hour in the area. Area 0 did the same thing with its practice 4 and said in
writing that cutting it short was fine. So does this one.

### Compressing to eleven sessions

If the calendar bites:

- **Merge 5 into 2.** `in`, `len` and `sorted` are readable the moment indexing is.
- **Merge 7 into 6.** A tuple beside a slice is two shapes of "part of a thing", and
  practice 7 is the area's designed slack.
- **Never cut practice 3, never cut practice 8, never cut practice 12.** Practice 3 is the only
  place aliasing is taught before it bites. Practice 8 is the debugger, and every session
  after it assumes they can stop a program. Practice 12 is the only rehearsal Boss 3 gets.

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

Seventeen concepts. **All seventeen are now taught.** Practice 13 introduces nothing — a boss
resurfaces the area rather than adding to it.

| Concept | Session | Where | Shipped? |
|---|---|---|---|
| `list` | 1 | `p1e1_a_row_of_blocks.py` | yes |
| `iteration` | 1 | `p1e1`, `p1e2` | yes |
| `indexing` | 2 | `p2e1_the_inventory.py` | yes |
| `len` | 2 | `p2e1`, `p2e2` | yes |
| `mutation` | 3 | `p3e1_two_names_one_list.py` | yes |
| `list-methods` | 4 | `p4e1_pick_it_up.py` | yes |
| `in` | 5 | `p5e1_do_i_have_enough.py` | yes |
| `min` | 5 | `p5e2_the_tallest_tower.py` | yes |
| `max` | 5 | `p5e2` | yes |
| `sorted` | 5 | `p5e3_tidy_it_up.py` | yes |
| `slicing` | 6 | `p6e1_the_hotbar.py` | yes |
| `tuple` | 7 | `p7e1_a_coordinate.py` | yes |
| `dict` | 8 | `p8e1_things_by_name.py` | yes |
| `breakpoints` | 8 | `p8e3_stop_and_look.py`, `w8_the_variables_panel.md` | yes |
| `dict-methods` | 9 | `p9e1_the_recipe.py`, `p9e2` | yes |
| `set` | 10 | `p10e1_a_bag_with_no_order.py`, `p10e2` | yes |
| `nested-structures` | 12 | `p12e1_a_recipe_book.py`, `p12e2` | yes |

**The thinnest is `tuple`**, at one drill and no quest, and *Why this order* argues that it
should be. The next thinnest is `min`, which shares a file with `max` because the two are
one idea asked in opposite directions.

**`breakpoints` is taught as stepping and the Variables panel, and not as the exception
breakpoint.** That split was settled on 2026-08-29 and is recorded in
`tools/vscode/README.md`: `breakpoints` is Area 3, and `debugger` — conditional breakpoints,
exception breakpoints, logpoints, the call stack — stays at Area 7. Practice 8 hunts a
`KeyError` with a breakpoint; it does not teach break-on-raise. The queued plan said
otherwise and has been corrected in place.

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

**Practices 1–7 stay well under it.** Nothing in this half places more than a few hundred
blocks, because these sessions are about what a collection *is* rather than about scale. A
row is ten blocks; the largest thing here is a 20 × 20 floor.

---

## Verifying the exercises

```console
py -3.14 verify.py
```

Last run: **28 of 28**, on Python 3.14.6, Windows 11. `ruff check curriculum/area-3/`
passes.

**`pyright` reports five, and all five are wanted.** Recorded here rather than suppressed,
because Area 1 lives with three of its own for the same reason and hiding them would make
the next author think this area had none.

- **Four × `Import "world" could not be resolved`**, in the files that build a world. The
  shim is at `curriculum/lib/world.py` and is *copied* next to the learner's own files, so
  `import world` resolves exactly where it matters and all twenty-eight files run. It does not
  resolve for a type checker pointed at the repository root, which is a fact about where
  pyright was standing rather than about the code. The count tracks the number of drills that
  build a world: `p1e1`, `p1e2`, `p7e1`, `p10e2`.
- **One × `"__setitem__" method not defined on type "tuple[...]"`**, at
  `p7e2_it_will_not_change.py:39`. That line is `spawn[0] = 99`, the file is called *It Will
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
  wherever they appear under `practices/`, `exercises/` or `reference/`.

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
  lesson.draft.md    the teaching body, published as a draft until practice 13 exists
  verify.py          headless; asserts placements, never opens a window
  practices/
    practice-1-the-row-of-blocks.md      … through practice-12
    practice-1/  p1e1_a_row_of_blocks.py, …   drills live beside the practice
    practice-8/  … and w8_the_variables_panel.md, the one walkthrough in the area
  reference/         worked answers. Datamine payloads under §5.5, not handouts
```

**No `journal/`.** Their `journal.md` moved into their own repository at Area 2a practice 2
and Area 0's `TEMPLATE.md` is still the only copy; eight copies of one file that must never
disagree is not a layout, it is a liability. Journal prompts live in each session plan's
Beat 5, which is where a DM actually reads them.

**One walkthrough, in practice 8.** The debugger rung is a thing done in an editor and there
is nothing in "set a breakpoint and read the Variables panel" for a harness to execute, so
`verify.py` reports it as uncovered rather than skipping it silently — Area 2's harness
earned that rule. It is audited by a person who followed it.

**`exercises/` holds all seven**, and `game/area-3/quests/` all seven — five collections
quests, the breakpoints rung, and Boss 3.
