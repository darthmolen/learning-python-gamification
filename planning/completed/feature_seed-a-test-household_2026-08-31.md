# A Seeded Household For End-To-End Testing

**Status:** Completed
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

- [x] `npm run seed --workspace @pyquest/db` fills an empty database and **is safe to run
      twice** — the second run leaves the same rows, not double
- [x] A reset path: drop the household and re-seed, so a run starts from a known place
- [x] **Two players**, with `player_roles` rows — `peer` and `dm`. One player cannot exercise
      peer-signoff, which §6.3 defines as "somebody other than the submitter presses the button"
- [x] **One `campaign` row with a start date**, offset from `now`. ADR 0002 ruled `week 10 of
      48` needs one and that it is household state rather than content
- [x] Progress covering every state the Map renders: an area **cleared**, one **in progress at
      three of five** (the §5.2 boss-unlock boundary exactly), one **started with one**, one
      **untouched**
- [x] **Medals across more than one rung**, since `MedalSlots` renders held and unheld together
      and a fixture holding only `cleared` proves half of it
- [x] **A concept review or two overdue**, so `/defend` returns a non-empty queue under §5.4's cap
- [x] **Every date is an offset from `now`**, never a literal. A fixture with hardcoded dates
      passes today and fails in a fortnight
- [x] A test that seeds, calls the real API handlers, and asserts the campaign view is non-empty
- [x] Full suite green, typecheck clean

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

## Status

**Completed:** 2026-08-31
**Completed By:** Claude (Opus 5)

### Outcomes

All ten success criteria are ticked.

- `pyquest/packages/db/src/seed.ts` — `seedHousehold`, `resetHousehold`, and the household plan
  as a *rule over the corpus* rather than a list of ids. `npm run seed` and `npm run seed:reset`
  from `packages/db`, run against the live database twice: two players, 27 medals, 6 attempts,
  4 ladder reviews, 2 forced reviews, 1 Datamine — identical on the second run.
- `pyquest/packages/db/tests/seed.test.ts` — 14 tests.
- `pyquest/apps/api/tests/fixtures-agree.test.ts` — 6 tests, Phase 3.

**Verified numbers**, all from `pyquest/`:

- `npx tsc -b` — clean. `npm run typecheck` — clean across all six workspaces.
- `npx vitest run` — **48 files, 756 tests, all passing**.
- `npm run validate:content` — `OK  no problems found`, 23 items across 8 areas.

**The four area states are derived, not listed.** `CLEARED_BY_RANK = [Infinity, 3, 1]` applies to
the areas that have quests, in order — so Area 0 is cleared (10 of 10), Area 1 sits on §5.2's
boundary exactly (3 of 5), Area 2 is started with one, and Areas 3–7 are untouched. A sixth quest
authored into Area 1 does not quietly turn "three of five" into "three of six is still three".

**Mutants seeded, and every one was caught.** Five, run one at a time:

1. Deleted the `DELETE FROM attempts` before the insert → `attempts` went 6 → 12 on the second
   run; "converges rather than appends" failed.
2. `CLEARED_BY_RANK[1]` 3 → 2 → two tests failed, including the boss-unlock boundary.
3. `startedOn` replaced with the literal `'2026-06-29'` → "moves every date when now moves"
   failed with `expected +0 to be 11`.
4. Blinded the identity comparison in the Phase 3 suite (`if (false && …)`) → the ledger dropped
   from eight findings to four and failed. The comparison is live, not decorative.
5. `CLEARED_BY_RANK[2]` 1 → 0 → the API's four-states test and the locked-quest test both failed.

None survived.

### Phase 3 — the fixtures and the API have now met, and they disagree in eight places

**Recorded, not fixed.** Which side is right is a contract question. The list is asserted whole in
`apps/api/tests/fixtures-agree.test.ts` as `KNOWN_DISAGREEMENTS`, so repairing either side fails
that test and sends whoever did it to the record rather than leaving a note in a plan nobody
re-reads. Only content-derived fields are compared — the fixture describes an invented player, so
its `cleared` counts are a different household and not a disagreement at all.

1. **`area 0: progress.total — fixture 5, API 10`.** `area-0.yml` moved `estimatedQuests` 5 → 10
   on 2026-08-31 when session 3's six broken sigils were promoted to fix-it quests. The stub did
   not follow. The Map would draw `5 of ~5` where the API says `10 of ~10`.
2. **`area 0: the fixture sends no identity, the API sends one`.**
3. **`area 2: the fixture sends no identity, the API sends one`.** The fixture's own comment says
   areas 0 and 2 "carry a title and no `weeks` or `blurb`" and argues at length that the map with
   two unlabelled areas "is also the one the API will actually send". Both manifests now carry
   both fields. **The comment is now false, and the two areas it describes are the two the API
   labels.**
4. **`area 1: identity.blurb`** — fixture *"Loops and conditions, and the shapes they draw."*,
   API *"Turtle becomes generative art. Loops repeat and conditions choose."*
