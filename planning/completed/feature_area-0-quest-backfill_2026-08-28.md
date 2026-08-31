# Area 0 Quest Backfill

**Status:** Completed
**Track:** area-0
**Date Discovered:** 2026-08-28
**Discovered During:** the Lane B planning session that produced
`planning/feature_area-1-control_2026-08-28.md` and its three siblings

## Objective

Author the three Area 0 quests that need nothing from Lane A — `s2e1`, `s4e1`, `s5e1` — so
the campaign map stops reading `1 of ~5` for an area that has been taught since week 1.

## Success Criteria

- [x] Three `a0-` quests: YAML, brief, starter and hidden tests each
- [x] **And the six broken sigils, `b1`–`b6`**, added 2026-08-31 when the traceback gate
      opened. Same four files each; nine `a0-` quests in total
- [x] `cd pyquest && npm run validate:content` exits 0
- [x] Every hidden test asserts on a **computed value or stdout, never on a picture**. The
      six fix-it quests add a second kind: **what the submission raised**, caught and named
- [x] Tests run with `turtle` and `tkinter` unavailable — the runner is `python:3.14-alpine`
      and has neither. Proven by running them with both blocked at import
- [x] Each test proven **both ways**: it passes a correct solution and fails the specific
      wrong answer the exercise is designed to catch
- [x] `content/areas/area-0.yml` left `partial` — see the note on the manifest below.
      `estimatedQuests` moved 5 -> 10, which is a different claim and an honest one

## Context

`content/areas/area-0.yml` declares `authoring: partial` with `estimatedQuests: 5`, and
`content/quests/` holds **two** items — `a0-name-tag` and the `a0-first-light` boss. §5.2 sets
five quests plus a boss per area. Area 0 is three quests short, and the campaign map renders
it as `1 of ~5` — honest, per §5.1a, but incomplete.

**The design work is already done.** `curriculum/area-0/README.md` carries a section headed
"Which of these should become quests" that names the exercises, assigns DCs, splits them into
`hidden-tests` and `peer-signoff`, and gives the reason each verifies cleanly:

- `s2e1_square_by_name.py` task 4, DC 8 — perimeter computed rather than typed
- `s4e1_type_lab.py`, DC 12 — every answer is a value; tests assert on `type()` directly
- `s5e1_ask_and_draw.py`, DC 12 — feed stdin, assert on stdout
- `b1`–`b6` as fix-it quests, DC 5–10 — the starter is the broken file, the test is that it
  runs. The cleanest quest shape in the area

Only transcription remains.

## Authoring is not blocked — playing is

**An earlier version of this stub said the Pyodide turtle shim was a hard prerequisite and
the whole item was blocked. That was wrong**, and it conflated two different things — the
same mistake the Area 2 plan made about its own laptop step:

- **Authoring** these quests produces YAML, briefs, starters and hidden tests. None of that
  needs turtle to render anywhere. Those files can be written today and will pass
  `validate:content`.
- **Playing** them needs the shim, and genuinely so. Without it a learner opens a drawing
  quest, presses **Run**, and sees nothing. That is unusable, so the shim gates *shipping*
  these to a player.
- **Submit does not need the shim at all.** It goes to the API and runs hidden tests
  server-side under CPython, where `turtle` imports and runs headless. Area 1 settled the
  pattern: hidden tests for drawing exercises assert on **computed values** — the turn angle,
  the side count, the accumulator's total — never on the picture.

So this item is **partly startable now**. What is genuinely gated is narrower than it looked.

## Known Scope

Three to five `a0-` quests scaffolded with `npm run new:quest`, hidden tests written, and
`content/areas/area-0.yml` reconsidered once the fifth lands.

**On the manifest:** do not flip `authoring` to `complete` mechanically on reaching five.
`content/areas/area-1.yml` records the better reading — §5.2 sets five as the *shape* of an
area, not its ceiling, so `complete` asserts that nobody will add a sixth. That is a decision
a person makes, not a consequence of hitting a number.

### Startable today

