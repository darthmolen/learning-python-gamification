# The Boss Pays Boss Rates

**Status:** Planned
**Track:** engine
**Date:** 2026-08-30
**Author:** Claude (Opus 5)
**Lane:** A

## Objective

Make a medal earned on a boss pay §5.1's 20×DC instead of a quest's 2×DC, and shape the fix so
that the next kind of thing cannot inherit the same bug.

## Why this exists

§5.1 prices two kinds from the effective DC, and the engine holds both:

```ts
export const XP_PER_DC = { quest: 2, boss: 20 };
```

The medal path asks for one of them, always:

```ts
export function questXpEarned(baseDC: number, earned: readonly DifficultyModifier[]): number {
  ...
  return xpFor('quest', effectiveDC(baseDC, earned));   // scoring.ts:157
}
```

`medalDelta` is a difference of two `questXpEarned` calls, and `medalDelta` is the only thing in
the system that decides what finishing something pays. **So a boss pays a tenth of what the spec
says** — quietly, and the API, which calls it exactly as instructed and rightly refuses to patch
the number, writes that tenth into `quest_medals.xp_awarded`, where §5.10 makes it permanent.

**The tell was already in the repository.** `xpFor('boss', …)` has exactly one caller anywhere,
and it is `tests/scoring.test.ts:100`. The boss rate is asserted correct — *"a DC 15 boss pays
300"* — and then reached by nothing else, ever. A constant with a passing test and no production
caller is not a feature; it is a branch someone forgot to wire.

**Why thirty-three mutants missed it.** `feature_engine-query-layer` seeded thirty-three and
killed every one. Mutation testing proves the tests notice a change in what the code *does*; it
cannot notice a case the tests never exercise. Nobody ever priced a medal on a boss, so there was
no assertion for a mutant to break. The bug is not in a line anyone mutated — it is in a branch
nobody wrote.

**This is not theoretical money.** §5.11 makes boss sign-off the parent's entire gap detector: he
challenge-runs bosses cold, and failing one is how a real gap surfaces. Every one of those pays
wrong today, and §5.10 writes the row once and never re-prices it.

## Success Criteria

- [ ] A medal earned on a boss pays `20 × effectiveDC`; the same medal on a quest still pays
      `2 × effectiveDC`
- [ ] `xpFor('boss', …)` has a production caller — the condition whose absence was the bug
- [ ] DC-2 still holds for bosses: the total across medals earned in any order equals
      `xp(final effective DC)`, order-independent, exactly as it does for quests
- [ ] The kind is a **required argument with no default**, so no call site can inherit the bug
      by omission
- [ ] The change lands with no `// TODO` and no fallback — every call site chose
- [ ] A seeded mutant hardcoding `'quest'` in the priced path is caught, and so is one
      hardcoding `'boss'`

## Approach

**`medalDelta` and `questXpEarned` take the kind: first, and required.**

```ts
export function medalXpEarned(
  kind: ScaledXpKind,
  baseDC: number,
  earned: readonly DifficultyModifier[],
): number;

export function medalDelta(
  kind: ScaledXpKind,
  baseDC: number,
  alreadyEarned: readonly DifficultyModifier[],
  newMedal: DifficultyModifier,
): number;
```

Three rulings, made rather than named:

**No default.** `kind: ScaledXpKind = 'quest'` would compile every existing call site untouched
and leave the bug exactly where it is for bosses — a fix that fixes nothing anybody forgets to
opt into. Required means the compiler stops at each call site and makes somebody choose. At all
four, the answer is already in scope: they hold the `ContentItem`.

**`ScaledXpKind`, not `Kind`.** Content's `Kind` is `quest | invasion | boss`; §5.1 prices an
invasion flat at 5, and an invasion carries no medals. A caller pricing a medal on an invasion
has already gone wrong, and a compile error says so at the line — better than a runtime throw
saying it in a log nobody reads. Callers holding a `ContentItem` narrow, and that narrowing is
the check.

**`questXpEarned` is renamed, not overloaded.** Its name is the bug written down: it asserts a
kind in the identifier while taking the DC of anything. `medalXpEarned` says what it prices.
Keeping the old name as an alias would leave the bug callable.

