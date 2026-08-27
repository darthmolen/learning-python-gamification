# Ursina Tier 3 Vocabulary Ceiling Spike

**Status:** Planned
**Date:** 2026-08-26
**Author:** Claude (Opus 5), with Steven Molen

## Objective

Determine whether a Tier 3 learner — variables, control flow, and collections, with no
functions and no classes — can write Ursina programs worth being proud of, and if not,
define the minimal shim that closes the gap and can be fully retired by Tier 5.

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

## Success Criteria

- [ ] Ursina confirmed to render under WSL2, or the fallback documented and chosen
- [ ] Three Tier-3-vocabulary probe programs written and running
- [ ] Ceremony ratio measured for each probe against an explicit vocabulary list
- [ ] Shim API surface defined, or documented as unnecessary
- [ ] Retirement path mapped to specific Tier 4 and Tier 5 moments
- [ ] Recommendation recorded in the spec's Tier 3 vehicle section
- [ ] Every artifact under `spikes/` labeled throwaway in its header

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

### Phase 1 — Environment feasibility (timeboxed, 30 minutes)

Ursina sits on Panda3D and wants a real GL context. Confirm it opens a window and renders
a single cube under WSL2.

If it fails, record the failure precisely and pick a fallback — Windows-side Python, WSLg,
or an X server — then continue. **Do not spend more than 30 minutes here.** A rendering
problem is a Phase 1 finding, not a Phase 1 blocker; the vocabulary question is answerable
either way, and the son's machine is Windows-native regardless.

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

### Phase 5 — Map the retirement, then recommend

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

- Python 3.x with `pip` on the host running the spike
- `pip install ursina` (pulls Panda3D)
- A display path from WSL2, or a decision to run Windows-side — Phase 1 resolves this
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

## Anticipated Backlog

Promote to `planning/backlog/` if they surface:

- WSL2 rendering proves unworkable and the project needs a standing decision about where
  Python runs for both players.
- Ursina's own version churn threatens a year-long campaign, which would need a pinning
  and upgrade policy.
