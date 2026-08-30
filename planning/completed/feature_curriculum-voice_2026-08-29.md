# The Curriculum's Voice — Second Person, and Singular They

**Status:** Completed
**Track:** main
**Date:** 2026-08-29
**Author:** Claude (Opus 5)
**Lane:** B — but no area track may own it, because it spans all of them

## Objective

Settle one convention for how the curriculum refers to a learner, write it into
`curriculum/README.md` so every future area inherits it, and apply it retroactively to
Areas 0 and 1 — the two complete areas no live track owns.

## Why this exists

This repository is going public. `curriculum/` carries **1,289** instances of `he`, `him`
and `his`, which assume one specific boy and read as an oversight rather than a choice to
anybody else.

`tools/`, `infra/` and the machine-and-role language across `curriculum/` were already fixed
(`afb9375`, `09bcf13`). That pass deliberately stopped at phrases like *"the parent's
machine"* and left the pronouns, because pronouns are the teaching voice rather than
documentation and a find-and-replace would wreck it.

**The convention is not being invented here — it is already in the repository.**
`content/briefs/` addresses the learner directly: **186 instances of "you", zero of "he".**
The briefs never needed a pronoun. This plan extends the answer that half the corpus already
uses.

**"He or she" is explicitly rejected.** It is dated, it doubles the word count in a document
read at 7pm on a Tuesday, and it still leaves people out.

## Success Criteria

- [ ] `curriculum/README.md` carries the voice rule under **Conventions**, in the same
      register as the tag and `verify.py` rules already there
- [ ] `curriculum/area-0/` and `curriculum/area-1/` carry **zero** `he`/`him`/`his`
      referring to a learner — 875 instances across 93 files
- [ ] Quotations are **verbatim and unchanged**, and each is visibly a quotation
- [ ] `py -3.14 verify.py` still reports **19 of 19** in Area 0 and **35 of 35** in Area 1
- [ ] `cd pyquest && npm run validate:content` exits 0
- [ ] The origin — one household, a parent and a son — is stated **once**, well, in a place
      a reader looks for it, and is not re-implied by pronouns everywhere else

## Approach

### The rule, by audience

The register differs by who is being addressed, and conflating them is what makes a
mechanical sweep read badly.

| Audience | Files | Rule |
|---|---|---|
| **The learner** | `exercises/`, `journal/`, `content/briefs/` | **Second person.** "You will type this and it will fail" |
| **The DM** | `dm-guide.md`, `sessions/`, `reference/`, area READMEs | **Singular they** for the learner; "you" is already the DM |
| **Either, when ambiguous** | anywhere | `the learner` — precise, and stiff enough that it earns its place only where "they" could mean the DM |

Singular *they* is standard in Chicago 17th, AP and APA. It is not a compromise register and
does not cost directness:

> Ask him what the traceback says → **Ask them what the traceback says**
> It runs on his machine and not on yours → **It runs on their machine and not on yours**

### This is not a `sed` job, and the plan fails if it is treated as one

Three ways a blind substitution breaks the material:

1. **`he` is not always the learner.** In a guide addressed to "you" most instances are, but
   not all. A wrong swap makes a stall instruction incoherent — and a stall instruction is
   the one thing in the DM guide that has to be right on the night.
2. **Quotations must not move.** Spec §7's *"a first `git commit` rejected by a linter he did
   not install and cannot read"*, and git's own terminal output, are quoted text. `tools/`
   set the precedent: keep them verbatim and mark them as quotations.
3. **Second person is a rewrite, not a substitution.** *"He should predict what this draws"*
   becomes *"Predict what this draws"* — shorter and better, and no regex produces it.

Work file by file, reading each one. 93 files is the cost of doing it correctly.

### Where the origin story goes

The specific arrangement is worth stating plainly — §2.4 counts a parent in the room as the
design's single largest advantage, and that argument needs a real parent to work. But it
needs saying **once**, not re-implied by every pronoun in every session plan.

`curriculum/area-0/dm-guide.md` already does this and is the model to follow rather than
replace:

> Where it says *parent* rather than *DM*, it means the relationship rather than the seat,
> and the difference is deliberate: §2.4 counts a parent in the room as the design's single
> largest advantage, and no teacher standing in later gets that for free.

## Phases

### Phase 1 — the convention

Add the voice rule to `curriculum/README.md` under **Conventions**, beside the existing rules
about header tags and `verify.py`. Short: three lines and the table above. Every future area
reads it before authoring, and the two in-progress tracks apply it to their remaining work.

Do this first, so Phases 2 and 3 are applying a written rule rather than an opinion.

### Phase 2 — Area 0 [ASYNC with Phase 3]

36 files, 407 instances. The smaller area and the one whose voice the rest copied, so
settling it first sets the tone.

`py -3.14 verify.py` still reports 19 of 19 afterwards — the harness reads docstrings and
header tags, so prose edits can break it.

### Phase 3 — Area 1 [ASYNC with Phase 2]

57 files, 468 instances. Same rule, same check: 35 of 35.

### Phase 4 — the residual check

A grep proving the claim rather than asserting it: no `\bhe\b|\bhim\b|\bhis\b` under
`curriculum/area-0/` or `curriculum/area-1/` except inside marked quotations, and a hand
list of every survivor with the reason it survived.

Then re-run both harnesses and `validate:content`.

## Dependencies / Prerequisites

