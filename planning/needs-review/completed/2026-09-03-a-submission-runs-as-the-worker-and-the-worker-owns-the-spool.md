# A Submission Runs As The Worker, And The Worker Owns The Spool

**Status:** Planned — queued for review before execution
**Track:** `main`
**Date:** 2026-09-03
**Author:** Claude (Opus 5)
**Lane:** A
**Promoted from:** `planning/backlog/feature_a-submission-runs-as-the-worker_2026-09-03.md`,
filed 2026-09-03 while fixing the first real Submit through the containerized stack
**Track is `main` rather than `runner`:** the file set crosses `apps/runner/**`,
`apps/api/Dockerfile`, `apps/api/src/dispatcher.ts` and `infra/compose/api.yml`. Three tracks'
worth of files, one indivisible change — the uid drop and the spool mode are the same fix, and
splitting them ships a window where the spool is narrowed against a submission that is still the
worker

## Objective

Make a learner's submission run as a user of its own, so that it cannot write the spool, read
another job's hidden tests, or forge a verdict for a job that is not its own.

---

## What the spike settled before this plan was written

The backlog item proposed `os.setuid` in `preexec_fn` and listed what it would drag in. **Two of
its assumptions are wrong and one of its open questions has a bad answer.** All three were
measured against `pyquest-runner:local` on this machine, not reasoned about.

### 1. `cap_add` does not work while the container user is non-root

The obvious minimal change — keep `user: "10001:10001"`, add `cap_add: [SETUID, SETGID]` — does
not work. Docker puts the capability in the **bounding** set only; without it in permitted or
ambient, `exec` clears it and the process never holds it.

| Config | `CapPrm` | `CapBnd` | `os.setuid(10002)` |
|---|---|---|---|
| `user: 10001`, `cap_drop: ALL` (today) | `0000…0000` | `0000…0000` | `PermissionError [Errno 1]` |
| `user: 10001`, `cap_add: [SETUID, SETGID]` | `0000…0000` | `0000…00c0` | `PermissionError [Errno 1]` |
| `user: 0:0`, `cap_add: [SETUID, SETGID]` | `0000…00c0` | `0000…00c0` | **OK → uid 10002** |

`0xc0` is bits 6 and 7 — `CAP_SETGID` and `CAP_SETUID`, and nothing else.

**So the runner's PID 1 has to be uid 0 inside the container.** There is no configuration that
keeps a non-root PID 1 and still lets it hand a child a different uid: `no-new-privileges` closes
the setuid-binary route by design, unprivileged user namespaces do not give us a second uid to map
to, and a helper container has no channel to be asked through under `network_mode: "none"`.

This inverts an existing asserted property, and that is the decision this plan is really asking
for — see **The trade this plan is making** below.

### 2. `/proc/<worker>/environ` is readable at the same uid, and `DATABASE_URL` was in it

The backlog item flagged this as "check that before relying on it". Checked, inside the runner
image, uid 10001, `cap_drop: ALL`, `no-new-privileges`, with the planted credential the suite
already uses:

```
child uid 10001 pid 1
[('7', 'READ DATABASE_URL FOUND')]
```

A sibling process's whole environment, read by a process with no privileges at all.
`test_a_submission_cannot_read_the_workers_environment` is therefore **materially narrower than
its name**: it proves `_child_environment` builds the child's own environment rather than
inheriting one, which is true and worth keeping, and it proves nothing about what the child can
read back out of `/proc`. The name has to change or the test has to grow. It gets both.

This also closes the "sign the verdict" alternative for good. Any key the worker holds is in the
memory or the environment of a process the submission can read while the uid is shared.

### 3. Exit-code forgery is in-process, and this plan does not fix it

Every authored hidden test executes the submission **inside the pytest process**:

```
curriculum/area-0/exercises/name-tag/hidden/test.py:13:  runpy.run_path("solution.py", run_name="__main__")
```

`job.py` grades the job on pytest's exit code. A `solution.py` containing `os._exit(0)` therefore
returns `PASSED` without a single assertion running, and **no uid, mode or capability change
touches that** — the forging code and the grading code are the same process by construction.

Fixing it would mean the hidden tests stopped running the submission in-process, which is every
authored test in the repository. It is a real hole, it is a different hole, and pretending this
plan closes it would be the hand-wave the backlog item's last section says this project will not
do. Filed, named, and stated in the threat model rather than quietly left out.

---

