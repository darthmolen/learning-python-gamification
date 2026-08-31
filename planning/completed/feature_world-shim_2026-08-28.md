# The `world.py` Shim — Promote the Spike to Shipping Code

**Status:** In Progress
**Track:** world-shim
**Blocked on:** the son's laptop. Phases 1, 2 and 4 are done; Phase 3 is a framerate measurement on that machine and cannot be faked on the parent's
**Date:** 2026-08-28
**Author:** Claude (Opus 5)
**Lane:** B — **blocks Area 3**

## Objective

Turn `spikes/ursina-tier3/world.py` into shipped, tested, pinned curriculum code at
`curriculum/lib/world.py`, with its three-name surface, its validating boundary and its
measured framerate all proven on the machine the learner actually uses.

## Why this exists

Area 3 imports `world` on day one. It exists only as a spike, and the file says so on line
one: **`# THROWAWAY — spike shim, not shipping code. Written to be measured, not shipped.`**

It is its own plan rather than Phase 0 of Area 3 because its success criteria are measured
numbers, and numbers buried inside a six-week curriculum plan do not get measured. The Ursina
spike proved this shim is the right answer. Proving it is the right *artifact* is different
work.

The spike's argument, which this plan inherits and must not re-litigate: Ursina's real
surface is `Entity(model='cube', position=(x, y, z))` — keyword arguments are Area 4 and
attribute access is Area 5, so **9 of 9 engine-touching lines an Area 3 learner would write
are vocabulary he has not earned, 100%.** The shim's surface is three names with positional
arguments only, and calling a positional function is Area 0 vocabulary — he calls `print()`
and `len()` from week one. Measured: 0% ceremony beyond a one-line import floor.

## Success Criteria

- [x] `curriculum/lib/world.py` exists, exports exactly `BLOCKS`, `place(x, y, z, kind)` and
      `start()`, and the `# THROWAWAY` header is gone
- [x] **It fails loudly on every input a learner will actually get wrong** — see the four
      cases below, each with a test that asserts on the message, not just on the raise
- [x] `start()` fuses placed blocks into one mesh, and a test asserts the fusion happened
- [ ] **≥ 60 fps at 5,000 blocks on the son's laptop**, measured and recorded with the
      date and the ursina version. The spike's numbers are from an RTX 5090 and do not transfer
      — **BLOCKED, Phase 3. The laptop was not available. No number has been invented.**
- [ ] The ursina version is **pinned identically on both machines** and the pin is recorded
      — pinned, recorded and asserted; the parent's machine matches. **The son's machine has
      not been installed against `requirements.txt` and `smoke.py` has not run there.**
- [x] `ruff` and `pyright` clean, no `Any`, exception chaining — per `python-quality-developer`
- [x] pytest suite runs headless in CI-shaped conditions (no window) and passes
- [x] **No `Tier` anywhere in the file.** The spike comments say Tier 3, Tier 4, Tier 5. The
      lexicon is Area, and at Boss 7 he opens this repository and reads it — and a test reads
      the source and fails if the word comes back
- [x] The removal schedule is documented in `curriculum/lib/README.md`, and the Area 7
      performance lesson is a runnable exercise rather than a paragraph

## Approach

### The four failures it must catch

§3 principle 5 is **never hide failure**, and the spike's central finding was that raw Ursina
violates it three separate ways. The shim exists first as a validating boundary and only
second as a vocabulary hider. Each of these is a measured observation from the spike, and each
needs a test:

| What he does | Raw Ursina | What the shim must do |
|---|---|---|
| Mistypes a block name | One warning inside forty lines of engine startup noise, then draws nothing | Already handled — `ValueError` naming the kind and listing the known kinds |
| Passes a two-element position | **No diagnostic at all** | Not handled today. `place()` takes four positional args so arity is caught, but nothing checks that `x`, `y`, `z` are numbers |
| Guesses `color='green'` | Eight-frame traceback ending in a message about hexadecimal | Not reachable through the shim's surface, but `BLOCKS` is a plain dict he can assign into. Decide whether to guard it or leave it |
| Calls `place()` after `start()` | Silent no-op | Not handled. Raise, and say why |

