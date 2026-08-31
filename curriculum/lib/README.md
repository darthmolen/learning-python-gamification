# `curriculum/lib` — the `world.py` shim

One canonical copy of the code the learner imports. It is not an area; it is the tool three
areas use and two areas dismantle.

| File | What |
|---|---|
| `world.py` | the shim. Three names, positional arguments only |
| `requirements.txt` | the ursina pin, identical on both machines |
| `smoke.py` | run this after any ursina upgrade, on **both** machines |
| `tests/test_world.py` | the headless suite — the messages, and the fusing |
| `area-7-exercise/` | the `ground.combine()` deletion lesson, stubbed for Area 7 |

Spec: `docs/specs/2026-08-26-gamified-python-curriculum-design.md` §4, Area 3.
The measurements behind every number here: `spikes/ursina-tier3/README.md`.

## The surface

```text
BLOCKS                  a dict of block kind -> color, seven kinds
place(x, y, z, kind)    remember one block; nothing is drawn until start()
start()                 build, fuse, frame the camera, open the window
```

That is all of it. Every call is positional, and **calling a positional function is Area 0
vocabulary** — he has been calling `print()` and `len()` since week one. Measured against the
raw engine, this is 0% ceremony beyond a one-line import floor, where raw Ursina is 100%.

```python
from world import place, start

for x in range(10):
    place(x, 0, 0, "grass")

start()
```

### Copy it into his repository

`import world` needs `world.py` beside his own `.py` files, so the shim is **copied, not
referenced**:

```console
cp curriculum/lib/world.py <his-repo>/world.py
```

That is deliberate and it is not laziness about packaging. A file he owns is a file he can
delete, and **deleting it in Area 4 and Area 5 has to be his action, not the DM's.** A
shim installed as a dependency is a shim that never comes down, and scaffolding that never
comes down is the thing this curriculum refuses to become.

Copy it again if it changes here. It is one file and the copy is the point.

## The pin

**`ursina==8.3.0`**, in `requirements.txt`, identical on both machines.

```console
py -3.14 -m pip install -r curriculum/lib/requirements.txt
```

The campaign runs roughly 48 weeks against one engine, and **push is the verification
mechanism** — he pushes, the other machine clones and runs the code cold. Two machines on
different ursina versions break that quietly, which is the worst way for it to break.

**The upgrade rule is never mid-area.** An upgrade may land only between areas, only when
something is actually broken, and only after `smoke.py` passes on *both* machines against the
new version. Mid-area, an engine change means the exercises he already has stop matching the
engine he is running, and diagnosing that costs more than any upgrade is worth.

Three things about 8.3.0 that shaped how the pin is enforced, all found in one afternoon:

- **There is no `ursina.__version__`.** `smoke.py` reads
  `importlib.metadata.version("ursina")` instead.
- **`Ursina` is wrapped in a `@singleton` decorator**, so it is a factory, not the class.
  `smoke.py` patches `ShowBase.run` rather than `Ursina.run`, and `world.py` carries one
  `# pyright: ignore` on `app.run()` because a type checker cannot see through the proxy.
- **`ursina/samples/` is no longer in the pip package.** The `minecraft_clone` sample is
  therefore **not a dependency and is not vendored**; its one-`Entity`-per-block pattern is
  not what anything here is built on.

### After any upgrade

```console
py -3.14 curriculum/lib/smoke.py
```

Seven checks: the pin matches, `import world` builds no app, all four validation messages
still fire, a real window opens and renders 1,728 fused blocks, and `place()` after `start()`
still refuses. Exit 0 or put the pin back. It needs nothing but Python and ursina — no
pytest — so it runs on the learner's machine exactly as it stands.

Its fps figure is **vsync-bound on purpose**: it answers *is this alive*, not *how fast*.
A machine with a hundred times the headroom prints the same 60.

## It fails loudly, which is most of why it exists

The shim is a **validating boundary first** and a keyword-argument hider second. That was the
spike's central finding: raw Ursina breaks spec §3 principle 5, *never hide failure*, on the
realistic Area 3 mistakes. A mistyped block name prints one warning inside forty lines of
engine startup noise and then draws nothing. A two-element position produces no diagnostic at
all. `color='green'` — the obvious guess — produces an eight-frame traceback ending in a
complaint about hexadecimal.

