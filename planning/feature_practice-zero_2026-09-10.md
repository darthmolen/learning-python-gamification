---
kind: plan
status: queued
track: practice-zero
date: 2026-09-10
---

# Practice 0 — the bootstrap, admitted rather than hidden

**Status:** Planned
**Track:** `practice-zero`
**Date:** 2026-09-10
**Author:** Claude (Opus 5)
**Lane:** A and B
**Wave:** `wave-4_the-workflow-and-the-bootstrap_2026-09-10`

## Objective

Make git install #1, give Area 0 a Practice 0 in which the learner creates their own repository,
and let the number `0` through the schema, the contract, the validator and the database.

## Why this exists

**The transport cannot deliver its own prerequisite.** `tools/learner-setup/` ships the payload as
a branch of the learner's repository — `git fetch && git checkout learner-setup` — and the payload
contains `tools/git/README.md`, the instructions for installing git. The learner needs git, a
clone and a Gitea account to receive the document telling them to install git.

`SETUP.md` lists git as install #3 and the remote as #4; `tools/git/local-lan-learner.md` creates
the repository in **week 6**, Area 2a. So the ordering is not merely awkward, it is circular.

**It was never designed for this.** `tools/learner-setup/` came out of
`feature_world-shim_2026-08-28`, whose closing notes say so: *"Getting `curriculum/lib/` and the
harness onto the other machine by hand was the thing that revealed it should be a command."* That
machine already had git, a repository and a remote. `tools/README.md:46` now advertises the same
tool as *"Putting a new machine into service"*, which is a job it never had.

**The fix is to make the bootstrap a lesson instead of a footnote.** git becomes install #1, and
Area 0 gains **Practice 0 — create your first repository**. It is a bootstrap disguised as a
lesson, which is honest for a DM-led run and is the arrangement run 1 has.

Practice 0 also earns its number. `curriculum/how-to/how-to-learn.md` tells the learner the
practices in an area "run in order from 1"; a practice numbered 0 says *before the work starts*,
which is exactly what setup is. Area 0 and Practice 0 are the same joke told twice, deliberately.

## Blocked on

**`gitea-remote`'s LAN half, and the stub behind it.** Practice 0 puts a clone on the learner's
machine in week 1, which needs Gitea reachable from that machine.
`planning/backlog/feature_gitea-lan-access-for-the-son_2026-08-27.md` records the opposite as
measured: `GITEA_DOMAIN=localhost` so advertised clone URLs point at the reader's own laptop, and
no firewall rule for 3080 or 3022 — `LAN 3080 -> 000`.

That stub sat in the backlog because nothing needed it. This needs it. **Do not start the content
half until a `curl http://<host>:3080/api/healthz` from the learner's machine returns
`{"status":"pass"}`.**

## `n: 0` is refused in four places

All four are small. They span three packages and the database, which is why this is a track and
not a commit.

| Where | Today | Change |
|---|---|---|
| `packages/content/src/schema.ts:341` | `n: z.number().int().positive()` | `nonnegative()`, and the `/** 1-based … */` comment corrected |
| `packages/contract/src/endpoints.ts:399` | `n: z.number().int().positive()` | the same |
| `packages/content/src/validate.ts:607-616` | `practice-numbering` hardcodes `expected = i + 1` | start at 0 **or** 1, contiguous thereafter |
| `packages/db/migrations/0007-practice-progress.sql` | `CHECK (practice_n > 0)` | a new migration relaxing it to `>= 0` |

**Allow Practice 0 in every area, not only Area 0.** A Practice 0 is setup that precedes the
work, and Area 3's ursina install is the next honest candidate — `tools/README.md` already schedules
it for week 9 and `curriculum/lib/smoke.py` is already the thing that proves it. Restricting the
number to Area 0 would bake a special case into a schema that 150 quests are authored against,
which is the argument §6.3 already made when it chose a role over a family member.

The numbering rule keeps its real job. It exists because *"a gap is an unwritten practice or a
half-done renumbering, and the learner meets it as 'what happened to 3?'"* — so the sequence must
still be contiguous, and must still start somewhere sensible. `0, 1, 2` and `1, 2, 3` are legal;
`2, 3, 4` and `0, 2, 3` are not.

**Do not forget the migration.** The tick is the one place a person will notice this at runtime,
and `practice_progress` will refuse the row silently from the API's point of view. Also check the
`:practiceN` route parameter's coercion in `apps/api/src/server.ts` — a positive-integer parse
there would reject `0` before the database ever sees it.

## The content

### `git-clone` becomes an Area 0 concept

`concepts.ts` gains `{ id: 'git-clone', label: 'git clone', area: 0 }`.

**Do not move `repository` or `git-init` down from area 2.** Area 2a still teaches what a
repository *is*, and a learner who has been using one for five weeks without understanding it is
in exactly the state Area 0 already engineers for types: they meet `str`, `float` and `TypeError`
by accident in Practices 1 to 3, and Practice 4 names what they have already tripped over.
`curriculum/area-0/README.md` argues that at length under "Why this order". The same argument
carries git.

**The glossary entry is required, not optional.** `glossaryIssues` (`validate.ts:946-991`) is
bidirectional: it fails an area whose glossary omits a concept of that area, *and* fails a
glossary that defines one belonging elsewhere. So `curriculum/area-0/glossary.md` must gain a
`## git-clone` section, or `validate:content` goes red.