The message is the feature. A `ValueError` that says *"place() does not know the block kind
'stnoe'. The kinds it knows are [...]"* is the shim doing its job; a bare `KeyError` is the
shim being a wrapper.

### The performance criterion, and why it is re-measured

The spike measured on an RTX 5090: one Entity per block drops below 60 fps between 1,000 and
2,500 blocks; three nested `range(20)` loops — which he will write — is 8,000 blocks at
**14.9 fps**; fused into one mesh the same program runs at **1,424 fps**.

Those numbers justify `ground.combine()`. They do not tell you what his machine does. Phase 0a
verified the son's laptop renders a cube at ~57 fps with no GDI Generic fallback, which is a
viability floor, not a headroom measurement. **The authoring cap of ~5,000 blocks is only
meaningful if 5,000 blocks holds 60 fps on the son's laptop**, and if it does not, the cap moves and
Area 3's exercises are written against the smaller number.

Re-measure with `spikes/ursina-tier3/_bench.py` and `_stress_shim.py`, which already exist.

### Shipping concerns the spike was allowed to ignore

- **`from ursina import *`.** Fine in a throwaway; it is a star import in a file he will read
  in Area 4 when he starts replacing it. Import what is used.
- **`Ursina()` at module scope.** Importing `world` currently constructs the app as a side
  effect. That makes the module untestable without a display and makes import order
  load-bearing. Defer construction into `start()`, or gate it — either way, `import world`
  must be safe in a test.
- **Half of it must be readable to him on day one, all but one line by the time he retires
  it.** That is the spike's claim and it is the thing that makes the shim scaffolding rather
  than magic. Every change here should be checked against it.

### Location

**`curriculum/lib/world.py`**, one canonical copy, with a documented copy-into-his-repo step.

It spans Areas 3 through 5, so it does not belong inside `area-3/`. It is curriculum code the
learner imports in a terminal, so it is not Lane A's and it does not go under `pyquest/`. And
it has to sit next to his own `.py` files for `import world` to work, so it is copied into his
repository rather than referenced — which is also what makes deleting it in Area 4 and Area 5
his action rather than the parent's.

`curriculum/lib/README.md` records the surface, the pin, the measured numbers and the removal
schedule.

### The removal schedule is content, not trivia

**It comes down on a schedule, and the schedule is the point.** Scaffolding that never comes
down is CodeCombat — the decision log already says so.

| Comes down | At | Replaced by |
|---|---|---|
| `BLOCKS` | Area 4 | his own dict |
| `place()` | Area 4 | his own `def` |
| `start()` | Area 5 | his own `class World`, landing on Boss 5 |

And the last one: **deleting `ground.combine()` and watching 1,424 fps become 14.9 is the
Area 7 performance-intuition lesson.** Ship it as a runnable exercise with the two numbers
recorded, not as a sentence in a README. It is the only place in the campaign where a
one-line deletion produces a hundredfold difference he can see.

## Phases

### Phase 1 — pin ursina, on both machines

`planning/backlog/feature_ursina-version-pinning-policy_2026-08-27.md` gets promoted and
resolved here. You cannot ship a shim against an unpinned engine, and 8.3.0 already churned:
samples dropped from pip, `Ursina` is `@singleton`-wrapped, and there is **no `__version__`
to read** — so the pin has to be recorded and asserted some other way.

Deliverables: the pinned version recorded in the spec, an upgrade rule (**never mid-area**),
and a post-upgrade smoke test.

### Phase 2 — promote and harden the module

Move, rename the lexicon, fix the star import and the import-time side effect, add the four
validations. Follow `test-filter-development`: RED with the failure output captured, GREEN,
then seed a mutant and confirm the suite catches it.

Named mutants that must be caught: accept an unknown block kind; accept a non-numeric
coordinate; skip `ground.combine()`; let `place()` succeed after `start()`; return the wrong
`BLOCKS` colour.