- `s2e1_square_by_name.py`, `s4e1_type_lab.py`, `s5e1_ask_and_draw.py` — three `hidden-tests`
  quests whose assertions are on computed values and stdout, not on drawings. Authoring and
  validation need nothing from Lane A.

### Gated on SPA Phase 4 — the turtle shim

Any of these being **playable in the browser**. Every Area 0 exercise draws, and turtle does
not render in Pyodide unaided. §8 flags the shim as being on the curriculum's critical path
and explicitly *not* to be scheduled last; the SPA plan budgets it at one to two days and
requires its own Phase 2 first.

Authored-but-unplayable quests are not wasted — they validate, they are reviewable, and they
light up the day the shim lands.

### Gated on an open question nobody owns — **answered 2026-08-31, and the answer is yes**

**`b1`–`b6` want a verifier that asserts on the traceback**, not on exit code. A quest that
accepts any passing run would accept *"delete the broken line"*, which is exactly the wrong
lesson for the session that taught reading errors.

Whether `hidden-tests` can express that was **unchecked from 2026-08-28 to 2026-08-31**, and
it held six quests for three days because no plan owned the reading. It has now been read.

**It can, today, with no change to the engine, the contract or the runner.** A `hidden-tests`
job is ordinary pytest in a real CPython 3.14 sandbox with the submission on disk beside the
test: `apps/runner/src/pyquest_runner/job.py:223-226` writes the submission to
`work/solution.py` and the hidden test's source to `work/hidden_test.py`, then runs
`python -m pytest hidden_test.py -q --tb=no --no-header` (`job.py:143-165`). Anything pytest
can express — `pytest.raises`, `traceback.format_exc()`, catching `NameError` and reading its
message and line — a hidden test can express. The contingency in the sentence above does not
fire; there is nothing to escalate to Lane A.

The shape is already shipping in this repository. `content/tests/a2-where-the-file-lives_test.py:50`
asserts on a captured `stderr`, and `:73-79` asserts a command **fails**. So "did it break, and
how" is authored, not theoretical.

**Two authoring constraints that must carry into all six quests**, both discovered by the same
reading and neither obvious:

1. **`--tb=no` is deliberate, and it eats your assertion messages.** `job.py:145-153` suppresses
   tracebacks so hidden assertions cannot leak to the browser. Only pytest's short summary —
   **the test name** — reaches the learner. So `assert ..., "helpful hint"` is invisible, and
   the feedback has to live in the function name as a sentence:
   `test_the_broken_line_was_fixed_not_deleted`. This is already the repo's convention and now
   there is a reason written down for it.
2. **`turtle` must be stubbed before the submission runs.** The runner is `python:3.14-alpine`
   with neither tkinter nor a display. `content/tests/a0-ask-and-draw_test.py:26-72` installs a
   `TurtleSpy` into `sys.modules["turtle"]` before `runpy.run_path`. All six of `b1`–`b6`
   import turtle, so they inherit this unchanged — **and the spy is also what defeats "delete
   the broken line"**, because it records that `left(90)` was actually called. The two halves
   of the quest are one mechanism: the traceback assertion proves the error is gone, the spy
   proves the behaviour is still there.

Verified empirically at Python 3.14 against a broken `b1` source: exception type, message, the
`solution.py, line 3` frame, and the recorded spy calls were all available to a test.

Not in scope: `b7_no_error_at_all.py`. Its win condition is that the learner *says what is
wrong*, and the curriculum README already rules it `peer-signoff` for that reason.

## Files Expected to Change

Added 2026-08-29 as Wave 3's first gate. This plan was promoted from a backlog stub and never
grew the section, which meant the rule that admits plans in parallel — a comparison of these
lists — could not be evaluated against it at all. Derived from what the track has actually
committed (`9bb627d`) plus what Known Scope still owes.

- `content/quests/a0-*.yml` — the quest definitions
- `content/briefs/a0-*.md` — one brief per quest
- `content/starters/a0-*.py` — starter files
- `content/tests/a0-*_test.py` — the hidden tests
- `content/areas/area-0.yml` — the manifest. **Held, not yet edited**: Known Scope defers
  `authoring: complete` until a person decides it, and Wave 3 adds the deferred wire fields
  below

