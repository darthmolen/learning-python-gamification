# Wave 3 — The Application

**Status:** Open — three gates closed and three plans landed 2026-08-29; two remain
**Level:** Wave — coordinates plans, does not replace them
**Date:** 2026-08-29
**Author:** Claude (Opus 5)
**Tracks:** `main`, `db`, `content-wire`, `api`, `spa`, `area-0`, `area-2`, `area-3`, `world-shim`

## What a wave is, and why this is one

A plan owns a track. A **wave** owns the order the tracks start in.

The word is already this repository's. `feature_phase0-tier0-foundation` reasons about
Wave 0 and Wave 1; three backlog items record what they were discovered during; and
`feature_scoring-model-single-source` says the Datamine table lands "in Wave 3, which is the
first moment Datamine needs a real table." This document is that Wave 3, written down instead
of carried in someone's head.

**A wave is written when the plans stop fitting in a head, not before.** Nine live plans across
nine tracks is where that happened here. Two or three plans need no wave; they need a glance at
`in-progress/`.

## The problem this wave exists to solve

Nine plans are live. Four are running. **None of the five queued can start**, and not one of
them is blocked by the work it actually depends on. They are blocked by file ownership and
track capacity:

| Held plan | Held by | Kind |
|---|---|---|
| Progress Schema (`db`) | `pyquest/vitest.config.ts`, in use by `spa` | shared file |
| Content Surface (`db`) | the `db` track, plus `content/areas/area-2.yml` | track capacity |
| API and Runner (`api`) | in review; then `vitest.config.ts` | review, then shared file |
| Curriculum's Voice (`main`) | area-0 declares no file set, so nothing can be cleared against it | missing declaration |
| Area 3 (`area-3`) | world-shim and area-2, both mid-flight | **a real dependency** |

Only the last is queued for an honest reason. The other four are the same failure this project
has now hit four times — **one file doing two jobs** — after `concepts.ts`,
`pyquest/tsconfig.json`, `infra/docker-compose.yml` and `packages/contract/src/index.ts`.

## The sequence

Two short gates on `main`, then five plans start within a day of each other.

### Gate 1 — Area 0 declares its file set  *(`main`, done 2026-08-29)*

`planning/in-progress/feature_area-0-quest-backfill_2026-08-28.md` has no
`Files Expected to Change` section. The rule that admits plans in parallel is a comparison of
those lists, and one of them is absent — so every judgement about what may run beside it is a
guess wearing the clothes of a rule. Cheapest item in the wave; unblocks a whole plan.

### Gate 2 — make the alias map derive itself  *(`main`, done 2026-08-29)*

**This gate was proposed wrongly and the fix is not what it says below.** The wave asked for
`vitest.config.ts` to be split per workspace, the way `infra/compose/` was. The `spa` track had
already argued against exactly that, in the file:

> **Defined once, on purpose.** An `apps/web`-local vitest config would be a second place for
> these to be written down, and the second place is the one that goes stale — a web project
> missing the contract alias would parse its fixtures against compiled output and stay green
> against a contract that moved.

That is the better argument. Per-workspace configs make every workspace restate the alias map,
and one that forgets an entry resolves silently through `dist/`.

**What landed instead:** the map stays in one file and derives itself, reading each package's
own `package.json`. That keeps the single definition the paragraph argues for *and* removes the
queue behind the file — `db` needed one alias line and `api` needed one, and now a package that
exists is aliased with no list to forget. `db` dropped the file from its set entirely.

Verified as this wave requires: 14 files and 243 tests before, 14 and 243 after.

**The lesson for the next wave:** a gate that proposes changing a file should read that file
first. The counter-argument was written down, in the place the change was going to be made.

### Gate 3 — re-track the Content Surface  *(`main`, done 2026-08-29)*

It declares `Track: db` and so queues behind the Progress Schema. They are not the same work —
one writes SQL and a repository layer, the other writes wire shapes and YAML. Give it
`content-wire` and the bottleneck disappears.

### Then, in parallel

