# The Progress Schema

**Status:** Planned
**Track:** db
**Date:** 2026-08-28
**Author:** Claude (Opus 5)
**Lane:** A — **blocks the API**

## Objective

The Postgres schema for everything a player accumulates, plus migrations that run as a
compose job. Progress only: content stays in git.

## Why this exists

§6.7 draws the line this whole plan sits on — **content lives in git, progress lives in
Postgres, and the two never mix.** There is no `quests` table. Rows reference quest ids as
strings, and the validator guarantees those resolve at load, so the database never becomes
a second, stale copy of the curriculum.

## Success Criteria

- [ ] Migrations run forward from empty against the real Postgres in `infra/`
- [ ] Every table has the constraint that makes its invariant impossible to violate — not
      a comment saying what the invariant is
- [ ] Integration tests run against a real database, not a mock (§ composition axis)
- [ ] `pg_dump` / restore still round-trips, verified by `infra/smoke.sh`
- [ ] No table stores anything derivable — no cached XP totals, no `is_unlocked`
- [ ] Every row shape the repository returns parses through its `@pyquest/contract` schema,
      in a test — the database's half of the check the engine already makes
- [ ] `npm run typecheck` from `pyquest/` covers this package and its tests
- [ ] Integration tests run against a scratch database and leave the real one untouched

## Approach

**Tables, from the spec.**

| Table | Holds | Spec |
|---|---|---|
| `players` | handle, display name, roles | §5.11 |
| `quest_medals` | `(player_id, quest_id, medal, earned_at, xp_awarded)` — PK on the first three | §6.2, exactly as written |
| `attempts` | every submit, passed or not. Failures are scars and are never deleted | §5.3, §3.5 |
| `datamines` | `(player_id, quest_id, unlocked_at, attempts_before, note)` — the note is required | §5.5 |
| `concept_reviews` | `(player_id, concept, last_reviewed_at, rung)` — rung indexes the ladder | §5.4 |
| `forced_reviews` | Datamine's +3 and +10 day guarantees, which are a second source | §5.5 |
| `journal_entries` | `(player_id, session_date, commit_sha, xp_awarded)` | §5.6 |
| `sessions` | scheduled, attended, forgiven_by — the streak, and the only counter a human may adjust | §5.9 |
| `bounties` | posted_by, claimed_by, xp, state | §5.8 |
| `runner_jobs` | the queue the API and runner share | §6.6 |

**What the contract already fixed, on 2026-08-29.**

`packages/contract` declares the rows this schema has to produce — the input half was
written *from this table list*, so the two are already meant to agree and the places they do
not are worth naming before a migration is written.

- `QuestMedalRecord` — `{ playerId, questId, medal, earnedAt, xpAwarded }`, matching
  `quest_medals` exactly.
- `ConceptReview` — `{ playerId, conceptId, lastReviewedAt, rung }`. The table calls that
  column `concept`; the repository maps it. Pick one name and let the other be the mapping,
  rather than discovering the difference in a query.
- `ForcedReview` — `{ playerId, conceptId, dueOn }`. **The table list gives this one no
  columns at all**, so the contract has already settled a shape this plan left open.
- `PlayerProgress` bundles the three, and every row must carry the same `playerId` — the
  contract refuses a mixed bundle, so the repository must not assemble one.

**A rule the engine already relies on.** `dueInvasions` skips a forced review whose concept
has no `concept_reviews` row, on the reasoning that the ladder row is written when a concept
is first taught and a corrupt row should not stop a session. The database can make that
unreachable with a composite foreign key to `concept_reviews(player_id, concept)`, or it can
allow it and let the engine's skip be the net. That is a decision this plan should make and
state, not inherit by accident.

**Dates are calendar dates, and that is not what the column names say.** The contract types
`earnedAt`, `lastReviewedAt` and `dueOn` as ISO calendar dates, because §5.4's ladder counts
in days and nothing in the queries needs finer than that. The table list names
`earned_at`, `last_reviewed_at` and `unlocked_at`, which read as timestamps.

Settle it per column rather than globally: `DATE` where only the day matters, `TIMESTAMPTZ`
where ordering within a day does — `attempts` almost certainly wants the timestamp, since
scars are a sequence and §5.3 cares about the order of them. Wherever the two differ, say
where the narrowing happens, because a repository that silently truncates a timestamp to a
date is a lossy conversion nobody wrote down.