**The arithmetic does not change.** `medalDelta` stays a difference of two totals, which is what
makes DC-2 hold: the intermediate terms telescope regardless of rate, so order-independence
survives the change — and the property test proves it for both kinds rather than assuming.

## Phases

### Phase 1 — the test that does not exist

RED first, and capture the output: a medal earned on a boss, priced against §5.1's 20×DC.
`xpFor`'s own test already fixes the numbers — a DC 15 boss pays 300 — so the expected value is
read off the spec rather than guessed.

Then the property, extended rather than duplicated: DC-2 order-independence run over both kinds.
It passes for quests today and must pass for bosses after.

### Phase 2 — the signature

Rename, add the parameter, thread it to `xpFor`. Update `src/index.ts`'s exports and its
docblock, which explains the medal arithmetic in quest vocabulary throughout.

Seed the mutant that decides it: hardcode `'quest'` in the priced path and confirm the boss test
reddens. Then hardcode `'boss'` and confirm a quest test reddens. Neither may survive — a suite
that catches only one direction is measuring a constant rather than a choice.

### Phase 3 — the four call sites  *(coordinated; see below)*

`apps/api/src/dispatcher.ts:241`, `src/server.ts:426`, `scripts/e2e.ts:127`, each passing the
kind it already holds. **Same commit as Phase 2.**

## Dependencies / Prerequisites

- None. The `engine` track has been free since the query layer completed, and every fact this
  plan needs is already in the repository

## Files Expected to Change

- `pyquest/packages/engine/src/scoring.ts` — the two functions
- `pyquest/packages/engine/src/index.ts` — exports, and the docblock's vocabulary
- `pyquest/packages/engine/tests/scoring.test.ts` — the boss medal, the extended property
- `pyquest/apps/api/src/dispatcher.ts`, `pyquest/apps/api/src/server.ts`,
  `pyquest/apps/api/scripts/e2e.ts` — **the `api` track's files.** One argument each; see below

## Track discipline

**This plan reaches into a track that is in flight, and it has to.** A required parameter is a
breaking signature change: land it in the engine alone and `tsc -b` fails inside `apps/api` until
somebody else fixes four lines. That is exactly the failure Wave 3 already learned — one track's
deliberate red gate read by another as its own breakage.

So **Phases 2 and 3 land in one commit.** The tree is never broken, and the `api` track finds
three of its lines carrying one extra argument each, with no behaviour changed on the quest path
it is currently exercising.

Tell the `api` track before starting. The change is mechanical, but `scripts/e2e.ts` asserts an
exact XP figure, and that assertion is the one place a quest-priced number could already have
been baked in as expected.

Nothing else here is shared. `packages/engine` has no other claimant.

## Out of Scope

**What a boss pays for being *cleared*, as distinct from for a medal.** This plan gives
`xpFor('boss', …)` its first production caller through the medal path, which is the path that
pays. Whether a boss also pays a separate completion bonus, and how §5.2's challenge-run bonus
composes with it, is a spec question rather than an arithmetic one and is not answered here.

**Re-pricing history.** §5.10 pays once, and `quest_medals.xp_awarded` records what was paid. If
a boss medal has already been written at quest rates before this lands, correcting that row is a
decision about a child's XP total and belongs to a person, not to a migration.

---

## Plan Review

**Reviewed:** 2026-08-30 07:44
**Reviewer:** Claude Code (plan-review-intake)

### Strengths

- Correct diagnosis: `xpFor('boss', …)` has exactly one caller (the test), zero production callers — the constant with a passing test and no production wire.
- Required `ScaledXpKind` parameter is the right fix shape; a default would leave the bug callable by omission.
- `ScaledXpKind` vs `Kind` distinction is sound — invasions carry no medals, so a caller pricing a medal on an invasion gets a compile error, not a runtime throw.
- DC-2 telescoping argument is correct; the property test extending to both kinds is the right verification shape.
- Both-directions mutant seeding (hardcode `'quest'`, then hardcode `'boss'`) is the right completeness check for a binary choice.

### Issues

