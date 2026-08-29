# Area 1 — Control

**Status:** Completed
**Track:** area-1
**Date:** 2026-08-28
**Author:** Claude (Opus 5)
**Lane:** B — **blocks nothing, blocked by nothing**

## Objective

Author Area 1 end to end — ten sessions of teaching material in `curriculum/area-1/` and
five quests plus Boss 1 in `content/` — so that weeks 3–6 can be delivered with a text
editor, a terminal and Python, whether or not the application exists.

## Why this exists

He finishes Area 0 in week 2. Area 1 starts in week 3. Nothing is written.

Spec §8: *if the curriculum waits on the app, the app becomes a satisfying way to postpone
teaching a child Python.* Lane A has four plans queued and none of them produce a single
session he can sit down to. This one does.

Area 1 is also the first area with a boss the spec actually names, and the first where the
material is genuinely his rather than a guided tour — **The Sigil is an art generator that
takes input and produces something worth hanging on a wall.** That is the payoff Area 0's
six sessions were buying.

## Success Criteria

- [ ] `curriculum/area-1/` complete: `README.md`, `dm-guide.md`, `verify.py`, `sessions/`,
      `exercises/`, `journal/`, `reference/` — the Area 0 layout, no deviations
- [ ] All ten Area 1 concepts covered, and the README says which is thinnest and why —
      honestly, the way Area 0 said `bool` was thin at three exercises
- [ ] `py -3.14 verify.py` runs every exercise and every reference solution and reports
      **N of N**, with the number recorded in the README
- [ ] `dm-guide.md` predicts stalls **by name** and gives the exact question to ask
- [ ] `dm-guide.md` carries hand-run invasion drills for Area 0's nine concepts *and* Area
      1's ten, on the 1/3/7/16/35 ladder — the engine does not exist yet and retrieval
      cannot wait for it
- [ ] `content/areas/area-1.yml` plus five `a1-` quests and one `a1-` boss, all scaffolded
      with `npm run new:quest`, and `npm run validate:content` exits 0
- [ ] Every hidden test asserts on a **computed value**, never on a picture
- [ ] The session ordering is argued in the README, not merely stated
- [ ] Area 1 reported to the `main` track for the `curriculum/README.md` status table —
      the index is a shared file and this track does not edit it

## Approach

Read `curriculum/area-0/README.md` first. It is the bar and it is the template — it argues
its own session ordering, records its DC choices with reasons, prints a concept coverage
table generated from the exercise tags, and reports `19 of 19` from a harness that actually
ran. Anything less than that here is a regression.

**The ten concepts**, verbatim from `pyquest/packages/content/src/concepts.ts`:
`if` · `elif` · `else` · `comparison-operators` · `boolean-operators` · `while` · `for` ·
`range` · `nesting` · `accumulator-pattern`.

**Vehicle: turtle into generative art.** Spirals, polygons, mandalas, parameterized colour.
Same import as Area 0, so no new tooling and no new install stands between week 2 and week 3.

### The session ordering, and the argument for it

Four weeks against Area 0's two, so **ten sessions of 45–60 minutes**, with a stated
compression path. Proposed order, to be defended in the README:

| # | Title | Introduces | Resurfaces |
|---|---|---|---|
| 1 | The Loop That Draws | `for`, `range` | `print`, `variables`, `int` |
| 2 | Any Shape You Like | `range` (three-arg), `variables` | `for`, `int`, `float` |
| 3 | The Loop That Does Not Stop | `while`, `comparison-operators` | `for`, `variables` |
| 4 | Two Roads | `if`, `else` | `comparison-operators`, `bool` |
| 5 | And, Or, Not | `boolean-operators`, `elif` | `if`, `else`, `bool` |
| 6 | The Broken Loop | — (errors, second pass) | `while`, `for`, `if`, `reading-errors` |
| 7 | A Loop Inside A Loop | `nesting` | `for`, `range` |
| 8 | Carrying A Number | `accumulator-pattern` | `variables`, `for`, `int`, `float` |
| 9 | The Mandala | — | `nesting`, `accumulator-pattern`, all |
| 10 | The Sigil | — | all nineteen |

