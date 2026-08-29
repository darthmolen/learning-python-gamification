# Ursina Tier 3 Vocabulary Ceiling Spike

**Status:** Complete — 2026-08-27
**Date:** 2026-08-26
**Author:** Claude (Opus 5), with Steven Molen

## Objective

Prove Ursina runs acceptably on **the son's actual laptop**, and determine whether a Tier 3
learner — variables, control flow, and collections, with no functions and no classes — can
write Ursina programs worth being proud of. If not, define the minimal shim that closes the
gap and can be fully retired by Tier 5.

Two questions, in that order. The hardware question gates the vocabulary question, because
a shim design is worthless if the engine never opens a window on his machine.

## Context

`docs/specs/2026-08-26-gamified-python-curriculum-design.md` §4 commits Tiers 3 through
the capstone to Ursina and rules out `mcpi`. That decision is settled and is not what this
spike tests.

The open risk is vocabulary. Ursina's surface is `Entity(model='cube', position=(x, y, z))`
— a constructor call with keyword arguments, which the curriculum does not teach until
Tier 4 (keyword arguments) and Tier 5 (classes). Tier 3 runs weeks 9–14, so the gap is
real and arrives roughly six weeks after the first session.

**The load-bearing observation this spike is built on:** *calling* a positional function is
Tier 0 vocabulary — he calls `print()` and `len()` from week one. *Writing* one is Tier 4.
So a shim exposing plain positional functions is legible to a Tier 3 learner without
teaching him anything he has not earned. Whether that shim stays small is the question.

### Why the hardware check is a gate, not a footnote

Spec §4 closes the Ursina-versus-`mcpi` question on continuity grounds: abandoning thirty
weeks of work at week 37 would read as a bait and switch. **If his laptop cannot run Ursina
and nobody checks, that is exactly what happens** — discovered at week 9 when Tier 3 starts,
or at week 37 when the capstone does, by which point every option has closed.

Checked in week 0, the options are all still open: install the vendor driver, replace the
laptop, or move the capstone to Pygame Zero before a single quest is authored.

**Both machines run Windows.** WSL2 is not a target for this spike. The son's laptop is
Windows 10 and older; the parent should run the probes on Windows too, so that what gets
measured is what he will actually use.

## Success Criteria

**Gate — the son's laptop:** cleared 2026-08-27, one item deliberately left open (see below)

- [x] `winver` and `dxdiag` recorded: Windows build, CPU, GPU, driver vendor and version
- [x] Current Python installs and runs
- [x] `pip install ursina` succeeds
- [x] A single cube renders in a real window, hardware accelerated, no GDI Generic fallback
- [ ] `minecraft_clone` sample runs, with its observed framerate recorded — **left open on
      purpose.** Phase 5 measured the sample's *pattern* instead, on the parent's machine, and
      found it unusable at any real world size even on an RTX 5090. That settles the
      architecture question the framerate number was there to answer. The sample is also no
      longer shipped in the `ursina` pip package at 8.3.0. Two cheaper replacements are
      recorded in the spike README under *Still open*
- [x] Verdict written: capstone safe, capstone safe with constraints, or fallback required

**Vocabulary:**

- [x] Three Tier-3-vocabulary probe programs written and running on Windows — each one twice,
      raw and shimmed, with screenshots in `spikes/ursina-tier3/shots/`
- [x] Ceremony ratio measured for each probe against an explicit vocabulary list
- [x] Shim API surface defined — three names, 43 lines, `spikes/ursina-tier3/world.py`
- [x] Retirement path mapped to specific Tier 4 and Tier 5 moments, landing on Boss 5
- [x] Recommendation recorded in the spec's Tier 3 vehicle section
- [x] Every artifact under `spikes/` labeled throwaway in its header

## Results — 2026-08-27

**All phases complete.** Full write-up, numbers, and screenshots: `spikes/ursina-tier3/README.md`.
Recommendation written into spec §4, Tier 3 vehicle, and the decisions table.

### Verdict: a shim is necessary, for a better reason than the one this plan predicted

