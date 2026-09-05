# A Submission Runs As The Worker, And The Worker Owns The Spool

**Status:** Planned — revised after review, queued for execution
**Revision:** 2 — 2026-09-03, after `planning/needs-review/completed/2026-09-03-a-submission-runs-as-the-worker-and-the-worker-owns-the-spool.md`
**Track:** `main`
**Date:** 2026-09-03
**Author:** Claude (Opus 5)
**Lane:** A
**Promoted from:** `planning/backlog/promoted_a-submission-runs-as-the-worker_2026-09-03.md`,
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

## What the spikes settled before this plan was written

The backlog item proposed `os.setuid` in `preexec_fn` and listed what it would drag in. **Two of
its assumptions are wrong, one of its open questions has a bad answer, and revision 1 of this plan
got the privilege model wrong in a way the review caught.** Everything below was measured against
`pyquest-runner:local` on this machine.

### 1. `cap_add` does not work while the container user is non-root

The obvious minimal change — keep `user: "10001:10001"`, add `cap_add: [SETUID, SETGID]` — does
not work. Docker puts the capability in the **bounding** set only; without it in permitted or
ambient, `exec` clears it and the process never holds it.

| Config | `CapPrm` | `os.setuid(10002)` |
|---|---|---|
| `user: 10001`, `cap_drop: ALL` (today) | `0000…0000` | `PermissionError [Errno 1]` |
| `user: 10001`, `cap_add: [SETUID, SETGID]` | `0000…0000` | `PermissionError [Errno 1]` |
| `user: 0:…`, `cap_add: [SETUID, SETGID]` | `0000…00c0` | **OK → uid 10002** |

`0xc0` is bits 6 and 7 — `CAP_SETGID` and `CAP_SETUID`, and nothing else.

**So the runner's PID 1 has to be uid 0 inside the container.** There is no configuration that
keeps a non-root PID 1 and still lets it hand a child a different uid: `no-new-privileges` closes
the setuid-binary route by design, unprivileged user namespaces do not give us a second uid to map
to, and a helper container has no channel to be asked through under `network_mode: "none"`.

### 2. `/proc/<worker>/environ` is readable at the same uid, and `DATABASE_URL` was in it

The backlog item flagged this as "check that before relying on it". Checked, inside the runner
image, uid 10001, `cap_drop: ALL`, `no-new-privileges`, with the planted credential the suite
already uses:

```text
child uid 10001 pid 1
[('7', 'READ DATABASE_URL FOUND')]
```

A sibling process's whole environment, read by a process with no privileges at all.
`test_a_submission_cannot_read_the_workers_environment` is therefore **materially narrower than
its name**: it proves `_child_environment` builds the child's own environment rather than
inheriting one, which is true and worth keeping, and it proves nothing about what the child can
read back out of `/proc`. The name has to change and the test has to grow. It gets both.

This also closes the "sign the verdict" alternative for good. Any key the worker holds is in the
memory or the environment of a process the submission can read while the uid is shared.

### 3. Exit-code forgery is in-process, and this plan does not fix it

Every authored hidden test executes the submission **inside the pytest process**:

```text
curriculum/area-0/exercises/name-tag/hidden/test.py:13:  runpy.run_path("solution.py", run_name="__main__")
```

`job.py` grades the job on pytest's exit code. A `solution.py` containing `os._exit(0)` therefore
returns `PASSED` without a single assertion running, and **no uid, mode or capability change
touches that** — the forging code and the grading code are the same process by construction.

Fixing it would mean the hidden tests stopped running the submission in-process, which is every
authored test in the repository. It is a real hole, it is a different hole, and pretending this
plan closes it would be the hand-wave the backlog item's last section says this project will not
do. Filed, named, and stated in the threat model rather than quietly left out.

### 4. **uid 0 bypasses nothing.** DAC override is a capability, and revision 1 assumed it was free