### The practice itself

- `curriculum/area-0/practices.yml` — the `n: 0` entry, `exercises: []`. Empty is already legal
  and already used: Practice 1's three drills are delivered at the table.
- `curriculum/area-0/practices/practice-0-<slug>.md` — the DM-voiced plan, in the five-beat shape
  every other plan uses. It is a setup evening, so it will not fill 45 minutes, and the plan
  should say so rather than padding.
- `curriculum/area-0/README.md` — a row in the table, and **"All nine Area 0 concepts are
  covered" becomes ten.**

### The install order

- `tools/README.md` — git moves to #1 in "Every learner's machine", and the note that the remote
  is "a separate decision" no longer holds for week 1.
- `tools/learner-setup/SETUP.md` — the ordered table, and the paragraph opening *"Python is first
  and everything else is downstream of it"*, which stops being true.
- `tools/git/local-lan-learner.md` — it is headed *"Needed week 6, Area 2a"*. It is now needed
  week 1, and the four steps become Practice 0's spine.

**Do not move VS Code.** `tools/README.md` and Area 0's DM guide both say week 7 and give the
reason; nothing here touches it.

### The rename never reached `tools/`

ADR 0007 renamed the unit in `curriculum/`, and `tools/` still says *session* where it means the
work. **Fifteen instances across six files**, found on 2026-09-10 while repairing the manifest:

```text
tools/git/README.md:3,17,61     tools/python/README.md:5,30,53
tools/README.md:60,63           tools/ursina/README.md:3
tools/learner-setup/SETUP.md:20,38   tools/vscode/README.md:7,83,115,212
```

Every one is *"Area 0 session 1"*, *"Area 2b session 7"*, *"the session 6 stall"* — a digit after
the word, which CLAUDE.md's rule says names the **unit**. None of them means an evening, so all
fifteen become *practice*.

**This track takes them because it already owns four of those six files** for the install-order
rewrite, and `feature_learner-setup-repairs_2026-09-10` deliberately left them alone rather than
collide. Apply the rule per instance rather than a blanket replace — the same rule read backwards
is what makes a find-and-replace get both halves wrong in opposite directions.

## The authored-area edit this forces

`curriculum/area-2/exercises/the-first-commit/BRIEF.md:8` reads:

> A repository of your own, that you named. Not one I named. `git init` it.

After Practice 0 the learner has one, and named it — so §7's *"one repository for all their
projects, and they choose the name"* survives intact, and that sentence does not.

Re-point the exercise at what `git init` **does**, in a throwaway folder they can delete
afterwards. That keeps the teaching — a repository is a folder that remembers, and you can make
one anywhere — and drops only the claim that this is the first one they have ever had.
`curriculum/area-2/practices/practice-1/w1_the_folder_that_remembers.md` is the walkthrough that
carries the same beat and will need the same pass.

**This is an edit to authored Lane B content, and it is the real cost of moving git to #1.** It
is called out here rather than discovered during execution.

## Tests

Fixtures under `packages/content/fixtures/broken/`, following the established pair:

| Fixture | Spine | Expected |
|---|---|---|
| `practices/` (existing valid control) | `1, 2, 3` | silent |
| a new valid fixture | `0, 1, 2` | silent |
| `practice-numbering-start/` | `2, 3, 4` | one issue |
| `practice-numbering/` (existing) | a gap | one issue |

**The mutant:** restore `expected = i + 1` and confirm the `0, 1, 2` fixture goes red. That is the
only thing that proves the relaxation was actually made rather than merely intended.

The database change needs its own check — insert a `practice_n = 0` row against a migrated
database and confirm it is accepted. `packages/db/tests/schema.test.ts` is where that belongs.

## Files expected to change

- `pyquest/packages/content/src/{schema.ts,validate.ts,concepts.ts}`
- `pyquest/packages/contract/src/endpoints.ts`
- `pyquest/packages/db/migrations/0008-*.sql` (new), `pyquest/packages/db/tests/schema.test.ts`
- `pyquest/apps/api/src/server.ts` (the `:practiceN` parameter, if it coerces)
- `pyquest/packages/content/fixtures/**`, `pyquest/packages/content/tests/practices.test.ts`
- `curriculum/area-0/{practices.yml,glossary.md,README.md}`,
  `curriculum/area-0/practices/practice-0-*.md` (new)
- `curriculum/area-2/exercises/the-first-commit/BRIEF.md`,
  `curriculum/area-2/practices/practice-1/w1_the_folder_that_remembers.md`
- `tools/README.md`, `tools/learner-setup/SETUP.md`, `tools/git/local-lan-learner.md`

## Verification

```bash
cd pyquest
npm run validate:content    # the 0-start spine, and the git-clone glossary entry
npm test
npm run migrate             # then insert a practice_n = 0 row
```

Then with the stack up: tick Practice 0 on the Area 0 screen and confirm the row persists across
a reload. The tick is the only runtime path that touches the `CHECK` constraint, so it is the only
one that proves the migration landed.

## Evidence

`planning/evidence/practice-zero-RED.txt` — the four refusals, before any change.
`planning/evidence/practice-zero-MUTANT.txt` — `expected = i + 1` restored, `0, 1, 2` red.