Phase 1 passed on the parent's machine (Windows 11, Python 3.14.6, ursina 8.3.0, Panda3D
1.10.16, RTX 5090 on OpenGL 4.6, no GDI Generic). Phases 2 through 5 ran to completion. Three
findings, in ascending order of how much they mattered:

| | Raw Ursina | Through the shim |
|---|---|---|
| Ceremony, net of floor, all three probes | 9 of 52 lines (17.3%) | 0 of 41 (0%) |
| **Ceremony among engine-touching lines** | **9 of 9 (100%)** | **0 of 7 (0%)** |
| Unavoidable incantation floor | 3 lines | 1 line |
| Readable failure on a realistic Tier 3 typo | 1 case of 3 | 3 of 3 |
| 8,000-block world (three nested `range(20)`) | 14.9 fps | 1,424 fps |

### Where this plan was wrong, and it matters

**The ceremony ratio was the wrong instrument.** Measured as the plan specified — ceremony
lines over total lines — raw Ursina scores 17.3% across the three probes and *passes* the 20%
threshold. It passes by dilution: probe B, which has the most engine ceremony in absolute
terms, scores best because 24 of its 30 lines are crafting logic that never touches Ursina.
Counted over engine-touching lines only, raw Ursina is 100% ceremony and the shim is 0%. Any
future vehicle decision should use the second metric; it cannot be gamed by writing more
logic around the problem.

**The traceback fear was aimed at the wrong target.** The plan expected a twelve-frame Panda3D
stack trace from a learner's `KeyError`. That case is fine — five lines, carets under the
exact subexpression — because the error resolves while Python evaluates the arguments, before
Ursina is entered, and at Tier 3 all learner code is module-level. The real damage is
elsewhere and is worse: `color='green'`, the obvious guess, gives an eight-frame traceback
ending in a complaint about hexadecimal, and a mistyped model name or a two-element `position`
tuple produces **no error at all** — one warning lost in engine startup noise, or nothing,
then a blank window. Raw Ursina violates §3 principle 5, *never hide failure*. That, not
keyword arguments, is the load-bearing case for a shim, and it would hold even if the
ceremony numbers had come in clean.

**Performance is a Tier 3 problem, not a capstone problem.** The plan filed
one-`Entity`-per-block under Phase 5 capstone constraints and under a future Tier 7 lesson. It
arrives in week 10. The pattern drops below 60 fps between 1,000 and 2,500 blocks on an RTX
5090; three nested `range(20)` loops is 8,000 blocks and 14.9 fps, and that is an ordinary
thing for a learner discovering nested loops to write. So `start()` fuses placed blocks into a
single mesh — 95× faster on that program, for two seconds of startup and no new vocabulary.
The Tier 7 lesson is not lost but improved: deleting one line from `world.py` and watching
1,424 fps become 14.9 is an experiment he can run, rather than a slowdown he suffers for four
tiers with no vocabulary to diagnose it.

### What was built

`spikes/ursina-tier3/world.py` — three names, 43 lines, positional arguments only:
`BLOCKS`, `place(x, y, z, kind)`, `start()`. Beyond the plan's sketch it does two things the
spike proved necessary: it validates `kind` and raises an error naming the valid kinds, and
`start()` auto-frames the camera on what was placed. The second earned its place when raw
Ursina turned out to silently ignore `camera.position` whenever an `EditorCamera` exists — it
lerps `camera.z` toward its own `target_z` every frame — making *"I placed blocks and see
nothing"* a failure with no Tier 3 diagnosis.

Retirement holds as designed: `BLOCKS` and `place()` at Tier 4, `start()` at Tier 5, last
removal on Boss 5. 22 of its 43 lines are readable to him at Tier 3, 42 of 43 by Boss 5, and
the one line that is never taught is `__all__`.

### On the son's Teach-back

Phase 0 recorded him restating `Entity(model='cube')` in his own words, four tiers early, and
this plan asked Phase 3 to weigh that against the threshold. It cuts a different way than
expected. He can *reason* about a call he cannot write — which is exactly why a shim of plain
positional functions is legible to him. It says nothing about whether he could debug
`ValueError: invalid literal for int() with base 16: 'gr'`, and that is the case the shim is
really for.

### Open, and deliberately so

