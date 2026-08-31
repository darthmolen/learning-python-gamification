# Curriculum Foundation — educational first, game second, in the tree itself

**Status:** In Progress
**Track:** curriculum-foundation
**Branch:** `curriculum-foundation`, off `main` at `359683d`
**Date:** 2026-08-31
**Author:** Claude (Opus 5)
**Lane:** B, with the Lane A readers repointed to follow it

## Objective

Make `curriculum/` the single source of every educational artifact and `game/` a deletable
overlay on top of it, so that the repository states in its directory names what the project
has always claimed in prose.

## Why this exists

The parent's framing, and it is a correction rather than a preference: *"Educational first,
game second, and we've been running the opposite."*

The evidence is a published website. The Field Manual set out to be "the curriculum,
published without the game" and shipped a vocabulary blurb, one sentence and a list of
briefs — because it read `content/`, and `content/` is the game's selection: the assessed
slice, the twenty quests and three bosses that carry hidden tests. Four of Area 1's six
quests carry the same names as curriculum exercises. The teaching itself — ~22,700 words for
Area 1 alone — sat in `curriculum/`, which nothing read.

**That was not a bug in the generator. It read the tree it was pointed at, and the tree was
laid out game-first.** The site is the symptom; the layout is the cause. Hence: *"Right now
we're on sand."*

Two further things the current layout gets wrong:

- **There is nowhere to put teaching.** No file in the repository holds an explanation of a
  concept. `Concept` is `{ id, label, area }`. The Area 1 page renders ten chips saying `if`,
  `elif`, `else` because a chip is all the data that exists. A missing file in a
  type-directory is invisible; an empty slot in an area folder is not.
- **`content/` and `curriculum/` both sound authoritative**, so neither is. The name collision
  is what allowed a game-first tree to pass for the curriculum for as long as it did.

## The target layout

```text
curriculum/                          every educational artifact, and nothing else
  README.md
  lib/                               shared runtime for exercises (unchanged)
  area-1/
    area.yml                         <- content/areas/area-1.yml
    lesson.md                        <- NEW: the teaching slot that has never existed
    dm-guide.md                      unchanged
    sessions/
      session-03-the-loop-that-does-not-stop.md
      session-03/                    <- the session's drills, beside the session
        s3e1_the_first_while.py
    exercises/
      the-countdown/
        BRIEF.md                     <- content/briefs/a1-the-countdown.md
        starter/unfinished.py        <- content/starters/a1-the-countdown.py
        hidden/test.py               <- content/tests/a1-the-countdown_test.py
    reference/                       unchanged — never published
    journal/                         unchanged

game/                                the overlay, and it is deletable
  area-1/
    quests/a1-the-countdown.yml      <- content/quests/
    transcripts/

content/                             ceases to exist
```

**Two trees, mirrored, because independence should be a deletion test rather than a claim.**
`rm -rf game/` must leave a curriculum that still validates and still publishes. That is the
project's whole thesis, and the no-game gate already exists to enforce the weaker version of
it. One tree with `quest.yml` inside each exercise folder keeps an exercise atomic, but turns
"the curriculum stands alone" back into a per-file rule — which is the same shape as the
starter/hidden boundary below, and the same shape as the `node:fs` leak that produced the
browser-safe entry.

**`starter/` and `hidden/` are siblings, not one `scripts/`.** The sketch put
`unfinished.py` and `test.py` in the same directory. Today "never ship `content/tests/`" is
one rule about one directory; co-locating them makes it a per-file rule about a shared one.
The learner never clones this repository — spec §739 puts hidden tests on the parent's side —
so nothing leaks today, but the SPA and API do serve briefs and starters to a client, and a
directory boundary is the cheap way to keep the test out of that path.

### The decision I made rather than deferred

`curriculum/area-N/exercises/` **already exists** and holds session drills as flat files
(`exercises/session-3/s3e1_the_first_while.py`, 51 of them across areas 0–2). The incoming
brief-bearing exercises want that same name, and two different things called "exercises" one
level apart is exactly the ambiguity this branch exists to remove.