Four guards, and **the message is the feature**. A `ValueError` that names the fix is the shim
doing its job; a bare `KeyError` would be the shim being a wrapper.

| What he does | Raw Ursina | The shim |
|---|---|---|
| `place(0, 0, 0, "stnoe")` | one warning in the noise, draws nothing | `ValueError: place() does not know the block kind 'stnoe'. The kinds it knows are ['dirt', 'glass', 'grass', 'sand', 'stone', 'water', 'wood'].` |
| `place(0, "up", 0, "grass")` | no diagnostic at all | `TypeError: place() needs numbers for x, y and z. The y it got was 'up', which is a str.` |
| `BLOCKS["grass"] = "green"` | eight frames, ending in hexadecimal | `TypeError: BLOCKS['grass'] is 'green', which is not a color. The colors in BLOCKS come from ursina's color module -- color.green, color.brown, and so on. A name in quotes is not one of them.` |
| `place()` after `start()` | silent no-op | `RuntimeError: place() cannot add blocks once start() has run. start() builds the world and opens the window, so every place() call has to come before it.` |
| `place(0, 0, "grass")` | — | Python's own: `TypeError: place() missing 1 required positional argument: 'kind'` |

Two of the raw failure modes are not merely improved but **unreachable**: he never types a
model name, a color or a position tuple, so he cannot get them wrong.

## `start()` fuses, and that is not optional

`start()` calls `ground.combine()`, which turns every placed block into a single mesh.

One `Entity` per block costs one draw call per block. Measured on an RTX 5090:

| Blocks | One Entity each | Combined |
|---|---|---|
| 1,000 | 75.4 fps | — |
| 2,500 | 25.8 fps | — |
| 5,000 | 12.7 fps | 3,366 fps |
| 15,000 | 4.1 fps | 2,481 fps |

**It falls below 60 fps between 1,000 and 2,500 blocks on the fastest consumer GPU you can
buy.** Three nested `range(20)` loops is 8,000 blocks — an entirely ordinary thing for a
learner discovering nested loops to write in week 10 — and renders at **14.9 fps** raw
against **1,424 fps** through the shim.

Without fusing, the first learner who turns a loop bound up to 20 gets a slideshow and no
vocabulary to understand why, which reads as *my computer is bad* rather than as a lesson.

### The authoring cap, and what is still unmeasured

**Soft-cap Area 3 worlds near 5,000 blocks.** Startup is 1.6 s there on the DM's machine.

> **Every number above is from an RTX 5090 and none of them transfer.** The target machine (a 2017 mobile workstation)
> — 2017, i7-7820HQ — has passed a viability check (a cube renders, hardware accelerated, no
> GDI Generic fallback, ~57 fps vsync-locked) and **has not been placed on the scaling
> curve.** Until it is, the 5,000-block cap is an estimate with a single-threaded-Python
> scaling guess on top of it, and **if 5,000 fused blocks does not hold 60 fps on the target machine,
> the cap moves and Area 3's exercises are written against the smaller number.**
>
> Phase 3 of `planning/in-progress/feature_world-shim_2026-08-28.md` is that measurement.
> Cite the cap with the machine attached until it is done.

## It comes down on a schedule

Scaffolding that never comes down is the thing this curriculum was designed against. The
schedule is not trivia; it is the argument.

| Comes down | At | Replaced by | Why then |
|---|---|---|---|
| `BLOCKS` | Area 4 | his own module-level dict | he already reads it at Area 3; nothing new is needed to own it |
| `place()` | Area 4 | his own `def place(x, y, z, kind)` | Area 4 teaches `def`, parameters, `return`, keyword arguments — the exact contents of this function |
| `start()` | Area 5 | his own `class World`, combining and camera setup as methods | Area 5 teaches `class`, `__init__`, methods, `raise` — the last unreadable lines |

The last removal lands in Area 5, **whose boss is Boss 5 — The Bestiary**. Taking down the
scaffolding is a boss beat, not an afterthought.

