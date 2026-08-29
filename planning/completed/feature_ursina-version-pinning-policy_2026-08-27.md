# Ursina Pinning and Upgrade Policy

**Status:** Complete -- 2026-08-29
**Date:** 2026-08-27
**Promoted from:** `planning/completed/feature_ursina-tier3-spike_2026-08-26.md`, Anticipated Backlog

## Why this surfaced

The spike listed *"Ursina's own version churn threatens a year-long campaign"* as a conditional
backlog item. Three pieces of evidence turned up in a single afternoon on ursina 8.3.0:

- **`ursina/samples/` no longer ships in the pip package.** The plan named the
  `minecraft_clone` sample as a dependency and it is not there. It now has to be fetched from
  the GitHub repository, which is a separate thing to keep alive for a year.
- **`Ursina` is no longer the class it appears to be.** It is wrapped in a `@singleton`
  decorator, so `Ursina.__mro__`, `hasattr(Ursina, 'run')`, and subclassing all behave
  unexpectedly. The spike's harness had to patch `ShowBase.run` instead. Any tooling the
  parent writes against Ursina internals is exposed to this.
- **`ursina.__version__` does not exist.** Version has to be read from pip metadata, so a quest
  cannot easily assert what it is running against.

The campaign runs roughly 48 weeks against one engine. The son also pushes from his machine and
the parent clones and runs his code cold — Boss 2's win condition. Two machines drifting to
different ursina versions mid-campaign breaks that verification quietly.

## What this needs to produce

- A pinned version in a requirements file, identical on both machines, with the pin recorded in
  the spec rather than only in a lockfile
- A rule for when an upgrade is allowed at all — the honest default is *never mid-area*, and
  probably *only between areas, and only if something is actually broken*
- A smoke test that runs after any upgrade: open a window, place blocks through the shim,
  trigger the shim's validation error, combine a world. The spike's probes are the seed, but
  they are throwaway and would need rewriting as something durable
- A decision on whether to vendor the `minecraft_clone` sample, or drop the dependency on it —
  the spike's Phase 5 findings suggest its pattern is not what gets built anyway

## Why it is not urgent yet

Nothing is authored against Ursina yet. The cost of deciding this is lowest before Area 3
content exists and rises steadily afterward.

## Depends on

- Area 2b, which is where `pip` and venv enter the curriculum and where a requirements file
  first becomes something he can be shown rather than something done for him

## Status -- resolved 2026-08-29

Promoted and closed by `planning/in-progress/feature_world-shim_2026-08-28.md`, Phase 1.
Every deliverable this item asked for now exists.

| Wanted | Where it landed |
|---|---|
| A pin in a requirements file, identical on both machines | `curriculum/lib/requirements.txt` -- `ursina==8.3.0` |
| The pin recorded in the spec, not only in a lockfile | Spec section 4, Area 3, and a row in the decisions table |
| A rule for when an upgrade is allowed | **Never mid-area.** Between areas only, only when something is actually broken, and only after the smoke test passes on *both* machines against the new version |
| A durable smoke test, not the spike's throwaway probes | `curriculum/lib/smoke.py`. Asserts the pin from pip metadata, checks `import world` builds no app, fires all four validation errors and reads their messages, then opens a real window, builds 1,728 blocks, fuses them and renders. Exit code 0 or the pin goes back. Needs nothing but Python and ursina, so it runs on the learner's machine as it stands |
| A decision on the `minecraft_clone` sample | **Dropped, not vendored.** The spike's Phase 5 showed its one-`Entity`-per-block pattern is unusable at any real world size even on an RTX 5090, so it is not the architecture anything here is built on. Nothing depends on it and nothing has to be kept alive for a year |

The three churn observations that made this urgent are all still true at 8.3.0, and all three
are handled rather than merely noted:

- **No `ursina.__version__`.** `smoke.py` reads `importlib.metadata.version("ursina")`.
- **`Ursina` is `@singleton`-wrapped**, so it is a factory rather than the class. `smoke.py`
  patches `ShowBase.run` to close the window by itself, and `world.py` carries one
  `# pyright: ignore` on `app.run()` because a type checker cannot see through the proxy.
- **`ursina/samples/` is gone from the pip package.** No longer a dependency -- see above.

First run, 2026-08-29, parent's machine, ursina 8.3.0, RTX 5090: all seven checks passed.

**One thing this deliberately does not do.** The pin is not asserted from inside `world.py`.
A learner running a program should not be stopped by a version check, and the check belongs
at the moment of upgrade rather than at the moment of use.

**The remaining dependency is teaching, not mechanism.** This item was filed as depending on
Area 2b, where `pip` and virtual environments enter the curriculum and a requirements file
becomes something he can be *shown* rather than something done for him. That is still where
the file gets introduced to him. It did not have to wait for the pin to exist.
