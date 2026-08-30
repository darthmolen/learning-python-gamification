# Standing Performance Budget for Graphical Quests

**Status:** Backlog
**Date:** 2026-08-27
**Promoted from:** `planning/completed/feature_ursina-tier3-spike_2026-08-26.md`, Anticipated Backlog

## Why this surfaced

The Ursina Area 3 spike anticipated this item conditionally — *"the son's laptop turns out to
be viable but marginal"* — and expected it to hinge on his hardware. It surfaced for a
different reason, which makes it more urgent rather than less.

The stock one-`Entity`-per-block pattern drops below 60 fps between 1,000 and 2,500 blocks
**on an RTX 5090**. Three nested `range(20)` loops is 8,000 blocks at 14.9 fps. His the son's laptop is
not the problem; the pattern is. Any graphical quest can be authored into a slideshow without
anyone noticing, on any machine.

Full numbers: `spikes/ursina-tier3/README.md`, Phase 5.

## What this needs to produce

- A per-quest block-count or entity-count ceiling that authoring checks against, starting from
  the spike's ~5,000-block soft cap for Area 3
- A rule for when a quest may create individual entities and when it must combine
- A cheap way to measure it — the spike's `_bench.py` and `_timed_runner.py` are the seed, but
  they are throwaway and would need rewriting as something durable
- The son's laptop's position on the scaling curve, which is the one measurement still missing

## Why it is not urgent yet

Area 3 runs weeks 9–14 and the shim's `start()` already combines, which removes the failure
mode for every Area 3 quest. This becomes load-bearing when quests start creating entities the
shim does not own — Area 5 onward, and the capstone.

## Depends on

- Area 3 content authoring, which will reveal whether the ~5,000-block cap is generous or tight
- One session with the son's laptop, to place it on the curve

## Note -- 2026-08-29, from the world-shim plan

`curriculum/lib/world.py` shipped, and `start()` combines. That closes the failure mode for
every Area 3 quest, exactly as this item predicted, so this stays in the backlog.

**The one measurement this item names as missing is still missing.** The the son's laptop has not
been placed on the scaling curve. Phase 3 of `feature_world-shim_2026-08-28.md` is that
measurement and it is blocked on the laptop being in reach. Until it is run, the ~5,000-block
soft cap is an RTX 5090 figure with a single-threaded-Python scaling estimate on top of it,
and it should be cited that way rather than as a budget.

What the shim now guarantees, and what it does not:

- **Guaranteed:** any world built only through `place()` and `start()` is one fused mesh, so
  a learner cannot author himself into a slideshow through the shim's surface.
- **Not guaranteed:** anything that creates entities the shim does not own. That is Area 5
  onward and the capstone, which is where this item becomes load-bearing.

`curriculum/lib/smoke.py` prints an fps figure, and it is **not** the durable measuring tool
this item wants. It runs vsync-bound on purpose -- it answers *is this alive*, not *how much
headroom*. A machine with a hundred times the headroom prints the same 60. The measuring tool
still has to be built from `spikes/ursina-tier3/_bench.py`, which is throwaway.
