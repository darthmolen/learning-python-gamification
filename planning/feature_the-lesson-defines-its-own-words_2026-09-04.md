# The Lesson Defines Its Own Words

**Status:** Planned — queued for review before execution
**Track:** `main`
**Date:** 2026-09-04
**Author:** Claude (Opus 5)
**Lane:** A and B — this one crosses, deliberately, and §"Two lanes" is argued below
**Requested by:** the DM, 2026-09-04 — "as the learner is reading, they can have a reference…
I always wanted that when I was younger, but the book medium didn't allow mouse overs"

## Objective

Let a lesson mark a concept where it appears in the prose, so a reader who meets a word
mid-sentence sees what it means without leaving the sentence.

## The rule this bends, and how far

CLAUDE.md commits to: "**No pop-overs.** The Tome expands in place and pushes the work down;
nothing is covered and nothing is lost." A hover card is a pop-over. That is not a technicality
to route around, so it is being **scoped rather than broken**:

The rule was written about **the Tome covering the learner's work**. §6.8's argument names what
is protected — "if looking something up costs a learner the code in his editor, he stops looking
things up" — and every case the rule has decided so far is that one: the Tome on the Quest screen,
the concept chips, the medal cards. **A learner reading a lesson has no work on the screen to
lose.** Nothing is covered but prose already read, and the card leaves when the pointer does.

The amendment says *what* may not be covered rather than *what shape* a thing is:

> **No pop-overs over work.** Anything that would cover the editor, a brief, or a form expands in
> place and pushes the work down. Reference material over prose may float — the Tome's inline
> glossary does — and it must be dismissible without losing your place.

If the DM does not want the rule moved, the feature comes out with it. It is one line to revert.

## The author marks the words — decided 2026-09-04

Two candidate mechanisms were put to the DM and the second was chosen.

**Rejected: match the concept registry against inline code.** A `` `code` `` span whose text
matched a concept id would be marked automatically — no authoring at all. It was measured before
being offered: it covers `print`, `int`, `float`, `str`, `bool`, `input` in Area 0 and `if`,
`elif`, `else`, `while`, `for`, `range` in Area 1. It was rejected for the cost that comes with
free coverage: **the author cannot opt one occurrence out**, and Area 1's lesson would light up
seventeen spans — `for` five times, `while` five, `range` four. A reference the reader stops
seeing is not a reference.

**Chosen: `[[concept-id]]` in the curriculum, and every one of them renders.** Once the author
decides which occurrences carry a card, "every occurrence" costs nothing — there are only the
marks they wrote. The two answers settle each other.

```markdown
Use [[print]] to see the value.
Read the [[reading-errors|error message]] on purpose, not by accident.
```

- `[[id]]` renders the concept's own label.
- `[[id|words]]` renders `words`, for when the label does not fit the sentence — and it will not
  fit often, because the labels are things like `what a repository is` and `if __name__ ==
  "__main__"`. MediaWiki's order, target first, because it is the order the DM has seen before.

**`validate:content` refuses an unknown id**, which is the whole reason this is safe to author.
CLAUDE.md already draws that edge — "authored content is validated against `concepts.ts`. If a
concept id changes, content breaks — that is `validate:content` doing its job" — and a mark is a
reference to an id, so it belongs under the same rule as every other one.

## The part that is easy to miss: there are two renderers

`[[print]]` is not Markdown. Two things render lesson prose and **neither one ignores unknown
syntax gracefully — they print it**:

- The SPA's own `Markdown.tsx`, used by the Tome screen and by the Quest screen's in-place Tome.
- The Field Manual's `marked`, which publishes the static site.

So a lesson marked up and shipped before the Field Manual understands the syntax publishes
`[[print]]`, in brackets, to a site whose whole claim is that the curriculum stands without the
game. **Both renderers change in this plan, or neither does.** The Field Manual has no hover cards
and is not getting any — it renders the mark as the display text, plain, and the reader loses
nothing because the same site prints the full glossary underneath.

This is why the plan crosses lanes. `curriculum/` gains syntax (Lane B) that only Lane A can
render, which is the dependency direction CLAUDE.md permits — content validated by `concepts.ts` —
but it is worth saying out loud rather than discovering at the deletion test.

## The construct is the concept, not the keyword

The DM's correction, and the interesting part of the design: `if` alone, `else` alone and `elif`
alone are not each worth a card. The **chain** is. A learner meeting `elif` does not want a
definition of `elif`; they want to see where it sits between the other two.