## The threat model this plan commits to

Stated up front, because the scope is only coherent with it.

**In scope — a submission must not affect anything outside its own job.** It must not write the
spool, read another job's hidden tests, delete or rewrite another player's queued work, forge a
verdict against another player's job id, or read the worker's memory or environment.

**Out of scope — a submission can still cheat its own job.** `os._exit(0)` returns a pass. §5.12
already makes AI-assisted work legal, named and logged, and Kitchen Table mode is one household at
one desk, so "he could pass a quest he did not earn" was never the interesting failure. The
interesting failure is that §6.3's promise — a verdict means something — currently breaks for
*other people's* verdicts, which is the part a boundary can actually hold.

That distinction is the plan. It is also the sentence that should end up in `sandbox.py`'s
module docstring.

---

## The trade this plan is making

`test_the_runner_does_not_run_as_root` exists and passes today. After this change the **worker**
runs as uid 0 in the container, and that test's premise is gone.

What replaces it is not weaker, but it is different, and it deserves to be argued with:

| Today | After |
|---|---|
| Worker: uid 10001, zero capabilities | Worker: uid 0, exactly `CAP_SETUID` + `CAP_SETGID` |
| Submission: **uid 10001 — the worker** | Submission: uid 10002, zero capabilities, no saved-uid route back |
| Spool: `0777`, submission can write it | Spool: `2770 root:spool`, submission is not in the group |
| Submission can read the worker's `/proc` | Different uid, so it cannot |

Everything else is untouched: `network_mode: "none"`, `read_only: true`, `mem_limit`,
`pids_limit`, `no-new-privileges`, the tmpfs, and every rlimit.

**Why this is the right way round.** The worker is our own code, four modules long, parsing JSON
the api wrote. The submission is a child's unreviewed program, and it is the thing the whole
container exists to contain. Given a choice about which of the two holds two capabilities, it
should not be the one we did not write. A container root with `cap_drop: ALL` except two, a
read-only root filesystem, no network and no new privileges is a narrower thing than "root"
usually means, and Phase 6 takes the one attacker-influenced parse out of it as well.

**The alternative, named so the reviewer can insist on it.** PID 1 stays root and does nothing but
fork on request; an unprivileged supervisor at 10001 does all the parsing and talks to it over a
pipe. That is strictly better and it is a second process, a protocol and a lifecycle for a
household running two players. Recommended against for now, and it is the shape to reach for if
the worker ever grows past four modules.

---

## Success Criteria

- [ ] A submission runs as uid 10002 and the worker as uid 0 — asserted by comparing them, so the
      mechanism is pinned and not only its consequence
- [ ] A submission cannot write `/spool`, cannot list `/spool/incoming`, and cannot read a file
      planted there
- [ ] The worker holds exactly `CAP_SETUID` and `CAP_SETGID` and nothing else, asserted from
      `/proc/self/status` so that widening the compose file breaks a test
- [ ] `runner-tests` mounts `runner_spool:/spool` — **without this the spool tests pass by finding
      no directory**, which is the failure mode this repository has been bitten by before
- [ ] The privilege drop **fails closed**: if it cannot happen, the job is answered `killed` with a
      loud log, and never runs as the worker
- [ ] `test_a_submission_cannot_read_the_workers_environment` is renamed to what it actually proves,
      and a new test covers the `/proc` route the spike found open
- [ ] Every existing test in `tests/test_sandbox.py` still passes, now against the dropped uid
- [ ] `0777` is gone from `dispatcher.ts` and from `apps/api/Dockerfile`
- [ ] The api refuses to start against a spool root it cannot secure, naming the fix in the message
- [ ] Ruff and pyright clean; `npm test` and `npm run typecheck` clean

---

## Approach

### The runner's PID 1 becomes root with exactly two capabilities

`infra/compose/api.yml`, both the `runner` and `runner-tests` services:

```yaml
user: "0:0"
cap_drop:
  - ALL
cap_add:
  - SETUID
  - SETGID
security_opt:
  - no-new-privileges:true
```

`Dockerfile` keeps `USER runner`, so the image run bare is still unprivileged and fails loudly
rather than silently running a submission as the worker. Compose overrides it for these two
services and says why in a comment carrying the table above.

### The child becomes uid 10002, and the order is the whole of it

`_apply_limits` becomes the place where the process stops being the worker. The sequence, and each
line is here because moving it breaks something:

