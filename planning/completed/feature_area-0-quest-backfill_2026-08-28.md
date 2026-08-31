# Area 0 Quest Backfill

**Status:** In Progress — the three unblocked quests only; see Trigger for the rest
**Track:** area-0
**Date Discovered:** 2026-08-28
**Discovered During:** the Lane B planning session that produced
`planning/feature_area-1-control_2026-08-28.md` and its three siblings

## Objective

Author the three Area 0 quests that need nothing from Lane A — `s2e1`, `s4e1`, `s5e1` — so
the campaign map stops reading `1 of ~5` for an area that has been taught since week 1.

## Success Criteria

- [ ] Three `a0-` quests: YAML, brief, starter and hidden tests each
- [ ] `cd pyquest && npm run validate:content` exits 0
- [ ] Every hidden test asserts on a **computed value or stdout, never on a picture**
- [ ] Tests run with `turtle` and `tkinter` unavailable — the runner is `python:3.14-alpine`
      and has neither. Proven by running them with both blocked at import
- [ ] Each test proven **both ways**: it passes a correct solution and fails the specific
      wrong answer the exercise is designed to catch
- [ ] `content/areas/area-0.yml` left `partial` — see the note on the manifest below

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

### Gated on an open question nobody owns

**`b1`–`b6` want a verifier that asserts on the traceback**, not on exit code. A quest that
accepts any passing run would accept *"delete the broken line"*, which is exactly the wrong
lesson for the session that taught reading errors.

Whether `hidden-tests` can express that is **unchecked**. It may need nothing new — asserting
on captured stderr is ordinary pytest — but the verifier contract has not been read with this
question in mind. **Check before authoring six quests against it**; if it cannot, that is a
finding for Lane A's API plan, not a workaround here.

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