**`for` before `while`.** A `for` loop over `range(6)` terminates, is visible, and draws a
hexagon on the first attempt. A `while` loop's first outcome is often a hung window. Area 0
established that failure is scheduled rather than stumbled into; the same discipline applies
here.

**`while` before `if`, and session 3 is where `while True:` happens on purpose.** He is going
to write it — the API plan's runner assumes so, in week three, by name. Session 3 makes it a
lesson with a Ctrl-C at the end of it rather than an ambush on a Tuesday night. This mirrors
Area 0's session 3, which taught tracebacks at the exact moment he already had a grievance.

**`if` arrives when a loop needs to branch, not before.** A conditional with nothing to
condition on is the "tour of types before you need a type" mistake Area 0 explicitly refused.
By session 4 he has a loop with an index, so "every third side is red" is a thing he wants.

**Session 6 is errors, second pass.** §3 principle 7: nothing is taught once and abandoned.
Area 0 session 3 taught reading a traceback; session 6 here teaches the loop errors that have
no traceback at all — the off-by-one, the condition that is never false, the loop body that
never changes the variable. This is the area's hardest and most valuable session, and the
README should say so.

**Nesting before the accumulator.** Nesting is visual and instantly rewarding — a loop inside
a loop is a mandala. The accumulator is abstract and lands better once he has seen a shape
grow, so session 8 gives it a job (a spiral whose side length increases) rather than a
definition.

**Session 9 is the boss rehearsal**, exactly as Area 0's session 6 was, and session 10 is the
boss itself.

### Compression path

The plan says ten. If the calendar bites: merge 1 and 2; merge 4 into 5. **Never cut session
3, session 6, or session 9.** Session 3 is where the hang gets taught, session 6 is the
area's actual subject, and session 9 is the only rehearsal Boss 1 gets.

### DC band

Area 0 ran 5–18 and deliberately stayed under 20, because §5.1 renders DC ≥ 20 with a warning
and a warning label in week one teaches fear of the material rather than of hard quests. Area
1 should run **8–20**, set against *this learner in week three* and not against Python in the
abstract. Record the band and the reasoning in the README the way Area 0 did. Boss 1 sits at
the top of the band — boss XP is DC × 20, so this is the first item that pays a level.

### The content half

```
cd pyquest
npm run new:quest -- --id a1-<name> --title "<Title>" --area 1 --concepts for,range --dc 10
npm run validate:content
```

`scaffold.ts` refuses before writing anything if a concept is unknown or is first taught above
area 1, and it stubs each hidden-test file with a deliberate
`AssertionError("write the hidden tests for <id>")` so a quest cannot pay XP before its tests
exist. §5.2 sets the target: **five quests plus a boss, any three quests unlocking the boss.**

**Boss 1 carries `requires: []`, and that is not an oversight.** The 3-of-5 rule is not
expressible in content and is not meant to be — it already lives in the engine, as
`bossUnlocked(clearedQuestCount) → clearedQuestCount >= QUESTS_TO_UNLOCK_BOSS`, and
`scoring.ts` says why in as many words: *"the count is the whole rule. Which three is the
player's business, and that is the autonomy the rule exists to protect, so nothing here asks
which quests they were."* The engine never reads `requires` at all. Listing quest ids on the
boss would impose exactly the ordering §5.2 protects against, and nothing would enforce it
anyway.

Use `requires` only for a genuine prerequisite between two quests — quest B is unreadable
without quest A — never as a progression gate.

**Do not copy Area 0's boss here.** `content/quests/a0-first-light.yml` is `kind: boss` with
`requires: [a0-name-tag]`. It is harmless there, because Area 0 has two items and the 3-of-5
rule cannot apply, but it is the wrong pattern to imitate in an area that has five quests.
Whether Area 0's boss should be corrected is a separate question and not this plan's.

**Verifiers.** §6.3 gives Areas 0–1 `hidden-tests`. Everything in this area draws, so tests
assert on **computed values** — the turn angle, the side count, the accumulator's total, the
`range` bounds — and never on the picture. Boss 1 is `peer-signoff` with `by: peer`, because
"worth hanging on a wall" is not a thing a test checks, and three theme framings per §5.2.