```python
os.setgroups([])                    # BEFORE setuid — needs CAP_SETGID, and root's
                                    # supplementary groups (including gid 0) survive
                                    # setresgid otherwise. This is the classic hole.
os.setresgid(gid, gid, gid)         # real, effective AND saved
os.setresuid(uid, uid, uid)         # saved too, so there is no route back
# ... every setrlimit, AFTER the drop ...
os.setsid()
```

- **`setgroups` first, and it is not in the backlog item's list.** `setresgid` alone leaves the
  child holding root's supplementary groups; a child in group 0 walks straight through a
  `0770 root:spool` directory. Dropping the list needs `CAP_SETGID`, so it cannot be done after
  `setresuid`.
- **`setres*` rather than `set*`.** From root, `setuid` does set the saved uid too, so plain
  `setuid` would be correct — `setresuid` says so in the source instead of relying on a reader
  knowing that rule.
- **rlimits after the drop, not before.** `setuid` fails with `EAGAIN` when the target uid is
  already at its `RLIMIT_NPROC`, so setting the limit first couples the privilege drop to a
  leftover process from a previous job. Nothing here needs privilege to lower a limit.

The identity is a small frozen dataclass beside `Limits` rather than a field on it — `Limits` is
documented as "the whole boundary, as numbers", and a uid is an identity:

```python
@dataclass(frozen=True, slots=True)
class Identity:
    uid: int
    gid: int

DEFAULT_IDENTITY = Identity(uid=10002, gid=10002)   # apps/runner/Dockerfile creates this user
```

`run_sandboxed(..., identity: Identity | None = DEFAULT_IDENTITY)`. `None` means "do not drop" and
exists only for a host that cannot; it is never the default.

### The drop fails closed, loudly

`_apply_limits` runs between `fork` and `exec`, where its own docstring already says nothing may
raise for an ordinary reason. A failed `setresuid` is not an ordinary reason — it is the boundary
not existing — and the child must not start.

- `run_sandboxed` refuses before forking when an `Identity` is requested and `os.getuid() != 0`,
  raising with a message that names the compose keys. A wrong host config is then one clear error
  rather than every job silently running as the worker.
- A `preexec_fn` that raises surfaces in the parent as `subprocess.SubprocessError`, which
  `worker.poll_once` does **not** catch today — its `except` covers `(OSError, ValueError,
  tarfile.TarError)`. Add `subprocess.SubprocessError` so the job is answered `killed` with
  "the sandbox could not drop privilege" rather than taking the loop down.
- The exact exception type CPython re-raises for a `preexec_fn` failure is version-dependent.
  **Assert it in a test rather than reading the source** — seed a failing drop and confirm the
  verdict is `killed` and the loop survives.

### The workspace has to be handed over

The worker creates the per-job directory and lays the job out; the child at 10002 has to be able
to write it. As root the worker can `os.chown` it, and the chown must happen **after** the layout
— `_unpack_repository` and both `write_text` calls — or the extracted tree stays root-owned.

Two ownership gotchas that will otherwise cost an evening each:

- **`/tmp/pyquest-work` must be traversable.** In production `Spool.ensure()` creates it `0755`,
  which is fine. In the suite the fixture uses `tempfile.TemporaryDirectory()`, which is **`0700`
  and now root-owned**, so the child cannot even `chdir` into a workspace beneath it. The fixture
  needs `os.chmod(root, 0o711)`. Every test in the file goes red without it, for a reason that has
  nothing to do with what they assert.
- **`.stdout` and `.stderr` need no chown.** `run_sandboxed` opens them in the parent and passes
  the descriptors down; write access is checked at `open`, and the worker reads them back as root
  afterwards. Leave them root-owned — the child having no handle on the files its output lands in
  is a small bonus.

### The spool narrows to a group the submission is not in

A shared gid, which is the answer `apps/api/Dockerfile:65` already reaches and files rather than
does. Not `0700`-relying-on-the-worker-being-root: that would make the spool silently insecure the
day somebody un-roots the runner, and the group encodes the intent instead.

- `addgroup -g 10004 spool` in **both** Dockerfiles.
- api is `adduser -D -u 10003 -G spool api`; runner is `adduser -D -u 10001 -G spool runner`.
- The submission user is created and is **not** in it:
  `addgroup -g 10002 submission && adduser -D -u 10002 -G submission -H -s /sbin/nologin submission`.
  It is created rather than left as a bare number so that `getpwuid` in the child does not raise —
  `HOME` is set explicitly, but a `KeyError` out of the standard library would surface to a learner
  as a mystery.
