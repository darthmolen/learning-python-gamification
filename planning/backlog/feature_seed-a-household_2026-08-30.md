# Nothing Creates A Household

**Status:** Backlog
**Track:** unassigned — `db` or `api`, see below
**Date Discovered:** 2026-08-30
**Discovered During:** SPA Phase 5 — `planning/**/feature_spa_2026-08-28-v2.md`

## Context

The database is migrated and empty. Five migrations applied, thirteen tables, and:

```
 players | medals | campaign | reviews
       0 |      0 |        0 |       0
```

**Nothing in the repository creates a player.** `packages/db` has `build`, `migrate` and
`typecheck` and no seed; the only `INSERT INTO players` in the tree is inside two test suites,
against their own fixtures.

So pointed at a live API the SPA shows empty screens or 404s — not because anything is broken,
but because nobody exists to have progress. Every screen works and there is nobody to show it
to.

## What is actually missing, which is more than a script

**Two players, because the seats are two.** Kitchen Table mode is one household with the parent
holding both the player and the DM seat (§5.11), and `player_roles` is a table rather than a
column for exactly that reason. A seed that creates one player quietly decides the roles
question the backlog has open in
`planning/backlog/feature_roles-modes-and-the-dm-seat_2026-08-28.md`.

**A campaign row, which is where the start date lives.** ADR 0002 ruled that `week 10 of 48`
needs a campaign start date, that it is household state rather than content, and that the engine
reads no clock. `feature_progress-schema_2026-08-28.md` added the row. Nothing sets it, so the
Map's header has no week to show and currently does not pretend to.

**Enough progress to see anything.** With zero `quest_medals` every area reads `0 of ~5`, every
island is dark, and the Map cannot be evaluated — the states this SPA spent four phases
rendering only appear once somebody has cleared something. A demo household and a real one are
different things, and which this is matters.

## The question underneath

**How does a household come into existence, in the product rather than in a script?**

Three answers, and they are not equivalent:

- **A seed script**, run once by hand. Fastest, and it makes the first household a development
  artifact rather than a thing the game knows how to do.
- **The Console screen.** §5.11 already puts sign-off, authoring and streak forgiveness there and
  says "every player has one". Creating the household is the same kind of act, and it is the
  only answer where the game can be handed to a second family without a developer.
- **First-run, from `content/` plus a name.** Everything except the name is derivable — the areas
  come from the manifests, the concepts from the registry, the schedule from ADR 0002's weeks.

This plan does not choose. It records that the choice has not been made and that a seed script
written in a hurry makes it by accident.

## Known scope

- Two players and their `player_roles` rows — `peer` and `dm`, roles rather than people
- One `campaign` row with a start date, which ADR 0002 needs and nothing sets
- Some `quest_medals`, if the household is meant to demonstrate rather than begin
- Whatever `apps/api` needs to answer `/campaign` for a player that exists

## Trigger for promotion

The first time anyone runs the SPA against the live API and wants to see something. That is
imminent — Phase 5 landed today and the stack is up — so this is closer to next than to later.

## Note

`PLAYER_ID` in `apps/web/src/gateway/index.ts` is the constant `'peer'`, with a comment pointing
here. When a household can be created, that constant is the thing to replace, and the Console is
the screen that would replace it.