- **None blocking.** The two complete areas are not owned by a live track.
- The **`area-2`** and **`world-shim`** tracks are in progress and own
  `curriculum/area-2/**` (351 instances) and `curriculum/lib/**` (41). **This plan does not
  touch either.** They apply the Phase 1 convention to their own remaining work — which is
  the better outcome anyway, since Area 2's sessions 5–8 are unwritten and should be authored
  in the new voice rather than written in the old one and swept afterwards.
- **`area-3`** is queued and unwritten. It simply follows the convention.

## Files Expected to Change

- `curriculum/README.md` — the Conventions entry. Already `main`'s file
- `curriculum/area-0/**` — 36 files
- `curriculum/area-1/**` — 57 files

## Out of Scope

**`curriculum/area-2/**` and `curriculum/lib/**`.** Owned by in-progress tracks. Named here
so nobody helpfully sweeps them and collides.

**`docs/specs/`.** The spec uses `he` throughout and is the approved document of record.
Generalising it is a separate and harder call: §2.4's argument works *because* there is a
real parent and a real 11-14-year-old, and a spec that reads as though it were written for
a generic cohort may be a worse document rather than a more inclusive one. That decision is
not this plan's to make.

**`content/briefs/`.** Already correct — 186 "you", zero "he". It is the model, not the work.

---

## Status -- completed 2026-08-29

All four phases done. **875 pronoun instances across 44 files** are now zero for the
learner. `curriculum/README.md` carries the rule so every future area inherits it.

| Criterion | Result |
|---|---|
| Voice rule in `curriculum/README.md` Conventions | Two entries -- the audience table, and where the origin gets stated |
| Zero learner `he`/`him`/`his` in Areas 0 and 1 | Zero. Eleven survivors, all listed below, none of them the learner |
| Quotations verbatim | Unchanged. See below |
| `py -3.14 verify.py` | **19 of 19** Area 0, **35 of 35** Area 1 -- same as before the pass |
| `npm run validate:content` | Exits 0. 17 items across 8 areas |
| `npx vitest run` | 361 passed, 18 files |
| Origin stated once | `area-0/dm-guide.md`, unchanged; `curriculum/README.md` now points at it |

### The register split held, and it was the whole job

The plan's claim that this is not a `sed` job is the finding, not the hypothesis. Roughly
a third of the instances needed a rewrite rather than a substitution, and the two that a
regex would have wrecked outright are worth naming:

- *"He will assume they are from his point of view"* -- swapping `he` for `they` gives a
  sentence with two different referents for the same word. It is now *"They will assume
  `left` and `right` are from their own point of view"*, which names the subject.
- *"He never moved or turned between them"* -- same collision. Rewritten to name the
  turtle and the shapes.

Learner-facing files went to **second person**, which shortened them: *"Three files ask
him to write predictions"* became *"Three files ask you to write predictions"*, and
*"Enforce it"* -- an instruction to a DM sitting in a file addressed to the learner --
became *"Do not skip it"*.

### The eleven survivors, and why each one stays

**Nine of them are Dad.** `area-0/exercises/session-3/error-log.md`,
`area-0/exercises/session-6/commission-brief.md`,
`area-0/exercises/session-4/s4e2_the_dashed_orbit.py`,
`area-1/exercises/session-1/s1e2_what_range_gives.py` and
`area-1/exercises/session-6/error-log.md` are written *to* the learner *about* a named
parent -- *"how long each one took him"*, *"it has to run on your dad's machine"*. The
pronoun is correct, it is not an assumption about the learner, and the warmth is the
point. Per the 2026-08-29 nuance: the spec states rules against roles, the curriculum may
name the actual people.

**Two are `curriculum/README.md` stating the convention** -- the rule's own name for the
thing it forbids, and the sentence rejecting *"he or she"*.

### Machine-and-role language cleaned up on the way past

Four phrases the earlier pass (`afb9375`, `09bcf13`) had left, all now consistent with the
`peer`/`dm` lexicon rather than with people:

- *"The son is on 3.14"* -> *"The learner's machine is on 3.14"* (both area READMEs)
- *"Parent's copy. Not his."* -> *"The DM's copy, not the learner's."* (both `reference/`
  directory maps, and the docstrings of `r5_ask_and_draw.py` and `r6_nameplate.py`)
- `area-1/dm-guide.md`'s *"that is his father"* -> *"that is a parent"*, with a pointer to
  Area 0's guide, which is where the relationship is explained once and properly

### Seven `.py` files were edited, all comments and docstrings

`area-0/verify.py`, `area-1/verify.py`, `area-0/reference/r5_ask_and_draw.py`,
`r6_nameplate.py`, and `area-1/reference/r3`, `r5`, `r7`, `r8`, `r9`. Every edit is inside
a `#` comment or a module docstring; **no executable line changed and no file's line count
changed**, which matters because both area READMEs warn that shifting a docstring moves
the line numbers the answer keys quote. Both harnesses re-run clean, and `ruff` reports
the same two pre-existing findings in each `verify.py` that it reported before the pass.

### Nothing was changed that would alter exercise substance

The `area-0` track holds `content/` and reads `curriculum/area-0/exercises/**` and
`sessions/**` beneath this work. No file was renamed, no signature altered, no expected
output touched, no task renumbered. Every `# concepts:`, `# dc:`, `# expect:`,
`# stdin:`, `# min-strokes:` and `# timeout-seconds:` tag is byte-identical.

### Out of scope, as planned

`curriculum/area-2/**` (351 instances) and `curriculum/lib/**` (41) belong to the
`area-2` and `world-shim` tracks and were not touched. They now have a written rule to
apply to their own remaining work, which is the better outcome for Area 2's unwritten
sessions 5--8. `docs/specs/` and `content/briefs/` are untouched for the reasons the plan
gives.
