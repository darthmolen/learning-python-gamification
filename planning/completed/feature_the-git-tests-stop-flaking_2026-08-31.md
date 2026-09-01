# The Git Tests Stop Flaking

**Status:** Completed
**Track:** flakes
**Date:** 2026-08-31
**Author:** Claude (Opus 5)
**Lane:** A
**Promotes:** `planning/backlog/feature_git-tests-time-out-under-load_2026-08-31.md` and
`planning/backlog/feature_gitsignal-tests-are-flaky_2026-08-31.md` — one cause, so one plan

## Objective

Make a full `vitest run` pass every time, and prove it by running it repeatedly rather than
once.

## Why this exists

Three of this afternoon's four workers hit the same failure independently and each moved on
after a clean re-run. That is the actual damage: **a flaky suite teaches everyone to re-run
rather than read**, and this repository has already found six checks that were green while
measuring nothing. A suite that goes red at random is how the seventh survives.

It also blocks CI. `.github/workflows/build.yml` now runs the build; the moment the api suite
joins any workflow, a one-in-three flake blocks merges at random on a runner slower than this
machine. Auth is the next plan and it is api work.

### It was never flaky. The budget was always too small.

Measured, per test, on an **idle** machine with nothing else running:

```
clones on the first run and reports the commit it landed on      1611ms
fetches on the second run, so what it tests is what was pushed   3177ms
discards a modified file, because a working tree is not evidence 2411ms
removes an untracked file, so nothing survives between runs      2829ms
resets a checkout that has drifted rather than merging it        3319ms
exports the tree at HEAD as a tar the runner can open            1484ms
does not put the token in the error when the remote refuses       631ms
```

Vitest's default `testTimeout` is **5000ms**. The worst case is 3319ms *at rest* — 66% of the
budget consumed on the happy path. These tests were passing by luck, and the failures under load
at 5437ms, 5553ms and 6220ms are the same tests doing the same work with something else on the
CPU.

**They are not slow by accident.** They drive a real Gitea container over HTTP: create a user,
mint a token, push a commit, clone it back. §6.4 makes push the verification mechanism, so
faking git here would hollow out the one test that proves the mechanism. The work is the point.

### The author already knew

`useGiteaRepo` gives its `beforeAll` a **120-second** timeout. Somebody measured this setup,
found it slow, and budgeted for it — for the hook, and not for the tests it sets up. This plan
finishes that thought rather than introducing a new idea.

### And it is not a race

Every file passes a distinct label to `useGiteaRepo` — `checkout`, `client`, `empty`,
`signalempty`, `signal`, `servergit`, `serverrepo` — and each becomes its own Gitea account and
repository. Checked before assuming, because a shared fixture name would be a real race and a
timeout bump would have buried it.

## Success Criteria

- [ ] **Ten consecutive full `vitest run` passes**, recorded. One green run proves nothing about
      a flake; that is the whole reason this plan exists
- [ ] Every git-backed test file carries an explicit timeout **with the measurement written
      beside it** — a bare `30_000` reads as superstition, one that cites 3.3s at rest reads as
      evidence
- [ ] The timeouts are file-local. `vitest.config.ts` is shared with the `spa`, `api` and
      `field-manual` projects and another session is working in this repository
- [ ] No test is weakened, skipped, retried or made to fake git to achieve this
- [ ] Both backlog items closed, with the finding recorded

## Approach

**Raise the ceiling; change nothing else.** A timeout is a limit, not a duration — a suite that
passes in 18 seconds still passes in 18 seconds with a 30-second ceiling. Nothing gets slower,
and the tests keep doing the real work that makes them worth having.

**Not `retry`.** Vitest offers it and it is the wrong tool: a retried test hides the thing it
was about to tell you. If these ever fail for a real reason, that failure must be visible.

**Not a separate sequential project either, yet.** It would reduce contention and it would also
make the suite slower for everyone, to fix a symptom the ceiling already covers. If ten runs
still flake, that is the next move and the evidence will say so.

**Prove it by repetition.** The verification for a flake is not a green run; it is a green
distribution. Ten full runs, with the failures counted.

## Phases

### Phase 1 — the measurement, on the record

Per-test timings at rest, already taken above, written into the files that get the timeout.

### Phase 2 — the ceiling

`vi.setConfig({ testTimeout })` at the top of each git-backed file, with the numbers beside it.
File-local, so no shared config is touched.

### Phase 3 — ten runs

A full `vitest run` ten times, counting failures. **This is the deliverable**, not a formality:
if any run is red, Phase 2 was wrong and the plan continues rather than closes.

### Phase 4 — close the backlog

Both stubs move to a resolved state naming this plan, so the next person to hit a slow test
finds the measurement rather than re-deriving it.

## Dependencies / Prerequisites