`content/areas/area-1.yml` stays `authoring: partial` with `estimatedQuests: 5` until the
fifth quest lands. §5.1a: an estimate marked as an estimate is honest, one presented as fact
is not, and he will find out either way.

**The turtle-to-canvas Pyodide shim (§8) is not a prerequisite for this plan.** It is a
prerequisite for these quests being *playable in the browser*, and it belongs to Lane A's SPA
plan. The curriculum runs in a terminal and ships regardless. Do not let the shim's schedule
touch this one.

## Phases

### Phase 0 — one documentation correction

`curriculum/area-0/README.md` carries a section headed "a deliberate deviation from the
spec," arguing the Journal should start in week 1 when §4 says week 3. The spec now says
week 1 — commit `3211076` moved it. **Keep the reasoning about Boss 1 having something to
reread; drop the framing that it deviates.** It no longer does. Area 0's README is this
track's file; no other track touches it.

The second correction this plan used to carry — `curriculum/README.md` pointing at
`packages/content/` twice, when the path has been `pyquest/packages/content/` since commit
`c384e16` — belongs to `main`, because all three area tracks would otherwise edit that file.
`main` has since landed it: `planning/completed/feature_shared-index-and-concepts_2026-08-29.md`.
That plan also registered the `breakpoints` concept and named `main` as the owner of the
status table in `curriculum/README.md`, so **this track starts with its shared files already
clear** and Phase 0 is now one correction rather than two.

### Phase 1 — the DM guide and the session skeletons

`dm-guide.md` first, because Area 0 proved it is the load-bearing document and writing it
first is what forces the stalls to be named. Then ten session files with their beats blocked
out. No exercise code yet.

**The invasion drills mirror `curriculum/area-0/dm-guide.md` §5 and do not invent a new
shape.** That format is: grouped by session, three questions each, asked out loud at the
start, no computer, nothing looked up, two minutes. They must be **retrieval, not
recognition** — "What does `int` do?" is retrieval; "Does `int` convert text to a number?"
is a yes-or-no he can guess. A per-concept table would be a second format for a DM who has
already run six sessions on the first one.

One addition Area 0 did not need. It drilled 9 concepts across 6 sessions and could stay
pure prose; Area 1 carries **19** — its own ten plus Area 0's nine — across ten sessions,
on the 1/3/7/16/35 ladder. So the section ends with a coverage line proving every one of
the nineteen is drilled at least once, and naming which are deliberately drilled most
(the Area 0 concepts at the top of the ladder are the ones at risk of quiet decay).

### Phase 2 — the exercises [ASYNC with Phase 3]

Roughly 25–30 `.py` files across ten session directories, each carrying `# concepts:`,
`# dc:`, `# expect:` and optional `# stdin:`. Tags record what a file **resurfaces**, not
only what it introduces — §5.4 schedules retrieval off them, so a file that quietly needs
`variables` says so.

Shipped exercise code runs and does something but is never the answer. Reference solutions
go in `reference/` and are Datamine payloads under §5.5 — the parent's copy, not handouts.

### Phase 3 — `verify.py` [ASYNC with Phase 2]

Adapt Area 0's harness. It already knows to suppress the turtle window, to check `# expect:`
tags against actual exit behaviour, to validate every `# concepts:` tag against the real
concept ids, and — the lesson it learned the hard way — **to count pen-down moves rather than
canvas items**, because an untouched turtle canvas already holds four Tk items and counting
those would pass a file that drew nothing.

Two additions Area 1 needs that Area 0 did not, specified as tags so they are implementable
rather than aspirational:

- **`# expect: hangs`** — a new member of the existing expectation vocabulary, alongside
  Area 0's `ok`, `runs` and the error names. Session 3 ships a loop that does not stop, and
  that loop is the lesson, so the harness must kill it and report it as **expected** rather
  than hang the run or call it a failure. Putting it in `# expect:` rather than inventing a
  bare timeout number keeps one vocabulary for "what should happen when this runs".
