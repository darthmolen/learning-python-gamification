---
kind: plan
status: completed
track: curriculum-voice
date: 2026-09-06
completed: 2026-09-06
---

# Define the sigil where it is first met

**Status:** Completed
**Track:** curriculum-voice
**Date:** 2026-09-06
**Author:** Claude (Opus 5)
**Lane:** B

## Objective

A learner meets the word *sigil* seven times in week two, in files addressed to them, with
no explanation — and the meaning they will form there is the one Area 1 later tells them is
wrong. Define it once, in Area 0, in the sense that survives.

## Why this exists

**Flavor is allowed and has to be paid for.** "The Sigil" is the document of record's own
name for Boss 1 (spec §4, line 93) and sits alongside The Bestiary, The Archive and The
Crafting Table. It is not a lexicon violation, it is not game machinery — it survives
`rm -rf game/` — and no ADR governs it. The name stays.

What is not paid for is the explanation.

### Where the word actually lands

**Area 0 session 3, weeks 1–2, learner-facing, seven times:**

```text
b1_the_typo.py        """Broken Sigil 1 — The Typo
b2_wrong_kind.py      """Broken Sigil 2 — The Wrong Kind of Thing
…through b7, plus error-log.md: "Fill one row per broken sigil"
```

Nothing in Area 0 says what a sigil is. Not the session plan, not the drill docstrings, not
the error log, not the README.

**Area 1's published brief is fine and needs no change.** `exercises/the-sigil/BRIEF.md`
defines it in its third paragraph — *"an art generator that takes input and produces
something worth hanging on a wall"* — and expands both halves under *The two halves, and
both are load-bearing*. It was checked and it is good. The gap is Area 0 only.

### The part that is worse than a missing definition

Area 0's sigil is a fixed turtle drawing: `forward(100)`, `left(90)`, `forward(100)`. Area
1's brief says, in as many words:

> **A generator, not a drawing.** … If it makes the same picture every time, it is a
> drawing, and a drawing was session 1.

**So Area 0 calls a sigil exactly the thing Area 1 says a sigil is not.** A learner who
forms the week-two meaning has to unlearn it in week six, and nothing in between tells them
to.

That is fixable without renaming anything, because the two senses nest cleanly:

- **Area 0 — a sigil is a symbol you draw.** True, concrete, and enough for week two.
- **Area 1 — and *The Sigil* is a machine that makes them**, one that never draws the same
  one twice.

That is §3 principle 7's two passes doing what it always does: the first pass is not wrong,
it is smaller. Stated that way the Area 1 brief stops contradicting Area 0 and starts
sharpening it.

## Success criteria

- [ ] A learner reading only Area 0 files can say what a sigil is
- [ ] The definition is in a **learner-facing** file, not only in a session plan
- [ ] Area 1's brief reads as a sharpening of Area 0's meaning rather than a contradiction
- [ ] **Nothing is added to any `glossary.md`.** Glossary headings are validated against
      `concepts.ts` ids and `sigil` is not a concept; a `## sigil` entry fails
      `validate:content` on `glossary-gap`
- [ ] `py -3.14 verify.py` in area-0 still reports 19 of 19
- [ ] `npm run validate:content` exits 0 and the deletion test still passes

## Approach

**Two edits, both in Area 0, both small.**

1. **`sessions/session-3/error-log.md`** — the learner-facing artifact they hold all
   evening. One short line under the title saying what a sigil is, in the Area 0 sense.
2. **`sessions/session-3-the-broken-sigil.md`** — the DM is told to say it out loud in the
   hook, in one sentence, and told that Area 1's boss sharpens it later. A word explained
   aloud once by a person beats a definition read silently.

**The seven `b*.py` docstrings are left alone.** Seven edits to say the same thing once is
churn, and the error log is open beside them the whole session by design.

**Area 1 gets one clause**, not a rewrite: its brief already defines the term, and the only
change worth making is to have it name what it is sharpening rather than appear to
contradict week two.