So: **session drills move beside their session plan** (`sessions/session-03/`), and
`exercises/` becomes folder-per-exercise for the brief-bearing units the game points at.
A session's drills belong to the session that teaches them; an exercise with a brief and a
hidden test is a different kind of object.

This is the piece most likely to be wrong, and the piece that can be cut without losing the
rest — see Phase 4. It is also the piece that collides with the live `area-2` track.

## Success Criteria

- [ ] `content/` no longer exists; nothing references it
- [ ] `rm -rf game/` leaves a tree that passes `validate:content` and still builds the site —
      **asserted by a test**, not by inspection
- [ ] `lesson.md` exists for all eight areas; authored for 0–2, an explicit stub for 3–7 that
      says so on the page
- [ ] The Field Manual publishes `lesson.md` and reads `curriculum/`
- [ ] Every hidden test lives under a `hidden/` directory; a test asserts no `hidden/` path
      reaches `dist/`
- [ ] Full suite green, `typecheck` clean, `validate:content` clean
- [ ] Two published pages from one source: a learner Tome, and a DM page whose extra content
      is behind a **Teaching aid** control that expands in place
- [ ] The learner build contains **no DM prose at all** — not hidden, absent — asserted over
      the built HTML
- [ ] The published site is not worse than it is today at any point on the branch

## Approach

**The validator barely cares, which is the finding that makes this affordable.**
`validate.ts:93` already does a recursive `readdirSync` and derives POSIX-relative paths, and
quest YAML references `brief:`/`starter:`/`tests:` as explicit paths existence-checked at
`validate.ts:414`. Co-location needs no change to the reference mechanism. Only two hard-coded
conventions break:

- `validate.ts:280` — `file.startsWith('areas/')` decides what a manifest is
- `validate.ts:479-480` — the "area has content but no manifest" error names `areas/area-N.yml`

Both become the new convention. Nothing else in the reader is layout-aware.

**Cross-root references are the one new rule.** A quest in `game/` points at a brief in
`curriculum/`. `checkContent` gains a second root and resolves quest paths against the
curriculum root, and its "every path an item points at must exist" rule now spans two trees.
That rule is the reason `buildSite` can skip its own existence checks; it must not weaken.

## Phases

### Phase 1 — the readers learn the new shape, RED first — **done, `92fd2d1`**

Teach `validate.ts` the two conventions and the second root, against fixtures in the new
layout, before a single real file moves. Per `test-filter-development`: capture the failure,
then GREEN, then seed a mutant — a quest pointing at a brief that does not exist across the
root boundary — and confirm the suite catches it.

### Phase 2 — the move — **done, `5622547`**

**Landed as one commit, not one per concern, and that was a deviation worth naming.** The
concerns are not separable without a red intermediate: moving briefs without rewriting the
quest paths that name them leaves a tree that fails `validate:content`, and a bisectable
history is worth more than a narrower diff. Rename detection carried it anyway — git recorded
117 renames — so the diff still reads as moves. No content edits ride along; a rename commit that also
changes a word is a rename commit nobody can review.

### Phase 3 — `lesson.md`

The slot, then the prose. Areas 0–2 authored from the session plans and DM guides that
already exist; 3–7 get a stub that renders as an honest gap, the same way "Not written yet"
already works for exercises. The Field Manual renders `lesson.md` above the exercises.

### Phase 4 — session drills beside their sessions

`exercises/session-N/*.py` → `sessions/session-N/`. **Cuttable.** If this branch is getting
long or the `area-2` collision bites, stop after Phase 3 and the foundation still stands.

### Phase 5 — two audiences, one build: the Tome and the teaching aid

The DM guide is curriculum, not a separate body of work, and this phase says so in the
output. **Two published pages from one source tree**: the Tome for the learner, and the same
page plus a **Teaching aid** button for whoever holds the DM seat.

The button expands in place and pushes the content down — CLAUDE.md's standing UI rule, *"no
pop-overs; the Tome expands in place and pushes the work down; nothing is covered and nothing
is lost."* The learner build simply never renders the control.

