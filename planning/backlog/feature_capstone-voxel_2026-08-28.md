# Capstone — Voxel

**Status:** Backlog
**Track:** capstone
**Date Discovered:** 2026-08-28
**Discovered During:** the Lane B planning session that produced
`planning/feature_area-1-control_2026-08-28.md` and its three siblings

## Context

A 3D Minecraft-like game in Python using Ursina, whose flagship demo is exactly that. Voxel
terrain, block placement and destruction, textures, save and load, his own mechanics.

**The pitch matters: he built a game, he did not mod one.** That sentence is the reason §4
chose Ursina over `mcpi` and accepted a slower start — Areas 3 through 5 written against
`mcpi` would be abandoned at week 37 when the capstone started over in a different framework,
and thirty weeks of discarded work reads as a bait and switch. Ursina compounds instead: every
area's work survives, the repository tells one story, and the capstone is the culmination of
the campaign rather than a fresh start.

By the time he arrives, `world.py` is entirely gone — `BLOCKS` and `place()` retired at Area
4, `start()` at Boss 5. The capstone is written against raw Ursina, which he has by then
earned every line of.

## Known Scope

Not an area. It has no fixed concept list, no session plan and no boss, and it should not be
authored as though it were — this is his project, and §3 principle 3 (*give options
everywhere*) applies more here than anywhere in the campaign. What the plan produces is
scaffolding for a long self-directed build: a scope conversation, a milestone ladder he
chooses from, and the review cadence — not a curriculum.

**One criterion is still open and it is a real gate.** Phase 0a passed on 2026-08-27 — the
the son's laptop renders a cube at ~57 fps with no GDI Generic fallback, so Ursina is viable — but §8
records that **the `minecraft_clone` benchmark remains outstanding and is the only thing that
could still qualify it.** A cube at 57 fps and a voxel world at 57 fps are different claims.
Run that benchmark long before week 37; it is the same class of risk the Ursina spike was
built to retire, and the answer arriving late is what makes it expensive.

The `feature_graphical-quest-performance-budget_2026-08-27.md` measurement tool, made durable
at Area 5, is what this is measured with.

## Trigger for Promotion

**Boss 7 cleared**, or week 45 — whichever is first, because the capstone runs alongside the
last weeks rather than after them.

**The `minecraft_clone` benchmark promotes much earlier and separately: alongside the
`world.py` shim plan**, since that plan is already measuring framerate on the son's laptop and it is
cheap to answer both questions in one sitting.
