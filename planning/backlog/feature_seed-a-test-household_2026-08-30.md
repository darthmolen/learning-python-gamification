# A Seeded Household For End-To-End Testing

**Status:** Backlog
**Track:** unassigned — `db`, and it pairs with the integration suite
**Date Discovered:** 2026-08-30
**Discovered During:** SPA Phase 5 — `planning/**/feature_spa_2026-08-28-v2.md`

## Context

The database is migrated and empty. Five migrations applied, thirteen tables, and:

```
 players | medals | campaign | reviews
       0 |      0 |        0 |       0
```

Nothing in the repository creates a player, so an end-to-end test has nobody to be and the SPA
pointed at a live API shows empty screens or 404s. Not because anything is broken — because
there is nobody to have progress.

**This is the test fixture, and only the test fixture.** How a real household comes into
existence is a different question with a different answer, and it now has its own plan:
`planning/backlog/feature_accounts-and-auth_2026-08-30.md`. Splitting the two is what stops a
seed script written in a hurry from quietly deciding how the product onboards people.

## What it seeds, and why each row is there

**Two players, because the seats are two.** Kitchen Table mode is one household with the parent
holding both the player and the DM seat (§5.11), and `player_roles` is a table rather than a
column for exactly that reason. A fixture with one player cannot exercise peer-signoff, which
§6.3 defines as "somebody other than the submitter presses the button".

**A campaign row with a start date.** ADR 0002 ruled that `week 10 of 48` needs one, that it is
household state rather than content, and that the engine reads no clock. The progress schema
added the row; nothing sets it, so the Map's header has no week and currently does not pretend
to have one.

**Enough progress to exercise every state the SPA renders.** This is the part that makes it a
*test* fixture rather than a starting position, and it should be chosen deliberately:

- an area **cleared** (all five), so an island draws lit and its boss reads unlocked
- an area **in progress** with three of five, so the boss unlock boundary is exercised at exactly
  the §5.2 threshold
- an area **started** with one, which is the state that caught a real bug — the first Map drew it
  as locked while its own label read `1 of ~5`
- an area **untouched**, so the drained treatment is covered
- **medals across more than one tier**, since `MedalSlots` renders held and unheld together and a
  fixture holding only `cleared` proves half of it
- a **concept review or two** overdue, so `/defend` returns a non-empty queue under the §5.4 cap

**Deterministic, and dated relative to now.** Overdue days are computed against `now`, so a
fixture with hardcoded dates passes today and fails in a fortnight. Seed dates as offsets.

## Why it is worth building rather than hand-inserting

`planning/backlog/feature_integration-suite_2026-08-30.md` tier 4 wants a browser driving the
real stack. That test needs a known household, reset between runs, or it asserts against
whatever the last run left behind. A seed is the difference between an integration suite and a
suite that passes once.

It also answers a question the SPA cannot answer alone: **the fixtures and the API have never
met.** Everything in `apps/web/src/fixtures` is shaped like the contract and parsed by it, but
no test has ever compared a fixture to what `apps/api` actually returns for the same request.
A seeded household makes that comparison possible, and it is the most likely place for a real
disagreement to be hiding.

## Known scope

- A `seed` script in `packages/db`, idempotent, safe to re-run
- Two players and their `player_roles` rows — `peer` and `dm`, roles rather than people
- One `campaign` row with a start date offset from `now`
- `quest_medals`, `concept_reviews` and `attempts` chosen to cover the states listed above
- A way to reset: dropping the household and re-seeding, so a run starts from a known place

## Out of scope

- Usernames, passwords and anything a person would type. This household exists for tests.
- How a real player is created. See `feature_accounts-and-auth_2026-08-30.md`.

## Trigger for promotion

With integration-suite tier 4, since neither is much use without the other. Sooner if somebody
wants to look at the SPA against the live API before then — which is a smaller version of the
same need and would take the first three rows only.