- `apps/api/Dockerfile`: `chown 10003:10004 /spool && chmod 2770 /spool`. The setgid bit is what
  makes every directory the api creates underneath inherit group `spool` without hardcoding a gid
  in TypeScript.
- `dispatcher.ts` `Spool.ensure()`: `chmodSync(path, 0o2770)`, and the `0777` paragraph is rewritten
  to describe what is true.
- `worker.py` `Spool.ensure()` runs as root and can win the race on first boot, creating
  `root:root 0755` directories the api cannot write. It sets `os.chown(path, 10001, 10004)` and
  `os.chmod(path, 0o2770)` — module constants, commented as mirroring the Dockerfile, the way the
  four directory names already mirror `dispatcher.ts`.

### An existing volume keeps its old ownership, and that is a live hazard

Docker seeds a named volume from the image at first creation only. An existing `pyquest_runner_spool`
is `0777` at its root, and **write permission on `/spool` lets the submission rename or remove
`done/` regardless of what mode `done/` itself carries.** Narrowing the children is not enough.

`Spool.ensure()` cannot fix it — the api does not own a root the volume created as `root:root`.
So the api **checks and refuses**: on startup, if the spool root is group- or world-writable, exit
with a message naming `docker volume rm pyquest_runner_spool`, the way `infra/README.md` already
documents for the original `EACCES`.

Bricking the household stack on upgrade is a real cost and it is deliberate — a stack that boots
with a `0777` spool boots with this plan's whole point undone, and silently. **Flagged for the
reviewer as the one judgment call here.** A one-time human action goes to `set-reminders`.

### `RLIMIT_NPROC` counts per uid, so the number is re-derived rather than carried

`RLIMIT_NPROC` counts processes **owned by a uid**, container-wide. Today the child shares uid
10001 with the worker, so the worker's own processes eat into the child's 64. After the change the
child gets a private budget at uid 10002 and the worker's are counted elsewhere — the limit gets
*looser* in effect while the number stays the same.

64 stays defensible (`pids_limit: 256` still backstops the container), but the fork-bomb tests are
the evidence, not this paragraph: re-run `test_a_fork_bomb_does_not_take_the_machine_with_it` and
`test_spawning_processes_in_a_loop_is_bounded` and adjust the number if the timing moved.

### The untar moves out of the root process

`_unpack_repository` opens a tar built by `git archive` from a commit the learner pushed. It is the
only attacker-influenced parse in the worker, and after this change the worker is root.
`filter="data"` already refuses absolute paths, traversal, symlinks out of the tree, devices and
setuid bits, so this is depth rather than a hole — but root plus tar is a pairing worth not having.

The extraction runs in a `fork()`ed child that drops to the submission identity first, and the
parent waits on it. The extracted tree then lands owned by 10002, which is where the chown was
going anyway. Non-zero exit becomes the `ValueError` `poll_once` already answers as `killed`.

Last phase, and severable: if it turns out to be more than it looks, drop it to a backlog item and
ship the rest. The uid drop is the plan; this is the part that makes the remaining root smaller.

---

## Tests

`apps/runner/tests/test_sandbox.py`, which already attacks the boundary by *doing* the forbidden
thing rather than reading configuration. Following `test-filter-development`: RED with the failure
output captured, GREEN, then a seeded mutant that the suite must catch.

**New:**

| Test | Asserts |
|---|---|
| `test_a_submission_does_not_run_as_the_worker` | child uid ≠ `os.getuid()` of the worker. The mechanism, not a consequence |
| `test_a_submission_cannot_write_the_spool` | `open("/spool/incoming/x", "w")` fails |
| `test_a_submission_cannot_list_the_spool` | `os.listdir("/spool/incoming")` fails |
| `test_a_submission_cannot_read_another_jobs_tests` | a probe file planted by the suite is unreadable |
| `test_a_submission_cannot_read_the_workers_proc` | `/proc/<worker>/environ` denied — the spike's finding, inverted |
| `test_the_worker_holds_only_setuid_and_setgid` | `CapEff` from `/proc/self/status` is exactly `…00c0` |
| `test_a_job_whose_privilege_drop_fails_is_killed` | fail-closed, and the loop survives (in `test_job.py`) |

**Changed:**

