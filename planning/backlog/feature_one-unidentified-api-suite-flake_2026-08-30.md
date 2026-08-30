# An unidentified flake in the api suite, seen once in fifteen runs

**Status:** Backlog
**Date Discovered:** 2026-08-30
**Discovered During:** planning/completed/feature_boss-pays-boss-rates_2026-08-30.md

## Context

While closing the boss-rate plan, one `npm test` run reported:

```
 Test Files  1 failed | 39 passed (40)
      Tests  1 failed | 660 passed (661)
```

The run before it and the fourteen runs after it were all green — eight further full-suite runs
and six `apps/api`-only runs. **The identity of the failing test was not captured**: that
invocation was piped through `tail -5`, so the failure name scrolled past before anything read
it, and it has not recurred since.

This stub exists because the honest state of the suite is "green, with one unexplained failure
on record", and that is worth writing down rather than rounding to green. It is filed with what
is actually known and no more.

## Known Scope

What is known:

- One test, one file, one run in fifteen. Everything else passed on that run.
- The api suite is the only one in the tree that touches a real Postgres — `scratch()` hands out
  a live client — so a transient connection, a pool timeout or cross-test row visibility are the
  plausible shapes. The engine suite is pure and cannot flake this way.
- It is **not** the boss-rate change reverting: the two tests that pin the boss rate were
  mutation-checked in both directions immediately before and after, and `pricedKind` reddens them
  on demand.

What is not known: which test, and whether it predates this plan's changes at all.

## Trigger for Promotion

Promote on the **second** sighting — at which point there are two data points and, if `npm test`
output is captured in full rather than tailed, a name to work from.

Until then the cheap mitigation is procedural rather than code: run the full suite with output
captured (`npm test 2>&1 | tee`) when closing a plan, so a one-in-fifteen failure arrives with
its own name attached instead of becoming this document.
