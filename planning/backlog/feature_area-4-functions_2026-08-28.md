# Area 4 — Functions and Decomposition

**Status:** Backlog
**Track:** area-4
**Date Discovered:** 2026-08-28
**Discovered During:** the Lane B planning session that produced
`planning/feature_area-1-control_2026-08-28.md` and its three siblings

## Context

Weeks 15–20, ten concepts, Boss 4 The Loop. Vehicle: **Pygame Zero** — game loop, sprites,
keyboard input, collision, score.

This is the area where the shim starts coming down. §4: `BLOCKS` and `place()` are replaced
by **his own dict and his own `def`** here, which makes Area 4 the first time he deletes
scaffolding rather than receives it. That is the moment the whole "scaffolding retires on a
schedule" argument either pays off or does not, and the area should be authored around it.

Concept ids, from `pyquest/packages/content/src/concepts.ts`: `def` · `parameters` ·
`return` · `default-arguments` · `keyword-arguments` · plus scope, docstrings, pure versus
side-effecting, refactoring, `import`, and the stdlib set (`random`, `math`, `time`,
`pathlib`, `json`).

## Known Scope

Follows the Area 1–3 template: `curriculum/area-4/` in the Area 0 layout, five `a4-` quests
plus Boss 4 in `content/`, `local-repo` verifiers, `verify.py` reporting N of N,
`curriculum/README.md` updated.

Two things this area carries that the earlier ones do not:

**A Pygame Zero viability spike, and it is a gate.** Ursina got one as Phase 0a for exactly
this reason — §4 rules out changing vehicles mid-campaign because a learner who has spent
thirty weeks on something reads a switch as a bait and switch, correctly. Discovering at week
15 that pgzero does not run on the son's laptop, or does not work under the pinned Python 3.14,
costs six weeks. Run it before week 15 and no later than Boss 3. Check at minimum: it
installs under 3.14, it opens a window on the son's laptop, the `pgzrun` entry point works from a
plain `python thing.py` (Area 2b vocabulary, not a bespoke runner), and it coexists with
ursina in one venv or is documented as needing its own.

**The shim's first retirement.** `BLOCKS` and `place()` come out. `curriculum/lib/README.md`
records the schedule; this area is where the first two rows execute. The exercise should be
his — he writes the `def` and the dict, then deletes the import — not a diff handed to him.

Also here: the VS Code rung restoring **outline and breadcrumbs**, per
`feature_vscode-profile-and-tool-quests_2026-08-28.md`, because files gain functions worth
navigating between.

## Trigger for Promotion

**Boss 3 cleared**, or week 13, whichever is first — the area needs authoring before the
learner arrives at it.

**The Pygame Zero spike promotes earlier and separately: before Boss 3 is authored.** It is a
gate, not a phase, and a gate discovered late is the expensive kind.
