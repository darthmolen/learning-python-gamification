# A Seeded Household For End-To-End Testing

**Status:** In Progress
**Track:** db
**Date:** 2026-08-31
**Author:** Claude (Opus 5)
**Lane:** A
**Promoted from:** `planning/backlog/feature_seed-a-test-household_2026-08-30.md`

## Objective

Put a known household in the database, idempotently, so the SPA pointed at a live API shows
something and an integration test has somebody to be.

## Why this exists

`select count(*) from players` returns **0**. The schema is migrated — thirteen tables, five
migrations — and nothing in the repository creates a row. So the SPA against a live API shows
empty screens or 404s, not because anything is broken but because there is nobody to have
progress.

Its promotion trigger has fired: *"Sooner if somebody wants to look at the SPA against the live
API."* That is now the ask.

It also answers a question the SPA cannot answer alone. **The fixtures and the API have never
met.** Everything in `apps/web/src/fixtures` is shaped like the contract and parsed by it, but
no test has ever compared a fixture to what `apps/api` actually returns for the same request.
A seeded household makes that comparison possible, and it is the most likely place for a real
disagreement to be hiding.

## Success Criteria

- [ ] `npm run seed --workspace @pyquest/db` fills an empty database and **is safe to run
      twice** — the second run leaves the same rows, not double
- [ ] A reset path: drop the household and re-seed, so a run starts from a known place
- [ ] **Two players**, with `player_roles` rows — `peer` and `dm`. One player cannot exercise
      peer-signoff, which §6.3 defines as "somebody other than the submitter presses the button"
- [ ] **One `campaign` row with a start date**, offset from `now`. ADR 0002 ruled `week 10 of
      48` needs one and that it is household state rather than content
- [ ] Progress covering every state the Map renders: an area **cleared**, one **in progress at
      three of five** (the §5.2 boss-unlock boundary exactly), one **started with one**, one
      **untouched**
- [ ] **Medals across more than one rung**, since `MedalSlots` renders held and unheld together
      and a fixture holding only `cleared` proves half of it
- [ ] **A concept review or two overdue**, so `/defend` returns a non-empty queue under §5.4's cap
- [ ] **Every date is an offset from `now`**, never a literal. A fixture with hardcoded dates
      passes today and fails in a fortnight
- [ ] A test that seeds, calls the real API handlers, and asserts the campaign view is non-empty
- [ ] Full suite green, typecheck clean

## Approach

**A script in `packages/db`, run from the host, not a compose service.** `migrate` already
works this way (`tsc -b && node dist/cli.js`), so `seed` follows the pattern and needs no new
container. It also keeps this plan's file set disjoint from the `infra` track running beside it.

**Idempotent by construction, not by checking.** Fixed UUIDs for the two players and
`ON CONFLICT DO NOTHING` / `DO UPDATE`, so re-running converges rather than appends. A seed that
must be run exactly once is a seed somebody will run twice.

**The area states are chosen, not arbitrary.** "Started with one" is in the list because it
caught a real bug — the first Map drew that area as locked while its own label read `1 of ~5`.
A fixture that only covers cleared and untouched would not have found it.

**Ids come from content, not from strings.** The quests seeded must be real ids read through
`@pyquest/content`, so a renamed quest breaks the seed loudly rather than leaving a progress row
pointing at nothing.

## Phases

### Phase 1 — the shape, RED first

A test that seeds into a scratch database and asserts the row counts and the four area states.
Per `test-filter-development`: capture the failure, then GREEN, then seed a mutant — a seed that
appends rather than converges — and confirm re-running twice is caught.

### Phase 2 — the script

`src/seed.ts` plus the `seed` and `seed:reset` npm scripts.

### Phase 3 — the meeting that has not happened

One test comparing a fixture in `apps/web/src/fixtures` against what `apps/api` returns for the
same request, over the seeded household. **This is the point of the plan**, not a bonus: if the
two disagree, the SPA has been developed against a shape the API does not serve.

If they disagree, **record the disagreement and stop.** Deciding which side is right is a
contract question and belongs to whoever owns the contract, not to a seed script.

## Dependencies / Prerequisites

- Postgres up and migrated. It is — 41 hours, healthy, five migrations applied.
- No dependency on the `infra` track. That track wires the browser to the API; this one gives it
  something to show. Either can land first.

## Files Expected to Change

- `pyquest/packages/db/src/seed.ts` — new
- `pyquest/packages/db/src/index.ts` — export it
- `pyquest/packages/db/package.json` — `seed`, `seed:reset`
- `pyquest/packages/db/tests/seed.test.ts` — new
- `pyquest/apps/api/tests/fixtures-agree.test.ts` — new, Phase 3

**Disjoint from the `infra` track**, which owns `infra/**` and the workflow. Nothing here
touches either.

## Out of Scope

- **Usernames, passwords, and anything a person would type.** This household exists for tests.
- **How a real player is created** — `planning/feature_accounts-and-auth_2026-08-30.md`. Keeping
  these apart is what stops a seed script written in a hurry from quietly deciding how the
  product onboards people.
- The integration suite itself (`planning/backlog/feature_integration-suite_2026-08-30.md`).
  This is the fixture it will need, not the suite.