**Read, not written — and declared because an unlisted read is still a collision.**
`curriculum/area-0/exercises/**` and `curriculum/area-0/sessions/**` are where these quests come
from; each `a0-` quest is an exercise promoted into content. `feature_curriculum-voice_2026-08-29.md`
rewrites that prose on the `main` track. The two are compatible — voice edits prose, this track
reads it and writes `content/` — but they are not disjoint, so they coordinate rather than
assume: if a session's wording changes under a quest being derived from it, this track re-reads
before it publishes.

## Deferred here from the content surface

`feature_content-surface_2026-08-29.md` adds `weeks` and `blurb` to every area manifest. It
cannot touch `content/areas/area-0.yml` while this track holds it, so that one edit lands here
instead, when this plan next opens the file:

```yaml
weeks: { from: 1, to: 2 }     # spec §3, Area 0 — First Light
blurb: <one line, authored — §3's prose is about the area, not a subtitle for it>
```

The schema widening is the content surface's; only this file's two fields are this track's. Do
not widen `AreaManifestSchema` here, and do not land these fields before that plan has — they
will not validate.

## Trigger for Promotion

**Two triggers now, because the work splits.**

1. **The three clean quests: promotable whenever there is appetite.** Nothing blocks them.
   The honest reason they have not been written is that Area 0 has been delivered in a
   terminal since week 1 and does not need them to teach — so they buy the campaign map's
   denominator, replay for medals (§5.10 makes replaying a cleared quest to take a medal a
   first-class action), and a second learner arriving later. Real value, not urgent.
2. **`b1`–`b6` and browser play: the turtle shim landing** — **Phase 4** of
   `planning/in-progress/feature_spa_2026-08-28-v2.md`, plus an answer to the traceback
   question above.

   **Half of this trigger fired.** The turtle shim landed 2026-08-30 — all five SPA phases are
   done, and the shim's geometry is proved against the stroke protocol. **The traceback
   question is the whole of what remains**, and it is a question about a contract this
   repository already contains rather than a dependency on anybody's work: read
   `hidden-tests` and find out whether a verifier can assert on stderr. It is an afternoon's
   reading that unblocks six quests, and it has been sitting unanswered since 2026-08-28
   because no plan owned it.

*The path and phase in this trigger were both stale until 2026-08-29: the SPA plan has been
renamed to `-v2` and moved to `in-progress/`, and the turtle shim is its Phase 4, not Phase 3.*

---

## Status — 2026-08-29, the three unblocked quests are done

**Startable-today scope complete. The gated scope is untouched and still gated.**

### Delivered

| id | DC | Concepts | Catches |
|---|---|---|---|
| `a0-the-perimeter` | 8 | `variables`, `int`, `print` | a typed perimeter — 360 is right at height 60 and wrong at 50 |
| `a0-the-type-lab` | 12 | `int`, `float`, `str`, `bool`, `print`, `variables` | `/` where `//` was wanted, an unconverted `type()`, a placeholder left in |
| `a0-ask-and-draw` | 12 | `input`, `str`, `int`, `f-strings`, `variables`, `print` | the session-5 bug — `forward()` handed a `str` straight off `input()` |

Six files each: YAML, brief, starter, hidden tests. `content/` is now **17 items across 3
areas**, up from 14.

### Verified, not asserted

```console
cd pyquest && npm run validate:content    OK, 17 items across 3 areas, exit 0
ruff check content/tests/a0-*.py content/starters/a0-*.py   All checks passed!
pyright  (--pythonpath, per tools/python/)                  0 errors
```

Every test proven **both ways**, against real solutions and against the specific wrong
answer its exercise is designed to catch — 5, 7 and 5 passing on correct submissions, and
each failing the intended mistake.

**And proven headless.** The runner is `python:3.14-alpine` (§6.6) with neither tkinter nor
a display. All three suites were run with `turtle` *and* `tkinter` blocked at import by a
`sys.meta_path` hook, and all three pass — so `import turtle` in a submission resolves to
the stub, never to the real module.

