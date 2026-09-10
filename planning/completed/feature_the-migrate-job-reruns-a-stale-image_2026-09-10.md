---
kind: plan
status: completed
track: infra-migrate
date: 2026-09-10
completed: 2026-09-10
---

# The migrate job reruns a stale image

**Status:** Complete
**Track:** infra-migrate
**Date:** 2026-09-10
**Author:** Claude (Opus 5)
**Lane:** A

## Objective

Stop `docker compose --profile migrate run --rm migrate` from reporting success about migrations
it has never seen.

## Why this exists

The production database sat one migration behind for four days while the documented command said
it was finished.

`docker compose run` uses the image if one exists — it does not rebuild — and the migrations are
**baked into** the image rather than mounted. So a `pyquest-migrate:local` built before a
migration was written runs the migrator it was built with, finds every file it knows about
already applied, and prints:

```console
migrate: already up to date
```

That sentence is true. It is a statement about the image, and it reads as a statement about
`packages/db/migrations/`.

### Measured, 2026-09-10

| | |
|---|---|
| `pyquest-migrate:local` built | 2026-09-01, six migrations inside |
| `0007-practice-progress.sql` written | 2026-09-06 |
| `pyquest` ledger | six rows |
| the job's report | `already up to date` |

**And the api was already live against the gap.** `pyquest-api:local`, built 2026-09-07, carries
`0007` in its own copy of the repository *and* reads the table it creates — `apps/api/src/store.ts`
has a `SELECT FROM practice_progress`, an `INSERT INTO` it and a `DELETE FROM` it. Production was
serving an api that queries a table its database did not have. Nothing had reached the route
(`0` matching errors in the container log), so the first practice tick would have been the
discovery.

### The same shape as the plan before it

This is `the-build-and-the-tests-see-the-same-code_2026-09-09` again, one layer out: a build
artifact silently behind source, and a tool truthfully reporting success about the stale view it
can see. There `tsc -b` trusted `tsconfig.tsbuildinfo`; here `compose run` trusts an image tag.
Both are correct programs answering the question they were actually asked.

## Success criteria

- [x] The documented command cannot silently under-migrate
- [x] Every live call site carries the fix, not just the README
- [x] `smoke.sh` cannot pass against a stale migrate image
- [x] Demonstrated: the old command under-migrates a fresh database, the new one does not
- [x] Production is migrated, and nothing else in it moved

## What was changed

| file | change |
|---|---|
| `infra/README.md` | `--build` in the quick start, with the failure written out |
| `infra/compose/migrate.yml` | the header — the command, and why `--build` is not optional |
| `infra/bounce.cmd`, `infra/start-full.cmd` | `--build`, with a comment each |
| `infra/smoke.sh` | builds **once** before the two runs, and credits the check that catches this |

`smoke.sh` builds once rather than passing `--build` to both runs, so the two stay comparable —
they must differ only in that one has already been done.

## Verified

The old and new commands, on the same stale image, against a throwaway database:

```console
######## OLD (no --build), fresh database, stale image ########
  migrate: applied 0001-players-and-campaign.sql
  ... through 0006-credentials-and-tokens.sql
  ledger: 6 migrations
  on disk: 7            <-- the job said it was finished; it is one short

######## NEW (--build), same image, same database ########
  migrate: applied 0007-practice-progress.sql
  ledger: 7 migrations
  on disk: 7            <-- matches

######## still idempotent ########
  migrate: already up to date
```

The stale image was reconstructed deliberately — `0007` moved out of the tree, image built, `0007`
put back — so the failure was reproduced rather than remembered. `pyquest_staletest` was dropped
afterwards.

Production, migrated with a `pg_dump` taken first
(`/c/pyquest-backups/pyquest-pre-0007-20260910-064046.sql`):

```console
migrate: applied 0007-practice-progress.sql
migrations=7 players=2 medals=26 attempts=8      (players/medals/attempts unchanged)
practice_progress rows: 0
3081=200  3082=200                                (never interrupted)
```

`0007` is a single `CREATE TABLE` — no `ALTER`, no `DROP`, no data touched — which is why applying
it to a live database was a small act rather than a large one.

## Where I was wrong before looking

I told the user `smoke.sh`'s migrate assertions "pass while measuring nothing". **Half right, and
the correction matters.** Its *idempotency* check — run twice, expect "already up to date" — is
indeed satisfied by a stale image for the wrong reason. But the check immediately after it counts
the `.sql` files on disk against the `schema_migrations` ledger, and that one is exactly right:
it asks the repository rather than the container, which is the only question a stale image cannot
answer wrongly. `smoke.sh` would have caught this the moment anyone ran it.

So the suite was not broken. It was not run. The comments now say which check is load-bearing and
why, so the next person does not draw the conclusion I did.

## Still open, and who owns it

**The general problem is bigger than `migrate`.** Every `:local` image can be behind source in
exactly this way, and two are today: `pyquest-api:local` and `pyquest-web:local` are 3 days old,
`pyquest-runner:local` is 8. For the api and web that is arguably correct — they are deliberate
release artifacts and production should not rebuild itself on a whim. For `migrate` it is not,
because a migrator is a *tool run against source*, not a release.

That distinction is the real design question and this plan does not settle it. What it does is
fix the one case where the answer is unambiguous. **Owner: unassigned — an `infra` question, and
the shape of it is "which of our images are releases and which are tools".**