### Phase 3 — measure on the son's laptop [ASYNC with Phase 2 authoring, not with its tests]

Run the existing `_stress_shim.py` and `_stress_naive.py` on the son's machine at 1,000 /
2,500 / 5,000 / 8,000 blocks, fused and naive. Record fps, date, ursina version, and machine.

**If 5,000 fused blocks does not hold 60 fps on the son's laptop, the authoring cap moves** and the
Area 3 plan is told the new number before its exercises are written. That is the whole reason
this phase exists.

Feed the result into `planning/backlog/feature_graphical-quest-performance-budget_2026-08-27.md`,
which becomes load-bearing at Area 5 and wants exactly this measurement tool made durable.

### Phase 4 — the docs and the Area 7 exercise

`curriculum/lib/README.md`: surface, pin, numbers, removal schedule, copy-into-his-repo step.
Then the `ground.combine()` deletion exercise, stubbed here with its measured numbers and
handed to the Area 7 plan to place in a session.

## Dependencies / Prerequisites

- **The son's laptop**, for Phase 3. This cannot be measured on the parent's machine and
  the plan is not done until it has been.
- `planning/backlog/feature_ursina-version-pinning-policy_2026-08-27.md` — promoted, Phase 1.
- The completed Ursina spike, `planning/completed/feature_ursina-tier3-spike_2026-08-26.md`,
  which supplies every number this plan re-checks.

## Files Expected to Change

- `curriculum/lib/world.py` — new, promoted from the spike
- `curriculum/lib/README.md` — new
- `curriculum/lib/tests/test_world.py` — new
- `curriculum/lib/tests/conftest.py` — new; puts `curriculum/lib/` on the import path so the
  suite imports `world` the way the learner does
- `curriculum/lib/requirements.txt` — new; Phase 1's pin. Not anticipated by name in this
  list, but Phase 1 cannot deliver "a pinned version in a requirements file" without one
- `curriculum/lib/smoke.py` — new; Phase 1's post-upgrade smoke test, likewise
- `curriculum/lib/area-7-exercise/` — new; Phase 4's runnable lesson. It sits here rather
  than in `curriculum/area-7/`, which does not exist and belongs to another track
- `spikes/ursina-tier3/**` — unchanged. Spikes are the record of what was measured; they
  are not edited after the fact
- `docs/specs/2026-08-26-gamified-python-curriculum-design.md` — the ursina pin and the
  upgrade rule
- `planning/backlog/feature_ursina-version-pinning-policy_2026-08-27.md` — resolved
- `planning/backlog/feature_graphical-quest-performance-budget_2026-08-27.md` — the son's laptop
  numbers

## Out of Scope

Area 3's curriculum and quests. This plan ships the tool; the area that uses it is its own
plan and is blocked by this one.

Anything under `pyquest/`. The shim never reaches the browser — Ursina needs a real OpenGL
context and Pyodide does not have one, which is precisely why Area 3 onward is `local-repo`.

Editing the spike. It is the record of a measurement and it stays as it is.

## Status — 2026-08-29, stopped at the hardware gate

**Phases 1, 2 and 4 are done. Phase 3 is not started and cannot be.** The son's laptop
was not available, and Phase 3 is a measurement on that machine. This plan stays in
`planning/in-progress/`.

### What was delivered

| Phase | State | Where |
|---|---|---|
| 1 — pin ursina | done on the parent's machine | `curriculum/lib/requirements.txt`, `curriculum/lib/smoke.py`, spec §4 Area 3 and the decisions table |
| 2 — promote and harden | done | `curriculum/lib/world.py`, `curriculum/lib/tests/` |
| 3 — measure on the son's laptop | **not started, blocked** | — |
| 4 — docs and the Area 7 exercise | done | `curriculum/lib/README.md`, `curriculum/lib/area-7-exercise/` |

Verification actually run, 2026-08-29, on the parent's machine:

