---
name: plan-sweep-blockers
description: Finds plans that are stuck, records what they are stuck on, moves them to planning/blocked/, and files a reminder for each blocker a person has to clear. Use when in-progress/ no longer answers "what is actually running" — when a plan has not moved in a while, when a status section contradicts its own header, or before a wave, so that scheduling reads a board that is telling the truth.
metadata:
  category: workflow-composers
  level: beside plan-workflow
---

# Sweep Blockers

`in-progress/` means *somebody is doing this*. It stops meaning that quietly: a plan reaches a
phase that needs a machine nobody has, and it sits there looking like work in flight. The board
then answers "what is running?" with a number that is too high, and every scheduling decision
made from it is wrong in the same direction.

This sweep separates the two, records why, and makes sure the thing that would unblock each plan
is written down somewhere a person will see it.

## When to run it

- Before a wave, so `wave-workflow` schedules against a true board
- When a plan's status section disagrees with its header — a reliable smell
- When `in-progress/` has more plans than there are people and agents to work them
- After a session where something turned out to need hardware, an endpoint, or an answer

## What a block actually is

**A plan is blocked when no one could pick it up today, however willing.** Not slow, not
unloved, not deprioritised — *unable*.

| Blocked | Not blocked |
|---|---|
| Needs a machine nobody has to hand | Nobody has got to it |
| Needs an endpoint that does not exist | Needs an endpoint that exists and is awkward |
| Needs an answer only a person can give | Needs a decision the plan could make itself |
| Every remaining phase is gated | *Some* phases are gated — see below |

**Partially blocked is not blocked.** A plan with three gated phases and one that anybody could
start stays in `in-progress/`, with its status line saying which part is live. There is real work
in it, and moving it hides that work.

## Step 1 — find the candidates

Grep is the first pass, not the answer:

```bash
grep -lniE "blocked on|cannot (be )?start|stopped at|not started, blocked|waits on|gated on" \
  planning/*.md planning/in-progress/*.md
```

Then **read each hit.** The phrase may be historical ("this track is no longer gated on it"), may
describe a blocker that has since cleared, or may be one phase of five. Grep finds sentences;
only reading finds blocks.

Also read the plans grep *missed*. A plan whose status section says "Phases 1, 2 and 4 are done"
and never says the word "blocked" is telling you Phase 3 is stuck.

## Step 2 — never invent a blocker

**If the plan does not state what it is waiting on, it is not blocked — it is unattended.** Say
so and leave it where it is.

This is the rule that keeps the sweep honest. A skill that infers blockers will find one in
every plan that has not moved lately, file a reminder for each, and bury the four that matter
under twenty that do not. `set-reminders` already forbids the same thing from the other end:
"Do not write one for work a plan already owns."

When a plan looks stuck and says nothing, the output is a question for the author, not a file.

## Step 3 — record the blocker on the plan

Add a `**Blocked on:**` line immediately after `**Track:**`, and update the status header:

```markdown
**Status:** Blocked — all phases complete, three criteria outstanding
**Track:** spa
**Blocked on:** his laptop for the 1366×768 check, the API for Journal and Console content,
and a browser that boots Pyodide for the turtle proof
```

**Name what would unblock it, not what is wrong.** "Blocked on hardware" tells the next reader
nothing; "blocked on the son's laptop, for a framerate measurement that cannot be faked on the
parent's" tells them exactly what to carry into the room. A blocked column whose entries do not
say why is a place plans go to be forgotten.

## Step 4 — move it

`git mv` the plan to `planning/blocked/`. The filename does not change — the path is the status,
which is `plan-workflow`'s rule and holds here too.

**`plan-workflow` owns the kanban vocabulary; this skill only adds one transition to it.** If the
two ever disagree about a directory, `plan-workflow` wins.

Moving a plan has a second effect worth checking: **a blocked plan is not holding a file.** If it
declared a `Files Expected to Change` that another plan wanted, that contention is now resolved,
and saying so is often the most useful sentence in the report.

## Step 5 — file a reminder for each blocker a *person* must clear

This is where the sweep earns its keep, and where it is easiest to make a mess.

**Only blockers a person can act on become reminders.** "Blocked on the api track" is not a
reminder — it is a dependency, and it clears when that track ships. "Blocked on the son's laptop"
is a reminder, because somebody has to carry a laptop into a room.

Use `set-reminders` rather than writing the file directly, so category, audience and the glob
plan-path stay consistent with everything already in `planning/reminders/`.

### Dedup by blocker, never by plan

**The failure mode is one reminder per blocked plan.** Three plans blocked on the same laptop
produce three reminders, the list stops being readable, and the person holding the laptop cannot
see that one sitting clears all three.

Before filing, read every existing reminder and ask **"is this the same blocker?"** — not "is
this the same plan?"

Matching is fuzzy and will not be solved by string comparison. In this repository the same
machine has been called *the son's laptop*, *his laptop* and *the target laptop* — three
spellings created by a single find-and-replace, in one afternoon. Expect that.

When a reminder already covers the blocker, **add the newly blocked plan to it** rather than
filing a second. When you are unsure whether two blockers are the same, **say so and file
nothing.** A missing reminder is a question; a duplicate is noise that outlives the question.

## Step 6 — report

- Which plans moved, and what each is blocked on
- Which reminders were filed, and which existing ones were extended instead
- **Any blocker now shared by more than one plan** — this is the finding that matters most, and
  it is invisible from any single plan
- Any plan that looked stuck and said nothing, as a question rather than an action

## What this skill does not do

- **Decide what to do about a blocker.** That is `plan-clear-blockers`, which runs when you have
  the thing rather than when you are tidying the board.
- **Unblock anything.** It records and routes; it never edits a plan's phases or scope.
- **Move a plan out of `blocked/`.** When a blocker clears, the plan goes back to `in-progress/`
  through `plan-workflow`, and the `Blocked on:` line comes off with it.
