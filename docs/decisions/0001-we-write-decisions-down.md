# 0001 — We write decisions down, here, under these rules

**Status:** Accepted
**Date:** 2026-08-29

## Context

Decisions made during the build were landing in whichever artifact happened to be open:

- **A zod comment.** `StandingSchema` in `packages/contract` records "§5.8 as ruled on
  2026-08-29: a record of what each player completed and which medals they took, not a
  ranking — so there is no rank field." That is an architecture decision, with a date and a
  rejected alternative, living inside a schema definition.
- **A backlog file.** Offline behaviour was ruled out of v1 on the grounds that the stack is
  always available by household arrangement. The reasoning sits in
  `planning/backlog/feature_offline-and-eventual-consistency_2026-08-29.md`, findable only by
  someone who already suspects it exists.
- **`CLAUDE.md`.** The lexicon reset — Area not Tier, Invasion not Patrol — is a decision with
  consequences across the spec, the schema, the engine, the curriculum and the UI.

None of these is in the wrong place exactly. The problem is that there is no right place, so
each decision went wherever the person making it happened to be standing. A decision spanning
the content schema, the contract and the UI has no single package or plan to live in, and it
ends up in whichever of the three was edited last.

The specific decision that forced the question is [0002](0002-weeks-are-road-markers.md): it
touches `packages/content`, `packages/contract` and the SPA, and its most important part is a
thing deliberately **not** built. Nobody writes down what they did not build.

## Decision

Keep short decision records in `docs/decisions/`, governed by the rules in this directory's
`README.md`: a decision earns a file when at least two of *crosses components*, *constrains
future work*, and *records a road not taken* hold.

Everything else stays where it already lives. The spec remains the document of record; plans
keep their own Status and Lessons Learned; a decision about one function stays in the comment
beside it.

## Consequences

- There is now a fourth place to look for reasoning, which is a real cost. The admission rules
  exist to keep the fourth place small enough to read end to end.
- A decision recorded here and later reversed is marked Superseded rather than edited or
  deleted. The record of having changed our minds is worth more than a tidy directory.
- Existing decisions are **not** retrofitted. The zod comment, the backlog file and the lexicon
  table stay where they are and keep working; rewriting history to fit a convention invented
  afterwards would cost real effort to produce a record nobody consulted. New cross-cutting
  decisions come here from now on. If one of the old three is ever wanted and cannot be found,
  that is the signal to move it, and the move is cheap.

## What this does not decide

Whether the spec gets amended when a decision here contradicts it. It should, and the spec is
still the document of record — but the mechanism for keeping the two in step is not settled,
and pretending otherwise would make this file the thing it is trying to prevent.