The review's first critical point, confirmed. Revision 1 said "root bypasses permission checks",
which is only true because root normally *holds* `CAP_DAC_OVERRIDE`, `CAP_FOWNER` and `CAP_CHOWN`
— and `cap_drop: ALL` takes all three away. Measured, against a fixture built to look like the
spool and a submission-owned tree:

| Operation | `user: "0:0"` (revision 1) | `user: "0:10004"` + `group_add: 10002` |
|---|---|---|
| write into `/spool/incoming` (`10003:10004`, `2770`) | **BLOCKED** `EACCES` | OK — via group `spool` |
| `listdir` / read a job file there | **BLOCKED** `EACCES` | OK |
| `chmod` a directory it does not own | **BLOCKED** `EPERM` | **BLOCKED** `EPERM` (`CAP_FOWNER`) |
| `chown(dir, 10002, 10002)` | **BLOCKED** `EPERM` | **BLOCKED** `EPERM` (`CAP_CHOWN`) |
| `chown(dir, -1, 10002)` — chgrp to a group it is in | **BLOCKED** `EPERM` | **OK** |
| `chmod` a directory it owns | OK | OK |
| `rmtree` a 10002-owned tree | **BLOCKED** `EACCES` | **BLOCKED** `EACCES` |

**Revision 1's Phases 3 and 4 would both have failed with `EPERM`, exactly as the review said.**

The fix keeps the capability set at two. The worker's *primary gid* becomes the spool group and it
gains the submission group as a supplementary, so the spool is reached by group membership rather
than by overriding permissions, and the workspace is handed over by `chgrp`-to-a-group-we-are-in
rather than by `chown`:

```yaml
user: "0:10004"          # uid 0 for CAP_SETUID; gid 10004 (spool) to reach /spool
group_add: ["10002"]     # the submission group, so the workspace can be chgrp'd to it
cap_drop: [ALL]
cap_add: [SETUID, SETGID]
```

### 5. A submission can leave a directory the worker cannot delete

Found while measuring #4, and **not in the review**. Once the uids differ, today's
`shutil.rmtree` in `sandbox.workspace` fails:

```text
--- 3. cleanup: the worker tries directly (this is today's rmtree) ---
  BLOCKED  worker rmtree the job dir  ->  PermissionError: [Errno 13] '/probe/work/job-1/locked'
```

The submission created `locked/` and `chmod`ed it `0500`. It owns it, so it is allowed to; the
worker has no `CAP_DAC_OVERRIDE`, so it cannot unlink what is inside. That breaks the property
`workspace`'s docstring calls the requirement rather than good manners — *"the cleanup is
unconditional"* — and it breaks it on a **tmpfs the next job needs**, which is the exact failure
that docstring exists to prevent. `test_the_workspace_is_removed_whether_or_not_the_job_survived`
would go green while the real container leaked.

The cleanup therefore has to run **as the submission**, which owns everything it made. Measured
end to end, same two capabilities:

```text
--- 4. cleanup: a dropped child does it instead ---
  wipe-child exit status: 0
  OK       worker rmdir the now-empty job dir
  job dir still there? False
```

This is why the fork-and-drop helper stops being an optional Phase 6 nicety and becomes the
primitive Phase 2 builds — see **The privilege model, derived** below.

---

## The threat model this plan commits to

Stated up front, because the scope is only coherent with it.

**In scope — a submission must not affect anything outside its own job.** It must not write the
spool, read another job's hidden tests, delete or rewrite another player's queued work, forge a
verdict against another player's job id, read the worker's memory or environment, or leave
anything behind on the tmpfs the next job needs.

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
| Worker: uid 10001, gid 10001, zero capabilities | Worker: uid 0, gid 10004 (`spool`), supplementary 10002, exactly `CAP_SETUID` + `CAP_SETGID` |
| Submission: **uid 10001 — the worker** | Submission: uid 10002, gid 10002, no supplementary groups, zero capabilities, no saved-uid route back |
| Spool: `0777`, submission can write it | Spool: `2770 api:spool`, reached by group; submission is in neither |
| Submission can read the worker's `/proc` | Different uid, so it cannot |
| Workspace cleanup: same uid, always works | Cleanup runs as the submission, so it still always works |