**The constraints the contract now names.** The criterion above promises "the constraint that
makes its invariant impossible to violate," and two of them are no longer a judgement call:
`rung BETWEEN 0 AND 4`, because the ladder has five rungs and the contract bounds it there;
and `xp_awarded >= 0`, because a medal at the DC floor pays zero and nothing pays less. Zero
must stay legal — §5.10 says a medal paying nothing reads as a brag, not as an error.

**Three decisions worth stating.**

*Roles are a table, not a boolean.* `player_roles(player_id, role)` where role is `player`
or `dm`. Kitchen Table mode is one adult with both rows. An `is_parent` column would make
every other arrangement a migration — the same mistake the content contract already made
once with `by: 'parent' | 'son'`.

*Scars are attempts, not a separate concept.* A scar is an attempt with `passed = false`.
Storing them separately invites the two to disagree about how many there were.

*XP is summed, never stored.* `quest_medals.xp_awarded` records what a medal paid at the
moment it was earned, because §5.10 prices the delta once and re-pricing history later
would be a lie. Totals are `SUM`. A cached total is a second source of truth that will
drift the first time a medal is corrected.

## Phases

### Phase 1 — schema and migrations

Plain SQL migrations, applied by a job in `infra/compose/migrate.yml`, per §6.1's
"migrations as a job". Forward-only; this is one household's data, not a fleet.

**What applies them is an open choice and the first thing to make.** The fragment runs
`npm run migrate --workspace @pyquest/db`, so something has to exist behind that script: a
dependency like `node-pg-migrate`, or forty lines that read a directory, check a
`schema_migrations` table and run each file in a transaction. Forward-only and one database
argues for the forty lines; a dependency argues for not maintaining them. Either is
defensible and the plan should not start until one is chosen, because it decides what the
migration files look like.

### Phase 2 — the repository layer

Thin functions returning the shapes `@pyquest/contract` declares — `QuestMedalRecord`,
`ConceptReview`, `ForcedReview`, assembled into `PlayerProgress`. No business logic — the
engine owns that, and a rule the SQL knows but the engine does not is a rule with two homes.

Every returned shape is parsed through its schema in a test. The engine does this in the
other direction and it is the only thing that makes "the repository returns what the contract
declares" a fact rather than an intention.

### Phase 3 — integration tests

Against the real container, into a **scratch database** — `restore.sh` already establishes
the pattern with `pyquest_scratch`, and a test suite that truncates the real progress table
is a bad Saturday. Created and dropped per run; the plan should say which.

Per the test-filter skill, a mock here *is* the schema you forgot to write. Seed a player,
award a medal, replay it, prove the primary key refuses the duplicate.

Then seed the mutants, which for a schema means removing the constraint and proving the bad
row lands: drop the `quest_medals` primary key and insert the same medal twice; drop the rung
check and store 9; drop the `xp_awarded` check and store −5; drop the roles table's uniqueness
and give one player `dm` twice. A constraint nobody has watched fail is a comment.

## Dependencies / Prerequisites

- `infra/` compose stack — done, healthy, restore rehearsed
- `packages/contract` — the shapes the repository returns

## Files Expected to Change

- `pyquest/packages/db/**` — new: migrations, repository, integration tests
- `pyquest/tsconfig.json` — a project reference. Unlike `apps/*`, this package **is** imported
  — `apps/api` depends on it — so it joins the composite build, and a package missing from
  that explicit list is silently skipped by `tsc -b`
- `pyquest/vitest.config.ts` — the source alias, so tests never resolve through a stale `dist`
- `infra/compose/migrate.yml` — the migration job; this track owns the file,
  and the root `docker-compose.yml` is not the place
- `infra/smoke.sh` — assert migrations applied and restore still round-trips

## Track discipline

This track is the only Lane A plan that still touches `pyquest/tsconfig.json` and
`vitest.config.ts`. `apps/web` and `apps/api` are leaves that nothing imports, so they need
neither; `packages/db` is a library, so it needs both. That makes these shared files
uncontended in practice — but only while that stays true, and it is worth re-checking rather
than assuming if a fourth package appears.

`infra/compose/migrate.yml` is this track's, per
`planning/completed/feature_compose-fragments_2026-08-29.md`. The root `docker-compose.yml`
is not to be edited here.

`infra/smoke.sh` is this track's for the duration, and it is shared with nobody today.

## Out of Scope

Content of any kind. If a migration inserts a quest, this plan has gone wrong.

---

## Plan Review

**Reviewed:** 2026-08-29 18:07
**Reviewer:** Claude Code (plan-review-intake)

### Strengths