- `test_the_runner_does_not_run_as_root` → `test_a_submission_does_not_run_as_root`. Same assertion,
  a name that is true after the worker becomes uid 0.
- `test_a_submission_cannot_read_the_workers_environment` → `..._cannot_inherit_the_workers_environment`.
  It proves `_child_environment` builds rather than inherits, which is worth keeping under a name
  that claims it. The `/proc` route gets its own test above.

**The probe file, and why it is not a `.json`.** `test_a_submission_cannot_read_another_jobs_tests`
needs a known file in `incoming/` or it passes against an empty directory. The suite plants
`probe-<pid>.txt` in a `try/finally` — deliberately not `*.json`, so that a live runner's `_claim`
glob can never pick it up if the stack happens to be running. The property under test is read
permission on the directory, which the extension has nothing to do with.

**`runner-tests` needs the spool mounted.** It has `tmpfs` and no `volumes:` today, so all four
spool tests would pass by finding no directory at all. Add `runner_spool:/spool`. Mounting the
**real** volume rather than a fresh one is deliberate: a new volume would be seeded `root:root 0755`
from an image with no `/spool`, which is not the mode production has, and the suite would assert
against a boundary nobody uses. Every spool assertion is a negative one and the suite writes
nothing to `/spool` from the test process except the probe it removes.

**The mutants, named in advance:**

1. Comment out `os.setresuid` → `test_a_submission_does_not_run_as_the_worker` **and** all four
   spool tests must go red. If only the first does, the spool mode is doing the work and the uid
   drop is untested.
2. Comment out `os.setgroups([])` → the spool tests must go red, because the child keeps gid 0.
   This is the mutant that proves the line nobody would have written.
3. Put `chmodSync(path, 0o777)` back in `dispatcher.ts` → the spool write test must go red.
4. Widen `cap_add` with `CAP_CHOWN` → `test_the_worker_holds_only_setuid_and_setgid` must go red.

---

## Phases

### Phase 1 — the suite can see what it is asserting about

Mount `runner_spool:/spool` on `runner-tests`. Write the four spool tests and
`test_a_submission_cannot_read_the_workers_proc`. **Capture the RED output** — they must fail
because the submission *can* do these things, not because the directory is absent. Confirm the
distinction in the failure text before going on; this is the step the whole plan's honesty rests on.

### Phase 2 — the privilege drop

`user: "0:0"` and `cap_add` on both services. `Identity`, the `setgroups`/`setresgid`/`setresuid`
sequence, rlimits reordered after it, the pre-fork guard, and `subprocess.SubprocessError` in
`poll_once`. Fix the fixture's `0o711`. Phase 1's tests go green; every existing test in the file
must stay green, now against uid 10002.

### Phase 3 — the workspace handover

`chown` the laid-out workspace to the identity, after `_unpack_repository` and both `write_text`
calls. Re-run the whole suite — a `local-repo` job is the case that breaks if the order is wrong.

### Phase 4 — the spool narrows

The `spool` group in both Dockerfiles, the submission user, `2770` in place of `0777` in
`dispatcher.ts`, `apps/api/Dockerfile` and `worker.py`. The api's startup refusal and its message.
Recreate the volume and bring the stack up. Seed mutants 1–4 and confirm each is caught.

### Phase 5 — the names stop overclaiming

Rename the two tests. Rewrite `sandbox.py`'s module docstring to carry the threat model — what the
boundary holds and what it explicitly does not.

### Phase 6 — the untar drops privilege first

Severable. Fork-and-drop around `_unpack_repository`.

### Phase 7 — the record

`infra/README.md` (the new volume-recreation step and why), the `Spool.ensure()` comment in
`dispatcher.ts` (repointed from the backlog stub to this plan), `apps/api/Dockerfile:65`'s "a
shared group would be tidier" note (now done), and the two backlog stubs below.

---

## What this plan deliberately does not fix

Two stubs to file in `planning/backlog/` during Phase 7, so that neither is left implied:

- **`feature_a-submission-can-forge-its-own-exit-code_2026-09-03.md`** — `runpy.run_path` runs the
  submission inside the pytest process, so `os._exit(0)` returns `PASSED`. Unfixable without
  changing how every authored hidden test invokes a solution. Trigger for promotion: a verifier
  that grades something other than an exit code, or the first time it matters.
- **`feature_a-verdict-has-no-provenance_2026-09-03.md`** — `collectVerdicts` still trusts any
  well-formed file in `done/`. After this plan only the worker can write there, so the exposure is
  closed by access control rather than by the verdict carrying evidence of who produced it. Worth
  revisiting if the runner ever gains a second writer.