- **`# timeout-seconds: N`** — optional, default 10. Only files that need something other
  than the default carry it, so thirty files do not each repeat boilerplate. A file tagged
  `hangs` that *exits* before its timeout fails the check, because it was supposed to hang.
- **`# min-strokes: N`** — optional, default 1, which preserves Area 0's behaviour exactly.
  An off-by-one that draws five sides of a hexagon still puts the pen down, so any file
  whose shape has a known stroke count carries the real number.

All three are read the same way Area 0 reads its tags, and a file may still carry none of
them. The reporting line stays Area 0's: `N of N`, plus the failing file and why.

Run it, capture the output, and put the count in the README. A curriculum whose exercises are
not known to run is not delivered.

### Phase 4 — the content items

Five quests and Boss 1, scaffolded then filled. Write the hidden tests — the scaffold's
`AssertionError` stub is deliberate and a quest that still carries it is not done. Then
`npm run validate:content` until it exits 0.

### Phase 5 — the Journal, and the README

Journal entries 07–16 continue as plain markdown, same 10-XP-for-substance rubric. They are
still not git-tracked; that arrives at Area 2a on schedule, and Area 0's six entries plus
these ten become his first real commit.

`curriculum/area-1/journal/` mirrors Area 0's layout exactly, which is:

```text
journal/
  TEMPLATE.md          copied once per session — Area 1 gets its own copy, so the
                       area stays self-contained and readable without area-0/ open
  entry-NN-prompt.md   what to say, and how to score it. Area 0 shipped one, for
                       entry 01; Area 1 ships them where a session needs more than
                       the template, not one per session as a matter of course
  entries/             his, empty, with the README that says so
```

**The Journal has four prompts, not three** — what I built, what broke, what I would do
differently, and what will break next time. The fourth is recent (`709b9e1`), so Area 1's
TEMPLATE carries it from the start rather than inheriting Area 0's copy. §5.6's forecast beat
— he reads his own last forecast back before writing the new one — first has something to
read here, since Area 0 supplied the first six forecasts.

Then the README: session table, ordering argument, DC choices, concept coverage table
generated from the tags, the verify count, and the "which of these should become quests"
section — which for this area is largely already answered by Phase 4, so record what was
*not* made a quest and why.

## Dependencies / Prerequisites

- **None blocking.** `concepts.ts` already carries all ten Area 1 ids; the scaffolder and
  validator are built and tested; turtle needs nothing installed.
- Python 3.14 on both machines. Use `py -3.14` explicitly — `python` is 3.12 in PowerShell
  and 3.14 in Git Bash on the parent's machine.
