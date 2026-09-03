# A Submission Runs As The Worker, And The Worker Owns The Spool

**Status:** Backlog
**Date Discovered:** 2026-09-03
**Discovered During:** fixing the first real Submit through the containerised stack

## Context

`POST /submit` never reached the runner. The api creates the spool directories as uid 10003 and
the runner container runs as 10001 (`infra/compose/api.yml`), and `Spool.ensure()` called
`mkdirSync` with no mode — so `incoming/`, `running/`, `done/`, `repos/` and `work/` came out
`0755 api:api`. The handoff is a rename from `incoming/` into `running/`, which needs write on
both. The runner could list the job and could not claim it, logged nothing, and the SPA polled
`/api/jobs/1` until somebody gave up.

The fix was `chmodSync(path, 0o777)` — the same call the api's Dockerfile already makes one
directory up. **That is what makes this worth filing.** The runner has to write the spool for the
handoff to exist at all, and `sandbox.py` applies rlimits without dropping uid, so a learner's
submission runs *as the worker* and inherits everything the worker can write.

Until today the pipeline was broken, which closed this by accident. It is open now.

## What a submission can do from inside the sandbox

**1. Forge its own verdict.** `collectVerdicts` (`apps/api/src/dispatcher.ts`) reads every
`*.json` in `done/`, parses `{ jobId, status, result }`, looks the job up by id, and on `passed`
writes an `attempts` row and awards `cleared` with engine pricing. Nothing ties a verdict to the
worker that claimed it — no signature, no provenance, no check that the file was written by the
process holding the lease. A submission that writes

```json
{ "jobId": "<its own job id>", "status": "passed", "result": {} }
```

into `/spool/done/` passes a quest whose hidden tests never ran.

That is §6.3 inverted. Run and Submit are separate paths precisely because "hidden tests shipped
to the client are not hidden" — and the verdict is now forgeable from inside the sandbox those
tests were moved into.

**2. Read another job's hidden tests.** `dispatchOne` writes `content.read(payload.tests)` — the
test *source* — into the spool file. A submission can read `/spool/incoming/*.json` for any job
queued while it runs. Its own tests it is given anyway, and that is by design; another quest's
are not.

**3. Interfere with other jobs.** Write access to `incoming/` and `running/` means a submission
can delete or rewrite queued work, including the other player's.

`result` is also spread unvalidated into the `attempts.detail` JSON, so a forged verdict writes
attacker-shaped JSON into a table §3.5 keeps forever. Minor beside the above, but it is the same
missing check.

## Why the obvious mitigations do not work

**Signing the verdict does not help while the uid is shared.** Any secret the worker holds is in
the environment or the memory of a process running as the same user, so a submission can read it.
`test_a_submission_cannot_read_the_workers_environment` proves the *child's own* environment is
scrubbed; it does not prove that a same-uid process cannot read `/proc/<worker>/environ`. **Check
that before relying on it** — if it can, that test is narrower than its name suggests.

**Tightening the spool mode does not help either.** Whatever the worker can write, the submission
can write, because they are the same user. 0777, 0770-with-a-shared-group and
runner-owned-0700 are identical in effect until the uids differ.

## The fix

**Drop the submission to a uid of its own.** `sandbox.py:300` already uses `preexec_fn` — the one
hook that runs between fork and exec — to apply rlimits. Setting `os.setgid` then `os.setuid` to a
second unprivileged user there is the whole change in principle, and it is the only mitigation
that survives the submission being hostile.

What it drags in:

- A second user in `apps/runner/Dockerfile`, unprivileged and distinct from the worker's 10001.
- The per-job workspace under `/tmp` has to be writable by that user — the tmpfs is `mode=1777`,
  so a directory created by the worker needs a `chown` or a mode that lets the child write.
- Order matters: `setgid` before `setuid`, or the process has already lost the privilege it needs
  to change groups.
- `pids_limit` and `RLIMIT_NPROC` interact with a uid change; `RLIMIT_NPROC` counts processes
  **per uid**, so moving the submission to its own uid changes what that limit is actually
  counting. Re-derive the number rather than carrying it across.
- Once submissions are a different uid, put the spool back to runner-only and delete the 0777 —
  `Spool.ensure()` carries a note pointing here.

## Tests

`apps/runner/tests/test_sandbox.py` is the right home: it already asserts the container has no
network, the root filesystem is read-only, and the worker does not run as root, each by *doing*
the forbidden thing rather than by reading configuration.

- `test_a_submission_cannot_write_the_spool` — the direct one.
- `test_a_submission_cannot_read_another_jobs_tests` — reads `incoming/`.
- `test_a_submission_does_not_run_as_the_worker` — compares uids, so the mechanism is pinned and
  not only its consequence.
- Whether `/proc/<worker>/environ` is readable, which decides how much
  `test_a_submission_cannot_read_the_workers_environment` is really claiming.

**`runner-tests` has no spool mounted today** (`infra/compose/api.yml` gives it tmpfs and nothing
else), so the first two need `runner_spool:/spool` added to that service. Without it they would
pass by finding no directory at all, which is the failure mode this repository has been bitten by
before.

## How much this matters right now

Kitchen Table mode is one household on one desk, and §5.12 already makes AI-assisted work legal,
named and logged — so "he could cheat" is not the interesting part. The interesting part is that
§6.3's promise is that a verdict means something, and at Boss 7 he opens this repository and reads
how it was kept. A sandbox whose verdict can be written by the thing being judged is the kind of
detail this project has said out loud it will not hand-wave.

## Files

`pyquest/apps/runner/src/pyquest_runner/sandbox.py`, `pyquest/apps/runner/Dockerfile`,
`pyquest/apps/runner/tests/test_sandbox.py`, `infra/compose/api.yml`, and
`pyquest/apps/api/src/dispatcher.ts` (`Spool.ensure`, to narrow the mode again afterwards).