---

## Dependencies / Prerequisites

- Docker, and `docker compose --profile api` able to build both images. Confirmed on this host —
  the spike ran against `pyquest-runner:local`.
- **One human action:** `docker volume rm pyquest_runner_spool` after Phase 4, with the stack down.
  Goes to `set-reminders`; no test can perform it and the api's startup check exists precisely
  because it will otherwise be forgotten.
- No content dependency. `curriculum/` and `game/` are untouched, and Lane B is unaffected.
- `in-progress/` is empty, so no track collision. The file set below overlaps the `api`, `infra`
  and `runner` tracks and locks all three for the duration — which is the argument for `main`.

## Risks

- **The stack does not boot after Phase 4** if the volume is not recreated. Mitigated by making
  that the loudest possible failure rather than a quiet one, with the command in the message.
- **`user: "0:0"` gets copied to another service** by someone reading compose for a pattern. Both
  occurrences carry the table from **The trade this plan is making**, and
  `test_the_worker_holds_only_setuid_and_setgid` catches the capability half.
- **Alpine `adduser`/`addgroup` flag differences** between the api's `node:22-alpine` and the
  runner's `python:3.14-alpine` — both are busybox and should match; verify at build rather than
  assume.
- **Phase 6 turns out to be bigger than a fork.** Severable by design; drop it to backlog and ship
  Phases 1–5, which are the plan.

## Files Expected to Change

- `pyquest/apps/runner/src/pyquest_runner/sandbox.py` — `Identity`, the drop, the ordering, the
  pre-fork guard, the module docstring's threat model
- `pyquest/apps/runner/src/pyquest_runner/worker.py` — `Spool.ensure()` owner and mode,
  `subprocess.SubprocessError` in `poll_once`
- `pyquest/apps/runner/src/pyquest_runner/job.py` — chown after layout, fork-and-drop untar
- `pyquest/apps/runner/tests/test_sandbox.py` — seven new tests, two renames, the fixture's `0o711`
- `pyquest/apps/runner/tests/test_job.py` — the fail-closed verdict
- `pyquest/apps/runner/Dockerfile` — `spool` group, the submission user
- `pyquest/apps/api/Dockerfile` — `spool` group, `/spool` to `2770`, the filed note resolved
- `pyquest/apps/api/src/dispatcher.ts` — `Spool.ensure()` mode and its comment
- `pyquest/apps/api/src/main.ts` — the startup refusal on an insecure spool root
- `pyquest/apps/api/tests/dispatcher.test.ts` — the mode, and the refusal
- `infra/compose/api.yml` — `user`, `cap_add` and the spool mount on `runner` and `runner-tests`
- `infra/README.md` — the volume recreation step
- `planning/backlog/feature_a-submission-runs-as-the-worker_2026-09-03.md` — marked promoted
- `planning/backlog/feature_a-submission-can-forge-its-own-exit-code_2026-09-03.md` — new
- `planning/backlog/feature_a-verdict-has-no-provenance_2026-09-03.md` — new

---

## Plan Review

**Reviewed:** 2026-09-03 18:19
**Reviewer:** Claude Code (plan-review-intake)

### Strengths
- The spike section is the plan's best asset: the `cap_add`/bounding-set finding, the `/proc/<worker>/environ` leak, and the `os._exit(0)` forgery are measured, not asserted, and each changes scope rather than decorating it.
- Threat model is stated before scope, and the out-of-scope item (a submission cheating its own job) is argued from �5.12 rather than hidden.
- Named mutants (1�4) with the specific expected red, and the explicit discrimination around whether the spool mode or uid drop is doing the work, is exactly `test-filter-development`.
- Catching the `runner-tests` missing `/spool` mount trap before writing the tests, and making it Phase 1, is the right ordering.
- Phase 6 is correctly identified as severable, and the trade table gives a reviewer a concrete thing to reject.

### Issues

