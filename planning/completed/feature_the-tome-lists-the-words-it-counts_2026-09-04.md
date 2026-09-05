# The Tome Lists The Words It Counts

**Status:** Completed 2026-09-04
**Track:** `main`
**Date:** 2026-09-04
**Author:** Claude (Opus 5)
**Lane:** A
**Promoted from:** `planning/backlog/feature_the-tome-lists-the-words-it-counts_2026-09-03.md`,
filed 2026-09-03 while cutting the Tome from the glossary plan

## Objective

Put an area's concepts on the screen whose job is the syllabus, with the definitions that are
already on the wire.

## Context

The Tome says how many concepts an area teaches and never says which ones. `TomeScreen.tsx`
renders `${entry.concepts} concepts` in the area header and again in the rail, and
`ConceptList` is not imported there. `/api/tome` has carried `{ id, label, definition? }` per
concept since 2026-09-03. **The data is on the wire and the screen counts it.**

## The decision the stub left open

The stub refused to guess where the list goes, because that is a screen decision rather than a
field: "above it as vocabulary the reader meets first, or below it as a reference they return
to — changes what the screen is for."

**Above the lesson, as collapsed terms.** Three things settle it:

- **The list is short as terms and long as prose.** Per area it is 9 to 17 concepts — three rows
  of chips, not twenty paragraphs. The stub's worry was "with 20 entries that is a lot of
  pushing", and that is true of twenty *open* definitions; one open at a time is what the
  Quest screen already does.
- **An area's vocabulary is its index.** The header already says `17 concepts` at the top of the
  page; the words belong where the count is, not past the whole lesson.
- **`ConceptList expandable` already exists, is tested, and behaves this way.** Building a second
  interaction for the same job on a different screen is how two things that look alike start
  behaving differently.

**The embedded Tome on the Quest screen is not in scope.** `src/tome/Tome.tsx` is a wrapper and
the Quest screen passes it the lesson alone. The quest's own concept chips already sit above it,
so adding the area's full vocabulary inside would put two concept lists on one screen — a
different question, and not one this plan needs to answer to do its job.

## Success Criteria

- [ ] An area's concepts appear as terms on the Tome, above the lesson.
- [ ] A term opens its definition in place, pushing the lesson down. No dialog, no scrim.
- [ ] A concept with no definition says so rather than opening onto nothing.
- [ ] An area with no concepts renders no empty vocabulary block.
- [ ] The rail's per-area count still agrees with the list beside it.
- [ ] Full suite green; the a11y sweep passes with the new controls.

## Approach

`Manual`'s `syllabus` mapping already reads `page?.concepts` and immediately reduces it to
`.length`. Carry the array through instead of the count, and derive the count from it — so the
number in the rail and the words in the pane cannot disagree, because they are one source.

Render `<ConceptList expandable>` under the blurb and above the lesson, behind an `Eyebrow`.

## Phases

### Phase 1 — the test, RED

A new `apps/web/src/screens/tome-vocabulary.test.tsx`. RED captured to `planning/evidence/`.

### Phase 2 — the screen

`syllabus` carries `concepts: ConceptView[]`; the count becomes `entry.concepts.length` in both
places that print it. The list renders between the blurb and the lesson.

### Phase 3 — mutants, then the suite

At least: the list dropped entirely, the count decoupled from the list, and the undefined-
definition branch removed. Each must be caught.

## Dependencies / Prerequisites

None. `/api/tome` already carries definitions, and `ConceptList` already expands.

## Files Expected to Change

| File | Change | Covered by |
|---|---|---|
| `pyquest/apps/web/src/screens/TomeScreen.tsx` | carry concepts, render the vocabulary | `screens/tome-vocabulary.test.tsx` |
| `pyquest/apps/web/src/screens/tome-vocabulary.test.tsx` | new | — |
| `pyquest/apps/web/src/fixtures/index.ts` | area 3 gains an undefined concept | `screens/tome-vocabulary.test.tsx` |

The fixture was not in the plan as written. The "unwritten definition" branch needs a concept
with no glossary entry to exercise it, and every concept in the Tome fixture was defined — so
either the branch went untested or the fixture grew one. Added rather than skipped, and recorded
here rather than left as a surprise in the diff.

---

## Status

**Final Status:** Completed
**Track:** `main`
**Completed:** 2026-09-04
**Completed By:** Claude (Opus 5)

### Outcomes

- The Tome lists an area's concepts above the lesson, as expandable terms. A term opens its
  definition in place; the lesson is pushed down, never covered.
- `syllabus` carries `ConceptView[]` instead of a pre-computed length, so the rail count, the
  header count and the list are one source counted three times rather than three numbers.
- A concept with no glossary entry says so. An area the Tome does not carry renders no block.
- Full suite: 1020 passed, 1 skipped, twice. Typecheck clean, `validate:content` green.

### Deviations

- One fixture file added to the file set, for the reason above.
- No new component. The plan expected to reuse `ConceptList expandable` and it fitted unchanged,
  which is the strongest evidence the decision to reuse it was right.

### Lessons Learned

- **Two of the seven checks were vacuous, and mutants found both.** "Renders no vocabulary block
  for an area the syllabus does not carry" passed against a screen with no vocabulary block
  *anywhere* — deleting the whole feature left it green, because an absence check alone cannot
  tell "not for this area" from "not at all". It now pins the presence first. Separately, the
  rail's count was a second render of the same array and was asserted by nothing: adding one to it
  left the entire suite passing. That is three sessions running in which the check was wrong
  rather than the code.
- **The stub was right to refuse the decision.** It read as a small placement question and it was
  not: "above" only works because the list is short *as terms*, which is only true because one
  definition opens at a time — a property of the component chosen, not of the placement. Deciding
  placement without the interaction settled would have been deciding half of it.

### Backlog Items Created

None.