**At area level first, exercise level second.** `dm-guide.md` is authored per area, so area
level is where the material already is and costs no new prose. Exercise level is the better
reading experience and can follow once the guide is sectioned per exercise; the renderer
should take a list of aids keyed by anchor so both work without a second code path.

**Two outputs, one generator.** A `dm` flag decides whether aids are rendered at all, not
merely hidden — a `display:none` teaching aid is a teaching aid the learner can read with
view-source, and this site is public. The no-aid build must contain no DM prose at all, and
a test asserts that over the built HTML the way the no-game gate already does.

Publishing is then two artifacts. **The DM page must not be linked from the learner page**,
and neither may leak the other's URL.

### Phase 6 — the gates the new shape demands

The deletion test (`game/` removed, everything still valid), the `hidden/` exclusion test,
and a check that no path string in `pyquest/` still says `content/`.

## Dependencies / Prerequisites

- Branch `curriculum-foundation`, already cut from `main` at `359683d`. **Blast radius is
  handled after the foundation lands, by explicit decision** — nothing here needs to merge
  before it is right.
- No dependency on the API, the SPA, or Postgres.

## Files Expected to Change

- `content/**` — deleted; every file moves to `curriculum/` or `game/`
- `curriculum/area-{0,1,2}/**` — receives briefs, starters, tests; gains `lesson.md`
- `curriculum/area-{3..7}/` — new, manifest and stub lesson only
- `game/area-{0,1,2}/quests/*.yml` — new home, 23 items
- `pyquest/packages/content/src/validate.ts` — two conventions, a second root
- `pyquest/packages/content/src/scaffold.ts` — `new:quest` scaffolds the new shape
- `pyquest/apps/field-manual/src/{build,render}.ts` — read `curriculum/`, render `lesson.md`,
  and emit two builds: the Tome, and the Tome plus teaching aids
- `.github/workflows/field-manual.yml` — publish the second artifact
- `pyquest/apps/api/src/checkout.ts` — verifier paths, if they are rooted here
- `CLAUDE.md` — the Lane B description and the lexicon table
- `planning/feature_field-manual-teaches_2026-08-30.md` — superseded, see below

## Supersedes

`planning/feature_field-manual-teaches_2026-08-30.md`, by the parent's call: *"it's a
rewrite, not a refactor."* That plan proposed `content/concepts/*.md` plus marked-up session
prose as the teaching slot, bolted onto the game-first tree. `lesson.md` in an area folder is
the same need answered at the right level, and two competing homes for the same prose is
precisely the drift that plan was written to avoid.

What survives from it and should be salvaged rather than re-derived:

- the docstring boundary — publish the module docstring, never the `# dc:` metadata below it
- `reference/` excluded by path *and* by test
- the learner/DM split, since session plans carry beat timings and Socratic phrasings
- the privacy scan, run against the live page rather than the local build

## Out of Scope — the blast radius, deliberately deferred

- **Merging to `main`.** By explicit direction: get the foundation right, then look at the
  blast radius.
- **The live `area-2` and `spa` tracks.** `area-2` holds `curriculum/area-2/**` and will
  conflict with Phase 4. That is a merge problem, and merge problems are the next
  conversation.
- **`feature_area-3-collections`**, queued against the old layout; it needs rewriting before
  it starts, not now.
- Concept-level definitions. `lesson.md` is the area-level answer; whether each of the 95
  concepts also wants its own paragraph is a question the first three lessons will answer
  better than speculation will.
- Transcripts. `content/transcripts/` holds zero files; `game/area-N/transcripts/` is
  reserved and left empty.

## Risks

- **A rename this size makes `git log` lie if done carelessly.** One concern per commit, no
  content edits mixed in, so rename detection holds.
- **Two roots is a genuinely new idea in the validator**, and the cross-root existence rule
  is what `buildSite` leans on to skip its own checks. If it is weak, the site publishes
  broken links. Phase 1 seeds a mutant across the boundary for exactly this reason.
- **Authoring three lessons is not mechanical work** and sits in a branch otherwise made of
  moves. If the prose stalls, Phase 3 ships the stubs and the lessons follow — the slot is
  the foundation, the prose is the fill.
- **The site must not regress mid-branch.** It is live and the parent reads it.