#### Critical (Must Address Before Implementation)
1. **The planned capability set is insufficient for the privileged work the root worker must do.** The plan gives the worker uid 0 with `cap_drop: ALL` plus exactly two capabilities, then requires it to `chown` the workspace to 10002, `chown` and `chmod` the spool, and write into `/spool` owned `2770` by another uid/gid. As written, Phases 3 and 4 will fail with `EPERM`. Either the capability set must widen, or the worker design must change so it never needs those privileged operations.
2. **The api startup refusal rejects the mode the plan itself installs.** The proposed check exits if the spool root is group- or world-writable, but the target mode is `2770`, which is group-writable. The check needs to reject world-writable roots while still allowing the intended group-writable state.
3. **Phase 6 contradicts Phase 3.** Phase 3 chowns the workspace after `_unpack_repository`; Phase 6 moves `_unpack_repository` into a child already dropped to 10002 while the workspace is still root-owned. The plan needs one consistent ordering, or Phase 6 must be split out as a separate design.

#### Important (Should Address)
1. **`test_the_worker_holds_only_setuid_and_setgid` cannot observe the runner service it names.** It reads `/proc/self/status` inside `runner-tests`, which pins the test container rather than the `runner` service. The plan should either share the compose settings between services or test the runner configuration directly.
2. **The workspace chown is underspecified.** The plan says to chown the laid-out workspace, but it does not say whether the operation is recursive, which matters for a repository tree.
3. **The fail-closed path may not distinguish privilege-drop failures from ordinary `OSError`.** The plan assumes `SubprocessError` will surface and be caught loudly, but the actual exception type is version-dependent. A dedicated sentinel error from `preexec_fn` would make the failure mode explicit.
4. **The default identity guard may make host-side test runs fail outside the container.** The plan should state that the suite is container-only from Phase 2 onward, or explain how local development is expected to run.
5. **Mounting the real `runner_spool` into `runner-tests` increases blast radius.** The plan should acknowledge the risk that a failing test or fixture could corrupt live queued work.

#### Minor (Consider)
1. The `Files Expected to Change` list does not clearly pair every file with its corresponding test file.
2. The plan uses `Planning/needs-review/in-progress/`, which is not a stage described in CLAUDE.md.
3. One success criterion says the drop should be asserted by comparing uids, but the approach hardcodes 10002; pinning the exact uid in a test would prevent drift.

### Recommendations
- Spike the exact capabilities required by the root worker before Phase 2, then restate the trade table around the measured result.
- Narrow the startup refusal to world-writable roots plus the expected owner/group.
- Resolve Phase 6 against Phase 3 explicitly before implementation.
- Make the runner capability test observe the runner service, not only `runner-tests`.
- State whether the workspace chown is recursive and whether the suite is container-only.

### Assessment
**Implementable as written?** With fixes

**Reasoning:** The plan is unusually well-researched and scoped, but the current capability model conflicts with the privileged filesystem operations it later requires, and the startup guard and Phase 6 ordering both need correction before implementation can proceed safely.

---

## Disposition

*Appended by the author after evaluating the review. Everything above is the review as received
and is unaltered.*

**7 accepted, 3 merged, 1 rejected, 0 flagged** — applied to
`planning/feature_a-submission-runs-as-the-worker_2026-09-03.md` as revision 2. Not yet committed.

### Critical #1 was right, and it was righter than it knew

Accepted, and confirmed by measurement rather than by reading. Revision 1 asserted that the root
worker "bypasses permission checks", which is only true because root normally *holds*
`CAP_DAC_OVERRIDE`, `CAP_FOWNER` and `CAP_CHOWN` — and `cap_drop: ALL` takes all three away. A
probe against a fixture shaped like the spool, under `user: "0:0"` with `cap_add: [SETUID, SETGID]`:

```text
BLOCKED  write into /probe/incoming (10003:10004, 2770)  ->  PermissionError: [Errno 13]
BLOCKED  listdir /probe/incoming                         ->  PermissionError: [Errno 13]
BLOCKED  chown(own dir, 10002, 10002)                    ->  PermissionError: [Errno 1]
BLOCKED  chmod /probe/incoming (not owner)               ->  PermissionError: [Errno 1]
```

Phases 3 and 4 would have failed exactly as predicted. The resolution keeps the capability set at
two rather than widening it: `user: "0:10004"` (the spool group as primary gid) plus
`group_add: ["10002"]`, so the spool is reached by **membership** and the workspace is handed over
by `chown(path, -1, gid)` — a chgrp to a group the process is already in, which needs no
capability. Measured working end to end.

