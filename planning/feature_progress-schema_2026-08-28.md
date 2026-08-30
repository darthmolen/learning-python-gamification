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

**Decisions, made.** The first review's verdict was that this plan named its open questions
instead of closing them, which is fair: a plan that says "choose a migration tool" is a plan
nobody can start. Each of these is now a ruling, not a topic.

*The migration runner is ours, about forty lines.* `packages/db/src/migrate.ts` reads
`migrations/*.sql` in lexical order, takes a Postgres advisory lock, and applies each unapplied
file inside its own transaction, recording it in `schema_migrations(version, applied_at)`.
Files are `NNNN-kebab-name.sql`, zero-padded, forward-only. `node-pg-migrate` was the
alternative and it is a good library; it earns its keep on teams that need down-migrations,
multiple environments and a rollback story, and this campaign has one database, one household
and a rehearsed restore that is a better rollback than any migration tool's. The forty lines
are also readable by the person this repository is for.

*`concept_id` in SQL, `conceptId` in TypeScript.* The column is `concept_id` everywhere,
including `concept_reviews` where it is currently written `concept`. The repository maps to
camelCase at its boundary, which it does for every other column anyway.

*No composite foreign key from `forced_reviews` to `concept_reviews`.* Tempting, and wrong. A
Datamine is granted when a quest is failed enough times, and it schedules reviews for that
quest's concepts; a `concept_reviews` row is written when a concept first goes onto the ladder.
Nothing in the application guarantees the second happens before the first, so the FK would make
a legal sequence fail at write time. The engine already handles the gap — `dueInvasions` skips a
forced review whose concept has no ladder row — and an integration test pins that behaviour
rather than a constraint pinning the ordering.

*`runner_jobs` is defined in the api plan and implemented here.* Its columns follow from how
Submit works, which is that plan's subject. See its schema appendix; this plan writes the
migration against it and does not invent a second version.

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

## The tables, in full

Names and hints are not implementable, which the review said about `players`, `sessions`,
`bounties` and `forced_reviews`. Every table below carries its keys and its checks, because
the criterion above promises the constraint rather than a comment about it.

**Date-like columns, per column** — the contract types `earnedAt`, `lastReviewedAt` and `dueOn`
as ISO calendar dates, so those columns are `DATE`. Everything that is a sequence is
`TIMESTAMPTZ`, because ordering within a day is the whole point of it.

| Column | Type | Why |
|---|---|---|
| `quest_medals.earned_at` | `DATE` | contract says a date; nothing orders two medals within a day |
| `concept_reviews.last_reviewed_at` | `DATE` | the §5.4 ladder counts in days |
| `forced_reviews.due_on` | `DATE` | a schedule, not an instant |
| `journal_entries.session_date` | `DATE` | one entry per session day |
| `attempts.attempted_at` | `TIMESTAMPTZ` | scars are a sequence (§5.3); order within a day matters |
| `datamines.unlocked_at` | `TIMESTAMPTZ` | follows the attempt that triggered it |
| `sessions.scheduled_for` | `DATE` | a session is a day |
| `bounties.posted_at`, `claimed_at` | `TIMESTAMPTZ` | a lifecycle |
| `runner_jobs.*` | `TIMESTAMPTZ` | a queue, ordered to the millisecond |
| `schema_migrations.applied_at` | `TIMESTAMPTZ` | audit |

**`players`** — `id uuid pk default gen_random_uuid()`, `handle citext not null unique`,
`display_name text not null check (length(trim(display_name)) > 0)`, `created_at timestamptz
not null default now()`.

**The contract's `playerId` is `players.id`, the UUID.** An earlier draft said `handle`, which
contradicted every other table keying on `player_id uuid` — and the two are genuinely different
things, so the repository would have mapped whichever one the author had in mind that morning.
`handle` is for routing and for humans; it can be changed without rewriting history, which is
exactly why it cannot be the identity. `display_name` is roster data the API joins and the
engine never sees (§6.2, §6.7).

**`player_roles`** — `(player_id, role)` primary key, `role text not null check (role in
('player','dm'))`, FK to `players` on delete cascade. Kitchen Table is one adult with both
rows. The PK is what stops a player holding `dm` twice.

**`quest_medals`** — `(player_id, quest_id, medal)` primary key exactly as §6.2 writes it,
`earned_at date not null`, `xp_awarded integer not null check (xp_awarded >= 0)`. Zero stays
legal: at the DC floor a medal genuinely pays nothing, which §5.10 says reads as a brag. The PK
is what makes "a medal pays once" true in the data rather than in a code path.

