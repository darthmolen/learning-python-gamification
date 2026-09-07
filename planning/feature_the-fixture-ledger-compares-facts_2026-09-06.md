---
kind: plan
status: queued
track: fixture-ledger
date: 2026-09-06
---

# The fixture ledger compares facts, not sentences

**Status:** Planned
**Track:** fixture-ledger
**Date:** 2026-09-06
**Author:** Claude (Opus 5)
**Lane:** A

## Objective

`fixtures-agree.test.ts` asserts a list of **rendered English sentences**. Make it assert
structured facts, make each recorded disagreement say which side is expected to win, and
extend the comparison to the spine — which the fixture now invents and nothing checks.

## Why this exists

The test itself is sound and this plan does not question it. It seeds a real household,
builds the real server, and compares content-derived fields against the SPA's fixture module
— closing a gap its own header names exactly:

> Everything in the SPA's fixture file is shaped like the contract and parsed by it, so the
> two have always agreed about *types*. Nothing had ever compared a fixture to a real
> response for the same request.

`KNOWN_DISAGREEMENTS` is a good idea too: a ledger asserted **whole**, so a fixture repaired
on one side or content changed on the other fails here rather than leaving a stale note in a
plan nobody re-reads. That instinct is right and stays.

**What is wrong is the representation.** Three things, and the third is the one that is
already costing something.

### 1 — It asserts prose

Nine entries, compared as strings:

```ts
'area 1: identity.blurb — fixture "Loops and conditions, and the shapes they draw.", API "Turtle becomes generative art. Loops repeat and conditions choose."',
```

That line pins an em dash, the word "fixture", the word "API", a comma, and
`JSON.stringify`'s quoting. **Reword the message and all nine entries break at once**, with a
diff that is nine long strings against nine long strings and no way to see which fact
changed. The test is then loud in a way that carries no information, which is the failure
mode that trains people to update the expectation without reading it.

The fact underneath is small and stable: *area 1, field `identity.blurb`, the two values
differ*. Comparing that survives any amount of rewording.

### 2 — It records the difference but not the intent

No entry says which side should win, or when it should stop being true. Compare the two that
are actually different in kind:

- `'area 0: progress.total — fixture 5, API 10'` — the fixture is **stale**. `area-0.yml`
  moved 5 → 10 and the stub did not follow. The API is right and the fixture should be
  repaired.
- `'area 3: quests — fixture [...], API []'` — the fixture is **fiction**. Those five ids do
  not exist and never will.

Both read identically in the ledger. The header says settling them is a contract question
and not the seeding plan's to decide, which is correct — but *recording which way it is
expected to go* is not settling it, and it is the difference between a ledger and a pile.

### 3 — The spine is invented, and nothing compares it

The newest problem, and the reason this is worth doing now rather than at leisure.

`apps/web/src/fixtures/index.ts` grew a `PRACTICES` map when the practice spine landed.
Nothing in `apps/api/tests/` mentions `practices` — `grep` returns no hits — so it is
unchecked in both directions.

Its own comment is already stale:

> An area absent from this map yields an empty spine, which is the real state of areas 3 to 7
> **until their `practices.yml` is authored**

Area 3's `practices.yml` is authored. And the fixture disagrees with it:

| | Fixture | `curriculum/area-3/practices.yml` |
|---|---|---|
| count | 5 | **12** |
| 1–3 | The Row Of Blocks · The Inventory · It Changes | same |
| 4 | The Recipe Book | **Pick It Up** |
| 5 | The Enchanter | **Do I Have Enough** |

Practices 1–3 were copied from the real spine and 4–5 invented — the same pattern as the
quest ids, this time with no tripwire at all. `AreaViewSchema` already carries
`practices: z.array(PracticeViewSchema)` and the API already serves it, so **the comparison
is buildable today**; nothing is blocked.

## Success criteria