#### Critical (Must Address Before Implementation)

- **Missing call site: `apps/api/src/views.ts:86`**
  - Section: Phase 3 / Files Expected to Change
  - What's wrong: The plan names three API call sites (`dispatcher.ts:241`, `server.ts:426`, `scripts/e2e.ts:127`) and says "four call sites." The actual production callers are `dispatcher.ts:241`, `server.ts:426`, and **`views.ts:86`** — `medalDelta(item.dc, held, medal)` in the quest-slot projection loop. `views.ts` holds `item: ContentItem` and would fail compile after the signature change. `scripts/e2e.ts` is a script, not a production caller in the same sense.
  - Suggested fix: Add `pyquest/apps/api/src/views.ts` to Files Expected to Change and Phase 3. Correct the call-site count.

- **Track discipline violation: `engine` plan edits `apps/api` files**
  - Section: Track discipline / Files Expected to Change
  - What's wrong: The plan is `engine` track but explicitly claims `apps/api/src/dispatcher.ts`, `server.ts`, and `scripts/e2e.ts` (and the missing `views.ts`). The project's disjoint-files rule applies to concurrently in-progress plans in Lane A. If an `api` track plan is in progress while this lands, the overlap is a conflict, not a coordination. "Same commit" keeps the tree green but does not resolve file ownership.
  - Suggested fix: Either (a) treat this as a coordinated two-track commit — the engine track makes the engine change, and a named API-track commit in the same atomic push updates the four API call sites — or (b) declare this plan's file set as `engine` only and state the API call-site updates are the API track's responsibility to pick up immediately. Option (a) is what "same commit" intends but needs to say so explicitly as a cross-track coordination, not as the engine track owning API files.

#### Important (Should Address)

- **`scripts/e2e.ts:127` does not hold a `ContentItem`; kind must be derived**
  - Section: Approach — "at all four, the answer is already in scope: they hold the ContentItem"
  - What's wrong: `e2e.ts:127` calls `content.item(QUEST)?.dc ?? 0` — the item is fetchable but not a local variable named `item`. The assertion `all four … hold the ContentItem` is overstated for this site.
  - Suggested fix: Note that `e2e.ts` must fetch the item to read its kind before calling `medalDelta`; the fix is one extra line, but the plan's claim is wrong as written.

- **Phase 1 RED test is underspecified**
  - Section: Phase 1 — the test that does not exist
  - What's wrong: "capture the output" satisfies the test-filter-development form but does not name the exact command. Per repo conventions, `cd pyquest && npm run test -- packages/engine` (or equivalent targeted run) should be stated.
  - Suggested fix: Add the exact command: `cd pyquest && npx vitest run packages/engine`.

#### Minor (Consider)

- **`store.ts` is not in Files Expected to Change** — it has relevant docblock commentary referencing `medalDelta` (lines 14 and 226); those comments may need updating when the function is renamed, but this is cosmetic.
- **`src/index.ts` docblock** — "the docblock's vocabulary" is called out in Phase 2; confirm the docblock does not contain hardcoded XP figures that become wrong for bosses.

### Assessment

**Implementable as written?** With fixes

**Reasoning:** The engine fix is correct and the arithmetic is sound, but the plan misses a real production call site (`views.ts:86`) and its track-discipline story needs to be explicit about cross-track ownership rather than relying on "same commit" to paper over it.

---

## Disposition

*Appended by the author after `plan-receive-review`. Everything above is the review as received and is unaltered.*

**3 accepted, 1 merged, 2 rejected, 2 flagged** — applied in `76fde05`.

The critical was right and worse than stated: `views.ts:86` was a missed call site, and the full census is nineteen, not four. The plan had said four because the grep behind it was piped through `head` and the count read off the truncation.

Rejected, both verified rather than argued: `store.ts`'s docblocks reference `medalDelta`, which keeps its name — only `questXpEarned` is renamed; and `index.ts` carries no hardcoded XP figures.

Merged: track discipline reframed as two tracks doing one change. Eleven of nineteen sites are the `api` track's, which is a phase of work rather than a coordination footnote, so it landed on the plan already in flight there.
