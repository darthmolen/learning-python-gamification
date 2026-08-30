# Ursina Tier 3 Vocabulary Ceiling — Spike Results

> **THROWAWAY.** Every file in this directory is a probe, not curriculum content and not
> shipping code. Nothing here is imported by anything real. The output of this spike is the
> recommendation below and the paragraph it puts into the spec. If a shim ships, it is
> written fresh during Tier 3 content authoring.

**Run:** 2026-08-27, parent's Windows machine (AMD Ryzen 9 9950X3D, 64 GB, RTX 5090 FE).
**Plan:** `planning/completed/feature_ursina-tier3-spike_2026-08-26.md`

---

## Verdict

**A shim is necessary, and the reason is not the one the plan expected.**

The plan expected to weigh a ceremony percentage against a 20% threshold. That measurement
was taken and is reported below, but it turned out to be the weaker of two findings. The
decisive ones are:

1. **Every line of raw Ursina a Tier 3 learner would write is ceremony — 9 out of 9, 100%.**
   The whole-file ratio only measures how much non-graphical logic you padded around it.
   There is no such thing as a Tier-3-legible line that talks to raw Ursina.
2. **Raw Ursina breaks the spec's "never hide failure" promise in two of three realistic
   Tier 3 mistakes** — one fails silently, one produces an eight-frame traceback into engine
   internals. See *Probe C* below. A shim is the only place to fix this.
3. **The stock one-Entity-per-block pattern is unplayable at any world size a Tier 3 learner
   would produce**, even on an RTX 5090. Three nested `range(20)` loops — an entirely natural
   thing to write in week 10 — render at **14.9 fps**. Through the shim, the same program
   runs at **1424 fps**.

The proposed shim is three names, 43 lines, positional arguments only, and retires fully by
Tier 5. It is in [`world.py`](world.py).

---

## Environment

| | |
|---|---|
| OS | Windows 11 Pro, build 26200 |
| Python | 3.14.6 |
| ursina | 8.3.0 |
| Panda3D | 1.10.16 |
| GL vendor | NVIDIA Corporation |
| GL renderer | NVIDIA GeForce RTX 5090/PCIe/SSE2 |
| GL version | 4.6.0 NVIDIA 596.49 |
| GDI Generic fallback | not triggered |

**Phase 1 gate passed.** A window opens, a cube renders, hardware accelerated, 60 fps
vsync-locked — matching the son's laptop at ~57 fps. Both machines are vsync-bound on a single
entity, so the single-cube number tells you nothing about either machine's headroom. That is
what the benchmark section below is for.

### Trap: `python` is not the same interpreter in every shell here

On the parent's machine, `python` resolves to **3.12.10** in PowerShell and **3.14.6** in Git
Bash. The son is on 3.14. Every command in this spike used `py -3.14` explicitly. Anyone
picking this up should do the same, or check `python --version` first in whichever shell they
are in.

---

## Phase 3 — Ceremony measurement

**Ceremony** is any line using syntax outside the Tier 0–3 vocabulary list (spec §4). Counted
over code lines; blanks and comments excluded.

The plan carves out an unavoidable floor — `from ursina import *`, `app = Ursina()`,
`app.run()` — as acceptable, teachable-as-incantation ceremony. Both gross and net-of-floor
figures are given.

### Raw Ursina

| Probe | Code lines | Ceremony (gross) | Floor | Ceremony (net of floor) |
|---|---|---|---|---|
| A — structure | 13 | 7 (53.8%) | 3 | **4 (30.8%)** |
| B — crafting | 30 | 6 (20.0%) | 3 | **3 (10.0%)** |
| C — traceback | 9 | 5 (55.6%) | 3 | **2 (22.2%)** |
| **All three** | **52** | **18 (34.6%)** | 9 | **9 (17.3%)** |

### Through the shim

| Probe | Code lines | Ceremony (gross) | Floor | Ceremony (net of floor) |
|---|---|---|---|---|
| A — structure | 9 | 1 (11.1%) | 1 | **0 (0%)** |
| B — crafting | 27 | 1 (3.7%) | 1 | **0 (0%)** |
| C — traceback | 5 | 1 (20.0%) | 1 | **0 (0%)** |
| **All three** | **41** | **3 (7.3%)** | 3 | **0 (0%)** |