So a marked id resolves through a small **families** table before the card is built. `[[elif]]`
opens one card titled `if / elif / else` carrying all three glossary entries in order. No new
content is authored — the family composes entries that already exist and that `validate:content`
already checks.

The table lives in the SPA rather than in `concepts.ts`: grouping three ids into one card is a
decision about how a reader is *shown* the words, and the registry's job is that the three ids
exist and each is defined, which is unchanged. **Open question for review:** whether an author
who wants only `elif` needs an escape hatch, or whether the family is always right.

## Success Criteria

- [ ] `[[id]]` and `[[id|words]]` render as marked terms in the SPA, and as plain display text in
      the Field Manual.
- [ ] Hover **and** keyboard focus open the card; Escape closes it; Tab reaches it.
- [ ] The card floats above and slightly right, flips below when there is no room, clamps at the
      viewport edge, and is not clipped by the scrolling pane.
- [ ] `[[if]]`, `[[elif]]` and `[[else]]` each open one `if / elif / else` card with all three.
- [ ] `validate:content` fails on `[[not-a-concept]]`, naming the file and the id.
- [ ] `[[...]]` inside a fenced code block is left exactly alone.
- [ ] The published Field Manual contains no literal `[[` anywhere.
- [ ] The a11y sweep passes: every marked term is a named control.

## Approach

`Markdown` learns nothing about concepts: it gains one optional lookup from concept id to term and
renders `GlossaryTerm` when the lookup answers. The concept knowledge stays in the Tome.

The card renders through a **portal** with fixed positioning. The Tome's content pane is
`overflow: auto`, so a card positioned above a term inside it is clipped — a term on the first
line loses the top of its card, one near the right edge loses the right. A portal escapes the clip
and is what makes "move it to fit the viewport" possible. It closes on scroll rather than
following, because a fixed card and scrolling text part company immediately. This is the SPA's
first portal.

## Phases

### Phase 1 — the syntax and the validator

Parse `[[id]]` / `[[id|words]]`, fence-aware, in `packages/content`. `validate:content` refuses an
unknown id. RED first, mutant after.

### Phase 2 — the two renderers

`Markdown.tsx` and the Field Manual. The Field Manual gate first, because it is the one that can
publish something wrong.

### Phase 3 — `GlossaryTerm`, the families table, and the card

Hover, focus, Escape, portal, flip and clamp.

### Phase 4 — mark up the lessons

An authoring pass over the eight lessons. Lane B, and the smallest useful set rather than every
possible mark.

### Phase 5 — CLAUDE.md

The amendment above, and nothing else in that file.

## Dependencies / Prerequisites

None. Definitions have been on `/api/tome` since 2026-09-03.

## Files Expected to Change

| File | Change | Covered by |
|---|---|---|
| `pyquest/packages/content/src/marks.ts` | new — parse `[[id]]`, fence-aware | `tests/marks.test.ts` |
| `pyquest/packages/content/src/validate.ts` | refuse an unknown marked id | `tests/validate.test.ts` |
| `pyquest/packages/content/src/index.ts` | export the parser | — |
| `pyquest/apps/web/src/tome/families.ts` | new — the grouping | `tome/families.test.ts` |
| `pyquest/apps/web/src/tome/GlossaryTerm.tsx` | new — the term and its card | `tome/glossary-term.test.tsx` |
| `pyquest/apps/web/src/tome/Markdown.tsx` | render marks when given a lookup | `tome/Markdown.test.tsx` |
| `pyquest/apps/web/src/screens/TomeScreen.tsx` | pass the lookup to the lesson | `screens/tome-vocabulary.test.tsx` |
| `pyquest/apps/field-manual/src/build.ts` | strip marks to display text | `tests/no-game.test.ts` |
| `curriculum/area-*/lesson*.md` | the authoring pass | `validate:content` |
| `CLAUDE.md` | scope the no-pop-over rule | — |

## Open Questions For Review

1. Is `[[id|words]]` the right order, or does `[[words|id]]` read better to the person authoring?
2. Should the families table have an escape hatch for an author who wants only `elif`?
3. Should marks be allowed in **briefs** as well as lessons, or is the Quest screen's own concept
   chip list already the answer there?
4. Is stripping marks the right Field Manual behavior, or should the published site render the
   definition inline — a `<dfn>` with a `title`, say — since it has no hover machinery?
