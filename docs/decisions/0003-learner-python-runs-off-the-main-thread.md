# 0003 — Learner Python runs off the main thread, in both places it runs

**Status:** Accepted
**Date:** 2026-08-30

## Context

His code runs in two places, and §6.3 makes them deliberately different paths:

- **Run** is Pyodide in the browser. Instant, no round trip, and it records nothing.
- **Submit** goes to the API, because "anything shipped to the browser is readable, and hidden
  tests shipped to the client are not hidden."

The SPA plan left the browser boundary open — worker or main thread — and asked for it to be
decided and written down. It is a bigger question than one phase of one app, because the same
argument governs the `runner` container on the other side.

The learner is 11-14. `while True:` is week-three material (§6.6) — not a mistake he might
make, one he **will** make, on purpose, before he understands what he has done.

## Decision

**Learner Python never runs on a thread that owns a user interface.**

- **In the browser: a Web Worker.** Pyodide is loaded and executed in
  `apps/web/src/turtle/runner.worker.ts`, never on the main thread.
- **On the server: the `runner` container** (§6.6), as already specified — a subprocess with
  `--network none`, a ten-second timeout and memory caps.

The browser half is the part this record adds; the server half was already decided and is
restated here so the two are read together, which is the whole point.

## Why not the main thread

It is less code and it is wrong.

**An infinite loop takes his work with it.** On the main thread a hot loop freezes the tab that
his editor is in. He loses what he typed, and the lesson he takes is that the tool is dangerous
— the exact opposite of Area 0's promise that errors are readable and recoverable.

**A page cannot interrupt itself.** This is the part that has no workaround. A main thread
running a spinning script cannot service a click, so there is no Stop button that can exist. A
worker can simply be terminated. Giving a learner a way out of his own mistake is not a nicety
here; it is the difference between a bug and a wall.

**The two halves would disagree.** The server kills at ten seconds. If the browser never kills
at all, the same program behaves in two ways under Run and Submit, and he learns that the game
is inconsistent rather than that his loop does not end.

## What this means for the `api` and `runner` tracks

**Run and Submit must fail the same way.** Two execution boundaries and one learner between
them: a timeout, a traceback and a memory ceiling should read the same whichever produced it. A
program he can Run but not Submit — or the reverse — reads as the game being broken, and he has
no way to tell which half is lying. Worth checking when `runner` gets its error shape, because
after both are built it is expensive to reconcile.

**The runner does not need a turtle module, and must not grow one.** Turtle graphics are Areas 0
and 1 start to finish, but the hidden tests already solve this and solved it better: they inject
a `TurtleSpy` that records the orders it is given and assert on computed values. From
`content/tests/a1-the-polygon-engine_test.py`:

> Every Area 1 quest draws, and §6.3's rule is that a test asserts on a **computed value, never
> on a picture**. So `turtle` is replaced by a stand-in that records the orders it is given.

**The browser shim and the hidden tests reached the same design independently**, in two
languages, for two different reasons — `protocol.ts` records intent and computes strokes
separately so the geometry is testable without a canvas; `TurtleSpy` records orders so the
assertions can be about numbers. That convergence is the strongest evidence either design is
right, and it is why it is recorded here rather than in either one's plan.

The consequence for the runner is a negative one, which is the kind most easily lost: **it needs
no turtle support at all.** A future maintainer watching turtle programs arrive at the API may
reasonably think one is missing. It is not.

**Both stand-ins forgive the same way.** `TurtleSpy` answers any attribute at all; the browser
shim ignores an op it does not implement rather than throwing. A learner reaching for a turtle
function neither supports gets a missing drawing, never a crash that reads as his fault — and he
gets the same non-answer from both. If one ever starts raising, the other must too.

## Consequences

- Pyodide loads from a CDN rather than the bundle. It is ~10MB of wasm and does not belong in a
  build that has to fit on a laptop's disk.
- The worker is an integration boundary the unit suite cannot cross. Nothing in
  `vitest --project web` executes real Python; the geometry is proved against the stroke
  protocol and the Python side by ruff, pyright and a textual seam guard. **The first real proof
  is a learner program drawing a square in a browser**, and it arrives with Phase 3's Run.
- A Stop button is now possible. Whether Phase 3 ships one is that phase's call, but the
  boundary no longer forecloses it.

## What this does not decide

The timeout the browser enforces, and whether it matches the runner's ten seconds. Ten is right
for a server protecting itself from many submissions; a learner watching his own screen may
deserve longer before being told his program will not finish. That is a teaching decision rather
than an engineering one, and it should be made where Run's UI is built rather than assumed here.
