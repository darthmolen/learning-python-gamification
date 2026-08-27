# Ursina Pinning and Upgrade Policy

**Status:** Backlog
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
- A rule for when an upgrade is allowed at all — the honest default is *never mid-tier*, and
  probably *only between tiers, and only if something is actually broken*
- A smoke test that runs after any upgrade: open a window, place blocks through the shim,
  trigger the shim's validation error, combine a world. The spike's probes are the seed, but
  they are throwaway and would need rewriting as something durable
- A decision on whether to vendor the `minecraft_clone` sample, or drop the dependency on it —
  the spike's Phase 5 findings suggest its pattern is not what gets built anyway

## Why it is not urgent yet

Nothing is authored against Ursina yet. The cost of deciding this is lowest before Tier 3
content exists and rises steadily afterward.

## Depends on

- Tier 2b, which is where `pip` and venv enter the curriculum and where a requirements file
  first becomes something he can be shown rather than something done for him