And then, at Area 7: delete `ground.combine()` and watch it happen. See
[`area-7-exercise/`](area-7-exercise/).

## Can he read it?

The constraint the shim is held to: he opens `world.py` at Area 4 and recognizes most of it.
Audited by statement rather than by physical line, because the formatter breaks long calls
across lines and that should not flatter the count. 43 statements:

| Readable at | Statements | What |
|---|---|---|
| Area 3 — the day he starts using it | 22 (51%) | the dict, the three lists, `if`, both `for` loops, the six `.append`s, `min`/`max`/`sorted`, indexing, the arithmetic, and calling a function positionally |
| Area 4 | +6 (65%) | `import`, `def`, `return`, keyword arguments |
| Area 5 | +14 (98%) | `raise`, `isinstance`, attribute access and assignment, method calls |
| Never taught | 1 (2%) | `__all__` |

**One honest regression against the spike's audit.** Three statements now carry type
annotations — `dict[str, Color]`, `list[tuple[float, float, float, str]]`, `list[Ursina]` —
which the throwaway did not have. They are here because the repository holds itself to
`ruff` and `pyright` clean with no `Any`, and §5.10's **Idiomatic medal** is literally that
standard, so the shim cannot be exempt from what the learner is graded against. They read as
labels built from words he already has (`dict`, `list`, `tuple`, `str`, `float`, from Area 0's
four types and Area 3's collections), and `type-hints` is itself an Area 7 concept. But they
are unearned syntax on the day he first opens the file, and the honest count is *all but one
statement and three annotations* rather than the spike's *all but one line*.

## Running the checks

```console
py -3.14 -m pytest curriculum/lib/tests -q      # headless, no window
py -3.14 curriculum/lib/smoke.py                # real window, real hardware
py -3.14 -m ruff check curriculum/lib
py -3.14 -m ruff format --check curriculum/lib
py -3.14 -m pyright curriculum/lib
```

**Note the deviation.** `curriculum/README.md` sets a standing constraint that everything
under `curriculum/` runs with a text editor, a terminal and Python, and gives each area a
`verify.py` rather than a test framework. This directory is not an area and it is the one
piece of curriculum code that ships to two machines and is imported by every Area 3 exercise,
so it carries a real pytest suite. **`smoke.py` is what keeps the constraint honest**: it
covers the same ground end to end, needs nothing but Python and ursina, and is the thing
actually run on the learner's machine. Nothing the learner touches needs pytest until Area 7,
where `pytest` is a taught concept.

### What the Area 3 checker depends on

`import world` **must stay safe with no display.** Area 3's `verify.py` swaps `world.start`
for a recording no-op, imports each exercise as a module, and asserts on what was placed:

```python
monkeypatch.setattr(world, "start", lambda: None)
runpy.run_path(exercise)
assert world.placed == [(0, 0, 0, "grass"), ...]
world.placed.clear()  # module state is per-process; clear between exercises
```

`world.placed` is a list of `(x, y, z, kind)` tuples in the order they were placed. It is not
in `__all__` — the learner's surface is still three names — but it is a plain name with a
plain shape on purpose, because the checker reads it.

This is why `Ursina()` is constructed inside `start()` rather than at module scope, and it is
the single largest change from the spike's version.

## What changed from `spikes/ursina-tier3/world.py`

The spike is the record of a measurement and is not edited after the fact. What the promotion
changed:

- **`from ursina import *` became seven named imports.** He reads this file at Area 4 and
  starts replacing it; a star import hides where every name came from.
- **`Ursina()` moved out of module scope and into `start()`.** Importing the shim used to
  construct the app as a side effect, which made the module untestable without a display and
  made import order load-bearing. Consequently `place()` no longer creates an `Entity` — it
  records into `placed`, and `start()` builds everything. **`place()` no longer returns
  anything**, which it could not do anyway with no app in existence when it is called.
- **`Tier` is gone.** The lexicon is Area, and at Boss 7 he opens this repository and reads
  it.
- **Three of the four guards are new.** The unknown-kind `ValueError` came from the spike;
  the coordinate check, the overwritten-color check and the after-`start()` check did not.
