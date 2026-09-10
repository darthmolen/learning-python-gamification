---
kind: stub
status: open
date: 2026-09-10
---

# The spec has no position on working between sessions

**Status:** Backlog
**Date Discovered:** 2026-09-10
**Discovered During:** the workflow audit behind `wave-4_the-workflow-and-the-bootstrap_2026-09-10`

## Context

A sweep of all 870 lines of the spec and all eight ADRs for *solo · self-study · alone ·
unsupervised · between sessions · on his own* returns **one** substantive hit, and it is about
machines rather than supervision — §6.4's *"The API runs on the parent's machine; the son codes on
his own."*

The design assumes co-presence, repeatedly and as a strength:

- §2.4 — *"Relatedness is free. Boot.dev builds guilds to simulate the presence of people who
  care. A parent in the room is the real thing."*
- §5.8 — *"A player watches a stronger player fail. This is the highest-value mechanic in the
  design."*
- §3 principle 6 and §5.3 — no hints, Socratic questions only. A person has to be there to ask
  them, and the spec names no substitute.
- ADR 0007 — five of the twenty-four authored practices carry no exercise at all: *"The work is
  delivered at the table."*
- `curriculum/how-to/how-to-learn.md`'s stuck ladder ends *"Ask. There is somebody sitting there
  for this."*

**None of that is an answer to the question.** It is a description of the intended arrangement.
The question is what happens on a Tuesday when the learner opens the laptop and nobody is free.

## What is actually possible today, which is more than the spec admits

The architecture already permits most of it, by accident rather than intent. §6.4 decouples
verification in **time and machine** — the learner pushes whenever, and the API pulls, tests and
pays with no human present. `hidden-tests`, `local-repo` and `git-signal` need nobody at all.

**Only `peer-signoff` blocks on a person**, and it blocks bosses and every Teach-back medal. Even
there the block is not total: the attempt is recorded as `passed=false` carrying
`awaitingSignoff`, sits in the queue, and is granted later. `feature_workflow-catalog_2026-09-10`
documents that path.

So the honest position is that a learner can work alone through nearly everything and cannot
*finish* an area alone. Nobody has decided whether they **should**.

## The questions this has to settle

- **Is unsupervised work legal?** If yes, it needs saying, because the curriculum's own prose
  currently assumes otherwise in the places listed above.
- **May a learner run ahead of the DM?** §5.11 has the DM one area ahead in order to adjudicate;
  a learner who works alone all week inverts that. The proposed *"a DM who also plays runs one
  area ahead"* rule in `feature_roles-modes-and-the-dm-seat_2026-08-28` is not yet in the spec and
  would collide with this directly.
- **What about the practices with no files?** A fifth of the authored curriculum is delivered at
  the table by design. If a learner works alone they will either skip those or do them badly, and
  `how-to-learn.md` already tells them skipping is not allowed. That sentence needs to survive the
  answer or be rewritten.
- **Does the Datamine rule still hold?** §5.5 requires two genuine attempts and a written sentence
  before the reference solution unlocks. Alone, nobody sees the attempts. The mechanic is built on
  the honour system already — §5.10 says so — but alone it is *only* the honour system.

## Why this is the parent's decision rather than a design one

It is a question about how much unsupervised screen time is wanted and how much of the teaching
is willing to be delegated to a text file, for an 11–14-year-old. That is not a thing a spec
section can settle on its own, which is why this is a stub and not a plan.

It is also adjacent to the AI-DM policy collision already recorded in
`feature_roles-modes-and-the-dm-seat_2026-08-28` — *"This is a decision, not an oversight, and it
belongs to the parent."* Both are the same shape and should probably be answered in one sitting.

## Trigger for Promotion

The parent ruling on it, or the first time the learner asks to work on something between
sessions — whichever comes first, and the second is likely.
