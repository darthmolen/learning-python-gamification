# Area 0 Quest Backfill

**Status:** Backlog — **partly unblocked; see the split below**
**Track:** area-0
**Date Discovered:** 2026-08-28
**Discovered During:** the Lane B planning session that produced
`planning/feature_area-1-control_2026-08-28.md` and its three siblings

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
