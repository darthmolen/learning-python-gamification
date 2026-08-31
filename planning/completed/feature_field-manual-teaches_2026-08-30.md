# The Field Manual Teaches — a body, not a table of contents

**Status:** Superseded
**Track:** field-manual — **queued**, see Track discipline
**Date:** 2026-08-30
**Author:** Claude (Opus 5)
**Lane:** A serving B — the plumbing is Lane A, the prose it carries is Lane B

## Objective

Give every published page a teachable body: what each idea *is*, what each session
*taught*, and the explanation and code that sit above each exercise — so the site reads as
the curriculum rather than as its index.

## Why this exists

The parent read `area-1.html` and named it exactly: *"a vocabulary blurb, one sentence, and
then a bunch of exercises. No teachable body. No explanation around the real concepts, no
code examples. Pretty vacuous as a learning experience."*

That is a fair reading of what is published, and the cause is structural rather than
cosmetic.

**The generator has nowhere to put teaching.** `build.ts:60-81` composes an area from five
fields — number, title, weeks, blurb, concepts, exercises — and a concept is
`{ id, label, area }` and nothing else (`concepts.ts:20-27`). There is no definition text
for a concept anywhere in the repository. "What this area teaches" renders ten chips
reading `if`, `elif`, `else` because a chip is genuinely all the data that exists. Nothing
was lost in rendering; there was never a body to render.

**The teaching exists, in a directory the site does not read.** `contentRoot` points at
`content/` only. `curriculum/` holds ~22,700 words for Area 1 alone: ten session plans, a
5,100-word DM guide, 30 exercise files. And the exercise docstrings are precisely the
missing body — `s3e1_the_first_while.py:1-32` contrasts `while` with `for`, shows the loop
form as a code block, tables all six comparison operators, separates `=` from `==`, and
gives the run command. Learner-facing prose with code examples, already written, published
nowhere.

**The deeper problem is which body was chosen.** Four of Area 1's six published quests —
The Polygon Engine, The Gatekeeper, The Growing Spiral, The Sigil — carry the same names as
curriculum exercises `s1e3`, `s5e3`, `s8e2`, `s10`. So `content/` is the *game's* selection:
the assessed slice, the fourteen briefs that carry hidden tests. This site's own docstring
calls it "the curriculum, published without the game", but what it publishes is the game's
content with the scoring subtracted. **A brief is written for someone a session has already
taught.** Subtracting the game from an assessment does not produce a lesson — it produces an
assessment with no lesson attached, which is what is live today.

So the correction is not "add prose to the briefs". It is: **`curriculum/` is the Field
Manual's source, and `content/` is the game's.** The site has been reading the wrong tree.

## Success Criteria

- [ ] Every concept chip that has a definition renders that definition; the chip alone is
      the honest fallback where none is written yet
- [ ] Area pages are organised by **session**, each with a learner-facing account of what
      that session teaches
- [ ] Each exercise renders its docstring — explanation, code blocks and all — not just a
      title and tags
- [ ] Areas 0 and 1 publish all 47 exercise files, against the 11 quests published today
- [ ] **No answer, no reference solution, and no DM-only direction ever reaches the site**,
      proven by a test that fails when one does
- [ ] The no-game gate still passes over the enlarged output
- [ ] Nothing identifying a person, machine or household appears on any page
- [ ] A gap still reads as a gap: an unwritten definition or session says so

## Approach

### 1. Concept definitions live in content, not in TypeScript

Add `content/concepts/<id>.md` — one short file per concept, prose plus a minimal code
example. **Not** a `definition` field on `Concept`: 95 paragraphs inside `concepts.ts`
would put Lane B prose inside a Lane A source file, where authoring it means touching code
and every edit risks the registry the validator depends on. A directory of markdown keeps
prose authorable by whoever writes curriculum, and leaves `concepts.ts` the id registry it
is.

