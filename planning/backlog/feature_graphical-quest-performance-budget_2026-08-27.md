# Standing Performance Budget for Graphical Quests

**Status:** Backlog
**Date:** 2026-08-27
**Promoted from:** `planning/completed/feature_ursina-tier3-spike_2026-08-26.md`, Anticipated Backlog

## Why this surfaced

The Ursina Tier 3 spike anticipated this item conditionally — *"the son's laptop turns out to
be viable but marginal"* — and expected it to hinge on his hardware. It surfaced for a
different reason, which makes it more urgent rather than less.

The stock one-`Entity`-per-block pattern drops below 60 fps between 1,000 and 2,500 blocks
**on an RTX 5090**. Three nested `range(20)` loops is 8,000 blocks at 14.9 fps. His laptop is
not the problem; the pattern is. Any graphical quest can be authored into a slideshow without
anyone noticing, on any machine.

Full numbers: `spikes/ursina-tier3/README.md`, Phase 5.

## What this needs to produce

- A per-quest block-count or entity-count ceiling that authoring checks against, starting from
  the spike's ~5,000-block soft cap for Tier 3
- A rule for when a quest may create individual entities and when it must combine
- A cheap way to measure it — the spike's `_bench.py` and `_timed_runner.py` are the seed, but
  they are throwaway and would need rewriting as something durable
- The son's laptop's position on the scaling curve, which is the one measurement still missing

## Why it is not urgent yet

Tier 3 runs weeks 9–14 and the shim's `start()` already combines, which removes the failure
mode for every Tier 3 quest. This becomes load-bearing when quests start creating entities the
shim does not own — Tier 5 onward, and the capstone.

## Depends on

- Tier 3 content authoring, which will reveal whether the ~5,000-block cap is generous or tight
- One session with the son's laptop, to place it on the curve
