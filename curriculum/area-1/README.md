# Area 1 — Control

**Weeks 3–6. Ten sessions of 45–60 minutes.**
Spec: `docs/specs/2026-08-26-gamified-python-curriculum-design.md`, §4 Area 1.

`if` `elif` `else` · comparison and boolean operators · `while` · `for` and `range` ·
nesting · the accumulator pattern

**Vehicle: turtle into generative art.** Spirals, polygons, mandalas, parameterized
colour. Same import as Area 0, so nothing new to install stands between week 2 and week 3.

**BOSS 1 — The Sigil:** an art generator that takes input and produces something worth
hanging on a wall.

This area needs a text editor, a terminal, and Python 3.14. No application, no server, no
browser, no internet — spec §8 warns that if the curriculum waits on the app, *the app
becomes a satisfying way to postpone teaching a child Python*.

---

## Read in this order

1. **`dm-guide.md`** — how the session shape changes, the Socratic phrasings for every
   stall predicted here, and the invasion drills. Read this before session 1. It is the
   load-bearing document.
2. **`sessions/session-1-the-loop-that-draws.md`** — then one per session, on the night.
3. **`reference/session-6-answers.md`** — before session 6. Not during.
4. **`journal/entry-07-prompt.md`** — at the end of session 1.

---

## The sessions

| # | Title | Introduces | Resurfacing | Files |
|---|---|---|---|---|
| 1 | **The Loop That Draws** | `for`, `range` | `print`, `variables`, `int` | `s1e1`–`s1e3` |
| 2 | **Any Shape You Like** | `range` (three-arg) | `for`, `variables`, `int`, `float`, `input` | `s2e1`–`s2e3` |
| 3 | **The Loop That Does Not Stop** | `while`, `comparison-operators` | `for`, `variables`, `bool` | `s3e1`–`s3e4` |
| 4 | **Two Roads** | `if`, `else` | `comparison-operators`, `bool`, `for`, `range` | `s4e1`–`s4e3` |
| 5 | **And, Or, Not** | `boolean-operators`, `elif` | `if`, `else`, `bool`, `input` | `s5e1`–`s5e3` |
| 6 | **The Broken Loop** | — (errors, second pass) | `while`, `for`, `range`, `reading-errors` | `b1`–`b6`, `error-log.md` |
| 7 | **A Loop Inside A Loop** | `nesting` | `for`, `range`, `if`, `else` | `s7e1`–`s7e3` |
| 8 | **Carrying A Number** | `accumulator-pattern` | `variables`, `for`, `while`, `int`, `float` | `s8e1`–`s8e3` |
| 9 | **The Mandala** | — | `nesting`, `accumulator-pattern`, all | `mandala-brief.md`, `s9_mandala_lab.py` |
| 10 | **The Sigil** | — | all nineteen | `sigil-brief.md`, `s10_sigil_starter.py` |

### Why this order

**`for` before `while`.** A `for` loop over `range(6)` terminates, is visible, and draws a
hexagon on the first attempt. A `while` loop's first outcome is very often a hung window.
Area 0 established that failure is *scheduled* rather than stumbled into, and the same
discipline applies here: the hang gets its own session, with the escape hatch taught
before it happens.

**`while` before `if`, and session 3 is where `while True:` happens on purpose.** He is
going to write it this month whether or not anybody plans for it. Session 3 makes it a
lesson with a Ctrl-C at the end rather than an ambush on a Tuesday night. This mirrors
Area 0's session 3, which taught tracebacks at the exact moment he already had a
grievance.

**`if` arrives when a loop needs to branch, not before.** A conditional with nothing to
condition on is the "tour of types before you need a type" mistake Area 0 explicitly
refused. By session 4 he has a loop with a counter in it, so *"the first six sides are
red"* is a thing he actually wants.

**Session 6 is errors, second pass.** §3 principle 7: nothing is taught once and
abandoned. Area 0 session 3 taught reading a traceback. Session 6 here teaches the loop
failures that produce **no traceback at all** — the off-by-one, the condition that is never
false, the loop that runs zero times, the shape whose turns add up to 350.

