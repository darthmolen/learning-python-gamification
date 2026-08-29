# The Curriculum's Voice — Second Person, and Singular They

**Status:** Planned
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
