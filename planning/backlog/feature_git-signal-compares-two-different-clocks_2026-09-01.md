# git-signal compares two different clocks

**Status:** Fixed 2026-09-01 in `planning/in-progress/feature_accounts-and-auth_2026-08-30.md`
Phase 0 — carried by the auth gate because it was api-track work in files that plan already
claimed. **The sketch below was half right:** set membership on the sha is the shape, but it has
to read the log's *position*, because only the tip is ever recorded and a re-submit would
otherwise pay for an unclaimed ancestor. No migration was needed — the sha was already in
`attempts.detail`.
**Track:** `api`
**Date Discovered:** 2026-09-01
**Discovered During:** `planning/**/feature_the-git-tests-stop-flaking_2026-08-31.md`
**Supersedes:** `planning/backlog/feature_gitsignal-tests-are-flaky_2026-08-31.md` — that stub
called it a flaky test. It is not. The test is right and the code is wrong.

## What is wrong

`gitsignal.ts` decides whether a learner has done something new by comparing two timestamps
that come from **two different machines**:

```ts
function newer(committedAt: string, since: string | undefined): boolean {
  ...
  return at > bound;      // at = git commit time, bound = attempts.attempted_at
}
```

- `committedAt` is written by **git, on the machine that made the commit** — the learner's.
- `since` is `attempts.attempted_at`, written by **`now()` in Postgres** — the parent's, via
  `store.ts:216`.

Nothing keeps those two clocks together, and the comparison is a bare `>`.

## The evidence

Measured on this machine, 2026-09-01:

```
host epoch ms      1788222433910
postgres epoch ms  1788222429978
                   postgres is ~5900 ms behind the host
```

So a commit made **almost six seconds before** an attempt was recorded still carries a
timestamp *after* it, and `newer()` returns true for history the learner did not touch.

That is exactly the observed failure. `server.gitsignal.test.ts` fails roughly one run in
seven with:

```
records a scar and pays nothing when the history does not carry the signal
  expected { state: 'passed' } to match { state: 'failed' }
```

The quest **paid out on stale history**. The test is correct; it is catching a real defect.

**Why it looked like a flake.** The failure tracks machine load, which is what sent the
original stub chasing a timeout. It is not a timeout — the file already has a 30-second
ceiling and still fails. Load changes the gap between the fixture's last push and the
attempt insert; when that gap is smaller than the clock drift, stale commits look fresh.
Three hypotheses were eliminated before the clocks were measured: test timeout, Postgres
`now()` returning transaction-start time (the test client is autocommit, no transaction),
and `since` arriving undefined (the query is a correct `to_char(... AT TIME ZONE 'UTC')`
with a deterministic `ORDER BY attempted_at DESC, id DESC`).

## Why this matters beyond the test

**§6.4 makes push the verification mechanism.** This is the code that decides whether a push
happened, and it can be wrong in the direction that pays.

In the real arrangement the two clocks are on two different physical machines — the API on
the parent's, the commits from the learner's laptop (§6.4, §739). A learner's clock running a
few minutes fast means **old commits count as new evidence indefinitely**, and a `git-signal`
quest clears without him doing anything. He does not need to intend it; laptops drift, and a
VM or a dual-boot can be out by hours.

It fails safe in the other direction too, which is its own problem: a learner whose clock is
*behind* pushes real work and is told `nothing has been pushed since the last time you asked`.

## Known Scope

The fix is to stop comparing clocks. The evidence is already sha-shaped:

- `SignalEvidence` **already carries `sha`**, and `attempts` could record the sha that
  satisfied it. "New" then means *a commit this quest has not already been shown* — a set
  membership question with no clock in it, and no way for a wrong clock to answer it wrongly.
- The `since` timestamp becomes a fallback for the first attempt only, or goes entirely.

Two smaller things to decide alongside:

- **Whether to keep a timestamp at all.** Tags and commits both have `committedAt`, and
  `newer()` is the only consumer.
- **Git commit timestamps are second-granularity.** Even between honest clocks the comparison
  loses sub-second precision, so a commit made in the same second as an attempt is already
  ambiguous today.

**Do not fix this by making the test tolerant.** The test is the only thing that noticed.

## Trigger for Promotion

- Before any `git-signal` quest is played for real. Area 2 is where they land, and Area 2 is
  authored — so this is due now rather than later.
- Or alongside `accounts-and-auth`, which is api-track work in the same files.

## Immediate mitigation, not a fix

Restarting `pyquest-postgres` resynchronises its clock and the failure goes away for a while.
That hides the bug rather than fixing it, and it was deliberately **not** done while
diagnosing, so the evidence above stayed reproducible.