The floor drops from three lines to one: `from world import *`. `place()` and `start()` are
positional calls, which is Tier 0 vocabulary — he has been calling `print()` and `len()`
since week one.

### The ratio is the wrong instrument, and here is the proof

Probe B measures 10.0% net-of-floor against raw Ursina, comfortably under the plan's 20%
threshold. Probe B is also the probe with the *most* engine ceremony in absolute terms. It
scores well only because 24 of its 30 lines are crafting logic that never touches Ursina.

Aggregate all three probes and raw Ursina scores **17.3%** — a pass. Dilution alone would
have cleared the gate.

Count the same lines a different way and the picture inverts:

| | Engine-touching lines | Of those, ceremony |
|---|---|---|
| Raw Ursina | 9 | **9 (100%)** |
| Through the shim | 7 | **0 (0%)** |

Every line that speaks to raw Ursina is unreadable to him; the ratio just measures padding.
**Recommendation: replace the whole-file ceremony ratio with the engine-touching-line ratio
as the metric for any future vehicle decision.** It is not gameable by writing more logic.

What makes each raw line ceremony:

- `Entity(model='cube', color=..., position=(x, y, z))` — keyword arguments, Tier 4
- `color.green` — attribute access on a module object, Tier 5
- `camera.position = (0, 4, -22)` — attribute assignment, Tier 5

---

## Probe C — what a Tier 3 mistake actually looks like

This is where the spike changed shape. Three realistic mistakes, tested against raw Ursina.

### 1. A `KeyError` in the learner's own dict — good, unexpectedly

```
  File "probe_c_traceback.py", line 13, in <module>
    Entity(model='cube', color=tints[kind], position=(i - 1, 0, 0))
                               ~~~~~^^^^^^
KeyError: 'diamond'
```

Five lines, points at his line, carets under the exact subexpression. The plan feared a
twelve-frame Panda3D stack trace and did not get one — because the error happens while Python
evaluates the *arguments*, before Ursina is ever entered. At Tier 3 all learner code is
module-level (no functions, no update loop), so this is the common case. Good news.

### 2. `color='green'` — catastrophic

Passing a string where a colour object belongs. This is the obvious guess, and the one he is
most likely to make:

```
  File "_err_color.py", line 3, in <module>
    Entity(model='cube', color='green', position=(0, 0, 0))
  File "...\ursina\ursinastuff.py", line 224, in __call__
  File "...\ursina\entity.py", line 103, in __init__
  File "...\ursina\entity.py", line 273, in color_setter
  File "...\ursina\color.py", line 86, in hex
  File "...\ursina\color.py", line 86, in <genexpr>
ValueError: invalid literal for int() with base 16: 'gr'
```

Eight frames, five of them inside ursina, ending in a message about hexadecimal that has no
relationship to anything he did. This is exactly the failure the plan predicted, and it
silently breaks the Tier 0 promise that errors are readable.

### 3. `model='cub'` and `position=(0, 0)` — worse than catastrophic: silent

```
warning: missing model: 'cub'
```

One yellow warning among forty lines of engine startup noise, then the program runs happily
and draws nothing. `position=(0, 0)` — a two-tuple instead of three — produces no diagnostic
at all.

A learner who mistypes a block name gets a blank window and no error. Spec §3 principle 5 is
*never hide failure*. Raw Ursina hides it.

### The same mistakes through the shim

Unknown block kind:

```
  File "probe_c_shim.py", line 9, in <module>
    place(i - 1, 0, 0, wanted[i])
  File "world.py", line 32, in place
ValueError: place() does not know the block kind 'diamond'.
            The kinds it knows are ['dirt', 'glass', 'grass', 'sand', 'stone', 'water', 'wood'].
```

Wrong number of arguments:

```
  File "_err_shim_argcount.py", line 2, in <module>
    place(0, 0, 'grass')
TypeError: place() missing 1 required positional argument: 'kind'
```