```console
py -3.14 -m pytest curriculum/lib/tests -q       19 passed in 0.72s
py -3.14 -m ruff check curriculum/lib            All checks passed!
py -3.14 -m ruff format --check curriculum/lib   8 files already formatted
py -3.14 -m pyright curriculum/lib               0 errors, 0 warnings, 0 informations
py -3.14 curriculum/lib/smoke.py                 all checks passed against ursina 8.3.0
```

Ten mutants seeded one at a time and each killed, including the five this plan named —
unknown kind accepted, non-numeric coordinate accepted, `ground.combine()` skipped, `place()`
succeeding after `start()`, and the wrong `BLOCKS` colour — plus one that restores the
spike's module-scope `Ursina()` and one that widens `__all__`. Captured in the commit bodies.

### What remains

1. **Phase 3, on the son's laptop.** Run `spikes/ursina-tier3/_stress_shim.py` and
   `_stress_naive.py`, and `_bench.py naive 2500` / `_bench.py combined 15000`, at 1,000 /
   2,500 / 5,000 / 8,000 blocks. Record fps, date, ursina version and machine.
   `curriculum/lib/area-7-exercise/measure.py` is now a second, durable way to take the same
   reading — it runs any world program with vsync off and reports build time and fps — and it
   is shipped rather than throwaway, so prefer it where the two overlap.
   - **If 5,000 fused blocks does not hold 60 fps, the authoring cap moves**, and the Area 3
     plan is told the new number *before* its exercises are written.
   - Confirm which display adapter Panda3D bound to. The son's laptop likely has an Intel iGPU
     beside a discrete Quadro; `smoke.py` prints the GL vendor and renderer.
   - Feed the result into `planning/backlog/feature_graphical-quest-performance-budget_2026-08-27.md`
     and into the table in `curriculum/lib/area-7-exercise/README.md`, which is written to
     take a second half rather than a correction.
2. **Finish the pin on his machine.** `py -3.14 -m pip install -r curriculum/lib/requirements.txt`,
   then `py -3.14 curriculum/lib/smoke.py`. The criterion says *identically on both machines*
   and only one machine has been checked.
3. **Copy `world.py` into his repository** when Area 3 starts. `curriculum/lib/README.md` has
   the step and the reason it is a copy.

Only then does this move to `completed/`.

### Where the plan turned out to be wrong

- **"`place()` returns an `Entity`" and "`Ursina()` must not be built at import" cannot both
  hold.** With no app in existence when `place()` is called, there is nothing to return. The
  import-safety requirement wins, because the Area 3 `verify.py` contract depends on it, so
  `place()` now records into `placed` and `start()` builds everything. This is the largest
  behavioural change from the spike and the plan did not name it as one.
- **The third failure case — `color='green'` — was listed as *"not reachable through the
  shim's surface; decide whether to guard it or leave it"*. It is reachable.** `BLOCKS` is a
  plain dict he can assign into, and `BLOCKS['grass'] = 'green'` is exactly the obvious guess.
  It is guarded, and the guard fires at `place()` time so the message names the kind.
- **The readability audit regressed and the plan's constraint did not anticipate why.** Three
  statements now carry type annotations, which the spike had none of, because `CLAUDE.md`
  requires pyright clean with no `Any` and §5.10's Idiomatic medal is literally that standard.
  The honest count is *all but one statement and three annotations* rather than the spike's
  *all but one line*. Recorded in `curriculum/lib/README.md` rather than smoothed over.
- **`curriculum/lib/` breaks a standing convention in `curriculum/README.md`** — that
  everything under `curriculum/` runs with a text editor, a terminal and Python, with a
  `verify.py` per area rather than a test framework. This is not an area and it is the one
  piece of curriculum code imported by every Area 3 exercise on two machines, so it carries a
  pytest suite. `smoke.py` keeps the constraint honest: same ground, end to end, nothing but
  Python and ursina. **`curriculum/README.md` was not edited — another track owns it** — so
  the main track should fold in a line about `lib/` when it next touches that file.
- **ruff 0.16 formats Python code blocks inside Markdown.** It silently reflowed a code fence
  in `curriculum/lib/README.md`. Worth knowing before it reformats someone's prose.