**This is the hardest and most valuable session in the area, and it is the reason the area
is laid out the way it is.** Three of its six files say nothing whatsoever. Area 0's
subject was that an error message is the computer helping; this session's subject is what
he does when there is no message and he is the only detector in the room.

**Nesting before the accumulator.** Nesting is visual and instantly rewarding — a loop
inside a loop is a mandala. The accumulator is abstract and lands far better once he has
watched a shape grow, so session 8 gives it a job (a spiral whose side length increases)
rather than a definition.

**Session 8 sits after session 6 on purpose.** The accumulator's two signature bugs — the
total reset inside the loop, and `total = length` instead of `total = total + length` —
are both silent, and the second one leaves the picture completely unchanged. He needs
session 6's habit before he needs the pattern.

**Session 9 is the boss rehearsal**, exactly as Area 0's session 6 was, and session 10 is
the boss itself.

### Compressing to eight sessions

The plan says ten. If the calendar bites:

- **Merge 1 and 2.** Keep `s1e3`'s polygon engine and `s2e1`'s five predictions; `s2e2`
  goes to his own time.
- **Merge 4 into 5.** Session 5 teaches the same material under more pressure anyway.
- **Never cut session 3, session 6, or session 9.** Session 3 is where the hang gets
  taught, session 6 is the area's actual subject, and session 9 is the only rehearsal
  Boss 1 gets.

---

## Concept coverage

Generated from the `# concepts:` tags in the exercise files, which `verify.py` checks
against the Area 0 and Area 1 entries of `pyquest/packages/content/src/concepts.ts`.

