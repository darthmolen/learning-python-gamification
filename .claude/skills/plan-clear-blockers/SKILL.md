---
name: plan-clear-blockers
description: Turns the blocked column into an agenda for a session that could actually clear it. Use when a resource is briefly available — his laptop for an hour, a sitting with the DM, a decision you are finally ready to make — and the question is "what do I do with it?". Groups by blocker rather than by plan, orders the work inside each group, cites where each step is already specified, and names what each one unblocks.
metadata:
  category: workflow-composers
  level: beside plan-workflow
---

# Clear Blockers

`plan-sweep-blockers` answers *what is stuck and why*. This one answers a different question,
asked at a different moment:

> **I have his laptop for an hour. What do I do with it?**

The board cannot answer that. It is organised by plan, and a plan is not a unit of anybody's
afternoon — the four things worth doing while that laptop is open live in four different plans,
and nothing in `blocked/` puts them next to each other.

## The instructions already exist. Do not write them again.

This is the whole design constraint, and getting it wrong produces something that looks more
useful than it is.

`world-shim` Phase 3 already specifies the framerate measurement. `area-2` Phase 3 already
specifies the profile import, down to the export command. Restating those here creates a second
copy that drifts from the plan that owns it — the same failure the reminders' glob plan-path
exists to prevent, one level up.

**Cite; never restate.** The output points at the authoritative steps and adds only what is not
written anywhere: the grouping, the order, and what each one buys.

The value is **aggregation, prioritisation, dedup and ordering.** Not a summary of the plans —
a summary is what you get when you skip all four.

## Step 1 — read both halves

`planning/blocked/**` for the `**Blocked on:**` lines, and `planning/reminders/**` for the open
ones. Neither is sufficient alone: the plan says what is stuck, the reminder says who can move
it and when, and the batching only appears when both are on the table.

Include `planning/in-progress/**` too. A plan that is partially blocked stays in progress by
design, and its gated phase belongs in this agenda even though the plan is not in `blocked/`.

## Step 2 — group by blocker, never by subject

**Subject groups for reading. Blocker groups for doing.**

`set-reminders` files under `screens`, `hardware`, `curriculum` — right for browsing a list,
wrong here. Two reminders under `hardware` may need two different machines on two different days,
and the one under `screens` may need the same laptop as one of them.

Group by **the thing that is briefly available**:

```
The son's laptop, one sitting
  · Install and verify the Area 2 VS Code profile      → unblocks area-2
  · Measure the Ursina framerate at 5,000 blocks       → unblocks world-shim
  · Open all nine screens at 1366×768                  → unblocks spa
  · Make Gitea reachable, and push from there          → §6.4's verification mechanism
```

**That grouping is the output.** Three blocked plans and one laptop is invisible from any single
plan and obvious the moment they are stacked — and it converts three stalled tracks into one
Saturday morning.

## Step 3 — order inside the group

Ordering is judgement, and these are the questions that decide it:

- **What does the rest depend on?** If Gitea being reachable is how the code gets to the machine
  at all, it goes first regardless of how interesting it is.
- **What is cheapest to discover is impossible?** A step that might reveal the machine cannot do
  the thing belongs early, while there is still time to react.
- **What needs him present, and what does not?** Check `audience`. A `dm` item can be done before
  he sits down; a `learner` item spends his session. Mixing them badly turns a teaching hour into
  a setup hour, which `set-reminders` names as the reason `audience` is load-bearing at all.
- **What shares setup?** Two steps needing the same environment open should be adjacent.

State the reason for the order in one line. An agenda whose sequence is unexplained gets
reordered by whoever runs it, which is fine — but then it should be a list, not an order.

## Step 4 — cite, and name the payoff

Each item carries three things and nothing else:

| | |
|---|---|
| **What to do** | one line, in the imperative |
| **Where it is specified** | the plan and phase, or the reminder — a path, not a paraphrase |
| **What it unblocks** | the plan that moves out of `blocked/` when this is done |

The third column is what makes an agenda persuasive rather than a chore list. "Measure the
framerate" is a task; "measure the framerate → `world-shim` leaves `blocked/`" is a reason.

## Step 5 — ask, but only when asking pays

Offer to go deeper on one group **only when the list is long enough that reading it is work.**

At six open reminders the whole agenda fits on a screen and a clarifying question costs more
than it saves — produce the agenda and let the reader choose. Past roughly fifteen, or across
more than three or four blockers, ask which group is live today and detail that one.

The question, when it is worth asking, is **which resource you have** — not which category you
prefer. "Do you have his laptop, or an hour with the DM?" is answerable in a word and selects
the group. "Which category do you want detail on?" makes the reader do the grouping that this
skill exists to do for them.

## Step 6 — the leftovers matter

Two things belong at the end of every agenda:

**Blockers nobody can clear.** A plan waiting on another track is not on anybody's Saturday. List
them separately, with what would move them, so the reader knows they were considered rather than
missed.

**Decisions.** A `decide` reminder is a block waiting on an answer rather than a thing, and it
needs no resource except attention — so it can be cleared in a queue, over coffee, in any order.
Grouping those together is often the shortest path to unsticking the board, because nothing has
to be carried anywhere.

## What this skill does not do

- **Change any plan or reminder.** It reads and orders. Closing a reminder afterwards is
  `set-reminders`; moving a plan out of `blocked/` is `plan-workflow`.
- **Decide the answer to a `decide` reminder.** It surfaces the question and says what it is
  holding up.
- **Find blockers.** It reads what `plan-sweep-blockers` recorded. If the board is stale, sweep
  first — an agenda built on a stale board sends somebody to measure a framerate that was
  measured last week.
