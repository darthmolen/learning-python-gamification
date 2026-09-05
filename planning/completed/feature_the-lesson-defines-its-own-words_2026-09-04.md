# The Lesson Defines Its Own Words

**Status:** Completed 2026-09-04
**Track:** `main`
**Date:** 2026-09-04
**Author:** Claude (Opus 5)
**Lane:** A and B — this one crosses, deliberately, argued below
**Reviewed:** 2026-09-04, `planning/needs-review/completed/2026-09-04-the-lesson-defines-its-own-words.md`
— 7 findings accepted, 2 merged, 1 rejected
**Requested by:** the DM, 2026-09-04 — "as the learner is reading, they can have a reference…
I always wanted that when I was younger, but the book medium didn't allow mouse overs"

## Objective

Let a lesson mark a concept where it appears in the prose, so a reader who meets a word
mid-sentence sees what it means without leaving the sentence.

## What the review changed

| Finding | Outcome |
|---|---|
| The lookup is area-scoped; a cross-area mark resolves to nothing | Accepted — whole-Tome lookup |
| The Quest screen renders lesson prose and is not in the file table | Accepted — it is now, with a rule |
| The file predicate is an open question | Accepted — `readsAsLesson` already exists; reuse it |
| `[[id\|words]]` collides with both table parsers | Accepted — marks parse before table cells |
| A mark with no definition is unspecified | Accepted — decided below |
| RED/mutant stated only for Phase 1 | Accepted — per phase |
| No escape hatch for a literal `[[` | Accepted — a backslash |
| The amended rule is violated by the Quest screen's own Tome | Merged — no cards there at all |
| "the eight lessons" is looser than the glob | Merged — the count was right, the criterion was not |
| Two copies of the plan may drift | Rejected — that is the pipeline working as designed |

## The rule this bends, and how far

CLAUDE.md commits to: "**No pop-overs.** The Tome expands in place and pushes the work down;
nothing is covered and nothing is lost." A hover card is a pop-over. That is not a technicality
to route around, so it is being **scoped rather than broken**:

The rule was written about **the Tome covering the learner's work**. §6.8's argument names what is
protected — "if looking something up costs a learner the code in his editor, he stops looking
things up." A learner reading the Tome as a destination has no work on the screen to lose.

> **No pop-overs over work.** Anything that would cover the editor, a brief, or a form expands in
> place and pushes the work down. Reference material over prose may float — the Tome's inline
> glossary does — and it must be dismissible without losing your place.

**The review found this rule contradicting itself, and the fix is to shrink the exception rather
than engineer around it.** The Quest screen embeds the Tome directly above the editor. On that
screen the carveout's premise — no work to lose — is simply false, so the exception does not
apply there: **the Quest screen renders marks as plain display text, with no card at all.**

That costs the learner nothing. The Quest screen already carries expandable concept chips with
the same definitions, shipped 2026-09-03. The reference is on that screen twice over; what it
does not need is a floating card over an editor.

If the DM does not want the rule moved, the feature comes out with it. It is one line to revert.

## The author marks the words

**Rejected: match the concept registry against inline code.** Automatic, no authoring, and
measured before being offered — it covers six concepts in Area 0 and six in Area 1. Rejected
because **the author cannot opt one occurrence out**, and Area 1's lesson would light up seventeen
spans. A reference the reader stops seeing is not a reference.

**Chosen: `[[concept-id]]`, and every mark renders.** Once the author decides which occurrences
carry a card, "every occurrence" costs nothing — there are only the marks they wrote.

```markdown
Use [[print]] to see the value.
Read the [[reading-errors|error message]] on purpose, not by accident.
```

- `[[id]]` renders the concept's own label.
- `[[id|words]]` renders `words`. **Target first, MediaWiki's order** — closed at review rather
  than left open. It is the order the DM has seen before, and the alternative reads better only
  until the display text itself contains a word that looks like an id.
- `\[[` is a literal `[[`. Rare enough that the escape will almost never be used and cheap enough
  that its absence would be the one thing nobody could work around.

**`validate:content` refuses an unknown id.** CLAUDE.md already draws that edge — "authored
content is validated against `concepts.ts`" — and a mark is a reference to an id.

### Which files may carry marks — `readsAsLesson`, which already exists

`validate.ts:559` already defines the predicate: `lesson.md`, `lesson.draft.md`, and `brief*.md`.
Its ADR 0006 comment explains why those three group together and why session plans, DM guides and
journal prompts do not — they are written for somebody running a calendar.

**Reuse it rather than declare a new scope.** This also closes what was an open question about
briefs: they are in, because the repository already decided that grouping and wrote down the
reason. A second predicate that disagreed with the first is exactly the failure `parseGlossary`
was extracted to prevent.