Everything else is untouched: `network_mode: "none"`, `read_only: true`, `mem_limit`,
`pids_limit`, `no-new-privileges`, the tmpfs, and every rlimit.

**Why this is the right way round.** The worker is our own code, four modules long, parsing JSON
the api wrote. The submission is a child's unreviewed program, and it is the thing the whole
container exists to contain. Given a choice about which of the two holds two capabilities, it
should not be the one we did not write. **The capability count did not go up to buy the spool and
the workspace** — spike 4 is the record of paying for them with group membership instead, which is
the difference between "root with two capabilities" and root.

**The alternative, named so the reviewer can insist on it.** PID 1 stays root and does nothing but
fork on request; an unprivileged supervisor at 10001 does all the parsing and talks to it over a
pipe. That is strictly better and it is a second process, a protocol and a lifecycle for a
household running two players. Recommended against for now, and it is the shape to reach for if
the worker ever grows past four modules.

---

## Success Criteria

- [ ] A submission runs as uid 10002 and the worker as uid 0 — asserted **both** by comparing them
      and by pinning the literal 10002, so neither drift nor a no-op passes
- [ ] A submission cannot write `/spool`, cannot list `/spool/incoming`, and cannot read a file
      planted there
- [ ] The worker holds exactly `CAP_SETUID` and `CAP_SETGID` and nothing else, asserted from
      `/proc/self/status`, and the `runner` and `runner-tests` services **cannot drift apart**
- [ ] `runner-tests` mounts `runner_spool:/spool` — **without this the spool tests pass by finding
      no directory**, which is the failure mode this repository has been bitten by before
- [ ] A submission that `chmod 0500`s a directory it created still gets cleaned up (spike 5)
- [ ] The privilege drop **fails closed**: if it cannot happen, the job is answered `killed` with a
      loud, identifiable message, and never runs as the worker
- [ ] `test_a_submission_cannot_read_the_workers_environment` is renamed to what it actually proves,
      and a new test covers the `/proc` route the spike found open
- [ ] Every existing test in `tests/test_sandbox.py` still passes, now against the dropped uid
- [ ] `0777` is gone from `dispatcher.ts` and from `apps/api/Dockerfile`
- [ ] The api refuses to start against a **world-accessible** spool root, naming the fix, and
      starts normally against the `2770` root this plan installs
- [ ] Ruff and pyright clean; `npm test` and `npm run typecheck` clean

---

## Approach

### The privilege model, derived

Every line below is a row of spike 4 or 5, not a preference.

| Who | Identity | Why |
|---|---|---|
| api | `10003:10004` (`spool` primary) | owns and creates the spool directories |
| worker | `uid 0`, `gid 10004`, supplementary `10002` | uid 0 for `CAP_SETUID`; `spool` to write the spool without `CAP_DAC_OVERRIDE`; `10002` to `chgrp` the workspace without `CAP_CHOWN` |
| submission | `10002:10002`, no supplementary groups | in neither `spool` nor the worker's gid, so it reaches nothing |

Three operations the worker needs and cannot have, so the design routes around each:

- **`chown` to another uid** — needs `CAP_CHOWN`. Never done. The workspace is handed over by
  `chgrp` to group 10002 plus the setgid bit.
- **`chmod` a directory it does not own** — needs `CAP_FOWNER`. Never done. The api owns and
  chmods the spool; the worker only ever chmods directories it created itself.
- **Deleting the submission's files** — needs `CAP_DAC_OVERRIDE`. Never done. The cleanup forks
  and drops first.

### The runner's PID 1 becomes root with exactly two capabilities

`infra/compose/api.yml`. **A YAML anchor, not two copies** — the review's Important #1 is right
that a test reading `/proc/self/status` inside `runner-tests` pins `runner-tests` and nothing else.
An anchor makes the drift impossible rather than detected:

```yaml
x-sandbox-privileges: &sandbox-privileges
  user: "0:10004"
  group_add: ["10002"]
  cap_drop: [ALL]
  cap_add: [SETUID, SETGID]
  security_opt: ["no-new-privileges:true"]
```

Merged into both `runner` and `runner-tests` with `<<: *sandbox-privileges`, and the comment above
it carries the table from **The trade this plan is making**. The capability test then pins the
anchor's value, and there is one place to widen and one test that notices.

`Dockerfile` keeps `USER runner`, so the image run bare is still unprivileged and fails loudly
rather than silently running a submission as the worker.

### The child becomes uid 10002, and the order is the whole of it

One function, `_become(identity)`, shared by `preexec_fn` and by the fork-and-drop helper below.
Each line is here because moving it breaks something:

```python
os.setgroups([])                    # BEFORE setuid — needs CAP_SETGID, and the worker's
                                    # supplementary groups (10002, and 10004 = spool) survive
                                    # setresgid otherwise. This is the classic hole, and here it
                                    # would hand the submission the spool group directly.
os.setresgid(gid, gid, gid)         # real, effective AND saved
os.setresuid(uid, uid, uid)         # saved too, so there is no route back
# ... every setrlimit, AFTER the drop ...
os.setsid()
```

- **`setgroups` first, and it is not in the backlog item's list.** `setresgid` alone leaves the
  child holding the worker's supplementary groups. Under the revised model that is not a
  hypothetical: group 10004 *is* the spool group, so skipping this line hands the submission
  exactly the access this plan exists to remove. Dropping the list needs `CAP_SETGID`, so it
  cannot be done after `setresuid`.
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
    uid: int = 10002
    gid: int = 10002          # apps/runner/Dockerfile creates this user and group

DEFAULT_IDENTITY = Identity()
```

`None` means "do not drop" and exists only for a host that cannot; it is never the default.

### One fork-and-drop helper, used three times

Spike 5 makes this a primitive rather than a convenience. It belongs in `sandbox.py` beside
`_become`:

```python
def as_submission(work: Callable[[], None], identity: Identity) -> None:
    """Run `work` in a forked child that has permanently become the submission."""