| Exercise | Session | DC | Concepts |
|---|---|---|---|
| `s1e1_the_repeated_line.py` | 1 | 8 | `for`, `range`, `print`, `int` |
| `s1e2_what_range_gives.py` | 1 | 8 | `range`, `for`, `print`, `int`, `variables` |
| `s1e3_the_polygon_engine.py` | 1 | 10 | `for`, `range`, `variables`, `int`, `float`, `print` |
| `s2e1_three_numbers.py` | 2 | 10 | `range`, `for`, `print`, `int`, `variables` |
| `s2e2_counting_down.py` | 2 | 10 | `range`, `for`, `variables`, `int`, `float`, `print` |
| `s2e3_the_shape_dial.py` | 2 | 12 | `for`, `range`, `variables`, `int`, `float`, `input`, `f-strings`, `print` |
| `s3e1_the_first_while.py` | 3 | 10 | `while`, `comparison-operators`, `bool`, `variables`, `int`, `print` |
| `s3e2_the_shrinking_line.py` | 3 | 14 | `while`, `comparison-operators`, `variables`, `float`, `int`, `print` |
| `s3e3_while_versus_for.py` | 3 | 12 | `while`, `for`, `range`, `comparison-operators`, `variables`, `int`, `print` |
| `s3e4_the_hang.py` | 3 | 10 | `while`, `comparison-operators`, `variables`, `int`, `print`, `reading-errors` |
| `s4e1_two_roads.py` | 4 | 10 | `if`, `else`, `comparison-operators`, `bool`, `variables`, `int`, `print` |
| `s4e2_the_first_half.py` | 4 | 12 | `if`, `else`, `comparison-operators`, `for`, `range`, `bool`, `variables`, `int`, `print` |
| `s4e3_the_choice_board.py` | 4 | 12 | `if`, `else`, `comparison-operators`, `for`, `range`, `input`, `f-strings`, `bool`, `variables`, `int`, `str`, `print` |
| `s5e1_and_or_not.py` | 5 | 12 | `boolean-operators`, `comparison-operators`, `bool`, `if`, `else`, `variables`, `int`, `print` |
| `s5e2_the_ladder.py` | 5 | 14 | `elif`, `if`, `else`, `comparison-operators`, `for`, `range`, `bool`, `variables`, `int`, `print` |
| `s5e3_the_gatekeeper.py` | 5 | 14 | `boolean-operators`, `elif`, `if`, `else`, `comparison-operators`, `for`, `range`, `input`, `f-strings`, `bool`, `variables`, `int`, `print` |
| `b1_five_of_six.py` | 6 | 10 | `for`, `range`, `reading-errors`, `int`, `variables`, `print` |
| `b2_the_loop_that_never_ends.py` | 6 | 10 | `while`, `comparison-operators`, `reading-errors`, `variables`, `int`, `print` |
| `b3_the_flat_body.py` | 6 | 8 | `for`, `range`, `reading-errors`, `int`, `print` |
| `b4_a_number_it_cannot_count.py` | 6 | 12 | `for`, `range`, `reading-errors`, `int`, `float`, `variables`, `print` |
| `b5_the_name_that_never_was.py` | 6 | 12 | `for`, `range`, `reading-errors`, `int`, `variables`, `print` |
| `b6_the_shape_that_does_not_close.py` | 6 | 14 | `for`, `range`, `reading-errors`, `int`, `float`, `variables`, `print` |
| `s7e1_a_loop_inside_a_loop.py` | 7 | 12 | `nesting`, `for`, `range`, `variables`, `int`, `print` |
| `s7e2_the_grid.py` | 7 | 14 | `nesting`, `for`, `range`, `variables`, `int`, `print` |
| `s7e3_the_rosette.py` | 7 | 16 | `nesting`, `for`, `range`, `if`, `else`, `comparison-operators`, `variables`, `int`, `float`, `print` |
| `s8e1_carrying_a_number.py` | 8 | 12 | `accumulator-pattern`, `for`, `range`, `variables`, `int`, `float`, `print` |
| `s8e2_the_growing_spiral.py` | 8 | 16 | `accumulator-pattern`, `for`, `range`, `variables`, `int`, `float`, `print` |
| `s8e3_the_ink_budget.py` | 8 | 16 | `accumulator-pattern`, `while`, `comparison-operators`, `variables`, `int`, `float`, `print` |
| `s9_mandala_lab.py` | 9 | 18 | `nesting`, `accumulator-pattern`, `for`, `range`, `if`, `else`, `comparison-operators`, `variables`, `int`, `float`, `print` |
| `s10_sigil_starter.py` | 10 | 20 | all nineteen |

### All ten Area 1 concepts are covered

| Concept | Exercises |
|---|---|
| `for` | 23 |
| `range` | 23 |
| `comparison-operators` | 15 |
| `if` | 9 |
| `else` | 9 |
| `while` | 7 |
| `nesting` | 5 |
| `accumulator-pattern` | 5 |
| `elif` | 3 |
| `boolean-operators` | 3 |

**`elif` and `boolean-operators` are the thinnest, at three exercises each, and that is
honest rather than an oversight.** Both arrive in session 5 and both live almost entirely
inside it: `s5e1`, `s5e2`, `s5e3`, and then the boss starter. Area 0 said the same thing
about `bool` at three exercises, for a related reason.

The reason here is different from Area 0's, and worth stating rather than glossing.
`if`/`else` gives him a fork, and a fork covers most of what an Area 1 drawing wants to
decide. `elif` and `and`/`or` are the shape you reach for when the *rule* gets
complicated, and Area 1's rules are mostly simple: which half of the shape is this, is
this size allowed. **They are not padded out with make-work**; they appear where a rule
genuinely needs them — the colour ladder, the gatekeeper's three bands — and Area 3's
collections work is where they get busy, because a rule about a list is where "either of
these, but not that one" starts happening for real.

`s5e1` and `s5e2` are therefore deliberately dense for their session: the `or 1 or 2`
trap, the unreachable rung, and the `and`/`or` swap are all in there, because three
exercises have to carry both concepts properly.

### Area 0's nine, resurfacing

