---
name: plan-sweep-blockers
description: Finds plans that are stuck, records what they are stuck on, moves them to a blocked column, and files a task for each blocker something outside the repository has to clear. Use when the in-progress column no longer answers "what is actually running" — when a plan has not moved in a while, when a status section contradicts its own header, or before scheduling, so that the schedule reads a board that is telling the truth.
metadata:
  category: workflow-composers
  level: beside plan-workflow
---

# Sweep Blockers

An in-progress column means *somebody is doing this*. It stops meaning that quietly: a plan
reaches a step that needs a machine nobody has, an approval nobody has given, or an environment
that does not exist yet, and it sits there looking like work in flight.

The board then answers "what is running?" with a number that is too high, and every scheduling
decision made from it is wrong in the same direction.

This sweep separates the two, records why, and makes sure the thing that would unblock each plan
is written down somewhere the actor who could clear it will see it.

## When to run it

- Before scheduling, so the schedule is built against a true board
- When a plan's status section disagrees with its own header — a reliable smell
- When the in-progress column holds more plans than there are people and agents to work them
- After a session where something turned out to need a resource, a decision, or an event

## What a block actually is

**A plan is blocked when nobody could pick it up today, however willing.** Not slow, not
unloved, not deprioritised — *unable*.

| Blocked | Not blocked |
|---|---|
| Needs a device, licence or environment nobody has to hand | Nobody has got to it |
| Needs an interface that does not exist | Needs an interface that exists and is awkward |
| Needs an answer only a particular person can give | Needs a decision the plan could make itself |
| Waits on a date, a window, or an external event | Waits on somebody's attention |
| Every remaining step is gated | *Some* steps are gated — see below |

**Partially blocked is not blocked.** A plan with three gated steps and one that anybody could
start stays in progress, with its status line saying which part is live. There is real work in
it, and moving it hides that work.

## Step 1 — find the candidates

Grep is the first pass, not the answer:

```bash
grep -rlniE "blocked on|cannot (be )?start|stopped at|not started, blocked|waits on|gated on|waiting for" \
  <queued dir> <in-progress dir>
```

Then **read each hit.** The phrase may be historical ("this is no longer gated on it"), may
describe a blocker that has since cleared, or may cover one step of five. Grep finds sentences;
only reading finds blocks.

Also read the plans grep *missed*. A plan whose status says "steps 1, 2 and 4 are done" and never
uses the word *blocked* is telling you step 3 is stuck.

## Step 2 — never invent a blocker

**If the plan does not state what it is waiting on, it is not blocked — it is unattended.** Say
so, and leave it where it is.

This is the rule that keeps the sweep honest. A skill that infers blockers will find one in every
plan that has not moved lately, file a task for each, and bury the few that matter under a
dozen that do not.

When a plan looks stuck and says nothing, the output is a question for its author, not a file.

## Step 3 — record the blocker on the plan

Add a `**Blocked on:**` line immediately after the plan's owner or track field, and update the
status header so the two agree:

```markdown
**Status:** Blocked — all steps complete, three acceptance criteria outstanding
**Track:** <owner>
**Blocked on:** a device the team does not have for the display check, an upstream interface
for two of the screens, and a runtime nobody has yet stood up for the end-to-end proof
```

**Name what would unblock it, not what is wrong.** "Blocked on hardware" tells the next reader
nothing. "Blocked on a device none of us owns, for a measurement that cannot be taken on any
machine we do own" tells them exactly what to bring into the room.

A blocked column whose entries do not say why is a place plans go to be forgotten.

## Step 4 — move it

Move the plan to the blocked column. The filename does not change: **the path is the status.**

**The kanban skill owns the column vocabulary; this skill only adds one transition to it.** If
the two ever disagree about a directory or a status name, the kanban skill wins.

Moving a plan has a second effect worth checking: **a blocked plan is not holding a file.** If it
declared a set of files it expected to change, and another plan wanted one of them, that
contention is now resolved — and saying so is often the most useful sentence in the report.

## Step 5 — file a task for each blocker something outside the repository must clear

This is where the sweep earns its keep, and where it is easiest to make a mess.

**Only blockers an actor outside this repository can clear become tasks.** A blocker that clears
when another plan ships is a *dependency*: record it, do not file it, because nobody has to do
anything except finish the other plan. A blocker that clears when a person carries something
into a room, or grants an approval, or a window opens, is a **task** — somebody has to act.

**The actor is whatever clears it, and it need not be a person.** A named individual, a role, a
team, a system that has to run, a vendor that has to answer, a date that has to arrive. Record
which, because it determines where the task can even be seen — a task nobody is watching for is
not filed, it is buried.

Use whatever mechanism this repository already has for recording work a person must do rather
than writing the file by hand, so that its fields stay consistent with everything already there.
If there is no such mechanism, the blocker belongs in the plan's own text and the report should
say the gap exists.

### Dedup by blocker, never by plan

**The failure mode is one task per blocked plan.** Three plans blocked on the same device produce
three tasks, the list stops being readable, and the person holding that device cannot see that
one sitting clears all three.

Before filing, read every existing task and ask **"is this the same blocker?"** — not "is this
the same plan?"

Matching is fuzzy and will not be solved by string comparison. The same resource is routinely
written three ways in one repository — a rename, a find-and-replace, or two authors on the same
afternoon is all it takes. Expect that, and compare meaning rather than text.

When a task already covers the blocker, **add the newly blocked plan to it** rather than filing a
second. When you are unsure whether two blockers are the same, **say so and file nothing.** A
missing task is a question somebody will ask; a duplicate is noise that outlives the question.

## Step 6 — report

- Which plans moved, and what each is blocked on
- Which tasks were filed, and which existing ones were extended instead
- **Any blocker now shared by more than one plan** — this is the finding that matters most, and
  it is invisible from any single plan
- Any plan that looked stuck and said nothing, as a question rather than an action

## What this skill does not do

- **Decide what to do about a blocker.** That is the clearing skill, which runs when you have the
  thing rather than when you are tidying the board.
- **Unblock anything.** It records and routes; it never edits a plan's steps or scope.
- **Move a plan out of the blocked column.** When a blocker clears, the plan returns through the
  kanban skill, and the `Blocked on:` line comes off with it.