**`attempts`** — `id bigserial pk`, `player_id`, `quest_id text not null`, `passed boolean not
null`, `attempted_at timestamptz not null default now()`, `detail jsonb`. Never deleted: a scar
is an attempt with `passed = false` (§5.3, §3.5), and there is no separate scars table to
disagree with this one.

**`datamines`** — `(player_id, quest_id)` primary key — one Datamine per quest per player —
`unlocked_at timestamptz not null`, `attempts_before integer not null check (attempts_before >
0)`, `note text not null check (length(trim(note)) > 0)`. The note is required by §5.5 and the
check is what makes "required" true of an empty string too.

**`concept_reviews`** — `(player_id, concept_id)` primary key, `last_reviewed_at date not
null`, `rung smallint not null check (rung between 0 and 4)`. The bound is the ladder's length
and the contract restates it as `TOP_RUNG_BOUND`; the engine's suite already asserts the two
agree, and this check is the third place the same number is pinned. That is deliberate.

**`forced_reviews`** — `(player_id, concept_id, due_on)` primary key, which makes scheduling
the same review twice impossible, `source text not null check (source in ('datamine'))`,
`created_at timestamptz not null default now()`. `source` is an enum of one today and exists
because §5.5 is not the only thing that could ever schedule a forced review; a check with one
value is cheaper than a migration later. **No FK to `concept_reviews`** — see the ruling above.

**`journal_entries`** — `(player_id, session_date)` primary key, `commit_sha text not null
check (commit_sha ~ '^[0-9a-f]{7,40}$')`, `xp_awarded integer not null check (xp_awarded >= 0)`.
One entry per session day; §5.6 pays for substance, and the sha is what makes the entry real
rather than claimed.

**`sessions`** — `id bigserial pk`, `scheduled_for date not null unique`, `attended boolean not
null default false`, `forgiven_by uuid null references players(id)`, `note text`. §5.9's streak
is derived from these rows and never stored.

The uniqueness on `scheduled_for` is deliberate and worth arguing, because the spec does not
require it: the streak counts session *days*, so two rows for one date would let a single
Saturday count twice — a streak that can be inflated by writing a row is not a streak. If the
campaign ever runs two sittings in a day, they are one session with a longer note. `forgiven_by` is the only counter a human may
adjust, and it names who did it, because a forgiveness nobody signed is one nobody can discuss.

**`bounties`** — `id bigserial pk`, `posted_by`, `claimed_by uuid null`, both FK to `players`,
`title text not null check (length(trim(title)) > 0)`, `xp integer not null check (xp > 0)`,
`state text not null check (state in ('open','claimed','done','withdrawn'))`, `posted_at`,
`claimed_at timestamptz null`, plus `check ((state = 'open') = (claimed_by is null))` so a
claimed bounty cannot pretend to be open. §5.8: either player posts for the other, and both pay.

**`runner_jobs`** — per the api plan's appendix. Not restated here; one definition.

## Phases

### Phase 1 — schema and migrations

Plain SQL migrations, applied by a job in `infra/compose/migrate.yml`, per §6.1's
"migrations as a job". Forward-only; this is one household's data, not a fleet.

`src/migrate.ts` first, then the migrations it applies. The runner is ruled above: advisory
lock, one transaction per file, `schema_migrations` as the ledger, `NNNN-kebab-name.sql`.

Its own filter test comes before any table: apply a migration twice and prove the second run is
a no-op; apply one that fails halfway and prove nothing from it survives the rollback. A
migration runner that has never been watched fail on a broken file is the thing you find out
about at the worst moment.

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
is a bad Saturday.

The lifecycle, stated: the suite creates `pyquest_test_<pid>` in `globalSetup`, runs the
migrations against it, hands its URL to the tests, and drops it in `globalTeardown` — with the
drop also running on failure, since a suite that leaves a database behind every time it fails
is one that fills a disk on the day you can least afford it. The name carries the pid so two
runs cannot collide.

Per the test-filter skill, a mock here *is* the schema you forgot to write. Seed a player,
award a medal, replay it, prove the primary key refuses the duplicate.

Then seed the mutants, which for a schema means removing the constraint and proving the bad
row lands. A constraint nobody has watched fail is a comment.