## The lookup is whole-Tome, not per-area

`TomeArea.concepts` carries one area's concepts, and the Tome screen renders one area at a time.
An area-scoped lookup would resolve only marks naming that area's own concepts.

**That breaks on the first real lesson.** `curriculum/area-3/lesson.draft.md` already writes
`` `print` `` twice and `` `range` `` once — Area 0 and Area 1 concepts, in an Area 3 lesson,
which is exactly what a curriculum that builds on itself looks like. Worse, `validate:content`
would pass them: it checks the registry, not the area. A cross-area mark would validate green and
render dead.

So the lookup is built from **every area in the Tome response**, which the SPA already holds.
Referring back is normal; referring *forward* is a separate question the validator's existing
`concept-above-area` rule already has an opinion about for quests, and this plan does not reopen
it.

## The two renderers, and the one rule that covers both

`[[print]]` is not Markdown, and neither renderer ignores unknown syntax — they print it.

| Surface | Renders | Cards |
|---|---|---|
| Tome screen | marked terms | yes |
| Quest screen's in-place Tome | display text | **no** — see the rule above |
| Field Manual | display text | no — it is static HTML |

**One rule covers every case: a mark that cannot or should not open renders as its display
text.** No surface ever prints a bracket. That is what makes the Quest screen safe, the Field
Manual safe, and any future renderer safe by default rather than by remembering.

The Field Manual loses nothing by stripping: the same page prints the full glossary underneath,
shipped 2026-09-03.

## What a mark shows when the glossary is thin

| case | behavior |
|---|---|
| concept found, definition present | card with the definition |
| concept found, **no** definition | marked, and the card says the entry is not authored |
| family where only some members are defined | card lists the defined ones, names the rest unwritten |
| id not in the registry | cannot ship — `validate:content` refuses it |

The second row matches `ConceptList` exactly, which already says "has no definition written yet"
rather than opening onto an empty box. §5.1a's honesty rule, and the same words, because two
components saying the same thing differently is how a vocabulary rots.

## The construct is the concept, not the keyword

`if` alone, `else` alone and `elif` alone are not each worth a card. The **chain** is. A learner
meeting `elif` wants to see where it sits between the other two.

A marked id resolves through a small **families** table before the card is built. `[[elif]]` opens
one card titled `if / elif / else` carrying all three entries in order. No new content — the
family composes entries that already exist and that `validate:content` already checks.

The table lives in the SPA rather than in `concepts.ts`: grouping three ids into one card is a
decision about how a reader is *shown* the words. The registry's job is that the three ids exist
and each is defined, which is unchanged.

## Success Criteria

- [ ] `[[id]]` and `[[id|words]]` render as marked terms on the Tome screen.
- [ ] A **cross-area** mark resolves — `[[print]]` in an Area 3 lesson opens Area 0's definition.
- [ ] The Quest screen renders marks as display text and contains no literal `[[`.
- [ ] The Field Manual publishes display text and contains no literal `[[`.
- [ ] A mark **inside a table cell** does not split the row, in either renderer.
- [ ] `[[...]]` inside a fenced code block is left exactly alone; `\[[` renders a literal `[[`.
- [ ] A marked concept with **no glossary entry** says so rather than opening onto nothing.
- [ ] Hover **and** keyboard focus open the card; Escape closes it; Tab reaches it.
- [ ] The card floats above and slightly right, flips below when there is no room, clamps at the
      viewport edge, and is not clipped by the scrolling pane.
- [ ] `[[if]]`, `[[elif]]` and `[[else]]` each open one `if / elif / else` card.
- [ ] `validate:content` fails on `[[not-a-concept]]`, naming the file and the id.
- [ ] The a11y sweep passes: every marked term is a named control.

## Approach

`Markdown` learns nothing about concepts. It gains one optional lookup; without it, marks render
as display text. That default is what makes every non-Tome surface correct for free.

The card renders through a **portal** with fixed positioning, because the Tome's content pane is
`overflow: auto` and a card positioned above a term inside it is clipped. It closes on scroll
rather than following. This is the SPA's first portal.

## Phases

**Every phase is RED with captured output, then GREEN, then a seeded mutant the suite must
catch.** Evidence to `planning/evidence/`. Stated once here because it applies to all five, not
because it applies to the first.

### Phase 1 — the syntax and the validator

`parseMarks` in `packages/content`, fence-aware and escape-aware. `validate:content` refuses an
unknown id in any file `readsAsLesson` accepts.

### Phase 2 — the two renderers

`Markdown.tsx` and the Field Manual. The Field Manual first: it is the one that can publish
something wrong.