- **`db`** — Progress Schema. Reviewed twice; its own reviewer said nothing blocks Phase 1.
- **`main`** — Curriculum's Voice, once Gate 1 proves it disjoint from area-0.
- **`api`** — when v4 returns. Its Phase 1 writes `endpoints.ts`, which the SPA is stubbing
  against right now; this is the oldest debt on the board.
- **`content-wire`** — Content Surface, **started**. It no longer waits for area-2: that track
  is blocked on the son's laptop, so rather than hold a plan behind hardware, the content
  surface lands the six manifests nobody holds and leaves `area-0.yml` and `area-2.yml` to the
  tracks that hold them, as deferred work carried in those plans.
- **`area-3`** — after world-shim and area-2. Correctly queued; nothing to fix.

## Exit criteria

- [x] Every in-flight plan declares a file set — area-0 was the only gap
- [x] No file appears in two in-flight plans' `Files Expected to Change` — checked by listing
      every path and looking for a duplicate, not by reading
- [x] No plan lists `pyquest/vitest.config.ts` **for an alias**. Two still list it: `spa`, which
      owns it, and `api`, which needs one `projects` entry for `apps/api`'s node environment.
      That is one claimant at a time and not the queue this wave existed to break — the
      criterion was written too absolutely
- [ ] Five queued plans running or complete — **three of five.** The progress schema, the
      content surface and the curriculum's voice all landed 2026-08-29
- [ ] The API's endpoint half exists — **not started.** The plan is approved (v4, "yes, with
      one clarification") and unblocked; it is the next thing to run

## What landed, 2026-08-29

| Track | Plan | Result |
|---|---|---|
| `db` | Progress Schema | `f6ad25a` — 13 tables, migrations run against live Postgres, 60 integration tests, smoke 35/0 |
| `content-wire` | Content Surface | `81dc3ab` — six manifests carry weeks and blurb; an area's name reaches the wire from YAML |
| `main` | Curriculum's Voice | `31a115d` — 875 pronouns across 40 files; 11 deliberate survivors, all Dad |

Suite went 243 → **361 tests across 18 files**, `validate:content` clean at 8 areas.

## What the wave learned

- **A gate that proposes changing a file should read that file first.** Gate 2 proposed a split
  the `spa` track had already argued against, in the file, with the better argument.
- **Two plans by one author a day apart still disagree.** `journal_entries` was built exactly as
  its appendix ruled, and the API plan promises three columns that appendix never had. Written
  down as `planning/backlog/feature_journal-text-has-no-column_2026-08-29.md`.
- **A mutant found a test passing for the wrong reason.** Deleting the migration runner's
  transaction control left the suite green — `pg` wraps a multi-statement file implicitly, so
  the test proved something Postgres does for free. The seam it missed was between the migration
  and its ledger row, two separate calls.
- **Four agents doing RED-first work in one tree makes the shared gate meaningless.** The `spa`
  track reported 33 failures and 21 type errors it could not act on; they were the `api` track's
  RED, in an untracked file. The isolation existed and was not used. Next wave: give concurrent
  agents their own worktrees, or tell each one that `vitest --project <name>` is its gate and
  the root suite is not.
- **Blocked on hardware is not blocked on everything.** area-2 waits on a laptop; the content
  surface stopped waiting on area-2 by landing six manifests and deferring two into the tracks
  that hold them.

## What Wave 4 inherits

- The API, approved and unblocked, with the Journal columns to add first
- `area-3`, still waiting on world-shim and area-2 — the only honestly-blocked plan on the board
- Tightening `weeks`/`blurb` to required once area-0 and area-2 land theirs; until then a
  weekless manifest is invisible to the validator, which a mutant proved
- The overlap defence in `payloads.test.ts` rests on a hand-written literal carrying Area 2's
  6–8 range. When area-2 lands its weeks, that literal should give way to real content

## What this wave does not do

It does not re-plan anything. Every plan named here keeps its own objective, phases, criteria
and review history; a wave that starts editing the substance of its plans has become a very
large plan and should be split back up.

It also does not schedule Lane B. `area-0`, `area-2` and `area-3` appear because they hold
files Lane A wants, not because a wave decides when curriculum gets written. Lane B is never
the thing that gets postponed.