5. **`area 4: identity.blurb`** — fixture *"Naming a thing is how you stop repeating it."*,
   API *"Pygame Zero and a game loop. A long script becomes functions worth naming."*
6. **`area 6: identity.blurb`** — fixture *"Files, APIs, and data that did not come from you."*,
   API *"Save the world, share a seed, call a live API. Data outlives the program."*
7. **`area 7: identity.blurb`** — fixture *"Tests, review, and code somebody else can read."*,
   API *"Tests, types and the debugger. Read unfamiliar code, then open a pull request."*
   Four paraphrases where the same comment claims "Nothing here invents content". Areas 3 and 5
   match exactly, which is what makes the other four read as drift rather than as a policy.
8. **`area 3: quests — fixture [a3-inventory-lists, a3-recipe-book, a3-the-smelter,
   a3-the-enchanter, a3-the-trading-hall], API []`.** The Area screen's only populated stub lists
   five quest ids that have never existed in `game/`. Area 3 is unauthored;
   `planning/feature_area-3-collections_2026-08-28.md` is where those ids would come from. The
   comment above them reads "Ids and concepts are real — they exist in `content/`". The concepts
   are; the quest ids are not.

The through-line is one thing rather than eight: **the fixture file's own comments are the most
confidently wrong part of it.** Three separate comments assert content facts that content has
since changed, and every one of them was written to explain why the fixture is honest.

### Deviations

- **`player_roles` stores `player`, not `peer`.** The success criterion says "`peer` and `dm`";
  `0001-players-and-campaign.sql` CHECKs `role IN ('player', 'dm')` and `PlayerRoleSchema` is the
  same enum. `peer` is the *handle*; widening the CHECK would have been a fixture editing the
  schema on its way past. Flagged rather than resolved — if the lexicon is meant to reach the role
  column, that is a migration and a contract change, not a seed.
- **`packages/db` now depends on `@pyquest/content`.** The plan asked for ids read through it, and
  that is a runtime dependency the package did not have. `packages/db/tsconfig.json` was outside
  this track's file list, so no project reference was added; it resolves through the workspace
  symlink to `packages/content/dist`, which the root build produces first. `tsc -b` and every
  workspace `typecheck` are clean, including after deleting `packages/db/dist` and rebuilding.
  **If a clean CI checkout ever fails to resolve it, the fix is one line in
  `packages/db/tsconfig.json`.**
- **The seed does not price medals.** §5.10's prices are the engine's, and `packages/db` cannot
  depend on `@pyquest/engine`: the root `tsconfig.json` orders `engine` after `db`, so a clean
  build would not have its declarations yet. `MEDAL_XP` is therefore fixture XP and says so in the
  header. Nothing in the campaign, area or quest views reads it; the Party screen's levels do, so
  a level drawn from this household is a shape rather than a score.
- **The seed CLI lives at the foot of `seed.ts`**, behind an `invokedDirectly` guard, rather than
  in a `seed-cli.ts` beside `cli.ts`. Same reason: `src/cli.ts` was outside this track's file list
  and `src/seed.ts` was in it. `cli.ts` is the migration *job* — a compose service with
  `restart: "no"` — and a fixture loader is not that, so the two would not have shared a file
  anyway.
- **Two tables are deleted before insert rather than upserted.** `attempts` is a `bigserial` log
  with no natural key; `forced_reviews`' primary key includes `due_on`, which moves with `now`, so
  a plain upsert would leave yesterday's row beside today's and lengthen the invasion queue by one
  for every day somebody ran the seed. Mutant 1 is the proof that the first of these is
  load-bearing.

### Deliberately not done

- **Nothing under `infra/`, `.github/`, `apps/web/` or `apps/api/src/` was touched.** The `infra`
  track was running in the same tree throughout.
- **The eight disagreements were not fixed**, per this plan's own instruction: record and stop.
- **`journal_entries`, `sessions` and `bounties` are not seeded.** Neither the criteria above nor
  the backlog stub's "what it seeds" list names them, and `GET`/`POST /journal` are not registered
  routes anyway (`feature_journal-text-has-no-column_2026-08-29.md`). `resetHousehold` clears them
  regardless, so a household that acquires them later still resets to a known place.

### Lessons Learned

- **The comparison was worth more than the seed.** The seed took an afternoon and behaved; the
  eight-line ledger is the actual find, and every one of the eight is a screen that would have
  drawn something the API does not send.
- **A comment explaining why something is honest is the thing to distrust.** All three false
  assertions in the fixture file sit in prose written specifically to defend the fixture's
  fidelity. The code is type-checked continuously; the prose was checked once, on the day it was
  written.
- **A build-order constraint is a real architectural constraint.** "The engine prices medals" and
  "`packages/db` may not import the engine" are both true, and the resolution was to say so in the
  header rather than to reimplement §5.10 quietly inside a fixture.

### Backlog Items Created

None filed — the eight disagreements are recorded in `KNOWN_DISAGREEMENTS` with the reasoning
above, and whoever owns the contract should take them from there rather than from a second copy.
