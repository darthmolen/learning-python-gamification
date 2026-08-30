# A Stopped Program Loses The Drawing It Was Making

**Status:** Backlog
**Track:** spa
**Date Discovered:** 2026-08-30
**Discovered During:** SPA Phase 3 — testing Stop against a runaway loop

## Context

Ops are recorded in `_OPS` inside the worker and drained once, after the program ends. Stop
**terminates** the worker, so a program that was killed hands back nothing at all.

```python
import turtle
while True:
    turtle.forward(5)
    turtle.right(1)
```

Press Run, watch nothing happen, press Stop: the canvas is empty. The spiral it was busy making
died with the worker that was making it.

That is correct behaviour for a kill and a bad experience for the exact case a learner meets most
often. A runaway drawing loop is not an exotic mistake — it is `while True:` plus a turtle, which
is week three plus Area 0, and the two arrive within a fortnight of each other. He writes one,
sees nothing, stops it, and has no evidence of what it was doing. **The drawing was the debugging
information**, and it is the piece that gets thrown away.

Compare the failure path, which already gets this right: a program that *raises* keeps every
stroke it managed, because the ops are drained after the catch. Stop is the one exit that loses
them, and it is the one where he had to intervene — so it is the one where he most wanted to see
what was going on.

## What it would take

**Stream the ops out instead of draining at the end.** The worker posts batches as they are
recorded, the hook accumulates them, and a terminated worker leaves behind everything it had
already sent.

That is a change to the worker protocol rather than a tweak:

- `turtle.py` needs to hand ops out mid-run rather than accumulating in `_OPS`. Posting from
  Python into JS on every call would be slow; a batch flushed on a timer or every N ops is the
  obvious shape, and the batch size is a real decision — too large and a killed program still
  loses a second of drawing, too small and a tight loop spends its time in `postMessage`.
- `reduce` gains an `ops` event that appends rather than replaces, and `start` still clears.
- The `stopped` transition keeps whatever arrived instead of leaving `ops` as the reducer found
  them.
- The canvas already re-renders on every ops change, so a streamed drawing animates for free —
  which is a bonus and also a risk, because turtle's own animation is something this shim
  deliberately does not have. It should arrive as a decision, not as a side effect.

## Why it is not urgent

Run works, Stop works, and a raising program already keeps its drawing — which covers the common
failure. This covers the *interrupted* one.

It is also worth doing after `planning/backlog/feature_integration-suite_2026-08-30.md` tier 4,
not before: nothing automated has ever started this worker, so a change to its protocol would be
made blind. The one thing that could catch a streaming bug is the browser test that does not
exist yet.

## Trigger for promotion

Whichever comes first: the integration suite landing, which makes this safe to change — or the
first time a learner writes a runaway drawing loop and asks why nothing is there. The second is
more likely, and would be the better evidence.
