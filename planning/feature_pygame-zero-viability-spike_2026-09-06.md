---
kind: plan
status: queued
track: pygame-zero-spike
date: 2026-09-06
promoted_from: area-4-functions_2026-08-28
---

# Pygame Zero Viability Spike

**Status:** Planned
**Track:** pygame-zero-spike
**Date:** 2026-09-06
**Author:** Claude (Opus 5)
**Lane:** B
**Gates:** `feature_area-4-functions_2026-09-06`, sessions 5–13

## Objective

Prove Pygame Zero runs on **the learner's actual laptop**, under the pinned Python 3.14, from
the command he already knows — before a single Area 4 exercise is authored against it.

Four questions, and the first one gates the rest:

1. Does it install under Python 3.14?
2. Does it open a window on his machine, hardware accelerated, at a playable frame rate?
3. Does `pgzrun` work from a plain `python thing.py` — Area 2b vocabulary — or does it
   demand a bespoke runner?
4. Does it share a virtual environment with `ursina==8.3.0`, or does it need its own?

## Context

Spec §4 commits Area 4 to Pygame Zero as its vehicle: game loop, sprites, keyboard input,
collision, score. That decision is settled and is **not** what this spike tests.

What this spike tests is whether the decision is deliverable on the two machines the campaign
actually runs on. §4 rules out changing vehicles mid-campaign on continuity grounds — a
learner who has spent thirty weeks on something reads a switch as a bait and switch, and he is
right. **If pgzero will not run on his laptop and nobody checks, that is exactly what
happens**, discovered at week 15 with six weeks of authored material pointing at it.

This is the same gate the Ursina spike was, for the same reason, and it is filed the same way:
as its own plan, in advance, on its own track. `planning/completed/feature_ursina-tier3-spike_2026-08-26.md`
is the precedent and the shape.

### Why it is a separate plan rather than Area 4's Phase 0a

Because a phase cannot run before its plan opens, and this has to. The Area 4 stub says it
directly — "the Pygame Zero spike promotes earlier and separately: before Boss 3 is authored.
It is a gate, not a phase, and a gate discovered late is the expensive kind."

Its own track, rather than `main` or `area-4`, so it never contends for the
one-in-progress-plan-per-track slot with the area it gates or with the track that owns the
spec. It can run while Area 3 is still teaching, which is the whole point.

### The three specific ways this could fail

Naming them now, because a spike that only checks "does it work" finds out that it does and
learns nothing.

**Python 3.14.** Pygame Zero sits on `pygame` (or `pygame-ce`), which ships compiled wheels
per Python minor version. 3.14 is recent enough that a wheel may not exist, and building from
source on Windows is not a thing to discover in week 15. **This is the most likely failure and
it is checked first.**

**The entry point.** Pygame Zero's documented invocation is `pgzrun thing.py`, a separate
console script. §3.8 and Area 2b spent a whole area getting him to a real terminal running
`python thing.py`, and the stub is explicit that a bespoke runner is not acceptable. The
supported alternative is two lines in the file — `import pgzrun` at the top and `pgzrun.go()`
at the bottom — and the spike confirms that path works rather than assuming it from the docs.

**Coexistence.** `curriculum/lib/requirements.txt` pins `ursina==8.3.0`, and Area 5 goes back
to it. Both libraries pull SDL-adjacent and OpenGL-adjacent stacks. If they cannot share an
environment, that is survivable but it is a real change to what he types and to
`curriculum/lib/README.md`'s install instructions, and Area 4 needs the answer before it
writes a session that says "activate this one."

## Success Criteria

**Gate — the learner's laptop.** Nothing below the line is worth measuring until these pass.

- [ ] `pgzero` (and its `pygame` dependency) installs under `py -3.14` on **his** machine, from
      a wheel, with no compiler invoked
- [ ] A window opens, hardware accelerated, and holds a playable frame rate with a few dozen
      sprites moving — the same *is this alive* question `curriculum/lib/smoke.py` asks, not a
      benchmark
- [ ] Keyboard input registers and a sprite moves in response
- [ ] **`py -3.14 thing.py` runs it**, via `import pgzrun` / `pgzrun.go()`, with no console
      script and no bespoke runner. If this fails, say so plainly rather than shipping a runner

**Then, and only then:**

- [ ] The coexistence question answered **either way, in writing**: one venv with both pins, or
      two venvs with the reason and the exact commands he types
- [ ] **A version pin chosen and recorded**, with the same never-mid-area upgrade rule
      `curriculum/lib/README.md` already sets for ursina
- [ ] A `smoke.py` analogue that runs on his machine with nothing but Python and pgzero — no
      pytest — for the same reason the ursina one exists
