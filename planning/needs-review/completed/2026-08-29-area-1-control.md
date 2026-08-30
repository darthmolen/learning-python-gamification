# Area 1 — Control

**Status:** Planned
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
exist. §5.2 sets the target: **five quests plus a boss, any three quests unlocking the boss** —
so `requires` on the boss must not chain the five into a line.

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
It is recorded in `planning/feature_shared-index-and-concepts_2026-08-29.md`.

### Phase 1 — the DM guide and the session skeletons

`dm-guide.md` first, because Area 0 proved it is the load-bearing document and writing it
first is what forces the stalls to be named. Then ten session files with their beats blocked
out. No exercise code yet.

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

Two additions Area 1 needs that Area 0 did not:

- **A wall-clock timeout per file.** Session 3 ships a loop that does not stop. The harness
  must kill it and report it as expected rather than hang the run.
- **A stroke-count floor per file**, not just non-zero. An off-by-one that draws five sides
  of a hexagon still puts the pen down.

Run it, capture the output, and put the count in the README. A curriculum whose exercises are
not known to run is not delivered.

### Phase 4 — the content items

Five quests and Boss 1, scaffolded then filled. Write the hidden tests — the scaffold's
`AssertionError` stub is deliberate and a quest that still carries it is not done. Then
`npm run validate:content` until it exits 0.

### Phase 5 — the Journal, and the README

Journal entries 07–16 continue as plain markdown in `curriculum/area-1/journal/`, same
TEMPLATE, same 10-XP-for-substance rubric. They are still not git-tracked; that arrives at
Area 2a on schedule and Area 0's six entries plus these ten become his first real commit.

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
- `content/quests/a1-*.yml`, `content/briefs/a1-*.md`, `content/starters/a1-*.py`,
  `content/tests/a1-*_test.py` — new, six items
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

## Plan Review

**Reviewed:** 2026-08-29 10:26
**Reviewer:** Claude Code (plan-review-intake)

### Strengths

- **Approach / session ordering:** Clear pedagogical argument throughout — `for` before `while`, errors as session 6, compression path preserving sessions 3/6/9.
- **Success Criteria:** Mostly application-independent and verifiable from files plus `py -3.14 verify.py` and `npm run validate:content`.
- **Content half:** Grounded in real tooling — `new:quest` and `validate:content` scripts confirmed in `pyquest/package.json`; `scaffold.ts` enforces concept ids and stubs hidden tests deliberately.
- **Dependencies / Prerequisites:** All 10 Area 1 concept ids confirmed present in `concepts.ts`. Area 0 layout and `journal/TEMPLATE.md` verified to exist.

### Issues

#### Critical (Must Address Before Implementation)

- **Content half / boss unlock rule**
  - Section: Content half / Phase 4
  - What's wrong: Says "any three quests unlocking the boss" but never specifies the actual `requires` schema/encoding.
  - Why it matters: Author could accidentally encode a linear chain or all-five requirement. Existing YAML uses a simple list (`requires: [quest-id]`), so "any 3 of 5" is not representable by implication alone.
  - Suggested fix: Name the exact encoding for Boss 1's `requires` field, or state that if the current schema only supports all-of lists, this plan must either (a) use no `requires` and record the intended rule in prose for a Lane A follow-up, or (b) hand off threshold-unlock support to a Lane A plan.

#### Important (Should Address)

- **Phase 3 — `verify.py` additions under-specified**
  - Timeout and stroke-count floor are not concrete enough to implement consistently.
  - Suggested fix: Specify tag formats such as `# timeout-seconds: 5` and `# min-strokes: 6`, plus expected handling and reporting behavior.

- **Files Expected to Change — boss file set ambiguous**
  - Says "six items" in a way that implies uniform starter/test generation.
  - Why it matters: Boss 1 is `peer-signoff` — scaffold generates no starter or hidden test for it, only a brief and YAML.
  - Suggested fix: Split quest files from boss files explicitly (five quest starters/tests, six briefs/YAMLs).

- **Phase 2 / Journal layout vs. Area 0 template**
  - Says entries continue in `curriculum/area-1/journal/` but Area 0 has `journal/TEMPLATE.md`, prompt files, and `journal/entries/`.
  - Suggested fix: State the exact Area 1 journal structure, mirroring Area 0's layout.

- **Phase 1 / DM guide invasion drills not operationalized**
  - 19-concept drill on 1/3/7/16/35 ladder stated but format unspecified.
  - Suggested fix: Require a table per concept with prompt, quick-check answer, and ladder positions covered.

#### Minor (Consider)

- **Phase 0 prerequisite reference:** `planning/feature_shared-index-and-concepts_2026-08-29.md` — verify path matches the actual file once `main` creates it.
- **Disjointness:** `planning/in-progress/` currently empty; no conflicts at time of review.

### Recommendations

Specify the boss `requires` encoding first — it affects Phase 4 and may require a Lane A follow-up. Then tighten Phase 3 with concrete header tags and thresholds, and align the journal structure with Area 0's actual layout.

### Assessment

**Implementable as written?** With fixes

**Reasoning:** The curriculum plan is strong and well-grounded, but the boss unlock encoding and `verify.py` contract are under-specified enough to cause incorrect implementation.

---

## Disposition

*Appended by the author after `plan-receive-review`. Everything above is the review as received and is unaltered.*

**Not recorded.** This review was read and acted on — `d99fdde`, `c056f58` revised the `area-1` plan — but nobody wrote down which findings were accepted, which were rejected, or why.

It is unrecoverable, and that is the point of saying so here rather than leaving the section absent. A rejected finding leaves no trace in a plan, so nothing distinguishes "considered and argued down" from "missed". Anyone re-reading these findings should treat them as open questions rather than as settled ones.

The rule that would have prevented it arrived on 2026-08-30: `.claude/skills/plan-review-record/SKILL.md`.
