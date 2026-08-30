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
- [ ] Both halves land in one push: engine and api, no window where `tsc -b` is red
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
opt into. Required means the compiler stops at each call site and makes somebody choose.

**There are nineteen of them, not four.** An earlier draft of this plan said four, because the
census behind it was a `grep` piped through `head` and the count was read off the truncation:

| Where | Calls | Whose |
|---|---|---|
| `apps/api/src` — `dispatcher.ts`, `server.ts`, **`views.ts`** | 3 | `api` |
| `apps/api/scripts/e2e.ts` | 1 | `api` |
| `apps/api/tests` — `dispatcher.test.ts`, `server.test.ts` | 7 | `api` |
| `packages/engine/tests/scoring.test.ts` | 8 | `engine` |

Only the three in `apps/api/src` hold a `ContentItem` and can pass `item.kind` directly. `e2e.ts`
fetches with `content.item(QUEST)?.dc ?? 0` and must fetch the kind alongside it; the test sites
hold a fixture and already know which kind they mean.

**`views.ts:86` widens what this bug costs.** It is the quest-slot projection, computing XP *per
medal slot for display*. So a boss does not merely pay wrong on award — every unearned medal slot
on a boss screen has been quoting a tenth of the real number to the player deciding whether to
attempt it.

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

RED first, and capture the output of `cd pyquest && npx vitest run packages/engine`: a medal
earned on a boss, priced against §5.1's 20×DC.
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

### Phase 3 — hand the api half over  *(not this track's work)*

Eleven of the nineteen call sites are the `api` track's, and this plan does not touch them. They
land as a phase on `planning/in-progress/feature_api-and-runner_2026-08-28.md`, in the same push
as Phase 2. See Track discipline.

## Dependencies / Prerequisites

- None. The `engine` track has been free since the query layer completed, and every fact this
  plan needs is already in the repository

## Files Expected to Change

- `pyquest/packages/engine/src/scoring.ts` — the two functions
- `pyquest/packages/engine/src/index.ts` — exports, and the docblock's vocabulary
- `pyquest/packages/engine/tests/scoring.test.ts` — the boss medal, the extended property

**Not this plan's, and deliberately absent:** every file under `pyquest/apps/api`. Eleven call
sites live there and they belong to the `api` track.

## Track discipline

**This is two tracks doing one change, not one track reaching into another.** An earlier draft
claimed the api files and argued that a single commit made that safe. It does keep the tree
green, and it still has the `engine` track editing eleven files it does not own — which the
disjointness rule exists to prevent, and which "same commit" papers over rather than resolves.

So the split is by owner:

- **`engine`** — `scoring.ts`, `index.ts`, `scoring.test.ts`. This plan.
- **`api`** — the eleven call sites, as a phase on the plan already in flight on that track. It
  owns those files today and a second plan cannot take them; one plan per track.

**They land in the same push.** Not "immediately after" — a required parameter means the moment
the engine commit exists alone, `tsc -b` is red inside `apps/api` for everyone, and Wave 3
already learned what one track's red gate does to another that did not cause it.

The api phase carries one thing beyond the mechanical edit. `dispatcher.test.ts:154` and
`server.test.ts:323` both explain, in prose, that *"on a fresh quest `medalDelta(dc, [], 'cleared')`
is exactly `dc * 2`"*. That stays true of quests and becomes a trap: it is the reasoning a future
author trusts, and the first person writing a boss test will read it and believe the rate is
universal. Both comments say **quest** explicitly, and name the boss rate.

## Out of Scope

**What a boss pays for being *cleared*, as distinct from for a medal.** This plan gives
`xpFor('boss', …)` its first production caller through the medal path, which is the path that
pays. Whether a boss also pays a separate completion bonus, and how §5.2's challenge-run bonus
composes with it, is a spec question rather than an arithmetic one and is not answered here.

**Re-pricing history.** §5.10 pays once, and `quest_medals.xp_awarded` records what was paid. If
a boss medal has already been written at quest rates before this lands, correcting that row is a
decision about a child's XP total and belongs to a person, not to a migration.