### Phase 3 — `GlossaryTerm`, the families table, and the card

Hover, focus, Escape, portal, flip and clamp.

### Phase 4 — mark up the lessons

**One mark per concept, on its first teaching occurrence, in the lesson that introduces it.** A
criterion somebody can apply, replacing "the smallest useful set". Eight files — three `lesson.md`
and five `lesson.draft.md`.

### Phase 5 — CLAUDE.md

The amendment, and nothing else in that file.

## Files Expected to Change

| File | Change | Covered by |
|---|---|---|
| `pyquest/packages/content/src/marks.ts` | new — parse `[[id]]`, fence- and escape-aware | `tests/marks.test.ts` |
| `pyquest/packages/content/src/validate.ts` | refuse an unknown marked id | `tests/validate.test.ts` |
| `pyquest/packages/content/src/index.ts` | export the parser | — |
| `pyquest/apps/web/src/tome/Markdown.tsx` | render marks; display text with no lookup | `tome/Markdown.test.tsx` |
| `pyquest/apps/web/src/tome/families.ts` | new — the grouping | `tome/families.test.ts` |
| `pyquest/apps/web/src/tome/GlossaryTerm.tsx` | new — the term and its card | `tome/glossary-term.test.tsx` |
| `pyquest/apps/web/src/screens/TomeScreen.tsx` | whole-Tome lookup to the lesson | `screens/tome-vocabulary.test.tsx` |
| `pyquest/apps/web/src/screens/QuestScreen.tsx` | no lookup — display text over the editor | `quest/glossary-chips.test.tsx` |
| `pyquest/apps/field-manual/src/build.ts` | strip marks to display text | `tests/glossary-published.test.ts` |
| `curriculum/area-*/lesson*.md` | the authoring pass | `validate:content` |
| `CLAUDE.md` | scope the no-pop-over rule | — |

---

## Status

**Final Status:** Completed
**Track:** `main`
**Completed:** 2026-09-04
**Completed By:** Claude (Opus 5)

### Outcomes

- `[[id]]` and `[[id|words]]` parse in `packages/content/src/marks.ts`, fence-aware, code-span
  aware, escape-aware, and line-bounded. `validate:content` refuses an unknown id in any file
  `readsAsLesson` accepts — proved against the real curriculum by typo'ing a live mark.
- **One rule covers every surface: a mark that cannot or should not open renders as its display
  text.** The Tome passes a lookup; the Quest screen and the Field Manual pass none, and neither
  can print a bracket. A future renderer is correct by default rather than by remembering.
- The lookup is **whole-Tome**, so a mark naming an earlier area's concept resolves.
- `cells()` is mark-aware, so a piped mark in a table cell no longer splits the row.
- 36 marks across seven lessons. Area 2 has none, honestly: its concepts are git terms whose
  labels are phrases, and no prose names them.
- Full suite 1052 passed / 1 skipped, twice. Typecheck clean, `validate:content` green.

### Deviations

- **The card is not a portal.** The plan specified one, on the grounds that the Tome's content
  pane is `overflow: auto` and would clip it. The card as built is absolutely positioned within
  the term, which is simpler and passes every test — but clipping near the pane's top edge is
  *unverified*, because jsdom has no layout. Filed rather than claimed: see Backlog Items.
- No `families.test.ts`. The family is exercised through `Markdown` and the Tome screen instead;
  a separate unit test for a five-line table would have tested the table rather than the feature.

### Lessons Learned

- **A mutant caught a false comment, not false code.** The `\n` in the mark pattern was documented
  as what prevents a mark spanning lines. It is not — `overProse` hands the matcher one line at a
  time — and the comment even cited a `[^\S\n]` that was never in the pattern. Removing both
  exclusions left all thirteen tests green. The guard stays as depth; the comment now says which
  it is.
- **Hover-then-click closed the card.** A pointer press fires `mouseenter` first, so a toggle
  closed the thing the click was meant to open. Found by a test that looked like a test-harness
  artifact and was a real bug on a real mouse.
- **Four heredoc escaping failures in one session**, each one CLAUDE.md's documented hazard: a
  `sed` delimiter clashing with regex alternation silently disabled a strip and produced a wrong
  measurement I reported before catching; a Python heredoc turned `\n` into a real newline and
  broke a regex across two lines. The rule is in CLAUDE.md and I re-learned it the expensive way.

### Backlog Items Created

- `planning/backlog/feature_the-glossary-card-may-be-clipped_2026-09-04.md` — the card is
  positioned in-flow rather than through a portal, and the clipping the plan predicted is
  untested because jsdom has no layout.
