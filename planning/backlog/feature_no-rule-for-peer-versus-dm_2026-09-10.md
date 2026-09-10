---
kind: stub
status: open
date: 2026-09-10
---

# Nothing says when a sign-off should ask a peer rather than the DM

**Status:** Backlog
**Date Discovered:** 2026-09-10
**Discovered During:** the workflow audit behind `wave-4_the-workflow-and-the-bootstrap_2026-09-10`

## Context

`peer-signoff` is one of four verifiers, and its `by` field holds a role — `peer` or `dm`. Spec
§6.3 defines the mechanic in a single table row:

> Somebody other than the submitter presses the button, named by a `by` field holding a **role** —
> `peer` or `dm`, never a person. *Used by: Bosses, and every Teach-back medal.*

**That is the whole of the specification.** The mechanism is identical for both values; only who
is asked differs. Nothing anywhere says how an author should choose.

The authored content has already made the choice five times, and made it both ways:

| Quest | `by` | The comment's reasoning |
|---|---|---|
| `a0-first-light` (Boss 0) | `peer` | a boss has no starter, so a person must look |
| `a2-the-log-as-a-story` | `dm` | *"a signal can prove commits exist; it cannot prove the log reads as a story… the dm reads it back to him"* |
| `a3-set-a-breakpoint` | `dm` | the DM watches them drive the debugger |

A pattern is visible — `dm` where judgement of *quality* is needed, `peer` where the check is
that the thing works in front of somebody — but it is a pattern in three header comments rather
than a rule, and the next author has nothing to consult.

## Why this matters more than it looks

**In Kitchen Table mode the two values are nearly the same person**, which is exactly why the
choice is being made carelessly. The parent holds both seats, so `peer` and `dm` both resolve to
them for the learner's work. The distinction only bites when the roster changes — a sibling, a
classroom, a teacher standing in — and by then ~150 quests will have been authored against an
unstated convention.

That is the same argument that got `by: 'peer' | 'dm'` into the schema early, recorded in the
§11 decision log: *"A two-person family in the content contract becomes a migration the moment a
sibling, a class, or a teacher appears."* The enum was future-proofed and the **editorial rule for
using it was not.**

There is also an asymmetry worth naming. §5.11's teach-back inverts the direction — a parent's
quest is incomplete until the learner hears the explanation and presses the button — so `peer` on
a DM's own quest means something quite different from `peer` on a learner's. One rule has to cover
both, or two rules have to be written.

## What this needs to produce

A sentence in §6.3, or a short section beside it, that an author can apply without thinking twice.
Something of the shape: *`dm` when the win condition is a judgement the curriculum has an opinion
about; `peer` when the win condition is that somebody watched it work.*

Then a pass over the five existing `peer-signoff` quests to confirm each still agrees with the
rule, and a correction where one does not.

## Trigger for Promotion

Authoring Area 4, which is the next area to add `peer-signoff` quests — or any decision that
changes the roster, since that is the moment the two values stop being the same person.