The tags record what a file **resurfaces**, not only what it introduces, because §5.4
schedules retrieval off them.

| Concept | Exercises | | Concept | Exercises |
|---|---|---|---|---|
| `print` | 30 | | `bool` | 8 |
| `int` | 30 | | `input` | 4 |
| `variables` | 28 | | `f-strings` | 4 |
| `float` | 12 | | `str` | 2 |
| `reading-errors` | 8 | | | |

**`str` at two is the one that needed watching**, and it is why `dm-guide.md` §5 drills it
in sessions 4 and 10 rather than leaving it to the exercises. Area 1 is about numbers, so
strings only genuinely occur where `input` does. The invasion coverage table in the DM
guide exists for exactly this: nineteen concepts across ten sessions is more than prose
can be trusted with.

---

## DC choices

Spec §5.1 derives XP from Difficulty Class, so these are the only numbers here the engine
will later read. They are set against the D&D scale as it reads for **this learner in week
three** — with two weeks of Area 0 behind him — not against Python difficulty in the
abstract.

- **8** — one idea, and the surprise is the point. `s1e1`, `s1e2`, `b3`.
- **10–12** — two ideas at once, or one idea plus a prediction he will get wrong.
- **14–16** — he has to decide something, not just type something. `s5e2`, `s7e3`, `s8e2`.
- **18** — a build with a blank half. `s9`.
- **20** — the boss.

**The band is 8–20 against Area 0's 5–18, and both ends moved for a reason.**

The floor moved up because there is no longer such a thing as a one-line change in this
area. The smallest thing here is a `for` loop, which is three lines and a rule about
indentation.

The ceiling moved to 20 because **Boss 1 is the first item in the campaign that pays a
level.** Boss XP is effective DC × 20 (§5.1), so DC 20 pays 400, and the level curve is
15·L·(L−1) — level 2 costs 30 and level 5 costs 300. One boss fight is worth several
levels at this stage and it should be.

Spec §5.1 renders DC ≥ 20 with a warning, and Area 0 deliberately stayed under it because
a warning label in week one teaches fear of the material rather than of hard quests. **By
week six that reasoning has inverted.** He has cleared an area, read seven tracebacks, and
survived a hung program on purpose. A boss that arrives with a warning on it is a boss
that looks worth beating, and it is the only item in the area that carries one.

---

## Which of these became quests, and which did not

Unlike Area 0, this area's content items exist. Five quests and Boss 1 in `content/`:

| Item | DC | Verifier | From |
|---|---|---|---|
| `a1-the-polygon-engine` | 10 | `hidden-tests` | `s1e3` + `s2e3` |
| `a1-the-countdown` | 12 | `hidden-tests` | `s3e1` |
| `a1-the-first-half` | 12 | `hidden-tests` | `s4e2` |
| `a1-the-gatekeeper` | 14 | `hidden-tests` | `s5e3` |
| `a1-the-growing-spiral` | 16 | `hidden-tests` | `s7e1` + `s8e2` |
| `a1-the-sigil` | 20 | `peer-signoff` | session 10 |

**Every hidden test asserts on a computed value, never on a picture.** `turtle` is replaced
by a recording stand-in, so the assertions are about the side count, the turn angle, the
sequence of lengths, and the accumulator's printed total. All thirty pass a correct
submission and each quest's signature bug fails it — a typed turn of 60 passes the hexagon
and fails the pentagon, which is precisely the mistake the quest exists to catch.

**Boss 1 carries no `requires`.** §5.2's *any three of five* is not expressible in content
and is not meant to be; it lives in the engine as `bossUnlocked`, which counts and does not
ask which. The YAML says so where the field would go.

### What was deliberately not made a quest

**Session 6's six broken loops.** They would make excellent fix-it quests — starter is the
broken file, test is that it behaves — and that is exactly the problem. Three of the six
are *silent*, and the win condition for those is that **he says what is wrong**, which no
test can check. A quest that accepted "it ran" would accept deleting the loop, which is
the wrong lesson taught by the right mechanism. They stay parent-delivered.

