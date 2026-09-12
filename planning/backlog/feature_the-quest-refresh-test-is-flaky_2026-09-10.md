---
kind: stub
status: open
date: 2026-09-10
---

# `quest-refresh.test.tsx` fails about one run in seven, and it has a name

**Status:** Backlog
**Date Discovered:** 2026-09-10
**Discovered During:** `wave-4_the-workflow-and-the-bootstrap_2026-09-10`, the final verification run

## Context

The last `npm test` of the wave reported:

```text
 Test Files  1 failed | 78 passed (79)
      Tests  1 failed | 1199 passed | 1 skipped (1201)

 FAIL  |web| src/quest/quest-refresh.test.tsx
   > the medals, after a passing submit > lights up Cleared without being reloaded
```

The same command had passed four times in the preceding twenty minutes, with the same tree.

**It is not this wave's doing.** `git diff --name-only main...HEAD -- pyquest/apps/web` is empty:
nothing on the branch touched the web app at all.

## What was measured

| Run | Result |
|---|---|
| full `npm test` | **1 failed** |
| the file alone, 3× | 1 failed, 2 passed |
| the file alone, 8× | 8 passed |
| the whole `apps/web` suite, 3× | 3 passed |

So roughly **two failures in fourteen attempts**, and it fails both in isolation and under full
load. That rules out the easy explanation — it is not simply contention when 79 files run at
once, because a lone three-run loop caught it too.

## Why it is worth its own item

`planning/backlog/feature_one-unidentified-api-suite-flake_2026-08-30.md` already exists and is
the same *class* of problem, but that one is in the **api** suite and, as its title says,
unidentified. This one is in the **web** suite and has a file, a describe block and a test name.
That is the difference between a note and something somebody can sit down and fix.

Both should probably be read together by whoever picks either up.

## Where to start

The test name is the clue: *"lights up Cleared without being reloaded"* is an assertion about the
UI reacting to a submit **without** a refetch, which is a race by construction — something has to
settle before the assertion looks. The usual causes, in the order worth checking:

- a `waitFor` with too short a window, or an assertion outside one
- a promise resolved in a microtask the test does not await
- a fake timer that advances past a real `setTimeout` the component uses

**Whatever the cause, do not fix it by widening a timeout.** A longer wait makes the failure
rarer without making it impossible, and this repository has already spent one plan
(`the-git-tests-stop-flaking`) learning that the thing to remove is the race rather than the
symptom.

## Trigger for Promotion

The next time it fails and costs somebody a confusing five minutes — or immediately, if the suite
is ever put in front of a gate that blocks on it. A flake nobody has named is noise; a flake
that fails a merge is a bug.