The `minecraft_clone` framerate on his laptop. Phase 5 measured the sample's *pattern* rather
than the sample and found it unusable at any real world size on hardware far stronger than
his, which answers the architecture question the number existed to serve. The sample is also
no longer shipped in the `ursina` pip package at 8.3.0. Two cheaper measurements to take next
time the laptop is in reach — locating his machine on the scaling curve, and confirming
whether Panda3D bound to the iGPU or the discrete Quadro — are in the spike README under
*Still open*. Neither blocks Tier 3 authoring.

## Approach

Write three deliberately small programs against Ursina using strictly Tier 0–3 syntax,
measure how much of each is ceremony the learner cannot yet explain, and let that number
decide whether a shim is needed and how large it may be.

The spike's output is a recommendation. No code from `spikes/` ships.

**Vocabulary admitted at Tier 3** (from spec §4, Tiers 0 through 3):
`print` · variables · `int` `float` `str` `bool` · `input` · f-strings · `if` `elif` `else`
· comparison and boolean operators · `while` · `for` · `range` · nesting · `list` ·
indexing · slicing · list methods · `tuple` · `dict` · `set` · `len` `in` `sorted` `min`
`max` · calling positional functions · `import`

**Ceremony** is any line using syntax outside that list. Measured as ceremony lines over
total lines, per probe.

**Threshold:** above roughly 20% ceremony, shimming is not enough and Tier 3's vehicle
needs rethinking rather than patching.

## Phases

### Phase 0 — Hardware gate, on the son's laptop (do this first)

Ursina sits on Panda3D, which needs a hardware-accelerated OpenGL context. This phase runs
on **his machine**, not the parent's, because his is the older one and his is the one that
matters.

**Step 1 — inventory, five minutes.** Run `winver` and `dxdiag`. Record the Windows build,
CPU, GPU, and the graphics driver's vendor and version. Vintage is the thing to look at:
Intel HD Graphics (2010 and later) should be adequate; the older GMA-era parts top out
around OpenGL 1.4–2.1 and will not do.

**Step 2 — install.** Install current Python from python.org, then:

```
python -m pip install ursina
```

The documented Python floor is inconsistent — ursinaengine.org says 3.12+, the GitHub
repository says 3.10+ — but the discrepancy does not bind on Windows 10, where current
Python installs cleanly. Do not carry "3.12 hard floor" forward as settled.

**Step 3 — does a window open at all.**

```
python -c "from ursina import *; app=Ursina(); Entity(model='cube'); EditorCamera(); app.run()"
```

The failure to watch for is a startup dump complaining that the application requested
hardware acceleration while the driver — reported as **GDI Generic** — supports only
software rendering, ending in *"Window wouldn't open; abandoning window"*. That means
Windows fell back to its generic driver, usually because the OEM driver was never installed
or was wiped by an upgrade.

**The fix is the vendor driver** from Intel, AMD, or NVIDIA directly, not Windows Update.
Panda3D's own documentation treats better drivers as the answer.

A DirectX 9 backend (`load-display pandadx9` in `Config.prc`) is sometimes suggested as a
second out. **Treat it as unverified.** At least one report has it failing to resolve the
same error, and it may not be present in current Panda3D builds. Try it if the driver route
fails, but do not plan around it.

**Step 4 — is it fast enough.** Run the `minecraft_clone` sample from the Ursina repository
and watch the frame counter. Record the number.

**Verdict, written down before Phase 2 begins:**

| Outcome | Meaning |
|---|---|
| Cube renders, clone playable | Capstone is safe. Never think about this again |
| Renders, clone slow | Capstone is safe *with constraints* — small world, combined static mesh, no shadows, windowed 1280×720. See Phase 5 |
| No window after vendor driver install | **Gate fails.** Stop. Escalate to the fallback decision below |

**If the gate fails**, the choice is the parent's and belongs in the spec, not in this
document: install a vendor driver, replace the laptop, or move the capstone to Pygame Zero.
Reopening `mcpi` is a fourth option, but it re-imports the continuity problem §4 rejected.

### Phase 0 — Results, 2026-08-27

**The gate passed.** The machine is materially stronger than the plan assumed.