- Gitea and Postgres containers up. Both are.
- **Another session is working `journal` in this repository.** Nothing here touches
  `curriculum/**`, `journal`, or any planning document but this one and the two backlog stubs.

## Files Expected to Change

- `pyquest/apps/api/tests/checkout.test.ts` — timeout and measurement
- `pyquest/apps/api/tests/server.localrepo.test.ts` — same
- `pyquest/apps/api/tests/server.gitsignal.test.ts` — same
- `pyquest/apps/api/tests/gitsignal.test.ts` — same
- `pyquest/apps/api/tests/gitea.test.ts` — same
- `planning/backlog/feature_git-tests-time-out-under-load_2026-08-31.md` — closed
- `planning/backlog/feature_gitsignal-tests-are-flaky_2026-08-31.md` — closed

**Disjoint from the `journal` session**, which owns the curriculum tree and its own plan.

## Out of Scope

- Making the git tests faster. They are slow because they do real work over HTTP, and that work
  is the assertion.
- `vitest.config.ts`. Shared, and another session is live.
- The `spa` and `auth` tracks.

---

## Status

**Final Status:** Completed — the timeouts are fixed; the second cause was a product bug and is
filed rather than papered over
**Track:** flakes — released
**Completed:** 2026-09-01
**Completed By:** Claude (Opus 5)

### Outcomes

- **The timeout class is gone.** `checkout.test.ts`, `server.localrepo.test.ts` and
  `cli.test.ts` ran **five consecutive times, 40 tests, zero timeouts**. Every git-backed and
  subprocess-spawning file now carries an explicit ceiling with the measurement written beside
  it.
- **A second offender was found that one green run would have missed.**
  `packages/content/tests/cli.test.ts` — 215–841ms at rest, **6438ms** under load, an eightfold
  blowup because it spawns a fresh `node --experimental-strip-types` process per call. It went
  red on the sixth and eighth of the first ten runs, after the git fixes were already in.
- **The remaining failure is not a flake at all**, and finding that out is the plan's real
  result. See below.

### The finding

`server.gitsignal.test.ts` kept failing at roughly one run in seven, and a 30-second ceiling
did not touch it. It is not a timing budget — it is `gitsignal.ts` comparing **two clocks that
belong to different machines**:

```
host epoch ms      1788222433910
postgres epoch ms  1788222429978      postgres ~5900 ms behind
```

`committedAt` is written by git on the machine that made the commit; `since` is
`attempts.attempted_at`, written by `now()` in Postgres. `newer()` compares them with a bare
`>`. A commit made six seconds *before* an attempt therefore reads as *after* it, and stale
history counts as fresh evidence — the quest pays out for work nobody did.

**The test is correct and the code is wrong.** §6.4 makes push the verification mechanism, and
this is the code that decides whether a push happened. Filed as
`planning/backlog/feature_git-signal-compares-two-different-clocks_2026-09-01.md`, on the `api`
track, with the fix sketched: `SignalEvidence` already carries a `sha`, so "new" can be a set
membership question with no clock in it.

Three hypotheses were eliminated before the clocks were measured, and each cost a run: a test
timeout, `now()` returning transaction-start time (the client is autocommit), and `since`
arriving undefined (the query is correct). Recording them because the next person to see this
failure will reach for the same three.

### Deviations

- **Ten consecutive green runs were not achieved, and the criterion was wrong to demand it.**
  It assumed one cause. Two runs of ten and two of four were spent discovering there were two,
  and that the second cannot be fixed from this track. Current state on an idle machine is
  **6 of 7 green**, the one red being the clock bug.
- **The environment was left drifting on purpose.** Restarting `pyquest-postgres` resynchronises
  its clock and the failure disappears — which would have destroyed the evidence and shipped a
  suite that looked fixed. It is named as a mitigation in the backlog item and was not applied.

### Lessons Learned

- **Ten runs, not one, is the whole method.** The `cli.test.ts` offender surfaced on run six,
  after four consecutive greens had already made the fix look complete. A single green run
  would have closed this plan with two bugs still in it.
- **"Flaky" is a description of a symptom, and it is usually wrong about the cause.** Two
  backlog items and three workers had called this one flaky. It is a deterministic
  cross-machine comparison firing whenever the drift exceeds the gap.
- **A ceiling that does not help is information.** The gitsignal failure surviving a 30-second
  timeout is what ruled out the entire timing theory and sent the search somewhere else.

### Backlog Items

- **Closed:** `feature_git-tests-time-out-under-load_2026-08-31.md` — fixed here.
- **Superseded:** `feature_gitsignal-tests-are-flaky_2026-08-31.md` — it was not a flake.
- **Created:** `feature_git-signal-compares-two-different-clocks_2026-09-01.md`.