Drop the `quest_medals` primary key and insert the same medal twice. Drop the rung check and
store 9. Drop the `xp_awarded` check and store −5. Drop `player_roles`' primary key and give one
player `dm` twice. Drop the `bounties` state check and store `'pending'`; drop its
claimed-implies-not-open check and leave a claimed bounty open. Drop the `datamines` note check
and store `''`. Drop the `forced_reviews` primary key and schedule the same review twice. Drop
a foreign key and orphan an `attempts` row against a player who does not exist. Drop the `datamines`
`attempts_before > 0` check and record a Datamine granted after zero failures. Drop the
`journal_entries` sha pattern and store `not-a-sha`. Drop `sessions.forgiven_by`'s foreign key
and forgive a streak in the name of a player who does not exist.

Every one of those is a row the application would happily have written on some Tuesday.

## Dependencies / Prerequisites

- `infra/` compose stack — done, healthy, restore rehearsed
- `packages/contract` — the shapes the repository returns. Its payload half is **done**; the
  seven row shapes this track owes are listed above
- `planning/feature_contract-modules_2026-08-29.md` — **blocks Phase 2.** Phase 1 is SQL and
  needs no TypeScript at all, so migrations can start before the split lands
- The api plan's `runner_jobs` appendix, before the migration that creates that table

## Files Expected to Change

- `pyquest/packages/db/**` — new: migrations, the runner, repository, integration tests
- `pyquest/packages/contract/src/progress.ts` — **this track owns it**, per
  `planning/feature_contract-modules_2026-08-29.md`. Seven row shapes the contract does not
  have yet: `players`, `player_roles`, `attempts`, `datamines`, `journal_entries`, `sessions`,
  `bounties`. The three the engine reads are already there and are not to be edited here
- `pyquest/tsconfig.json` — a project reference. Unlike `apps/*`, this package **is** imported
  — `apps/api` depends on it — so it joins the composite build, and a package missing from
  that explicit list is silently skipped by `tsc -b`
- `pyquest/vitest.config.ts` — the source alias, so tests never resolve through a stale `dist`
- `infra/compose/migrate.yml` — the migration job; this track owns the file,
  and the root `docker-compose.yml` is not the place
- `infra/smoke.sh` — assert migrations applied and restore still round-trips

## Track discipline

`pyquest/tsconfig.json` is uncontended: `apps/*` are leaves that nothing imports, so only
`packages/db` needs a project reference.

**`pyquest/vitest.config.ts` is not**, and an earlier draft of this plan claimed it was. The
`spa` track names that file too, for the `projects` entry that gives `apps/web` a DOM. Two
tracks, one file, both adding a distinct entry — so coordinate on it rather than assume: this
track adds one alias line, and if the `spa` track is mid-edit the two changes are appended, not
merged blind. It is a candidate for the same treatment `infra/docker-compose.yml` got, if it
blocks anything.

`pyquest/packages/contract/src/progress.ts` is this track's alone after
`planning/feature_contract-modules_2026-08-29.md` lands. `index.ts`, `primitives.ts` and
`payloads.ts` are `main`'s; `endpoints.ts` is the `api` track's. This plan edits none of them.

`infra/compose/migrate.yml` is this track's, per
`planning/completed/feature_compose-fragments_2026-08-29.md`. The root `docker-compose.yml`
is not to be edited here.

`infra/smoke.sh` is this track's for the duration, and it is shared with nobody today.

## Out of Scope

Content of any kind. If a migration inserts a quest, this plan has gone wrong.

---

## Review History

**v1 reviewed 2026-08-29 — implementable with fixes.** Five criticals, all of the same kind: the
plan named its decisions instead of making them. The migration runner, the `concept_id` naming,
the composite-FK question and the full shapes for `players`, `sessions`, `bounties` and
`forced_reviews` are now rulings, and the schema appendix exists.

**v2 reviewed 2026-08-29 — implementable, minor fixes, not blocking Phase 1.** Three findings.
The identity mapping was the one that mattered: `playerId` is `players.id`, not `handle`, and
the draft had said both. The uniqueness on `sessions.scheduled_for` is now argued rather than
asserted.

Three of the four missing mutants were real and are added — `attempts_before > 0`, the journal
sha pattern, and `sessions.forgiven_by`'s foreign key. The fourth, the `bounties`
claimed-implies-not-open check, was already in the list.

No v3. The reviewer's own verdict was that nothing here blocks starting, and Phase 1 is plain
SQL that depends on none of it.