Two frames each, and the message names the fix. Cases 2 and 3 above become *unreachable* — he
never types a model name, a colour, or a position tuple, so he cannot get them wrong.

**This reframes what the shim is for.** It is not primarily a keyword-argument hider. It is a
validating boundary that keeps the engine's failure modes away from a learner who has no
vocabulary to read them. That is the load-bearing justification, and it would still hold even
if the ceremony ratio had come in under threshold.

---

## Phase 5 — Performance, measured

All figures: 1280×720, vsync disabled (`sync-video false`), 120-frame sample after a 30-frame
warmup, one process per configuration.

### One `Entity` per block — the stock voxel pattern

| Blocks | FPS | Frame time |
|---|---|---|
| 500 | 175.5 | 5.70 ms |
| 1,000 | 75.4 | 13.27 ms |
| 2,500 | 25.8 | 38.79 ms |
| 5,000 | 12.7 | 78.67 ms |
| 15,000 | 4.1 | 244.13 ms |

Adding `collider='box'`, as the stock `minecraft_clone` sample does, costs about 13% at 1,000
blocks and is lost in the noise by 5,000 — the pattern is bound by per-entity draw call
submission, not by physics.

**This falls below 60 fps between 1,000 and 2,500 blocks, on the fastest consumer GPU you can
buy.** A single 16×16×16 Minecraft chunk is 4,096 blocks.

### One combined mesh

| Blocks | FPS | Speed-up |
|---|---|---|
| 5,000 | 3,366.2 | **265×** |
| 15,000 | 2,481.0 | **605×** |

Build cost of `combine()` is roughly 0.3 ms per block, paid once at startup:

| Blocks | Entity build | `combine()` | Total startup |
|---|---|---|---|
| 1,000 | 0.06 s | 0.18 s | 0.24 s |
| 5,000 | 0.39 s | 1.22 s | 1.61 s |
| 15,000 | 2.08 s | 4.50 s | 6.58 s |

### End to end: the program he will actually write

Three nested `range(20)` loops. 8,000 blocks. Nothing exotic — this is a Tier 3 learner
discovering nested loops and turning the numbers up.

| | Startup | FPS | Entities |
|---|---|---|---|
| Raw Ursina | 1.31 s | **14.9** | 8,017 |
| Through the shim | 3.56 s | **1,424.1** | 18 |

**95× faster, for two extra seconds of startup and zero extra vocabulary.**

### Authoring rules this produces

- **The shim must combine.** `start()` calls `ground.combine()`. Not optional — without it,
  the first learner who turns a loop bound up to 20 gets a slideshow and no way to understand
  why, which reads as *my computer is bad*, not as a lesson.
- **Soft cap Tier 3 worlds at ~5,000 blocks.** 1.6 s startup here; estimate 4–5 s on the
  son's i7-7820HQ, which is roughly 2.5–3× slower on single-threaded Python. 15,000 blocks
  would be ~20 s on his machine and feels broken.
- **The capstone needs chunked, combined static terrain**, not one `Entity` per block. The
  stock sample's pattern is a demo, not an architecture.
- **Do not put colliders on static terrain.** Only on blocks that can be hit.

### The Tier 7 lesson survives — improved

The plan worried that a shim would bake the slow pattern in so deep it could not be undone at
Tier 7. Combining in `start()` does the opposite: the fast pattern is present in code he can
read, and at Tier 7 *"why is my game slow"* becomes an experiment he can run in one line —
delete `ground.combine()`, watch 1,424 fps become 14.9, put it back. That is a better lesson
than suffering the slowdown blindly for four tiers with no vocabulary to diagnose it.

---

## Phase 4 — The shim

[`world.py`](world.py). Three exported names, positional arguments only:

```python
BLOCKS                  # dict of kind -> colour, seven kinds
place(x, y, z, kind)    # one block; validates kind, raises a readable error
start()                 # combine, frame the camera on what was placed, run
```

Learner-facing vocabulary: **calling positional functions, and a dict he can read**. Nothing
else. `__all__` keeps `from world import *` from dumping Ursina's namespace into his file, so
he cannot accidentally reach `Entity` and get the raw error modes back.