## Files expected to change

- `curriculum/area-0/sessions/session-3/error-log.md` — the definition, learner-facing
- `curriculum/area-0/sessions/session-3-the-broken-sigil.md` — the DM says it in the hook
- `curriculum/area-1/exercises/the-sigil/BRIEF.md` — one clause naming the earlier sense

**Owned by other tracks and not touched here:** nothing. `area-0` and `area-1` both have no
in-progress plan, and this track's file list is disjoint from `area-3` and `infra`, which do.

## Out of scope

**Renaming the sigil.** It is the spec's own term, it is the pattern every boss name
follows, and it carries a deliberate arc — Area 0 breaks one seven ways, Area 1 builds a
machine that makes them. A rename would touch the document of record, two areas, a quest
YAML and two test files, and it would buy nothing this plan does not.

Adding it to a glossary. See the success criteria — the validator would refuse it, correctly.

---

## Status

**Final Status:** Completed
**Completed:** 2026-09-06
**Completed By:** Claude (Opus 5), on the `curriculum-voice` track

### Outcomes

Three edits, all small, all in the sense the plan argued.

**`curriculum/area-0/sessions/session-3/error-log.md`** — the learner-facing artifact open
beside them all evening now opens with the definition: *a sigil is a symbol you draw — a
shape that means something, like a crest on a shield or a mark on a map.*

**`curriculum/area-0/sessions/session-3-the-broken-sigil.md`** — the DM is told to say it
out loud before anything else, given the sentence to say, and told explicitly **not** to
give Area 1's sharper meaning yet. §3 principle 7's two passes, named in the guidance so a
DM does not helpfully spoil the second one.

**`curriculum/area-1/exercises/the-sigil/BRIEF.md`** — one paragraph rewritten so it
sharpens week two rather than appearing to contradict it. It now says the Area 0 sense was
true and is half the story, before drawing the distinction it always drew.

### Verification actually performed

```console
$ cd curriculum/area-0 && py -3.14 verify.py     19 of 19
$ cd curriculum/area-1 && py -3.14 verify.py     35 of 35
$ cd pyquest && npm run validate:content         OK, 23 items across 8 areas
$ cd pyquest && npm run validate:plans           OK, 118 documents
$ npx vitest run packages/content/tests/two-roots.test.ts apps/field-manual/tests/
  6 files, 54 tests passed
```

Calendar language, US spelling and marks discipline re-checked on all three changed files.

### Where the plan turned out to be wrong, or incomplete

1. **My first draft of the Area 1 paragraph broke ADR 0006.** It read "the seven broken
   ones you fixed **in week two**" — calendar language in a learner-facing brief, in the
   same edit whose whole purpose was voice discipline. The test in CLAUDE.md catches it
   immediately: a learner who took twice as long fixed them in week four. Replaced with
   "there". `validate:content` did **not** flag it, so the rule is currently carried by the
   author rather than the validator on files named `BRIEF.md`.

2. **This branch could not verify anything until the harness fix was cherry-picked.** Off
   `main`, `curriculum/area-0/verify.py` reports **2 of 22**, because the `SEARCH` repair
   lives on `area-3-collections-phases-1-2a` and has not landed on `main`. Commit `808e1fc`
   was cherry-picked here so the success criteria could actually be checked.

   **That is a signal about sequencing rather than about this plan.** The harness repair is
   a prerequisite for verifying *any* curriculum change on *any* branch, and it is sitting
   behind an unmerged feature branch. It would be better on `main` on its own.

### Not done, on purpose

The seven `b*.py` docstrings still say "Broken Sigil N" with no gloss. Seven edits to say
one thing once is churn, and the error log is open beside them by design.

The name itself is untouched. It is the spec's own term (§4, line 93), it follows the
pattern every boss name follows, and it carries a deliberate arc across two areas.