| Measured | Value |
|---|---|
| Model | the son's laptop — a mobile workstation, not a budget laptop |
| OS | Windows 11 Pro 22H2, build 22621.4317 |
| CPU | Intel Core i7-7820HQ @ 2.90GHz, 8 logical CPUs |
| Memory | 16 GB |
| DirectX | 12 |
| Python | 3.14, pip 26.2.1 |
| Ursina | Installs cleanly |
| Render | Window opens, cube draws, ~57 FPS, 1 entity, 0 colliders |
| GDI Generic fallback | **Not triggered** |

~57 FPS on a single entity is vsync against a 60Hz panel, which is the healthy result rather
than a slow one.

**Corrections to the plan's assumptions.** It was written expecting Windows 10 on older
hardware. Both were wrong, in the project's favour. The Python floor question is moot at
3.14, and the OpenGL driver risk — the failure judged most likely to bite — did not
materialise at all. The DirectX 9 fallback, flagged as unverified, is not needed.

**Outstanding.** A single cube proves a window opens; it does not prove a voxel world is
playable. The `minecraft_clone` benchmark is still the load-bearing measurement, because
the stock sample gives every block its own `Entity`. Run it before Phase 5 sets performance
constraints.

**Open follow-up.** `dxdiag` showed two Display tabs, which on a mobile workstation of that era usually means
hybrid graphics — an Intel iGPU alongside a discrete Quadro. Confirm which adapter Ursina
actually bound to. If it took the iGPU, the capstone may have significant headroom still
unclaimed.

**Unplanned finding, and the most encouraging one.** The son read the one-line Ursina
incantation and restated it in his own words unprompted, and was visibly pleased that it
drew a square. That is a Teach-back (spec §5.10) passed on day zero, against syntax four
tiers ahead of him. It is direct evidence for the shim hypothesis this spike exists to test:
he does not need to *write* `Entity(...)` to reason about what it does.

### Phase 1 — Parent-side environment (timeboxed, 30 minutes)

Same install on the parent's Windows machine, so the probes are written against the same
runtime the son uses. WSL2 is explicitly not a target.

### Phase 2 — Write the three probes [ASYNC]

Each probe is a single file, under 40 lines, Tier 0–3 syntax only.

| Probe | File | Exercises | Shape |
|---|---|---|---|
| A | `spikes/ursina-tier3/probe_a_structure.py` | list, `range`, nested `for` | A block palette plus nested loops building a staircase or tower |
| B | `spikes/ursina-tier3/probe_b_crafting.py` | `dict`, `set`, `in`, membership | An inventory list and a recipe dict; place only what can be crafted |
| C | `spikes/ursina-tier3/probe_c_traceback.py` | error reading | A deliberate `KeyError` or index error, to see what a traceback looks like *through* the shim |

Probe C matters more than it looks. Spec §4 Tier 0 teaches that errors are normal and
readable; a shim that turns a learner's typo into a twelve-frame Panda3D stack trace
silently breaks that promise six weeks later.

### Phase 3 — Measure

For each probe, count ceremony lines against the vocabulary list and record the ratio.

Note the floor separately: `from ursina import *`, `app = Ursina()`, and `app.run()` are
unavoidable and total three lines. Three lines of unexplained ceremony is acceptable and
can be taught as an incantation. Thirty is not.

### Phase 4 — Design the shim, only if Phase 3 demands one

Sketch the smallest module that closes the measured gap. Working hypothesis, to be
validated rather than assumed:

```python

# world.py — positional functions only, no keyword arguments

place(x, y, z, kind)     # hides Entity construction
start()                  # hides Ursina() and app.run()
BLOCKS                   # a dict of kind -> colour or texture
```

Two constraints on the design:

- **Positional arguments only.** A keyword argument in the shim teaches Tier 4 syntax at Tier 3.
- **The shim must be readable by its user.** He should be able to open `world.py` in Tier 4
  and recognise most of it. A shim he cannot eventually read is a black box, and the spec's
  §2.3 diagnosis is that black boxes are how these curricula fail.

### Phase 5 — Performance constraints, then map the retirement, then recommend