`checkContent` learns to read them and to report a **warning, not an error**, for a concept
with no file. This is deliberate and matches `authoring: partial` and the areas 3–7
treatment: an unwritten definition is an honest gap, not a broken build. The validator is
not being loosened — a definition for an *unknown* concept id is still an error, which is
the typo case the validator exists to catch.

First pass authors the 19 concepts of Areas 0 and 1. The remaining 76 render as bare chips
and say so.

### 2. Sessions become the page's spine

`AreaView` gains `sessions`, read from `curriculum/area-N/sessions/*.md`, each carrying its
title, the concepts it introduces and resurfaces, its learner-facing prose, and its
exercises. Exercises hang off sessions rather than off the area, because that is the order
in which a person actually meets them.

### 3. Session prose is marked in place, not duplicated

The session files are DM-facing — beat timings, Socratic phrasings, *"make them predict
before running"*. Publishing them raw would hand the learner the teacher's notes.

Rather than authoring a parallel learner file per session, mark the learner-safe region of
the existing file:

```markdown
<!-- learner:start -->
A `for` loop knows how many times it will run before it starts. A `while` loop does not …
<!-- learner:end -->
```

One source, no drift. A duplicate learner file would be two copies of the same explanation,
and the copy further from the session is the one that goes stale — the same argument this
repository already made when it deleted the duplicated missing-brief guard.

**An unmarked file publishes nothing but its title and concepts.** Fail open to silence:
the risk being managed is DM notes leaking, so the default must be to publish nothing.

### 4. Exercise docstrings are lifted, and the metadata below them is not

Read the module docstring of each `curriculum/area-N/exercises/**/*.py`, render it as
prose with its code blocks intact.

**Stop at the docstring.** The lines immediately below it are game metadata —
`# concepts:`, `# dc: 10`, `# expect: ok`, `# min-strokes: 9`. Publishing a whole file
would put a difficulty class on the page and rightly fail the no-game gate. The docstring
is the teaching; everything under it is the game's bookkeeping.

### 5. `reference/` is excluded by construction and by test

`curriculum/area-N/reference/` holds worked solutions and `session-6-answers.md`. The
reader walks `exercises/` only, and a test asserts no reference filename or answer text
appears in `dist/`. Exclusion by path is the mechanism; the test is what keeps it true when
someone later adds a directory walk.

## Phases

### Phase 1 — the reader, RED first

A `curriculum.ts` reader: sessions, marked prose, exercise docstrings. Per
`test-filter-development`, capture the failure output, then GREEN, then seed a mutant — a
reference solution placed where the walker could reach it — and confirm the suite catches
it. The last field-manual gate was vacuous through a `\b` escape and let three mutants
through; assume nothing here is load-bearing until it has been seen to fail.

### Phase 2 — concept definitions

`content/concepts/`, the validator's warning path, and the 19 files for Areas 0 and 1.
[ASYNC] — the prose is independent of Phases 1 and 3.

### Phase 3 — render

Sessions as the spine, definitions under the chips, docstrings under the exercises.

### Phase 4 — the gates the enlargement demands

Extend the no-game test over the larger surface, and add two: **no answers**, and **no DM
direction** (`Ask them`, `Do not say`, beat timings). Then the privacy scan, run against
the live page rather than the local build.

### Phase 5 — mark the sessions

Areas 0 and 1 only — twenty session files. **Area 2 is out of scope**, see below.

## Dependencies / Prerequisites

- ~~The `field-manual` track must free up.~~ **Cleared 2026-08-31.** The predecessor closed
  to `planning/completed/feature_field-manual_2026-08-30.md` once the site was live and
  verified. The track is free and this plan may be admitted to `in-progress/`.
- No dependency on the API, the SPA, or Postgres. Everything read here is committed.

## Files Expected to Change