- [ ] `KNOWN_DISAGREEMENTS` is an array of **objects**, not strings, and no assertion in the
      file compares a rendered sentence
- [ ] Every entry carries an **intent**: which side is expected to change, so the next reader
      does not re-derive it from a comment
- [ ] The failure message is **generated from** the structured entry rather than being the
      thing compared, so it can be reworded without touching the ledger
- [ ] **The spine is compared** — `n`, `title`, `exercises`, `quests` per practice, for every
      area the fixture describes, not only area 3
- [ ] Every existing disagreement is carried across unchanged in meaning, with its reasoning
      comment preserved. **This plan settles none of them**
- [ ] The suite still fails when either side drifts, proven by seeding a mutant on each side
- [ ] `npx vitest run` is green apart from failures this plan did not cause

## Approach

### The shape

```ts
interface Disagreement {
  readonly area: number;
  readonly field: 'identity.blurb' | 'progress.total' | 'quests' | 'practices' | …;
  readonly fixture: unknown;
  readonly api: unknown;
  /** Which side is expected to move, and what makes it true. */
  readonly expect: 'fixture-follows-api' | 'api-follows-fixture' | 'undecided';
  readonly note: string;
}
```

Compare with `toEqual` over a sorted array of these. The rendering — the em dash, the words
"fixture" and "API" — moves into a `describe()` helper used only to print a failure, and
stops being load-bearing.

`expect` is the field that makes the ledger actionable. `'undecided'` is a legitimate value
and should be used where the header's argument applies — a seed script does not get to decide
whether the stub or the manifest is right, and pretending otherwise to fill the field would
be worse than admitting it.

### The spine comparison

Per area the fixture describes, compare its `practices` against `AreaViewSchema`'s. Field by
field, as the identity comparison already does, because "the spines differ" is a sentence
nobody can act on:

- the practice numbers present
- `title` per `n`
- `exercises` and `quests` per `n`

`completed` is **household progress, not content** — it is the fixture player's ticks — and
must be excluded, exactly as `progress.cleared` and `boss.unlocked` already are. Comparing it
would reintroduce the mistake the file's header exists to avoid.

Expect this to produce several new entries for area 3 on the first run. **They are recorded,
not fixed** — same rule as the rest.

### Proving it can fail

Per `test-filter-development`, and the file deserves better than being trusted because it is
green. Two mutants, each seeded and captured:

1. **Reword a failure message.** Under the current code every entry breaks; under the new
   shape nothing does, because the message is not the assertion. That is the whole point of
   the change and it should be demonstrated rather than asserted.
2. **Change one fact on each side** — a fixture blurb, and an `area.yml` field — and confirm
   exactly one entry moves, naming the right area and field.

## Files expected to change

- `pyquest/apps/api/tests/fixtures-agree.test.ts` — the ledger, the comparison, the spine
- `planning/evidence/fixture-ledger-*.txt` — captured mutants

**Not changed by this plan**, and this is the important half:

- `pyquest/apps/web/src/fixtures/index.ts` — **the fiction stays.** Repairing the invented
  quest ids and the invented practices 4 and 5 is a contract decision about what the SPA
  should be built against, and this plan's job is to make the disagreement legible, not to
  settle it. A plan that fixed both sides would leave nothing to have recorded.
- `curriculum/**` — untouched. The `area-3` track holds it.

## Out of scope

Settling any disagreement. Deleting any entry. Deciding whether the SPA should carry stubs at
all once the API is real — a genuine question, and a different plan's.

## Dependencies

**None.** The API already serves `practices`, `PracticeViewSchema` is already in the
contract, and the suite already seeds a household.

One thing to know rather than wait for: `pyquest/packages/db/tests/schema.test.ts` currently
fails on `main`. Migration `0007-practice-progress.sql` creates `practice_progress` and the
test's expected table list was never updated. It is one string in an array, it is unrelated to
this plan, and it will be in the way of a clean `vitest run` until somebody takes it.