### Two findings

**The `TurtleSpy` pattern is Area 1's, and it is load-bearing rather than convenient.**
Without it these quests could not be verified at all: Area 0's exercises all draw, and the
runner cannot import turtle. It is now used by eight quests across two areas and deserves
naming as the house pattern for any drawing quest.

**A test that coerces the value cannot catch a type error.** The first draft of
`a0-ask-and-draw` asserted `firsts("forward") == [150.0, ...]`, and the session-5 bug —
`forward(answer)` with `answer` a `str` — passed it, because `float("150") == 150.0`. Caught
only by running the wrong solution and finding two failures where three were expected. The
test now asserts on the argument's **type**, and the helper carries a comment saying why
coercing elsewhere is safe.

### Deviations

`content/starters/a0-the-type-lab.py` carries two `# noqa: UP003`. Ruff wants
`type("120")` rewritten as `str`, which would hand the learner the answer — asking `type()`
what a literal is *is* the exercise. Suppressed narrowly, with the reason in the file.

### Still gated, unchanged

- **`b1`–`b6`**, on whether `hidden-tests` can assert on a traceback. Unchecked.
- **Browser play for all of these**, on SPA Phase 4's turtle shim.
- `content/areas/area-0.yml` stays `authoring: partial` — five is the shape of an area, not
  its ceiling, and `complete` is a decision somebody makes.

---

## Status — 2026-08-31, the six broken sigils are done

**The gate opened and the whole plan is delivered.** `b1`–`b6` are authored, proven and
validating. Nothing in Known Scope is outstanding.

### Delivered — the six broken sigils

| id | from | DC | Concepts | The error it is about | Catches |
|---|---|---|---|---|---|
| `a0-the-typo` | `b1` | 5 | `reading-errors` | `NameError` | deleting `turtel.left(90)` instead of fixing it |
| `a0-the-wrong-kind` | `b2` | 8 | `reading-errors`, `str`, `int` | `TypeError` | deleting the order; a `str` that still looks like 100 |
| `a0-never-closed` | `b3` | 8 | `reading-errors` | `SyntaxError` | deleting the unclosed line instead of closing it |
| `a0-out-of-line` | `b4` | 8 | `reading-errors` | `IndentationError` | deleting the indented line instead of moving it |
| `a0-no-such-order` | `b5` | 10 | `reading-errors` | `AttributeError` | deleting the misspelled order, losing the second side |
| `a0-not-a-number` | `b6` | 10 | `reading-errors`, `int`, `str` | `ValueError` | deleting `size`; silencing it with `size = "10"`; a number that is not ten |

Four files each: YAML, brief, starter, hidden tests. `content/` is now **23 items across 8
areas**, and Area 0 holds ten quests and a boss.

### The shape both halves take

Every one of the six asserts twice, because either half alone teaches the wrong lesson:

1. **The error is gone**, and named. `attempt()` *catches* what fell out rather than letting
   it propagate, so the suite can say `not isinstance(fell_out, NameError)` in one test and
   `fell_out is None` in another. Under `--tb=no` only the test's NAME survives, so the
   diagnosis has to live in the name — a bare propagating exception would say only that
   something, somewhere, went wrong.
2. **The behaviour is still there.** `TurtleSpy` records that `left(90)` was actually called.
   That is what refuses *"delete the broken line"*, and it is the reason a fix-it quest can be
   verified at all.

**The spy had to stop being a yes-man.** Area 1's `TurtleSpy` answers to any attribute name
and accepts any argument. Under that spy `turtle.forwrd(100)` and `turtle.forward("100")` do
not raise at all — so `a0-no-such-order` and `a0-the-wrong-kind` would have passed their own
broken starters untouched. The version in these six reproduces two of the real module's
refusals: an unknown name raises `AttributeError` (an `ORDERS` allowlist, written generously
so a learner who adds a legitimate call is not punished for it) and a non-numeric distance
raises `TypeError`. Measured, not assumed — see the seeded mutant below.