**`s1e2_what_range_gives.py` and `s5e1_and_or_not.py`.** Both are prediction exercises.
The value is in the wrong prediction he wrote down before running, and automating them
deletes the only part that teaches.

**Every choice board.** Open-ended by design. There is no right picture, and offering one
converts an exercise about making something into an exercise about guessing what the
author had in mind — the failure §2.3 diagnoses in the puzzle platforms.

**Session 9's mandala.** It is the boss rehearsal and it is judged by looking. Making it a
quest would give Boss 1 two sign-offs and no rehearsal.

### One note for whoever wires the pipeline

**The turtle-to-canvas shim (§8) is a hard prerequisite for any of this being playable in
a browser.** Every exercise and every quest here draws. Until Pyodide can render turtle,
these run in a terminal — which is fine, and is why the area was written to need nothing.

The hidden tests do **not** need the shim. They replace `turtle` outright, so they run
anywhere Python does.

---

## Verifying the exercises

```text
py -3.14 verify.py
```

Every `.py` file in `exercises/` and `reference/` is run, with the turtle window
suppressed, and checked against its own header tags:

- files tagged `# expect: ok` must exit cleanly **and draw at least `# min-strokes:`**
- files tagged `# expect: hangs` must **not** finish, and are killed at their
  `# timeout-seconds:`
- files tagged `# expect: NameError` (and so on) must fail with exactly that
- every `# concepts:` tag must be a real Area 0 or Area 1 concept id

Last run: **35 of 35**, on Python 3.14.6, Windows 11.

### The two things this harness knows that Area 0's did not

**Some files are supposed to hang.** `s3e4_the_hang.py` and
`b2_the_loop_that_never_ends.py` never finish, on purpose, because that is the lesson.
`# expect: hangs` makes "never finished" the assertion rather than an accident, and a file
tagged `hangs` that *exits* fails the check.

**Non-zero strokes is not enough in an area whose signature bug is an off-by-one.**
`b1_five_of_six.py` draws five sides of a hexagon and still puts the pen down, so a check
for "did it draw anything" passes it happily. Every file whose shape has a known stroke
count carries `# min-strokes:` with the real number. Both new checks were seeded with
mutants and watched to fail before being trusted: a grid whose rows went from 4 to 2 was
caught at 32 strokes against a floor of 64.

**One thing measured rather than assumed.** A turtle program that loops forever fills the
Tk canvas until the window dies and the process raises `turtle.Terminator` — so an
*untagged* runaway reports as a crash rather than as a timeout. Still a failure, still
with the file's name on it, and the reason the default wall clock is ten seconds rather
than something larger.

The stroke count itself is inherited from Area 0 and is real: an untouched turtle canvas
already holds four Tk items, because the cursor is itself a drawing, so the harness counts
pen-down moves instead of canvas items.

`reference/session-6-answers.md` quotes the broken loops' tracebacks with line numbers.
**Editing a docstring in `session-6/` shifts them.** Re-run the harness after any edit
there and check the numbers still match.

**Use `py -3.14` explicitly.** On the parent's machine `python` is 3.12 in PowerShell and
3.14 in Git Bash. The son is on 3.14.

---

## Directory map

```text
area-1/
  README.md                this file
  dm-guide.md              how to run a session; predicted stalls; the invasion drills
  verify.py                runs every exercise and checks it against its own tags
  sessions/                one plan per session, in delivery order
  exercises/               the .py files he actually runs
    session-6/error-log.md      the table he fills in while finding silent bugs
    session-9/mandala-brief.md  the boss rehearsal
    session-10/sigil-brief.md   Boss 1
  journal/
    TEMPLATE.md            copied once per session. Four prompts
    entry-07-prompt.md     what changes at entry 07, and how to score it
    entries/               his, empty
  reference/               Datamine payloads (spec 5.5). Parent's copy. Not his.
```
