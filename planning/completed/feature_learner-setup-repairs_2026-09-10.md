---
kind: plan
status: completed
track: learner-setup-repairs
date: 2026-09-10
completed: 2026-09-10
---

# The four things that stopped running, and the prose the rename left behind

**Status:** Completed 2026-09-10
**Track:** `learner-setup-repairs`
**Date:** 2026-09-10
**Author:** Claude (Opus 5)
**Lane:** A and B
**Wave:** `wave-4_the-workflow-and-the-bootstrap_2026-09-10`

## Objective

Make the four broken tools run, and put a gate behind each one so the next rename cannot break
them silently.

## Why this exists

An audit of the campaign workflow went looking for documentation and found tooling instead. Every
item below is something a person would reasonably believe works, because nothing says otherwise
and every test is green.

**`pack.sh` cannot run.** Two of its eighteen manifest entries are dead:

```
curriculum/area-2/exercises/README.md      # gone
curriculum/area-2/exercises/session-2      # gone; motto.py is now practices/practice-2/
```

Both are ADR 0007 fallout — the sessions→practices rename moved the tree and the packaging never
followed. `pack.sh:107-118` validates the whole manifest before copying anything, deliberately
("A half-copied payload is worse than no payload"), so it dies at step 1. **This is the only tool
that puts material on a learner's machine.**

`tools/learner-setup/SETUP.md:68` links the same dead path, in the sentence that tells the reader
to open one real exercise in the editor they just configured.

**`seed-gitea-users.sh` dies on its first lookup.** It reads `gitea-user-admin` and friends;
the repository-root `.env` uses `gitea_user_admin`. `env_get` matches `key=` exactly, so the
script reaches `die "gitea-user-admin is missing or empty"` before it does anything.

**`verify.py` under-reports for a learner, and says nothing about it.** `SEARCH` is
`(ROOT/"practices", ROOT/"reference")`, and `reference/` is the DM's answer keys —
`curriculum/area-0/reference/README.md` says so in its third line. `pathlib.Path.rglob` on a
directory that does not exist yields nothing rather than raising, so a learner who does not have
`reference/` gets:

```
19 of 19 exercises behaved as tagged.
```

with a silently smaller nineteen, and exit 0. Areas 0, 1 and 2 have no guard. Area 3 has
`if d.exists()` and skips, which is better and still silent.

`curriculum/area-2/practices/README.md:82-85` already argues against exactly this: *"A harness
that quietly counts zero and prints a reassuring result is worse than one that names what it
cannot check."* The harness it is describing is this one.

**And the prose is stale in four more places**, all the same rename.

## Scope

### 1. The manifest and its link

- `tools/learner-setup/manifest.txt` — remove `curriculum/area-2/exercises/README.md`; repoint
  `curriculum/area-2/exercises/session-2` to `curriculum/area-2/practices/practice-2`.
- `tools/learner-setup/SETUP.md:68` — the Gate 1 link becomes
  `curriculum/area-2/practices/practice-2/motto.py`.
- `tools/vscode/README.md` — check its §4 checklist names the same file. It says `py -3.14
  motto.py`, which is cwd-relative and correct; confirm the surrounding prose does not name the
  dead directory.

### 2. `seed-gitea-users.sh`

Reconcile the key names against the real `.env`. **Read `.env` before editing** — the fix is to
match what is actually there, and the file is gitignored, so the repository cannot tell you.
Prefer accepting both spellings over renaming the operator's existing keys.

### 3. `verify.py`, areas 0 through 2

Adopt Area 3's existence guard, and then go one step further than Area 3: **a missing search root
must be named, not skipped.** The learner is the expected reader of that message.

```
reference/ is not here, so 4 files were not checked.
15 of 15 exercises behaved as tagged.
```

The denominator stays honest because the sentence above it says what is missing. A learner
without `reference/` is in a *correct* state — that directory is the DM's — so this must not be
an error, and must not exit non-zero.

### 4. The stale prose

- `curriculum/area-0/README.md:191` — "Every `.py` file in `exercises/` and `reference/` is run".
  It is `practices/` and `reference/`, and has been since the rename. No `verify.py` has ever
  scanned `exercises/`.
- `curriculum/area-{0,1}/practices/README.md:3` — both still open *"Each `session-<n>/` directory
  here…"*, and Area 0's names `s1e1_first_light.py`, which is `p1e1_first_light.py`.
- `README.md` (repository root) — the layout table names a `content/` directory that does not
  exist, and describes `validate:content` as reading `../content`. The real roots are
  `curriculum/` and `game/`.
- `curriculum/README.md` — the status table calls Area 3 *"planned, blocked on the shim's
  measurement"*. Area 3 has 13 practice plans and 7 exercises. **This file is written by the
  `main` track by its own rule**, so raise it rather than editing it here if that rule is being
  held strictly; the rule exists to stop two area tracks colliding, and this track is neither.

## Out of scope

- The install order, and anything that touches `curriculum/area-2/`'s teaching. That belongs to
  `practice-zero`, which owns the Area 2 edit and is blocked behind a gate this plan is not.