### Verified, not asserted — the second pass

```console
cd pyquest && npm run validate:content              OK, 23 items across 8 areas, exit 0
cd pyquest && npm run typecheck                     exit 0, all seven workspaces
cd pyquest && npx tsc -b packages/content --force   exit 0, dist/ emitted
py -3.14 -m ruff check content/tests/               All checks passed!
py -3.14 -m pyright (--pythonpath, per tools/python/) on the six new tests
                                                    0 errors, 0 warnings, 0 informations
```

**There is no root `build` script** in `pyquest/package.json` — builds are per workspace, and
`@pyquest/content` exports `./dist`, which is gitignored. `--force` is how you know `tsc -b`
emitted rather than skipping on a stale `tsconfig.tsbuildinfo`.

**Every quest proven three ways**, through a harness that mimics `job.py` exactly — submission
written to `solution.py`, hidden test to `hidden_test.py`, then `pytest hidden_test.py -q
--tb=no --no-header -p no:cacheprovider`:

| quest | RED, the starter untouched | GREEN, the fix | MUTANT, the wrong answer |
|---|---|---|---|
| `a0-the-typo` | 5 failed | 5 passed | line deleted: 2 failed · a side dropped: 1 failed |
| `a0-the-wrong-kind` | 5 failed | 5 passed, and 5 passed for `int("100")` | order deleted: 3 failed |
| `a0-never-closed` | 5 failed | 5 passed | line deleted: 2 failed |
| `a0-out-of-line` | 5 failed | 5 passed | line deleted: 2 failed |
| `a0-no-such-order` | 4 failed | 4 passed | order deleted: 2 failed |
| `a0-not-a-number` | 5 failed | 5 passed, and 5 passed for `size = 10` | deleted: 4 failed · `size = "10"`: 4 failed · not ten: 1 failed |

**And proven headless**, the same way the first three were: every run installed a
`sys.meta_path` hook raising `ImportError` for `turtle`, `tkinter` and `_tkinter`. A submission
doing `import tkinter` is refused, which is what the runner's `python:3.14-alpine` does (§6.6).

**And the rig itself was proven.** A check nobody has watched fail is worth nothing, and that
applies to the verification as much as to the tests. Replacing the strict spy with a yes-man
and re-running the broken starters shows exactly what the two refusals buy:

```console
a0-no-such-order   honest 4 failed  ->  yes-man 2 failed, 2 passed
                   lost: test_turtle_is_no_longer_given_an_order_it_does_not_have
                         test_the_program_now_runs_all_the_way_to_the_end
a0-the-wrong-kind  honest 5 failed  ->  yes-man 2 failed, 3 passed
                   lost: test_forward_no_longer_raises_a_type_error
                         test_the_line_is_still_drawn_the_order_was_fixed_not_deleted
                         test_the_program_now_runs_all_the_way_to_the_end
```

### Three findings

**A fix-it quest cannot have a lint-clean starter, and that IS the quest.** All six starters
are broken source by design, so `ruff check content/starters/a0-*.py` now reports six errors it
is right to report: `F821 Undefined name 'turtel'`, an unexpected EOF for the unclosed bracket,
an unexpected indentation for the stray one. Pyright objects to the other three
(`turtle.forwrd`, `forward("100")`). **The `.py` quality gate covers `content/tests/` and the
unbroken starters; these six are excluded, deliberately.** Nothing automated runs ruff or
pyright in this repository today, so this is a note for whoever writes that gate: an `exclude`
for the broken sigils goes in with it, or the gate fails on content that is correct.

**A hidden test cannot import a shared helper.** `job.py:223-226` writes exactly one test file
into the workspace, so every hidden test is self-contained by contract and the turtle stub is
duplicated six times on purpose. It was generated from one skeleton rather than copied by hand.
The day a seventh needs it, that is an argument for a scaffolder — never for a
`content/tests/_support.py` the runner would have no way to ship.

