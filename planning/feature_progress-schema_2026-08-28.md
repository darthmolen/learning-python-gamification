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

Plain SQL migrations, applied by a job in `infra/docker-compose.yml`, per §6.1's
"migrations as a job". Forward-only; this is one household's data, not a fleet.

### Phase 2 — the repository layer

Thin functions returning the shapes `@pyquest/contract` declares. No business logic — the
engine owns that, and a rule the SQL knows but the engine does not is a rule with two
homes.

### Phase 3 — integration tests

Against the real container. Per the test-filter skill, a mock here *is* the schema you
forgot to write. Seed a player, award a medal, replay it, prove the primary key refuses
the duplicate.

## Dependencies / Prerequisites

- `infra/` compose stack — done, healthy, restore rehearsed
- `packages/contract` — the shapes the repository returns

## Files Expected to Change

- `pyquest/packages/db/**` — new: migrations, repository, integration tests
- `infra/compose/migrate.yml` — the migration job; this track owns the file,
  and the root `docker-compose.yml` is not the place
- `infra/smoke.sh` — assert migrations applied and restore still round-trips

## Out of Scope

Content of any kind. If a migration inserts a quest, this plan has gone wrong.
