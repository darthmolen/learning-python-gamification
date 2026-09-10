---
kind: reminder
status: open
date: 2026-09-06
---

# Two files still say Area 3 is blocked, and it is not

**Category:** follow-up
**Discovered:** 2026-09-06, during `feature_area-3-collections_2026-08-28.md` Phases 1–2a
**Owned by:** `main` for the first, the shim plan's track for the second — **not `area-3`**

## What is stale

**1. `curriculum/README.md`** — the status table row reads:

> | area-3 | 9–14 | Collections — … | planned, blocked on the shim's measurement |

and the prose below it still says *"Area 3 waits on `curriculum/lib/`'s framerate
measurement on the same machine."*

Both were true until 2026-08-31. `feature_world-shim_2026-08-28.md` is in `completed/` with
the measurement taken, and Area 3's own dependency box has been ticked since. As of
2026-09-06 sessions 1–7 are authored and `verify.py` reports 17 of 17.

The row should now read something like:

> | area-3 | 9–14 | Collections — lists, dicts, sets, and Minecraft data | **sessions 1–7 authored** |

**This file is owned by `main`** and is not editable by an area track — three area tracks
want that table and one owner writes it. That rule is why this is a reminder rather than a
commit.

**2. `curriculum/lib/README.md`** — still carries the warning box saying the 5,000-block cap

> has not been placed on the scaling curve … the 5,000-block cap is an estimate with a
> single-threaded-Python scaling guess on top of it

It has been placed on the curve. Measured on the learner's laptop, 2026-08-31, ursina 8.3.0:

| Blocks | Fused fps | Fused startup |
|---|---|---|
| 1,000 | 296.1 | 2.21 s |
| 5,000 | 213.8 | 5.32 s |
| 8,000 | 178.3 | 8.68 s |

The numbers are in `planning/completed/feature_world-shim_2026-08-28.md`'s Status section.
**`curriculum/lib/` belongs to the shim plan and Area 3 uses it without writing it**, which
is stated in the Area 3 plan's dependency list.

## Why it matters beyond tidiness

The cap's *justification* changed with the measurement and the warning box hides that.
Framerate was never the binding constraint — 8,000 blocks still renders at 178 fps. What
degrades is **startup**, at roughly a millisecond a block, paid before anything appears.

An author who reads the stale box concludes the cap is a framerate guess and may relax it.
An author who reads the measurement concludes it is a budget on how long a learner stares
at a blank window, which is the true and much more useful framing. Area 3's `README.md`,
`dm-guide.md` and `verify.py` failure message all now argue it the second way.

## Done when

- [ ] `curriculum/README.md`'s area-3 row and the paragraph under the table tell the truth
- [ ] `curriculum/lib/README.md`'s warning box is replaced by the measured table, with the
      startup-not-framerate finding stated