- Not a dependency, stated because it looks like one: the **Pyodide turtle shim** (§8, Lane
  A's SPA plan) gates browser play, not authoring.

## Files Expected to Change

- `curriculum/area-1/**` — new, the whole area
- `content/areas/area-1.yml` — new
- `content/quests/a1-*.yml` — new, **six**: five quests and Boss 1
- `content/briefs/a1-*.md` — new, **six**: every item has a brief
- `content/starters/a1-*.py` — new, **five**, quests only
- `content/tests/a1-*_test.py` — new, **five**, quests only

  The counts differ on purpose. `scaffold.ts` emits a starter and a test only for a
  `hidden-tests` verifier, and Boss 1 is `peer-signoff` — §5.3 gives a boss a blank file and
  a specification, so there is nothing to scaffold and no test to hide. A boss that shipped a
  starter would be scaffolding the one item the spec says must have none.
- `curriculum/area-0/README.md` — the Journal deviation section

**Owned by `main`, not this track:** `curriculum/README.md`. Three area tracks want its
status table; one owner writes it, after the tracks land.

## Out of Scope

Anything under `pyquest/` or `infra/`. This plan writes no TypeScript and touches no
`concepts.ts` — Area 1's ten ids already exist. If this plan needs a schema change, it has
gone wrong.

Also out of scope: making these quests playable in a browser. That is the turtle shim, and
it is Lane A's.

---

## Status

**Final Status:** Completed
**Completed:** 2026-08-29
**Completed By:** Claude (Opus 5), on the `area-1` track

### Outcomes

**Area 1 is deliverable.** Ten session plans, thirty exercises, five Datamine payloads, a
DM guide, a Journal, and a harness that ran. Weeks 3–6 can be taught with a text editor, a
terminal and Python, whether or not the application exists.

**`py -3.14 verify.py` reports 35 of 35**, on Python 3.14.6, Windows 11 — thirty exercises
and five reference solutions. The number is recorded in `curriculum/area-1/README.md`.

**`npm run validate:content` exits 0**, 8 items across 2 areas. Five quests, Boss 1, and
the area manifest; six YAML, six briefs, five starters, five test files, exactly as the
Files Expected to Change section specifies.

**All thirty hidden tests were proven both ways.** They pass a correct submission written
in Area 1 vocabulary only, and each quest's signature bug fails it — a turn typed as 60
passes the hexagon and fails the pentagon, `>= 20` costs the countdown four tests, and a
refusal that draws anyway, a branch hoisted out of its loop, and `ink = length` are each
caught. Every assertion is on a computed value: `turtle` is replaced by a recording
stand-in, so the tests read the side count, the turn angle, the sequence of lengths and
the accumulator's printed total, and never a pixel.

**The harness's two new checks were seeded with mutants and watched to fail** before being
trusted, per `test-filter-development`. A grid whose rows went from 4 to 2 was caught at 32
strokes against a floor of 64; a broken sigil repaired in place was caught as "expected
IndentationError, ran clean"; a concept tag borrowed from Area 3 was caught by name.

### Deviations, and things the plan did not anticipate

**The worktree started on a pre-review commit.** Work was already under way against the
draft plan when the revision landed; a rebase onto `main` merged cleanly and four of the
six revisions touched work already written. All four were fixed in place rather than
rebuilt: the timeout tag became `# expect: hangs` with `# timeout-seconds:` and
`# min-strokes:`, twenty-seven files were retagged, the DM guide's per-concept rung table
was replaced with Area 0's session-grouped shape, and the loose `entries-07-to-16.md`
became `entry-07-prompt.md` in Area 0's layout.

**Four invasion drills had to be rewritten to make the coverage line true.** Writing out
the nineteen-concept table found that `if`, `bool`, `print` and a genuine
comparison-operator question had no drill at all — the table earned its place by catching
something.

**A runaway turtle program dies before any wall clock fires.** Measured while seeding a
mutant, not assumed: an unbounded turtle loop fills the Tk canvas until the window is
destroyed, the process raises `turtle.Terminator`, and the *next* run in the suite can
fail for want of memory. So the harness's untagged-runaway branch reports a crash rather
than a timeout for turtle files. It is still a failure with the file's name on it, the
behaviour is documented in `verify.py`, and it is why the default wall clock is ten
seconds. The `RuntimeError` branch was exercised separately against a pure-Python
`while True: pass` to confirm it works at all.

**Area 1's starters are plain scripts, with no `def` and no `__main__` guard.**
`scaffold.ts` emits both, and `a0-name-tag.py` shipped with both, but `def` is Area 4 and
`main-guard` is Area 2b. A starter written in vocabulary the learner has not met teaches
him the real version is out of reach. The starters say so in their docstrings. Whether
`scaffold.ts` should default differently below Area 4 is a Lane A question and not this
plan's.

**`elif` and `boolean-operators` came out thinnest, at three exercises each.** Recorded
honestly in the README with the reason rather than padded out: `if`/`else` covers most of
what an Area 1 *drawing* needs to decide, and the two thin concepts get busy in Area 3,
where a rule about a list is where "either of these but not that one" starts happening for
real.

### Reported to the `main` track

`curriculum/README.md`'s status table is owned by `main`. The row for this area should
read:

| area-1 | 3–6 | Control — `if`/`while`/`for`, nesting, the accumulator pattern | **authored** |

### Not done here, on purpose

The **turtle-to-canvas Pyodide shim** (§8, Lane A's SPA plan) still gates these quests
being playable in a browser. It does not gate the hidden tests, which replace `turtle`
outright and run anywhere Python does.
