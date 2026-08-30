---
name: wave-workflow
description: Coordinates many plans across many tracks when the board stops fitting in a head. Use when several plans are queued behind each other, when deciding what can start in parallel right now, or when a queued plan seems blocked by something other than its real dependencies. Sits above plan-workflow; it schedules plans and never rewrites them.
metadata:
  category: workflow-composers
  level: above plan-workflow
---

# Wave Workflow

`plan-workflow` governs one plan through the kanban. **A wave governs the order plans start
in.** A plan owns a track; a wave owns the board.

The word is this repository's already — `feature_phase0-tier0-foundation` reasons about Wave 0
and Wave 1, and a backlog item places the DB schema "in Wave 3." This skill makes the existing
vocabulary official rather than adding a synonym for it, which is the same rule the lexicon
table applies to `Area` over `Tier`.

## When to write one

**When the plans stop fitting in a head.** Concretely, when any of these is true:

- More than about four plans are live at once
- A queued plan is blocked by something that is not its stated dependency
- Two plans declare the same track
- The same file appears in three or more plans' `Files Expected to Change`

Two or three plans need no wave. They need a look at `in-progress/`. A wave written too early is
a second planning artefact to keep in sync, which costs more than it saves.

## Where waves live

```
planning/waves/wave-<n>_<name>_<YYYY-MM-DD>.md
```

Numbers are never reused, and a wave is never deleted — the trail is how you learn what the
last one actually cost. Waves do not move through the kanban directories; they carry a
**Status** of `Open` or `Closed` and stay where they are.

## What a wave contains

```markdown
# Wave <n> — <name>

**Status:** Open | Closed
**Level:** Wave — coordinates plans, does not replace them
**Date:** YYYY-MM-DD
**Author:**
**Tracks:** every track this wave touches

## What a wave is, and why this is one
One paragraph. What made the board stop fitting in a head.

## The problem this wave exists to solve
A table of held plans: what is held, what holds it, and which KIND of hold it is.

## The sequence
Gates first, in order, each with its track and a rough size. Then what starts in parallel.

## Exit criteria
Checkboxes. When is this wave over?

## What this wave does not do
Above all: it does not re-plan anything.
```

## The arithmetic

A plan may start when **all three** hold. Check them in this order, because the cheap check
rules out the most:

1. **Its track is free.** No other in-flight plan declares the same track.
2. **Its file set is disjoint** from every in-flight plan's `Files Expected to Change`.
3. **Its stated dependencies are satisfied.**

```bash
# what is running, and on what track
grep -H "^\*\*Track:\*\*" planning/in-progress/*.md

# every path claimed by an in-flight plan, and any claimed twice
for f in planning/in-progress/*.md; do
  sed -n '/## Files Expected to Change/,/^## /p' "$f" | grep -oP '(?<=^- `)[^`]+'
done | sort | uniq -d
```

**A plan with no `Files Expected to Change` section defeats the whole mechanism.** Rule 2
cannot be evaluated against it, so every admission decision near it is a guess in the shape of
a rule. Finding one is a gate, not a note.

## The pattern that keeps recurring

Most plans that look blocked are not blocked by their dependencies. They are blocked by **one
file doing two jobs** — a root config, a manifest, an index that every component needs one line
of. This project has hit it four times: `concepts.ts`, `pyquest/tsconfig.json`,
`infra/docker-compose.yml`, `packages/contract/src/index.ts`.

Two fixes, and prefer the second:

- **Declare an owner.** Cheap, and it serialises the work. Right when there is exactly one
  change to make and it can be made now.
- **Split the file by owner.** One fragment per track, and the shared file changes once —
  during the gate. Right when each track's change cannot be written yet, which is the usual
  case.

The tell is the third claimant. One shared file is a coincidence; three is a file doing two
jobs, and a wave should propose the split rather than schedule around it.

**Prove a split was mechanical.** Whatever the split, the suite reports the same count
afterwards and no test file is edited. A count that moves means behaviour changed, which a
split is not allowed to do.

## Gates

A **gate** is a plan inside a wave that must run alone and complete before others start, usually
because it edits other plans' file sets. Gates belong to `main`.

Keep them small enough to finish in a sitting. A gate that takes a week is a plan, and the wave
should say so.

## Running plans as sub-agents

A wave is the natural point to hand each track to its own agent. Two rules, and the second was
learned the hard way in Wave 3.

**Give each agent its exact file set, and the rulings its plan already made.** An agent that has
to re-decide what the plan settled will decide differently. Paste the constraints — the file
list, the vocabulary rulings, what it must not touch — rather than trusting it to infer them
from a long document.

**Isolate them, or accept that the shared gate is unusable.** Agents doing `test-filter-development`
in one working tree take turns making the suite red *on purpose*: RED is the first step, and a
shared tree makes one track's RED every track's failing gate. In Wave 3 the `spa` track
correctly reported 33 failures and 21 type errors that were simply the `api` track mid-cycle,
in an untracked test file it could not act on.

Two ways out:

- **`isolation: "worktree"`** on the agent, so each track works in its own git worktree and the
  shared tree only ever sees finished, committed work. Prefer this whenever two or more agents
  run at once.
- **A per-track gate** when they do share a tree: `vitest --project <name>` scopes a run to one
  project, so a track can verify itself without waiting on anyone. Tell every agent which gate
  is theirs, and tell them the shared one is not.

Either way, say so in the wave. A track that does not know another track's RED is in the tree
will read it as its own breakage, and the honest thing it then does — stop and report — costs
more than the isolation would have.

## Closing a wave

Tick the exit criteria, set **Status: Closed**, and add what the next wave inherits. Waves are
the record of how the board actually behaved, and the next one is written faster for having
read the last.

## Do not

- **Do not re-plan inside a wave.** Each plan keeps its own objective, phases, criteria and
  review history. A wave that edits the substance of its plans has become a very large plan.
- **Do not schedule Lane B by wave.** Content tracks appear in a wave only when they hold files
  Lane A wants. Lane B is never the thing that gets postponed.
- **Do not let a wave outlive its accuracy.** It is a snapshot with a plan attached. If it no
  longer describes the board, close it and write the next one.
