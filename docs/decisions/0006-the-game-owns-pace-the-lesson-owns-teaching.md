# 0006 — The game owns pace, the lesson owns teaching

**Status:** Accepted
**Date:** 2026-08-31

## Context

Six of the eight lessons opened by naming a duration:

```text
Two weeks. By the end of them you will have typed a line that draws a square...
Six weeks, and the longest area in the year.
Six weeks. By now you can write a long program.
Eight weeks. Area 4 gave you functions — work with a name.
Eight weeks. Everything you have written so far forgets everything...
Twelve weeks, and the last area.
```

The parent had corrected this by hand more than once before naming it, which is the signal that
a habit needs a rule rather than another correction.

**It was not obvious this was still open**, because ADR 0002 looks like it covers it. That record
ruled that area weeks are road markers, that they gate nothing, and that no pace judgement is
derived from them. Every one of those sentences is about the **integers** — where they live, what
reads them, what the app may conclude. None of them reaches an author typing *"Six weeks"* into a
paragraph, because that is not a field and nothing computes it.

## Decision

**The game owns pace. The lesson owns teaching.**

A lesson's prose may place the reader in the **sequence** and never on the **calendar**.

| Legal — sequence | Illegal — pace |
|---|---|
| "Area 4 gave you functions — work with a name." | "Eight weeks." |
| "By now you can write a long program." | "Six weeks, and the longest area in the year." |
| "the first time you go looking for when something broke" | "in about three weeks" |
| "This is the last area." | "by the end of the month" |

**The test is one question: would this sentence still be true for a learner who took twice as
long?** Sequence survives that. Pace does not — Area 4 follows Area 3 for everybody, and it takes
six weeks for nobody in particular.

Week counts keep every other home they have: `area.yml`'s `weeks: { from, to }`, the area
READMEs, session plans, the DM guide and the spec. The game knows the week and may say so on a
screen. The lesson does not know it and must not pretend to.

## Why this is not 0002 restated

**0002 is about the numbers. This is about the prose.** They fail differently and in different
places, and collapsing them loses the part that bites.

0002 stops the *app* from computing a judgement — it guards a field, and a validator can watch
it. This stops the *author* from asserting one, and there is no field to guard: an opening
sentence is typed by a person and rendered verbatim. 0002's protection cannot reach it, which is
how six lessons acquired one while 0002 was Accepted and correct the whole time.

The consequence is also worse here. `week 10 of 48` on the Map is a marker beside a plan, and
0002 argues at length why that reads as reassurance. **"Six weeks." is the fourth word of a
lesson**, addressed to the reader in the second person, before any teaching has happened. A child
who took nine weeks over Area 3 opens the document and is told he is behind, by the document,
before he has read a line of it. Nothing in the design intends that and §5.8 explicitly refuses
it — but §5.8 governs the completion board, not a paragraph.

**And the lesson is the artifact meant to outlive the campaign.** ADR 0004 puts the durable,
portable thing in the learner's hands and asks what survives if PyQuest is deleted tonight. A
lesson stamped with a duration dates itself against one *run* of the game rather than against the
subject it teaches. Python's `for` loop will not take six weeks next year either.

## Consequences

- **Six openings and one body reference changed.** Each now leads on what the reader will be able
  to do. The body case is instructive: area-2 said a bad commit message costs you *"in about three
  weeks"* and now says *"the first time you go looking for when something broke"* — an event
  rather than a clock, which is timing-free and also truer, since it happens when he first needs
  the log rather than on a date.
- **This governs the same surface ADR 0005 does** — `curriculum/**/lesson.md`, `lesson.draft.md`,
  briefs, and material a learner reads. It does not reach session plans or the DM guide, which
  are written for somebody running a calendar and *should* name weeks.
- **Unlike 0005, this one could be tested.** 0005 is unenforceable because register is not a
  closed set; a week count nearly is — digits or a spelled number beside `week`, in a lesson's
  first paragraph, would have caught all six. It is not built yet, and it is the obvious next
  thing.

## The road not taken

**Leaving it as a CLAUDE.md bullet**, which is where it started. Rejected because CLAUDE.md is
instructions and this is an argument: the rule survives there but the *reason* does not, and the
reason is the whole of what meets the next author who wants to open a lesson with a friendly
"Six weeks, and we are nearly done."

**Folding it into 0002 as an amendment.** Rejected because it would blur the one distinction that
makes either record useful. 0002 is a decision about data and what may be derived from it; this is
a decision about voice. An amendment saying "also, do not write it in prose" would read as a
footnote to a storage rule rather than as the separate constraint it is.

**Banning references to sequence as well**, for symmetry. Rejected outright: sequence is real and
load-bearing. *"Area 4 gave you functions"* is how a lesson connects to the one before it, and a
lesson forbidden from naming what came before is a lesson that cannot build on anything.