- `pyquest/apps/field-manual/src/curriculum.ts` — new, the `curriculum/` reader
- `pyquest/apps/field-manual/src/build.ts` — a second root; sessions in `AreaView`
- `pyquest/apps/field-manual/src/render.ts` — sessions, definitions, docstrings
- `pyquest/apps/field-manual/tests/` — the reader's tests; answers and DM-direction gates
- `pyquest/packages/content/src/validate.ts` — read `content/concepts/`, warn when absent
- `content/concepts/*.md` — new, 19 files in the first pass
- `curriculum/area-0/sessions/*.md` — learner markers only, no prose rewritten
- `curriculum/area-1/sessions/*.md` — learner markers only, no prose rewritten

## Track discipline

**Track `field-manual`, free as of 2026-08-31.** Both admission tests now pass: the
predecessor has closed, so no other in-progress plan declares this track, and the file set
below collides with nothing running.

`area-0` also closed, releasing `content/`. The one live collision left is `area-2`, which
claims `curriculum/area-2/**` — so **Area 2's sessions are deliberately excluded** from
Phase 5 and pick up after that track lands. Note that `content/concepts/` was new ground
even while `area-0` held `content/quests|briefs|starters|tests|areas`; it is uncontested
either way.

`pyquest/packages/content/src/validate.ts` is shared with no in-progress plan today, but it
is the file every content track depends on. One additive read path, no restructuring.

## Out of Scope

- The Tome screen, and any API work.
- The 76 concept definitions outside Areas 0 and 1 — they render as bare chips until
  authored, which is the honest state.
- Areas 3–7's "Not written yet". That is `content/` telling the truth and should stay.
- Rewriting the DM guide for publication. It is the DM's document; marking sessions is the
  narrower move and it is enough.
- Self-hosting the Google fonts. Real, noted on the in-progress plan, not this plan's job.

## Risks

- **The privacy surface grows.** Publishing ~50 more files from a tree written for one
  household, from a public repository that names a minor, is the largest new risk here. The
  scan in Phase 4 runs against the live page and is a gate, not a courtesy.
- **The site gets much bigger**, and a static page per area may stop being the right shape
  once a page carries ten sessions. Acceptable for now; revisit if a page passes the point
  of being readable.
- **`# dc:` and friends sit two lines below every docstring.** The docstring boundary is the
  whole safety argument for Phase 4's gate, and it is one parser bug away from failing.

---

## Status

**Final Status:** Superseded — never started
**Track:** field-manual (never admitted to `in-progress/`)
**Closed:** 2026-08-31
**Closed By:** Claude (Opus 5)

**Superseded by `planning/in-progress/feature_curriculum-foundation_2026-08-31.md`**, on the
parent's call: *"I think it's a rewrite, not a refactor on that plan from last night."*

### Why it did not survive contact

This plan accepted the tree it found. It proposed `content/concepts/*.md` and marked-up
session prose as the teaching slot, and taught the generator to read a second directory —
all of it bolted onto a layout that is game-first, with `content/` holding the game's
assessed slice and `curriculum/` holding the teaching that nothing read.

The diagnosis in this document was right and is carried forward verbatim. The remedy was
pitched one level too low. *"Educational first, game second, and we've been running the
opposite"* — the fix is the tree, not another reader taught to compensate for it.
`lesson.md` in an area folder answers the same need at the level where the gap actually is.
Two competing homes for the same prose is the drift this plan was itself written to avoid.

### What was salvaged into the successor

- The **docstring boundary** — publish the module docstring, never the `# dc:` /
  `# min-strokes:` metadata two lines below it.
- **`reference/` excluded by path and by test**, because it holds worked answers.
- The **learner/DM split**: session plans carry beat timings and Socratic phrasings that
  must not reach a learner-facing page.
- The **privacy scan run against the live page** rather than the local build.
- The finding that **`AreaView` has no field for teaching** and a concept is
  `{ id, label, area }` with no definition text anywhere in the repository. That is the
  observation the successor is built on.

### What was dropped, and why

- `content/concepts/*.md` — the area-level `lesson.md` is tried first. Whether all 95
  concepts also want a paragraph each is a question three authored lessons will answer
  better than speculation.
- The `<!-- learner:start -->` markers. Still a good idea; deferred until the sessions have
  settled into their new home.