`start()` also auto-frames the camera on the bounding box of what was placed. This was not in
the plan's sketch and earned its place during the spike: raw Ursina silently ignores
`camera.position` when an `EditorCamera` exists — it lerps `camera.z` toward its own
`target_z` every frame — so *"I placed blocks and see nothing"* is a failure mode with no
Tier 3 diagnosis. Auto-framing removes it, and removes a fourth name from the API.

### Is the shim readable by its user?

The plan's constraint: he should open `world.py` at Tier 4 and recognise most of it. Audit of
all 43 code lines:

| Readable at | Lines | What |
|---|---|---|
| Tier 3 (now) | 22 (51%) | the dict, the lists, the loops, `append`, `min`/`max`, arithmetic, `in` |
| Tier 4 | +4 (60% cumulative) | `import`, `def`, `return`, keyword arguments |
| Tier 5 | +16 (98% cumulative) | `raise`, attribute access and assignment, method calls |
| Never taught | 1 (2%) | `__all__` |

**Half of it is readable to him the day he starts using it, and all but one line by Boss 5.**
That one line is a documented module convention, explainable in a sentence.

### Retirement

| Element | Retired at | Replaced by | Why then |
|---|---|---|---|
| `BLOCKS` | Tier 4 | his own module-level dict | he already reads it at Tier 3; nothing new is needed to own it |
| `place()` | Tier 4 | his own `def place(x, y, z, kind)` | Tier 4 teaches `def`, parameters, `return`, keyword arguments — the exact contents of this function |
| `start()` | Tier 5 | his own `class World`, with combining and camera setup as methods | Tier 5 teaches `class`, `__init__`, methods, `raise` — the last four unreadable lines |

The last removal lands in **Tier 5, whose boss is Boss 5 — The Bestiary**. Taking down the
scaffolding is a boss beat, not an afterthought. This satisfies the plan's requirement that
the last removal land at or before Boss 5.

---

## Still open

**The `minecraft_clone` benchmark on the son's laptop has not been run.** This spike did
not close it and does not claim to. What it does is make the number less load-bearing: the
scaling curve above shows the stock sample's pattern is unusable at any real world size *on a
5090*, so measuring exactly how unusable it is on a 2017 mobile workstation settles nothing
the architecture decision needs. The authoring rules above already assume the sample's pattern
is not what gets built.

Note also that the sample is not in the `ursina` pip package at 8.3.0 — `ursina/samples/` does
not exist. Running it means fetching the file from the GitHub repository.

What is still worth doing on his laptop, next time it is in reach:

1. Run `_bench.py naive 2500` and `_bench.py combined 15000` and record both numbers. That
   locates his machine on the curve, which is what the 5,000-block soft cap depends on.
2. Confirm which display adapter Ursina bound to. `dxdiag` showed two Display tabs, so the
   the son's laptop likely has an Intel iGPU alongside a discrete Quadro. If Panda3D took the iGPU there
   is headroom still unclaimed. `_runner.py` prints the GL vendor and renderer.

---

## Files

| File | What |
|---|---|
| `world.py` | the proposed shim, 43 lines |
| `probe_a_structure.py` / `probe_a_shim.py` | nested loops, list, `range` — raw and shimmed |
| `probe_b_crafting.py` / `probe_b_shim.py` | dict, set, `in`, list methods — raw and shimmed |
| `probe_c_traceback.py` / `probe_c_shim.py` | deliberate errors — raw and shimmed |
| `_runner.py` | runs a probe N frames, prints GL driver info, screenshots, exits |
| `_timed_runner.py` | same, but reports startup time and steady-state fps |
| `_bench.py` | fps against block count: `naive` \| `collider` \| `combined` |
| `_bench_combine_cost.py` | build-time cost of `combine()` |
| `_err_*.py` | the three raw failure modes and one shimmed one |
| `_stress_shim.py` / `_stress_naive.py` | the accidental 8,000-block world |
| `shots/` | screenshots proving each probe rendered |
