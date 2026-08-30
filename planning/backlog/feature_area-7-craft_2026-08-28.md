# Area 7 — Craft

**Status:** Backlog
**Track:** area-7
**Date Discovered:** 2026-08-28
**Discovered During:** the Lane B planning session that produced
`planning/feature_area-1-control_2026-08-28.md` and its three siblings

## Context

Weeks 37–48, nine concepts, and **Boss 7 — Visit Another Kingdom (Don't Break It)**: he
clones the parent's engine repository, branches, authors a new quest for the game he has
played all year, opens a pull request, receives a real review with comments he must address
before merge, and then plays the level he wrote.

Concepts: `pytest` · the debugger · type hints · comprehensions · generators · refactoring ·
performance intuition · branches and pull requests · reading unfamiliar code.

## Known Scope

The Area 1–3 template, plus three obligations no other area has.

**Boss 7's prerequisite is this repository being readable by an 11–14-year-old**, and that
is a constraint on work happening *now*, forty weeks early. `CLAUDE.md` already says it: *at
Boss 7 he opens this repository and reads them* — which is why the lexicon table exists and
why "Tier" is banned. When this plan is promoted, the check is real: someone reads the repo
as he will, and anything that only makes sense to its author gets fixed before he arrives.
§6.10 makes authoring a first-class feature precisely so his quest can be a real quest.

**The performance-intuition lesson is already written and waiting.** Deleting
`ground.combine()` from `world.py` and watching 1,424 fps become 14.9 is authored by
`feature_world-shim_2026-08-28.md` as a runnable exercise with its numbers recorded. This
area places it in a session. It is the one place in the campaign where a one-line deletion
produces a hundredfold difference he can see, and it beats any abstract lesson about
complexity.

**`debugger`, second pass.** `breakpoints` was registered at area 3 for stepping and the
Variables panel; `debugger` stays at area 7 for the deep pass — conditional breakpoints,
exception breakpoints, logpoints, the call stack. Two concepts, two passes, per §3 principle
7. The final VS Code rungs restore the **problems panel** (ruff and pyright, and the
Idiomatic medal) and the **source control view** — deliberately last, so the git commands
are muscle memory and the GUI is a convenience rather than a crutch.

`pytest` arriving here rather than earlier is worth arguing in the plan. He has been *passing*
hidden tests since week one and writing none. Area 7 is where the tests become his, which is
also where §5.10's Idiomatic medal stops being a grading rule and starts being a habit.

## Trigger for Promotion

**Boss 6 cleared**, or week 35.

Separately and earlier: **the readability pass on this repository**, which should happen
whenever the campaign reaches Area 5 — late enough that the repo has stopped churning, early
enough that Boss 7 is not blocked on a rewrite.
