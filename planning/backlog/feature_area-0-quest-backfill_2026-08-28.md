# Area 0 Quest Backfill

**Status:** Backlog
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

## Known Scope

Three to five `a0-` quests scaffolded with `npm run new:quest`, hidden tests written, and
`content/areas/area-0.yml` flipped to `authoring: complete` once the fifth lands.

Two constraints the curriculum README already flagged for whoever does this:

**The turtle-to-canvas Pyodide shim is a hard prerequisite.** Every Area 0 exercise draws,
and turtle does not render in Pyodide unaided. Until Lane A's SPA plan ships that shim (§8,
where it is explicitly flagged as being on the curriculum's critical path and *not* to be
scheduled last), these exercises run in a terminal or not at all. That is fine — it is why
the area was written to need nothing — but it is why this item is blocked rather than merely
unstarted.

**`b1`–`b7` want a verifier that asserts on the traceback**, not on exit code. A quest that
accepts any passing run would accept "delete the broken line", which is exactly the wrong
lesson for the session that taught reading errors. Check whether the `hidden-tests` verifier
can express that before authoring six quests against it; if it cannot, that is a finding for
Lane A's API plan, not a workaround here.

Not in scope: `b7_no_error_at_all.py`. Its win condition is that he *says what is wrong*, and
the curriculum README already rules it `peer-signoff` for that reason.

## Trigger for Promotion

**The Pyodide turtle shim shipping** — Phase 3 of `planning/feature_spa_2026-08-28.md`.

Until then this is inert, and the curriculum is unaffected: Area 0 has been delivered in a
terminal since week 1 and does not need these quests to teach.