If Phase 0 returned "safe with constraints", record the constraints that make the capstone
viable on his hardware, because they become authoring rules rather than afterthoughts:
small world, a combined mesh for static terrain instead of one `Entity` per block, no
shadows, windowed at 1280×720.

One `Entity` per block is thousands of draw calls, and the stock Minecraft-clone sample is
written that way. This is good news pedagogically: *why is my game slow* is a genuine Tier 7
performance-intuition lesson rather than a blocker — provided the shim does not bake the
slow pattern in so deep that it cannot be undone at Tier 7.

Scaffolding that never comes down is CodeCombat. Map each shim function to the moment the
learner replaces it:

| Shim element | Retired at | Replaced by |
|---|---|---|
| `place()` | Tier 4 | His own `def place(...)` |
| `BLOCKS` | Tier 4 | His own module-level dict |
| `start()` | Tier 5 | His own `class World` |

Confirm the last removal lands at or before Boss 5, so taking down the scaffolding is
itself a boss beat rather than an afterthought.

Then write the recommendation into the spec's Tier 3 vehicle section, and append this
document's Status block.

## Dependencies / Prerequisites

- **Physical access to the son's laptop.** Phase 0 cannot be done remotely or by proxy
- Current Python with `pip`, installed on Windows on both machines
- `pip install ursina`, which pulls Panda3D
- The Ursina repository's `minecraft_clone` sample, for the framerate benchmark
- Spec §4 Tiers 0–3 vocabulary list, which is the measuring stick

## Files Expected to Change

- `spikes/ursina-tier3/README.md` — throwaway label, findings, ceremony table
- `spikes/ursina-tier3/probe_a_structure.py` — new, throwaway
- `spikes/ursina-tier3/probe_b_crafting.py` — new, throwaway
- `spikes/ursina-tier3/probe_c_traceback.py` — new, throwaway
- `spikes/ursina-tier3/world.py` — new, throwaway; only if Phase 4 runs
- `docs/specs/2026-08-26-gamified-python-curriculum-design.md` — Tier 3 vehicle recommendation
- `planning/feature_ursina-tier3-spike_2026-08-26.md` — Status block on completion

## Out of Scope

- Any decision revisiting Ursina versus `mcpi`. Closed in spec §4.
- Building actual Tier 3 quest content. This spike sizes the gap; authoring comes later.
- Shipping the shim. If a shim is warranted, it is written for real during Phase 2 content
  authoring, not here.

## Anticipated Backlog — resolved 2026-08-27

- ~~The gate fails and the capstone needs re-deciding.~~ **Did not surface.** The gate passed
  on both machines.
- ~~A standing performance budget for every graphical quest.~~ **Surfaced, promoted:**
  `planning/backlog/feature_graphical-quest-performance-budget_2026-08-27.md`. It surfaced for
  a different reason than anticipated — not because his laptop is marginal, but because the
  stock voxel pattern is unusable on any machine.
- ~~Ursina version churn needs a pinning and upgrade policy.~~ **Surfaced, promoted:**
  `planning/backlog/feature_ursina-version-pinning-policy_2026-08-27.md`. Three pieces of
  evidence in one afternoon on 8.3.0: the samples directory is gone from the pip package,
  `Ursina` is a singleton wrapper rather than the class it appears to be, and
  `ursina.__version__` does not exist.

## Status

**Complete — 2026-08-27.** Both questions answered.

**Hardware:** the capstone is safe. It is not safe with the stock sample's architecture, on any
machine, which is an authoring constraint rather than a hardware verdict.

**Vocabulary:** a shim is warranted. `spikes/ursina-tier3/world.py` — three names, 43 lines,
positional arguments only, 0% ceremony against 100% for raw Ursina, retired by Boss 5.

**Landed in:**

- `docs/specs/2026-08-26-gamified-python-curriculum-design.md` — §4 Tier 3 vehicle, and two
  rows in the decisions table
- `spikes/ursina-tier3/` — probes, shim, benchmarks, screenshots, full write-up. All throwaway
- `planning/backlog/` — two promoted items

**Not done, on purpose:** the `minecraft_clone` framerate on the son's laptop. Reasoning in
*Results* above and in the spike README under *Still open*. It does not block Tier 3 authoring.