```

Three callers:

1. **`preexec_fn`** — via `_become`, the submission itself.
2. **`workspace()`'s cleanup** — Phase 3, and required.
3. **`_unpack_repository`** — Phase 6, and still severable.

Building it once in Phase 2 is what makes Phase 3 and Phase 6 small, and it is why **Phase 6 no
longer contradicts Phase 3** (the review's Critical #3): there is no post-layout `chown` in the
plan any more, so there is no ordering for the two phases to disagree about. Phase 3 hands the
workspace over *before* anything is laid out; Phase 6 then runs the untar inside a child that is
already entitled to write there.

### The workspace is handed over by group, never by chown

`workspace()` gains the identity and does the handover at creation, before `run_job` lays anything
out:

```python
path.mkdir(parents=True)
os.chown(path, -1, identity.gid)   # chgrp only — proven OK, needs no CAP_CHOWN
os.chmod(path, 0o2770)             # setgid bit: the child's files stay group 10002
```

- **The setgid bit is load-bearing and answers the review's Important #2** ("is the chown
  recursive?"). There is no recursion and no chown, because every file the submission creates
  *inherits* group 10002 from the directory. Spike 3 confirmed the worker could then read a file
  the child had written, which is what makes a `local-repo` tree work.
- **`/tmp/pyquest-work` needs `x` for group 10002 and nothing else.** The child must traverse it to
  reach its job directory; it never creates or lists entries there, because the worker creates and
  removes the job directory itself. `2710` is the minimum; spike 3 verified `2730`, so Phase 3
  confirms `2710` and falls back to `2730` if it does not hold.
- **`.stdout` and `.stderr` need no handover.** `run_sandboxed` opens them in the parent and passes
  the descriptors down; access is checked at `open`. Leave them root-owned — the child having no
  handle on the files its own output lands in is a small bonus.

### The cleanup drops privilege too

`workspace()`'s `finally` becomes: `as_submission(wipe_contents, identity)`, then the worker
`rmdir`s the directory it owns and is empty. `wipe_contents` uses `shutil.rmtree(..., onexc=...)`
with a handler that chmods the parent and retries — as the **owner**, chmod always succeeds, so a
submission cannot construct a tree it is able to make and unable to unmake.

Unconditional, as it is today: the wipe child's failure is logged and the `rmdir` is still
attempted, because a workspace left behind by a failing job is the one holding whatever the
failure wrote.

### The drop fails closed, loudly

`_apply_limits` runs between `fork` and `exec`, where its own docstring already says nothing may
raise for an ordinary reason. A failed `setresuid` is not an ordinary reason — it is the boundary
not existing — and the child must not start.

- `run_sandboxed` refuses **before forking** when an `Identity` is requested and `os.getuid() != 0`,
  raising with a message that names the compose keys. A wrong host config is then one clear error
  rather than every job silently running as the worker.
- `_become` raises `PrivilegeDropError` with a distinctive message. **The review's Important #3
  asks for a sentinel; the honest version is that a type cannot cross the fork barrier** — CPython
  transports a `preexec_fn` exception as `subprocess.SubprocessError` carrying the child's
  exception *repr*. So the sentinel is the message, not the class: `poll_once` widens its `except`
  to include `subprocess.SubprocessError`, and the test asserts the distinctive text reaches the
  verdict's `stderr`. That makes the failure identifiable without pretending the type survived.
- **The exact behavior is version-dependent, so it is asserted rather than read.** Seed a failing
  drop, confirm the verdict is `killed`, confirm the message is in it, and confirm the loop
  survives to take the next job.

### The spool narrows to a group the submission is not in

A shared gid, which is the answer `apps/api/Dockerfile:65` already reaches and files rather than
does. Not `0700`-relying-on-the-worker-being-root — spike 4 proves that would not have worked
anyway, since the worker cannot override DAC.

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
- `worker.py` `Spool.ensure()` runs as root and can win the race on first boot, creating directories
  the api cannot write. It sets `os.chown(path, -1, 10004)` and `os.chmod(path, 0o2770)` — chgrp
  only, because it has no `CAP_CHOWN`, and both are permitted since it created them. Module
  constants, commented as mirroring the Dockerfile, the way the four directory names already mirror
  `dispatcher.ts`.
- **Incidental:** `Spool.ensure()` in `dispatcher.ts` creates `<root>/work`, which nothing uses —
  the runner's work root is `/tmp/pyquest-work`. One line, removed while the method is open.

### An existing volume keeps its old ownership, and that is a live hazard

Docker seeds a named volume from the image at first creation only. An existing `pyquest_runner_spool`
is `0777` at its root, and **write permission on `/spool` lets the submission rename or remove
`done/` regardless of what mode `done/` itself carries.** Narrowing the children is not enough.

`Spool.ensure()` cannot fix it — the api does not own a root the volume created as `root:root`, and
spike 4 confirms `chmod` on a directory you do not own needs `CAP_FOWNER`. So the api **checks and
refuses** at startup.

**The review's Critical #2 is right about the condition.** Revision 1 said "group- or
world-writable", which rejects `2770` — the mode this plan installs. The check is on the **other**
bits only:

```ts
if ((mode & 0o007) !== 0) → exit, naming `docker volume rm pyquest_runner_spool`
```

`0777` (other = `7`) fails; `2770` (other = `0`) passes. Group-writable is the intended state and
must not be refused. Both directions get a test.

Bricking the household stack on upgrade is a real cost and it is deliberate — a stack that boots
with a `0777` spool boots with this plan's whole point undone, and silently. A one-time human
action goes to `set-reminders`.

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

It runs inside `as_submission`, which Phase 2 already built. The extracted tree then belongs to
10002, which is where it was going anyway. A non-zero child exit becomes the `ValueError`
`poll_once` already answers as `killed`.

Still severable: if it turns out to be more than it looks, drop it to a backlog item and ship the
rest. The cleanup use of `as_submission` is **not** severable — spike 5 makes it required.

---

## Tests

`apps/runner/tests/test_sandbox.py`, which already attacks the boundary by *doing* the forbidden
thing rather than reading configuration. Following `test-filter-development`: RED with the failure
output captured, GREEN, then a seeded mutant that the suite must catch.

**The suite is container-only from Phase 2 onward.** `test_sandbox.py`'s docstring already says so;
`test_job.py` does not, and it calls `run_job` → `run_sandboxed`, so the identity guard reaches it
too. Both files get the statement, and neither is in a host-side npm script today — the only
invocation is `docker compose --profile api run --rm runner-tests`. That answers the review's
Important #4: there is no host-side run to preserve, and the guard's error message names the
command that does work.

**New:**

| Test | File | Asserts |
|---|---|---|
| `test_a_submission_does_not_run_as_the_worker` | `test_sandbox.py` | child uid ≠ worker uid **and** child uid == 10002 |
| `test_a_submission_cannot_write_the_spool` | `test_sandbox.py` | `open("/spool/incoming/x", "w")` fails |
| `test_a_submission_cannot_list_the_spool` | `test_sandbox.py` | `os.listdir("/spool/incoming")` fails |
| `test_a_submission_cannot_read_another_jobs_tests` | `test_sandbox.py` | a probe file planted by the suite is unreadable |
| `test_a_submission_cannot_read_the_workers_proc` | `test_sandbox.py` | `/proc/<worker>/environ` denied — spike 2, inverted |
| `test_the_worker_holds_only_setuid_and_setgid` | `test_sandbox.py` | `CapEff` is exactly `…00c0` |
| `test_a_locked_directory_is_still_cleaned_up` | `test_sandbox.py` | spike 5 — the submission `chmod 0500`s a directory it made, and the workspace still goes |
| `test_a_job_whose_privilege_drop_fails_is_killed` | `test_job.py` | fail-closed; the message reaches `stderr`; the loop survives |
| `spool root refusal` | `dispatcher.test.ts` | `0777` refuses **and** `2770` starts — both directions |

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

**`runner-tests` needs the spool mounted, and the review is right that this now costs more.** It
has `tmpfs` and no `volumes:` today, so all four spool tests would pass by finding no directory at
all. Mounting the **real** volume rather than a fresh one is deliberate: a new volume would be
seeded `root:root 0755` from an image with no `/spool`, which is not the mode production has, and
the suite would assert against a boundary nobody uses.

The blast radius genuinely grew — under the revised model the test container is in group `spool`,
so a buggy fixture *could* damage live queued work, where revision 1's `user: "0:0"` could not have.
Three mitigations, stated rather than assumed: every spool assertion is a negative one; the single
write is a pid-unique probe removed in `try/finally`; and `infra/README.md` records that the
security suite is run with the `api` profile down. `docker compose run --rm runner-tests` does not
require the runner to be up, so that costs nothing.

**The mutants, named in advance:**

1. Comment out `os.setresuid` → `test_a_submission_does_not_run_as_the_worker` **and** all four
   spool tests must go red. If only the first does, the spool mode is doing the work and the uid
   drop is untested.
2. Comment out `os.setgroups([])` → the spool tests must go red, because the child keeps group
   10004. This is the mutant that proves the line nobody would have written, and under the revised
   model it is no longer subtle: that group *is* the spool.
3. Put `chmodSync(path, 0o777)` back in `dispatcher.ts` → the spool write test must go red.
4. Widen `cap_add` with `CAP_DAC_OVERRIDE` → `test_the_worker_holds_only_setuid_and_setgid` must go
   red, in **both** services, because they share one anchor.
5. Revert the cleanup to a direct `shutil.rmtree` → `test_a_locked_directory_is_still_cleaned_up`
   must go red. Spike 5 is the proof this mutant is not hypothetical.

---

## Phases

### Phase 1 — the suite can see what it is asserting about

Mount `runner_spool:/spool` on `runner-tests`. Write the four spool tests and
`test_a_submission_cannot_read_the_workers_proc`. **Capture the RED output** — they must fail
because the submission *can* do these things, not because the directory is absent. Confirm the
distinction in the failure text before going on; this is the step the whole plan's honesty rests on.

### Phase 2 — the privilege drop, and the helper

The `x-sandbox-privileges` anchor on both services. `Identity`, `_become` with the
`setgroups`/`setresgid`/`setresuid` sequence, rlimits reordered after it, `PrivilegeDropError`, the
pre-fork guard, `subprocess.SubprocessError` in `poll_once`, and **`as_submission`** — built here
because Phases 3 and 6 both need it. Phase 1's tests go green; every existing test must stay green,
now against uid 10002.

### Phase 3 — the workspace handover and the cleanup

`workspace()` gains the identity: `chgrp` + `2770` at creation, `as_submission(wipe_contents)` in
the `finally`, `rmdir` after. `/tmp/pyquest-work` to `2710` (or `2730`). Re-run the whole suite —
`test_a_locked_directory_is_still_cleaned_up` is the new one, and a `local-repo` job is the case
that breaks if the setgid bit is wrong.

### Phase 4 — the spool narrows

The `spool` group in both Dockerfiles, the submission user, `2770` in place of `0777` in
`dispatcher.ts`, `apps/api/Dockerfile` and `worker.py`. The api's startup refusal on the **other**
bits only, with both directions tested. Recreate the volume and bring the stack up. Seed mutants
1–5 and confirm each is caught.

### Phase 5 — the names stop overclaiming

Rename the two tests. Rewrite `sandbox.py`'s module docstring to carry the threat model — what the
boundary holds and what it explicitly does not.

### Phase 6 — the untar drops privilege first

Severable. `_unpack_repository` inside `as_submission`.

### Phase 7 — the record

`infra/README.md` (the volume-recreation step, and running the security suite with the profile
down), the `Spool.ensure()` comment in `dispatcher.ts` (repointed from the backlog stub to this
plan), `apps/api/Dockerfile:65`'s "a shared group would be tidier" note (now done), and the two
backlog stubs below.

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
  every spike ran against `pyquest-runner:local`.
- **One human action:** `docker volume rm pyquest_runner_spool` after Phase 4, with the stack down.
  Goes to `set-reminders`; no test can perform it and the api's startup check exists precisely
  because it will otherwise be forgotten.
- **`group_add` support in the compose file format** — standard, but confirm at Phase 2 rather than
  at Phase 4, since everything after it depends on the worker holding group 10002.
- No content dependency. `curriculum/` and `game/` are untouched, and Lane B is unaffected.
- `in-progress/` is empty, so no track collision. The file set below overlaps the `api`, `infra`
  and `runner` tracks and locks all three for the duration — which is the argument for `main`.

## Risks

- **The stack does not boot after Phase 4** if the volume is not recreated. Mitigated by making
  that the loudest possible failure rather than a quiet one, with the command in the message.
- **A fourth identity to keep straight.** api 10003, runner 10001, submission 10002, spool group
  10004 — four numbers across two Dockerfiles and a compose file. The derivation table above is
  the single place they are explained, and every file that hardcodes one points at it.
- **Alpine `adduser`/`addgroup` flag differences** between the api's `node:22-alpine` and the
  runner's `python:3.14-alpine` — both are busybox and should match; verify at build rather than
  assume.
- **Phase 6 turns out to be bigger than a fork.** Severable by design; drop it to backlog and ship
  Phases 1–5, which are the plan. The cleanup use of the same helper is not severable.

## Files Expected to Change

| File | Change | Covered by |
|---|---|---|
| `pyquest/apps/runner/src/pyquest_runner/sandbox.py` | `Identity`, `_become`, `as_submission`, `PrivilegeDropError`, the ordering, the pre-fork guard, `workspace()` handover and cleanup, the docstring's threat model | `tests/test_sandbox.py` |
| `pyquest/apps/runner/src/pyquest_runner/worker.py` | `Spool.ensure()` group and mode, `subprocess.SubprocessError` in `poll_once` | `tests/test_job.py` |
| `pyquest/apps/runner/src/pyquest_runner/job.py` | fork-and-drop untar (Phase 6) | `tests/test_job.py` |
| `pyquest/apps/runner/tests/test_sandbox.py` | seven new tests, two renames, the fixture's `0o711`, container-only docstring | — |
| `pyquest/apps/runner/tests/test_job.py` | the fail-closed verdict, container-only docstring | — |
| `pyquest/apps/runner/Dockerfile` | `spool` group, the submission user | asserted at runtime by `test_sandbox.py` |
| `pyquest/apps/api/Dockerfile` | `spool` group, `/spool` to `2770`, the filed note resolved | asserted at runtime by `test_sandbox.py` |
| `pyquest/apps/api/src/dispatcher.ts` | `Spool.ensure()` mode, its comment, the unused `work` directory | `tests/dispatcher.test.ts` |
| `pyquest/apps/api/src/main.ts` | the startup refusal on a world-accessible spool root | `tests/dispatcher.test.ts` |
| `pyquest/apps/api/tests/dispatcher.test.ts` | the mode, and both directions of the refusal | — |
| `infra/compose/api.yml` | `x-sandbox-privileges` anchor, the spool mount on `runner-tests` | `test_the_worker_holds_only_setuid_and_setgid` |
| `infra/README.md` | volume recreation; running the security suite with the profile down | — |
| `planning/backlog/promoted_a-submission-runs-as-the-worker_2026-09-03.md` | already marked promoted | — |
| `planning/backlog/feature_a-submission-can-forge-its-own-exit-code_2026-09-03.md` | new | — |
| `planning/backlog/feature_a-verdict-has-no-provenance_2026-09-03.md` | new | — |

---

## Review History

**v1 reviewed 2026-09-03 — "Implementable as written? With fixes".** 7 accepted, 3 merged, 1
rejected. The review's first critical finding was correct and this plan's privilege model was
wrong: revision 1 assumed a container root bypasses file permissions, when DAC override is a
capability like any other and `cap_drop: ALL` removes it. Measured, `user: "0:0"` with two
capabilities could not write the spool, could not `chown`, and could not `chmod` a directory it did
not own — Phases 3 and 4 would both have died on `EPERM`. The fix keeps the capability count at
two and pays for the access with group membership instead (`user: "0:10004"`, `group_add:
["10002"]`), which is why the trade table still says two.

Measuring that also turned up spike 5, which the review did not raise and which is worse: with the
uids separated, a submission can `chmod 0500` a directory it created and the worker can no longer
delete it, silently breaking the unconditional-cleanup property on a tmpfs the next job needs. The
cleanup now forks and drops to the submission uid. That, in turn, is what resolved the review's
third critical finding — the Phase 3/Phase 6 ordering contradiction disappears once there is no
`chown` to order, and the fork-and-drop helper moves to Phase 2 as a primitive both phases use.

The startup refusal was self-contradictory as written and now checks the **other** mode bits only,
with both directions tested. The capability test's blind spot — it observed `runner-tests` while
naming `runner` — is closed with a YAML anchor rather than a second test, so the two services
cannot drift.

**One finding rejected.** Minor #2 said the plan used `Planning/needs-review/in-progress/`, a stage
CLAUDE.md does not describe. It does not: `grep -n "in-progress"` over revision 1 returns a single
hit, and it is `planning/in-progress/` — the kanban stage CLAUDE.md names explicitly — in the
sentence performing plan-workflow's track-collision check. The `needs-review/in-progress/`
directory exists in the repository as part of the review pipeline, but this plan never refers to
it. No change made.

**Nothing was flagged for the owner.** The one judgment call revision 1 raised — whether the api
should refuse to start against an insecure spool root, at the cost of bricking the household stack
on upgrade — the review did not contest, so it stands as written.
