# The git-backed api tests time out under full-suite load

**Status:** Closed 2026-09-01 — fixed by `planning/completed/feature_the-git-tests-stop-flaking_2026-08-31.md`
**Date Discovered:** 2026-08-31
**Discovered During:** the `PLAYER_ID` fix on the `spa` track; independently hit by both the
`db` and `infra` agents the same afternoon

## Context

`apps/api/tests/checkout.test.ts` and `apps/api/tests/server.localrepo.test.ts` fail
intermittently in a **full** `vitest run`, and pass every time in isolation. The failures are
always the same shape:

```
Error: Test timed out in 5000ms.
  × fetches on the second run, so what it tests is what was pushed        6220ms
  × exports what was pushed, not the checkout it already had (§6.4)       5437ms
  × exports the pushed bytes, not the ones sitting in the api's own …     5553ms
```

**Just over the line, every time.** Vitest's default `testTimeout` is 5000ms and these tests
shell out to real `git clone`, `git fetch` and `git archive` against a scratch repository. Under
the parallel load of the full suite they take five and a half to six and a half seconds.

**It is ambient, not caused by any one change.** Measured directly: with the `PLAYER_ID` change
applied, 3 failures; with the same change stashed, **8** — on the same machine, minutes apart.
The count tracks how busy the machine is, not what the code says. All three of the afternoon's
workers hit it independently and none could reproduce it in isolation.

## Why it is worth fixing rather than tolerating

**A flaky test is worse than a missing one**, because it teaches everyone to re-run rather than
read. This repository has already found six checks that were green while measuring nothing; a
suite that goes red at random trains exactly the habit that lets those survive. Two agents this
afternoon reported the same failure and both — reasonably — moved on after a clean re-run.

It also blocks CI. `.github/workflows/build.yml` now runs the build, and the moment the api
suite joins any workflow a one-in-three flake blocks merges at random on a runner that is slower
than this machine.

## Known Scope

The straightforward reading is that a 5-second budget is simply wrong for a test that does real
git I/O, and the fix is a per-test or per-file `testTimeout`. Before reaching for that, the
question worth asking once: **should these tests be doing real git at all?**

- They are testing the checkout's *behaviour against a real repository* — that a second run
  fetches, that a dirty working tree is discarded, that what is exported is what was pushed.
  §6.4 makes push the verification mechanism, so faking git here would hollow out the one test
  that proves the mechanism.
- So the answer is probably yes, they should, and the timeout is what is wrong.

Options, cheapest first:

1. A generous explicit timeout on the git-backed files — `{ timeout: 30_000 }` — and a comment
   saying why they are allowed to be slow.
2. Run them in their own vitest project, sequenced rather than parallel with everything else.
3. `poolOptions` to stop these files sharing workers with the DOM-heavy `web` suite.

Whichever is chosen, **note the measurement in the file**, the way the field-manual workflow
records why its content build step exists. A bare `timeout: 30000` reads as superstition; one
that says "real git clone under full-suite load measured at 5.4–6.2s" reads as evidence.

## Trigger for Promotion

- Before the api suite joins any CI workflow. That is the moment this stops being an annoyance.
- Or the next time somebody re-runs the suite "because those are flaky" — that sentence being
  said out loud is the signal.

Related: `planning/backlog/feature_gitsignal-tests-are-flaky_2026-08-31.md` describes
`server.gitsignal.test.ts` failing about one run in four. Same directory, same kind of I/O, and
quite possibly the same cause — worth investigating together rather than separately.
