# The Tests That Would Have Caught The Ones The Tests Missed

**Status:** Backlog
**Track:** spa (mostly — one item is repo-wide, see below)
**Date Discovered:** 2026-08-30
**Discovered During:** SPA Phases 1–4 — `planning/**/feature_spa_2026-08-28-v2.md`

## Why this exists

Six times in one session, something was green while the thing it was checking was broken. None
of these was a missing test; every one was a test that ran and reported success.

| # | What was broken | What the suite said |
|---|---|---|
| 1 | `boundary.test.ts` threw on import under jsdom and ran **zero** assertions | `54 passed` |
| 2 | `vite build` failed on `node:fs` for days | `--project web` green |
| 3 | A stale dev server silently dropped an import, `ReferenceError` in the browser | green, and dev returned HTTP 200 |
| 4 | A seam guard read `String(interpret)`, which the transform does not preserve, and compared against `''` | green, and it survived its own mutant |
| 5 | `toHaveTextContent('Run')` is a **substring** match, so a label reading `Running…` passed the rule forbidding exactly that | green, and it survived its own mutant |
| 6 | `importScripts` in a module worker; a duplicate React key; a dead worker leaving the UI on `Run · working` forever | `161 passed` |

Five of the six were caught by a person looking at a screen or a console. That is the actual
current gate, and it does not scale past one attentive adult.

**The mutant discipline is not the problem and is not the answer either.** It caught 4 and 5 —
that is exactly what it is for. What it cannot do is notice that a test file never loaded, that a
build never ran, or that a browser printed a warning. Those need a different kind of test.

## Four tiers, cheapest first

The order matters more than the list: the first two are hours and would have caught three of the
six, and the last is days.

### 1. Fail the suite on a console warning — *cheap, catches #6 in part*

React logs duplicate keys, bad nesting and act() violations to `console.error` and nothing fails.
A setup-file spy that fails a test when `console.error` or `console.warn` is called — with an
explicit opt-out for tests that assert on a warning deliberately — would have caught the
duplicate-key bug on the commit that introduced it, instead of in devtools opened for an
unrelated reason.

Needs a survey first: existing suites may already be noisy, and the point is a clean floor.

### 2. Assert the suite ran what it thinks it ran — *cheap, catches #1*

A failed *suite* and a failed *test* read differently in vitest's summary, and a file that throws
on import contributes zero tests while the total still climbs. A check that the expected test
files all reported — or simply treating a failed suite as a hard stop in whatever runs the gate —
closes it.

`boundary.test.ts` already carries a hand-rolled version of this idea: its first assertion checks
it can see the source tree, "because a guard that scans nothing passes forever." That instinct
should be infrastructure rather than one file's good manners.

### 3. Put `vite build` in a gate — *cheap, catches #2. **Repo-wide, not this track's alone.***

Already raised, unanswered, in
`planning/completed/feature_content-browser-safe-entry_2026-08-30.md`. Restated here because the
evidence has doubled since: the production build was broken across several commits while the SPA
gate stayed green, and the fix came from a person running it by hand.

Whether it is a suite, a hook or a wave exit criterion is a decision above this track.

### 4. A real browser, booting real Pyodide — *expensive, catches #3 and the rest of #6*

The one that needs new machinery. Everything about the worker is currently faked: jsdom has no
`Worker`, and Pyodide is ~10MB of wasm from a CDN. The `importScripts` bug was **unreachable by
construction** — no unit test could have found it, because no unit test starts a worker.

What it would cover, and nothing else can:

- The worker boots, loads Pyodide, and answers.
- `import turtle` resolves and `forward(100); right(90)` four times comes back as four strokes —
  the first end-to-end proof that the shim works at all, which today rests on the split being
  correct in two halves that have never met.
- Stop actually terminates a `while True:`. The whole of ADR 0003 is currently an argument.
- A learner program that raises keeps its partial drawing, through the real drain path rather
  than the reducer's.

Cost is real: a browser runner (Playwright), a network dependency, and a suite measured in tens
of seconds rather than milliseconds. It must be a **separate command** from
`vitest run --project web` — that gate is fast because it is hermetic, and slowing it down to
catch a class of bug it was never meant to catch would be a bad trade twice over.

## Known scope

- Tiers 1 and 2 are `apps/web` and `vitest.config.ts` — this track owns both.
- Tier 3 is a decision above this track; it touches whatever runs CI or hooks.
- Tier 4 is a new dev dependency, a new script, and probably a `spikes/` entry first to find out
  how slow a Pyodide boot really is on the parent's machine before committing to it.

## Trigger for promotion

**Tiers 1 and 2 on the next SPA plan**, whatever it is — they are hours, they are hermetic, and
they close two of the six.

**Tier 4 when Phase 5 lands**, because that is when Run and Submit both exist and the interesting
failures become the ones between them — a timeout that reads differently in the browser than in
the runner, which ADR 0003 names as a thing the two tracks must agree on and nothing currently
checks.

## The honest note

Every filter test written this session is real, and each one caught something. The lesson is not
that the discipline failed — it is that **a test proves what it looks at, and none of these were
looking at the browser.** Running the app is not optional, and until tier 4 exists it is the only
thing that covers what tier 4 would.