- The `world.py` double-copy and the payload's contents. `gitea-remote` owns the manifest's
  *shape*; this plan only makes the paths in it resolve.

## The gate

**Nothing in CI runs `pack.sh`, which is the entire reason this rotted.** A fix without a gate
here is a fix with a shelf life.

Add `pyquest/packages/content/tests/learner-setup.test.ts`, modelled on `two-roots.test.ts`,
which already reaches outside `pyquest/` and so establishes that a test may read the repository
root. It reads `tools/learner-setup/manifest.txt`, applies the same comment-and-blank stripping
`pack.sh:108` uses, and asserts every path resolves.

Follow `test-filter-development`:

1. **RED, captured.** Run it against the tree as it stands. It must fail naming exactly
   `curriculum/area-2/exercises/README.md` and `curriculum/area-2/exercises/session-2` — if it
   fails naming anything else, the test is wrong before the code is.
2. **GREEN** after the manifest fix.
3. **Mutant.** Add a bogus line to the manifest and confirm the suite catches it. Remove it.

For `verify.py`, the check is a run rather than a suite: move `reference/` aside in a scratch
copy, run the harness, and confirm it says what it could not check and still exits 0.

## Files expected to change

- `tools/learner-setup/manifest.txt`
- `tools/learner-setup/SETUP.md`
- `tools/git/seed-gitea-users.sh`
- `curriculum/area-{0,1,2}/verify.py`
- `curriculum/area-0/README.md`
- `curriculum/area-{0,1}/practices/README.md`
- `README.md`
- `pyquest/packages/content/tests/learner-setup.test.ts` (new)

## Verification

```bash
cd pyquest && npm test
tools/learner-setup/pack.sh /tmp/throwaway-repo    # reaches "committed" rather than dying at step 1
py -3.14 curriculum/area-0/verify.py               # still 19 of 19 with reference/ present
```

## Evidence

- `planning/evidence/learner-setup-manifest-RED.txt` — the two named failures, before the fix.
- `planning/evidence/verify-absent-root-BEFORE-AFTER.txt` — the learner's run, and the mutant
  that reproduces the old silence.

## Outcome

**All four tools run.** `pack.sh` reaches "committed" — `8 passed, 0 failed`, 17 manifest entries
all present — for the first time since ADR 0007's rename. Full suite 1172 passed, 1 skipped;
`validate:content` and `validate:plans` both clean.

The manifest test did what it was written for. RED named exactly the two predicted paths and
nothing else, GREEN after the one-line repoint, and a seeded bogus entry was caught and named.
The `verify.py` change was mutated the same way: deleting the two reporting lines reproduced
`17 of 17` with no mention of the missing tree, which is the bug it was written against.

### Deviations from the plan

- **`curriculum/area-2/practices/README.md` was added to the scope.** It carried the identical
  *"Each `session-<n>/` directory"* opener as areas 0 and 1. The `area-2` track is not
  in-progress, so there was no collision, and leaving one of three identical files stale would
  have been a worse outcome than a slightly wider diff.
- **`curriculum/area-0/README.md` needed more than its one wrong line.** The concept-coverage
  table still named nine `sNeM_*.py` files, the heading read *The sessions*, its column header
  read *Session*, and **the directory map placed the drill files under `exercises/`** — which is
  the two-bodies confusion this wave exists to untangle, asserted in the one document a DM reads
  first. The map now names both trees and says they are different objects.
- **`in_session_order` in `curriculum/area-1/verify.py` was renamed** to `in_practice_order`,
  matching area 3. Its docstring already said *practice*; only the identifier was stale.
- **The root README's test count was 1170 and is now 1172.** A hardcoded count in a README goes
  stale on any commit that adds a test. Worth replacing with something that cannot drift, but
  that is a convention change rather than this repair.
- **`tools/` was deliberately left alone.** Fifteen `session <n>` references across six files
  still name the unit there. Four of those six files belong to `practice-zero`'s declared file
  set for the install-order rewrite, so the sweep was **recorded in that plan** rather than taken
  here — `plan-workflow` admits parallel plans only on disjoint files.
- **`curriculum/README.md` was not touched.** Its Area 3 status row is stale, and that file is
  written by the `main` track by its own stated rule. Raised rather than edited.

### Found while working, not fixed

- **`pack.sh` rejects a valid target when Git Bash aliases the path.** `/tmp/...` and
  `/c/Users/<user>/AppData/Local/Temp/...` are one directory under two spellings, and
  `pack.sh:105`'s root check compares them as strings after `cd && pwd`, which preserves the
  logical path. Its comment already anticipates the `C:/` versus `/c/` case and this is a second
  one it does not cover; `pwd -P` would resolve both. Only bites for `/tmp`-aliased targets, so
  it was left for `gitea-remote`, which is rewriting that block for `--remote` anyway.
- **`curriculum/area-3/verify.py` is still silent about an absent root.** It has the
  `if d.exists()` guard so its denominator is honest, but it does not say what it skipped. The
  `area-3` track is in-progress and owns the file.