**The probe also found something this review did not, and it is the more serious of the two.**
Once the uids differ, today's `shutil.rmtree` in `sandbox.workspace` fails: a submission that
`chmod 0500`s a directory it created leaves a tree the worker cannot unlink, because the worker
has no `CAP_DAC_OVERRIDE`. That breaks the property `workspace`'s own docstring calls a
requirement rather than good manners — the cleanup is unconditional — on a tmpfs the next job
needs, while `test_the_workspace_is_removed_whether_or_not_the_job_survived` stayed green. The
cleanup now forks and drops to the submission uid, which owns everything it made. Recorded as
spike 5 with the measured output, and it is the reason Critical #3's resolution took the shape it
did.

### Critical #2 — accepted

The refusal condition was self-contradictory: `2770` is group-writable, and the check rejected
group-writable. Narrowed to the **other** bits only (`mode & 0o007`), so `0777` fails and `2770`
passes. Both directions are now tested, which is what stops the same mistake being made again in
the opposite direction.

### Critical #3 — accepted, and dissolved rather than patched

The contradiction was real: Phase 3 chowned the workspace after `_unpack_repository`, Phase 6 moved
`_unpack_repository` into an already-dropped child. Critical #1's resolution removes the premise —
there is no post-layout `chown` anywhere in the plan now, because a `chown` to another uid is not
available. The workspace is handed over at creation, before anything is laid out, so the two phases
no longer have an ordering to disagree about. The fork-and-drop helper moves to Phase 2 as a
primitive, since spike 5 makes the cleanup need it whether or not Phase 6 ever ships.

### Important #1, #2, #4 — accepted

**#1** is right that a test reading `/proc/self/status` inside `runner-tests` pins `runner-tests`.
Fixed structurally rather than with a second test: an `x-sandbox-privileges` YAML anchor merged into
both services, so drift is impossible by construction and the existing test pins the anchor.

**#2** is answered by Critical #1's resolution: the chown is gone, so "is it recursive" has no
subject. The equivalent question — does the whole tree end up reachable — is answered by the setgid
bit on the workspace, which the probe confirmed by having the worker read a file the child wrote.

**#4** is correct that `test_job.py` calls `run_job` and so is caught by the identity guard.
Verified there is no host-side invocation to preserve: nothing in `pyquest/package.json` runs
pytest, and the only path is `docker compose --profile api run --rm runner-tests`. Both test files
now state container-only, and the guard's message names the command that works.

### Important #3 — merged

The plan already asserted the behavior in a test rather than reading CPython's source. The
suggestion of a dedicated sentinel is worth taking, but not literally: **an exception type cannot
cross the fork barrier**, because CPython transports a `preexec_fn` failure as
`subprocess.SubprocessError` carrying the child's exception *repr*. So the sentinel became the
message rather than the class — `PrivilegeDropError` with distinctive text, a widened `except` in
`poll_once`, and a test asserting the text reaches the verdict's `stderr`. Identifiable, without
pretending the type survived.

### Important #5 — merged

The plan already carried a paragraph on this. The review is right that it was thin, and the revised
privilege model makes it thinner still: under `user: "0:10004"` the test container is now *in* group
`spool`, so a buggy fixture genuinely could damage live queued work, where revision 1's `user: "0:0"`
could not have. The real mount is kept — a fresh volume would be seeded `root:root 0755` and the
suite would assert against a boundary nobody uses — with three stated mitigations: every spool
assertion is negative, the single write is a pid-unique probe removed in `try/finally`, and
`infra/README.md` records that the suite is run with the `api` profile down.

### Minor #1, #3 — accepted and merged

**#1** accepted: `Files Expected to Change` is now a table pairing each file with the test that
covers it.

**#3** merged: the criterion now asserts **both** that the child uid differs from the worker's and
that it is literally 10002. The comparison catches a no-op drop; the literal catches drift to some
other uid. Neither alone is sufficient.

### Minor #2 — rejected

> The plan uses `Planning/needs-review/in-progress/`, which is not a stage described in CLAUDE.md.

The plan does not use that path. `grep -n "in-progress"` over revision 1 returns exactly one hit:

```text
442:- `in-progress/` is empty, so no track collision. The file set below overlaps the `api`, `infra`
```

That is `planning/in-progress/`, the kanban stage CLAUDE.md describes in as many words — *"plans
live in `planning/`, move to `in-progress/`, end in `completed/` with a Status block"* — and the
sentence is the plan-workflow track-collision check, which is required before a plan may be
admitted. `planning/needs-review/in-progress/` does exist in the repository, as a directory of the
`plan-send-review` pipeline, but the plan never references it. No change.
