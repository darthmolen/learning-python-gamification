# server.gitsignal.test.ts fails intermittently

**Status:** Superseded 2026-09-01 by `planning/backlog/feature_git-signal-compares-two-different-clocks_2026-09-01.md`
**Why:** this stub diagnosed a flaky test. It is a deterministic bug — `gitsignal.ts` compares a git commit timestamp from one machine against `now()` from another, and Postgres here runs ~5.9s behind the host. A 30-second ceiling did not touch it. The test was right all along.
**Date Discovered:** 2026-08-31
**Discovered During:** `planning/completed/feature_curriculum-foundation_2026-08-31.md`

## Context

Two tests in `pyquest/apps/api/tests/server.gitsignal.test.ts` fail intermittently:

- `records a scar and pays nothing when the history does not carry the signal`
- `does not pass a second time on history it has already been shown`

Always those two, always together. Observed three times across this branch, at roughly one run
in four. Not caused by the curriculum move — the first sighting was during phase 2
verification, before this branch touched anything the api reads at runtime.

**It is not a test-ordering problem, which is the interesting part.** The obvious theory was
interference from a sibling suite sharing the database. But it has now failed in isolation and
passed in the same full run minutes later, and passed three consecutive isolated runs after
that. Ordering does not explain both directions; something stateful and time-dependent does.

Both tests concern git history — a temporary repository, commits made during the test, and a
signal read back out of the log. Likely candidates, in the order worth checking:

1. **Filesystem or git timing on Windows.** Two commits made in the same second can order
   unstably in `git log`, and "the history it has already been shown" is precisely a test about
   which commit came first.
2. Leftover state in a scratch repository not cleaned between runs.
3. Database rows surviving `beforeEach` in a way the other suites do not exercise.

## Known Scope

Reproduce first — a loop of twenty isolated runs should catch it a few times and say whether
the failure message is stable:

```bash
cd pyquest
for i in $(seq 20); do npx vitest run apps/api/tests/server.gitsignal.test.ts --project api; done
```

**A flaky test is worse than a missing one**, because it teaches everyone to re-run rather than
read. This repository has already found three gates that were green while measuring nothing;
a gate that is red at random trains exactly the habit that lets those survive.

## Trigger for Promotion

- Any api-track work that opens this file.
- Any time someone re-runs the suite "because that one is flaky" — that sentence being said out
  loud is the signal.
- Before CI ever runs the full suite. Today the workflow runs `validate:content` and the
  field-manual gate only, so this has never blocked a deploy; the moment the api suite joins
  CI, a one-in-four flake blocks merges at random.
