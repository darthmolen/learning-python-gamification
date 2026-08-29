# Area 5 — State and Objects

**Status:** Backlog
**Track:** area-5
**Date Discovered:** 2026-08-28
**Discovered During:** the Lane B planning session that produced
`planning/feature_area-1-control_2026-08-28.md` and its three siblings

## Context

Weeks 21–28, eleven concepts, Boss 5 The Bestiary — an object-oriented game with multiple
entity types that behave differently. Vehicle: modeling a world — `Block`, `Player`,
`Inventory`, `World`.

§4's argument for the placement is the whole reason this area works: **objects finally have
an obvious reason to exist, because Area 4 supplied the pain of living without them.** Eight
weeks of a growing script with functions and a pile of parallel lists is the setup; `class`
is the punchline. An area plan that teaches `class` before that pain has landed throws the
sequencing away.

Concepts: `class` · `__init__` · attributes · methods · `__repr__` · instance versus class ·
composition · light inheritance · `try` · `except` · `raise` · custom exceptions.

## Known Scope

The Area 1–3 template. Eight weeks is the second-longest area, so the same mid-area slump
question applies and the plan should answer it in writing.

**The shim's final retirement lands here, on Boss 5.** `start()` becomes his own
`class World`. That is the last line of `curriculum/lib/world.py` to come down, and §4 makes
it the boss rather than an exercise — he does not finish this area until the scaffolding is
entirely gone and his own class runs the world. Half of `world.py` was readable to him the
day he first used it and all but one line by the time he retires it; Boss 5 is where that
claim gets tested.

`planning/backlog/feature_graphical-quest-performance-budget_2026-08-27.md` **becomes
load-bearing here**, per its own note. Once he owns the world class, the combine-into-one-mesh
behaviour is his responsibility rather than the shim's, and a per-quest entity ceiling stops
being an authoring convention and starts being something his own code has to honour.

Exceptions arriving in the same area as classes is deliberate and worth arguing: a custom
exception needs a class, and `try`/`except` needs something worth protecting — which an
`Inventory` with rules is and a script is not.

## Trigger for Promotion

**Boss 4 cleared**, or week 19.
