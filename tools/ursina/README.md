# ursina

**Both machines, identical versions. Needed week 9, Area 3 session 1.**

The 3D engine Areas 3 through 5 build on, and the capstone. A learner never touches it directly —
they import `curriculum/lib/world.py`, a three-name shim, which comes down on a schedule.

## The pin lives with the code, not here

**`curriculum/lib/requirements.txt`** is the single source of the version:

```
py -3.14 -m pip install -r curriculum/lib/requirements.txt
```

That file is deliberately *not* copied into this directory. It sits beside `world.py`, and
`curriculum/lib/smoke.py` asserts that the file and the installed version agree — two copies
would drift and the assertion would start lying.

## Two rules that are not optional

**Identical on both machines.** §6.4 makes `git push` the verification mechanism: one machine
pushes, another clones and runs the code cold. Two machines on different ursina versions
break that quietly, and the failure looks like the code being wrong.

**Never upgrade mid-area.** Between areas only, only when something is actually broken, and
only after `smoke.py` passes on **both** machines against the new version. 8.3.0 has already
churned once — `ursina/samples/` left the pip package, `Ursina` became `@singleton`-wrapped,
and there is no `ursina.__version__` to read.

## Hardware

Ursina needs a **hardware-accelerated OpenGL context**, not a software fallback. This was
gated before anything else was built (spec §8, Phase 0a) and it passed on 2026-08-27: the
machine it was tested on — a 2017 mobile workstation, the weaker of the two — renders a cube at
~57 fps with no GDI Generic fallback.

**That is a viability floor, not a headroom measurement.** The ~5,000-block authoring cap
Area 3 writes against still needs confirming on that machine — the spike's 14.9 / 1,424 fps
figures are from an RTX 5090 and do not transfer. Until that measurement lands,
`planning/in-progress/feature_world-shim_2026-08-28.md` holds Area 3's block-placing work.

## What proves it works

```
py -3.14 curriculum/lib/smoke.py
```

Seven checks: the pin matches the installed version, `import world` builds no app, all four
validation errors fire with the right messages, then a real window opens, builds 1,728
blocks, fuses them and renders. Exit 0 or the pin goes back.

**It needs a real display** — it opens a window on purpose. It needs nothing but Python and
ursina, so it runs on any learner's machine exactly as it stands.