- [ ] **The headless claim verified.** Area 4's `verify.py` asserts that a logic module imports
      with `pgzero` and `pygame` blocked out of `sys.modules`. Prove that a *game* file cannot
      be imported that way, so the exercise pair split is load-bearing rather than stylistic
- [ ] A recommendation, in one paragraph: proceed, proceed with a named constraint, or escalate
      to a vehicle decision

## Approach

Timeboxed. This is a spike, not a deliverable — it produces measurements and a recommendation,
and the thing it protects is six weeks of authoring that has not started.

**Both machines run Windows**, and the learner's is the older one. WSL2 is not a target. Run
the probes on Windows so that what gets measured is what he will actually use.

**Measure on his laptop, not the DM's.** The ursina spike's numbers came from an RTX 5090 and
`curriculum/lib/README.md` carries a standing warning that none of them transfer — the block
cap is still an estimate with a scaling guess on top. Do not repeat that. A number from the
fast machine is a number about the fast machine.

## Phases

### Phase 0 — the install gate, on his laptop (do this first)

```console
py -3.14 -m pip install pgzero
py -3.14 -c "import pgzero, pygame; print(pgzero.__version__ if hasattr(pgzero,'__version__') else 'n/a', pygame.version.ver)"
```

Record: whether a wheel was found, what pulled in what, and the resolved versions. If pip
reaches for a compiler, **stop and report** — that is the escalation, and it is worth more
delivered on the day it is found than worked around quietly.

Note the ursina spike's finding that `ursina.__version__` does not exist; do not assume pgzero
has one either. Read `importlib.metadata.version("pgzero")` and record what actually answers.

### Phase 1 — the window, the loop, and the entry point

One probe file, written as a learner would write it: a sprite, arrow keys, a score that goes
up on collision. Roughly forty lines, no cleverness.

Run it three ways and record all three:

1. `pgzrun probe.py` — the documented path
2. `py -3.14 probe.py` with `import pgzrun` / `pgzrun.go()` — **the one that has to work**
3. `py -3.14 probe.py` with neither — confirm it fails, and record *how*. A learner will do
   this by accident in week 15 and the DM guide needs the error text

Record frame rate the way `smoke.py` does — vsync-bound, answering *is this alive* rather than
*how fast*.

### Phase 2 — coexistence

A venv with `ursina==8.3.0` and pgzero together. Import both, then run each one's probe. If
they conflict, find out *what* conflicts — SDL versions, an OpenGL context, a display init
that runs at import — because "they conflict" is not enough to write install instructions
from.

Whichever way it lands, write the commands he types. That prose goes to Area 4's session 5 and
to whichever README owns the install.

### Phase 3 — the headless claim

Area 4's harness depends on a specific asymmetry: **logic modules import cleanly with pgzero
absent, and game files cannot.** Prove both halves.

```python
sys.modules["pgzero"] = None
sys.modules["pygame"] = None
import scoring        # must succeed
import scoring_game   # must fail, and the failure is the point
```

If a game file turns out to import fine with pgzero stubbed, the `ast` walk in Area 4's
`verify.py` is carrying the whole rule alone, and that plan should be told so.

### Phase 4 — write it down and recommend

A short README beside the probes — versions, commands, the three run modes and their outputs,
the coexistence answer, the frame rate with the machine attached. Then the one-paragraph
recommendation.

## Dependencies / Prerequisites

- The learner's laptop, available for one sitting. This is the whole gate and it cannot be
  done on the DM's machine.
- Python 3.14 installed there, which Area 2b established.
- `ursina==8.3.0` installed there, for Phase 2.

## Files Expected to Change

- `spikes/pygame-zero/**` — new: the probe, the README, the measurements. Modeled on
  `spikes/ursina-tier3/`, which is the record of a measurement and is not edited after the
  fact
- `curriculum/lib/requirements.txt` — **only if Phase 2 says one venv.** If it says two, this
  spike writes the second requirements file and names it; either way the pin lands here rather
  than in Area 4

**Owned by other tracks:** `curriculum/area-4/**` and `game/area-4/**` (`area-4`),
`docs/specs/**` (`main`). If the recommendation is *escalate to a vehicle decision*, that is a
spec change and it goes to `main` as a finding, not as an edit made here.

## Out of Scope

Authoring anything. No exercise, no session, no brief. This spike produces a probe, a
measurement and a paragraph.

Designing a shim. The ursina spike found it needed one and designed it, and that was the right
call there because raw Ursina's surface was Area 4 and Area 5 vocabulary. Pygame Zero's
surface is `def draw()` and `def update()` — **Area 4's own vocabulary, taught in the same
area** — so there is nothing to hide and a shim would be scaffolding invented for its own
sake. If the probe contradicts this, that is a finding worth having, and it goes in the
recommendation rather than being built on the spot.

Performance tuning. The question is *playable*, not *fast*.
