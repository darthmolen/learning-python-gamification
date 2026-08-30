# Nothing Prices a Boss Medal

**Status:** Promoted — `planning/feature_boss-pays-boss-rates_2026-08-30.md`
**Date Discovered:** 2026-08-29
**Discovered During:** `planning/in-progress/feature_api-and-runner_2026-08-28.md`, Wave 3

## Context

§5.1 prices two kinds from the effective DC, and the engine holds both:

```ts
export const XP_PER_DC = { quest: 2, boss: 20 };
```

But the medal path only ever asks for one. `questXpEarned` ends at `scoring.ts:157` with
`xpFor('quest', effectiveDC(baseDC, earned))` — unconditionally — and `medalDelta` is a
difference of two `questXpEarned` calls. So **a medal earned on a boss pays 2×DC where §5.1
says 20×DC**: a tenth, silently.

The API found it by calling `medalDelta` for a boss sign-off, exactly as its plan instructs. It
did not correct the number, which was right: the engine owns the arithmetic and an API that
patches a payout has crossed §6.7.

**Why the engine's own tests did not catch it.** `feature_engine-query-layer` seeded
thirty-three mutants and killed every one, and this survived all of them — because no test ever
prices a medal on a boss. Mutation testing proves the tests notice a change in what the code
does; it cannot notice a case the tests never exercise. The bug is not in a line anyone mutated.
It is in a branch nobody wrote.

`xpFor` is fine and has both kinds. `bossUnlocked` is fine. The gap is one function that decided
its own vocabulary — `questXpEarned` is honestly named, and nothing named `bossXpEarned` exists.

## Known Scope

Decide which shape is right, then do it once:

- **A `kind` parameter** on `questXpEarned`/`medalDelta`, defaulting to `quest` so no caller
  changes; the boss path passes `'boss'`.
- **Or a sibling** `bossXpEarned`, leaving the quest path untouched.

The first is fewer moving parts and the second is harder to call wrongly. Either way the test to
write first is the one that does not exist: **a medal earned on a boss, priced against §5.1's
20×DC**, RED before the fix.

Then re-seed the mutant that would now catch it — swap `'boss'` for `'quest'` in the boss path
and prove the suite reddens.

**Do not** let the API compensate. The number comes from the engine or it is two numbers.

## Trigger for Promotion

Before any boss is playable — the API already calls this path for `peer-signoff`, which is how
a challenge run (§5.2, §5.11) is signed off, and the parent's whole gap-detector runs through
boss sign-offs. It is wrong money the first time a boss is beaten, not eventually.

---

**Promoted 2026-08-30** to `planning/feature_boss-pays-boss-rates_2026-08-30.md`, on the `engine`
track. The plan makes the ruling this stub left open: the kind is a **required** first argument
with no default, because a default reproduces the bug for anyone who forgets to pass it.

One thing the plan found that this stub did not: `xpFor('boss', …)` has exactly one caller in the
repository and it is a test. The boss rate is asserted correct and then reached by nothing.