- Content-in-git / progress-in-Postgres boundary maintained clearly; `quests` table explicitly forbidden.
- Correctly ties repository return shapes to `@pyquest/contract` validation in tests.
- Calls out real unresolved design points instead of hiding them (`forced_reviews` shape, column naming, date types).
- Contract shapes `QuestMedalRecord`, `ConceptReview`, `ForcedReview`, `PlayerProgress` all confirmed to exist in `packages/contract`.
- `infra/compose/migrate.yml` already exists; `infra/smoke.sh` already does health, backup, restore, and scratch restore.
- `pyquest/packages/db` does not exist yet — all new work, no collision.

### Issues

#### Critical (Must Address Before Implementation)

- **Phase 1 — migration tool choice not made**
  - Section: Phase 1
  - What's wrong: The plan says choosing the tool is "the first thing to make" but leaves it open. The migration file format, scripts, and compose job contract all depend on this.
  - Suggested fix: Commit to either `node-pg-migrate` or a homegrown SQL runner; name the migration file layout and exact `npm run migrate` behavior before Phase 1 begins.

- **`runner_jobs` table has no schema**
  - Section: Approach table
  - What's wrong: Listed as a deliverable with no columns, PK, type/status enum, payload, error, or locking fields.
  - Suggested fix: Define columns before migration is written — at minimum: id, type, status (enum + check), payload (jsonb), error, created_at, claimed_at, claimed_by.

- **`sessions` and `bounties` under-specified**
  - Section: Approach table
  - What's wrong: Both have name-hints but no PKs, FK targets, required columns, state constraints, or date/timestamp choices.
  - Suggested fix: Add full row shapes with keys, nullability, checks, and per-column types for both.

- **Forced reviews / concept reviews composite FK — decision not made**
  - Section: Approach
  - What's wrong: The plan discusses both options (composite FK vs engine skip) but makes no choice.
  - Suggested fix: State the decision explicitly and include the exact FK constraint or rationale for omitting it.

- **`concept` vs `concept_id` column naming — acknowledged, not resolved**
  - Section: Approach
  - What's wrong: The mismatch is named but no canonical DB column name is chosen.
  - Suggested fix: Pick one now; `concept_id` in SQL with repository mapping to camelCase is the natural choice.

#### Important (Should Address)

- **`forced_reviews` table shape still thin**
  - Contract shape exists but DB shape has no PK, unique key, or source provenance.
  - Suggested fix: Specify PK/unique key (likely `player_id, concept_id, due_on`), a source enum/check, and FK behavior.

- **`players` table under-specified**
  - "handle, display name, roles" is insufficient to implement.
  - Suggested fix: Name `id`, `handle`, `display_name`, created/updated timestamps, uniqueness rules; keep roles in `player_roles` as stated.

- **Phase 3 scratch DB mechanics still left to the reader**
  - "Created and dropped per run; the plan should say which" — the plan says this but still leaves it open.
  - Suggested fix: Specify exact lifecycle: create uniquely named scratch DB before suite, migrate, run tests, drop in teardown.

- **Constraint mutant list incomplete**
  - Missing: FK integrity, uniqueness on roles, valid state enums, non-empty required text, duplicate datamine/forced review rows.
  - Suggested fix: Extend the list to cover these invariants.

- **`forced_reviews` / invasions coverage unclear**
  - Whether `forced_reviews` fully covers §5.5's scheduling needs is not stated.
  - Suggested fix: State explicitly whether invasions are derived from `forced_reviews` + engine time, or whether a separate schedule/audit table is needed.

#### Minor (Consider)

- **DATE vs TIMESTAMPTZ — framing is good, enumeration missing**
  - The plan argues the decision correctly; a per-column table would make it unambiguous.
  - Suggested fix: Add a mapping of every date-like column to `DATE` or `TIMESTAMPTZ`.

- **Track discipline — `vitest.config.ts` is already a declared coordination point**
  - The SPA v2 plan also lists `pyquest/vitest.config.ts` in Files Expected to Change. The claim that it is "uncontended in practice" is already out of date.
  - Suggested fix: Acknowledge active coordination with the `spa` track on this file; `tsconfig.json` appears genuinely uncontended.

### Recommendations

Start Phase 1 with a concrete decision block: migration tool, file naming convention, compose command, rollback policy. Add a schema appendix enumerating every table with columns, types, PKs, uniques, FKs, checks. Keep `vitest.config.ts` as a declared coordination point with the SPA track.

### Assessment

**Implementable as written?** With fixes

**Reasoning:** The architectural direction is sound and the boundary discipline is good, but several Phase 1 essentials are undecided — migration tooling, `runner_jobs` shape, and full table definitions for `sessions`, `bounties`, and `forced_reviews` — which blocks starting work.