**`b1`'s concept tags were trimmed.** `curriculum/area-0/README.md` tags `b1_the_typo.py`
`reading-errors, print`, and the file contains no `print`. The quest carries `[reading-errors]`
alone. Concept tags drive §5.4's spaced repetition, so a tag naming vocabulary the quest does
not exercise queues an invasion for something it never taught. The curriculum's own coverage
table is unaffected: it counts exercises, not quests.

### `content/areas/area-0.yml`

Opened, and three things landed:

- **`estimatedQuests: 5` becomes `10`.** Ten quests are authored, and an estimate that says
  five is not an estimate. §5.1a's whole argument is that the denominator has to be honest.
- **`authoring` stays `partial`**, unchanged and for the recorded reason: §5.2 sets five as the
  shape of an area rather than its ceiling, and `complete` is a decision a person makes.
- **`weeks` and `blurb` added** — the two fields `feature_content-surface_2026-08-29.md`
  deferred to this track. Its schema widening had already landed: `AreaManifestSchema` carries
  both as optional and names `area-0.yml` as one of the two files it was waiting on.

### Deviations in this pass

The six hidden tests each carry one `# noqa: BLE001`, on `except Exception as raised`, with the
reason in the file. Catching everything *is* the assertion here — the quest is about whatever
fell out, and a narrower catch would let a brand-new mistake slip past the test that says
nothing may fall out any more.

### Still open, and not this plan's

- **Browser play.** The turtle shim landed 2026-08-30; nobody has played these six through it.
- **`b7_no_error_at_all.py`** stays `peer-signoff` and stays out of `content/`. Its win
  condition is that the learner *says what is wrong*, which no test can check.

---

## Status

**Final Status:** Completed
**Track:** area-0
**Completed:** 2026-08-31
**Completed By:** Claude (Opus 5)

### Outcomes

All nine quests. The three unblocked ones landed 2026-08-29; the six `b1`–`b6` fix-it quests
landed 2026-08-31, the same day the traceback question that had gated them since 2026-08-28 was
finally read rather than wondered about.

`content/` is **23 items across 8 areas**, validator exit 0. Every hidden test proven both ways
and each with a seeded mutant that the suite caught.

Both halves are present in every one of the six: `attempt()` catches what fell out, so one test
can assert the error is gone and another that the behaviour survives; and a strict `TurtleSpy`
proves the order was actually called. **That pairing is the quest** — without the spy, "delete
the broken line" passes.

### Deviations

- **`estimatedQuests` 5 → 10.** Not a re-estimate: ten quests exist, so "~5" had become a wrong
  answer rather than an approximation.
- **`weeks` and `blurb` landed here**, which the content-surface plan had deferred into this
  track. Its schema widening had already shipped and named `area-0.yml` as one of the two files
  it was waiting on.
- **`b1`'s concept tags trimmed** to `[reading-errors]`. The curriculum README tags it
  `reading-errors, print` and the file has no `print` — a tag naming vocabulary the quest does
  not exercise would queue a §5.4 invasion for something it never taught.

### Lessons Learned

- **The Area 1 `TurtleSpy` is a yes-man, and reusing it would have broken two of these quests
  silently.** It answers to any attribute and accepts any argument, so `turtle.forwrd(100)` and
  `turtle.forward("100")` raise nothing under it — `b5` and `b2` would have *passed their own
  broken starters*. The investigation that opened this gate said the six would "inherit this
  unchanged"; they could not. The spy here reproduces two real refusals: an `ORDERS` allowlist
  raising `AttributeError`, and `TypeError` on a non-numeric distance. **A stub built to let
  code run is the wrong tool for a quest about code failing.**
- **A fix-it quest cannot have a lint-clean starter**, by construction. `ruff check
  content/starters/a0-*.py` reports six errors it is right to report. Nothing runs ruff over
  starters today; **whoever writes that gate must exclude these six or it will fail on correct
  content.**
- **Three days of block, zero days of work.** The gate was a question nobody owned, about a
  capability the repository already had, in a pattern already shipping in `content/tests/a2-*`.

### Backlog Items Created

None.
