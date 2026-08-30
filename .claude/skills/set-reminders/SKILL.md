---
name: set-reminders
description: Records a task a person must actively do, which no test or gate can catch. Use when a plan names work that needs a human, a machine, a conversation or a calendar — a check on the son's laptop, a decision only the DM can make, something to raise at the next session — and the plan alone would leave it to memory. Sits beside plan-workflow; it never schedules work, it remembers the work software cannot verify.
metadata:
  category: workflow-composers
  level: beside plan-workflow
---

# Set Reminders

A plan tracks work the repository can do. **A reminder tracks work a person must do**, where
nothing in the suite will ever notice it was skipped.

The two are different in a way that matters. A criterion like *"typecheck is clean"* fails
loudly the moment it is untrue. A criterion like *"every screen is legible on the son's laptop at
1366×768"* is silent forever — the plan can be complete, the tests green, the build clean, and
the criterion simply never met by anyone. It is not a gate. It is a task, and tasks that live
only in a plan's prose get finished by accident or not at all.

Reminders live in `planning/reminders/`. They are in source control like everything else.

## When to write one

Write one when a plan names something that:

- **needs a machine you do not have** — the son's laptop, a phone, a printer
- **needs a person** — a decision only the DM can take, a conversation, a sign-off
- **needs an occasion** — the next session, the start of an area, a boss night
- **cannot fail a test** — anything where "we forgot" and "we did it and it was fine" look
  identical afterwards

Do **not** write one for work a plan already owns. A plan phase is not a reminder; a backlog
item is not a reminder. If a test could catch it, write the test instead — that is always the
better answer, and this directory is for the cases where it genuinely is not available.

## The file

`planning/reminders/<category>_<slug>_<YYYY-MM-DD>.md`

```markdown
# <What the person has to do, as an instruction>

**Category:** follow-up | decision | occasion | verify
**Audience:** learner | dm | both
**Subject:** <the thing it is about — screens, hardware, content, tooling, curriculum>
**Raised:** YYYY-MM-DD
**Plan:** planning/**/feature_<slug>_<date>.md
**Status:** open | done | dropped

## What to do

The instruction, concretely enough to act on without reading the plan.

## Why it cannot be a test

The specific reason software will never catch this. If this section is hard to write, the
reminder probably should have been a test.

## What it changes

What happens with each outcome — including the outcome where everything is fine, which is
the one most likely to go unrecorded.
```

## The plan reference is a glob, deliberately

**`planning/**/feature_<slug>_<date>.md`, never a fixed directory.**

A plan moves — `planning/` to `in-progress/` to `completed/`, and sometimes back to the queue.
A reminder outlives all of that, and often the whole point of it is that it is still open after
the plan has been marked complete. A path naming `in-progress/` is wrong within days and rots
into a dead link exactly when someone finally goes looking.

The glob survives every move, and `ls planning/**/feature_spa_*.md` answers "where did this
end up" in one command.

## The categories

| Category | What it means | Closes when |
|---|---|---|
| `follow-up` | A thing to go and do, at the first opportunity | it is done |
| `decision` | Something a person must choose, which code cannot infer | it is chosen and written down |
| `occasion` | Tied to an event rather than a date — next session, boss night, area start | that occasion passes |
| `verify` | Something believed true that nobody has actually observed | somebody looks |

`verify` and `follow-up` are easy to confuse. The test: if the expected answer is *"yes, fine"*
and you would be surprised otherwise, it is `verify`. If there is real work either way, it is
`follow-up`.

## Audience

`learner`, `dm`, or `both`. Roles, never people — the same rule the whole repository keeps
(CLAUDE.md's lexicon). Kitchen Table mode has one household and the parent holds both seats, so
`audience` says which hat is being worn rather than who is in the room.

It is load-bearing for one reason: a reminder addressed to `learner` happens **during a
session**, in his time, and competes with the teaching. One addressed to `dm` happens outside
it. Getting that wrong spends a Saturday morning on setup instead of Python.

## Subject

A short, stable noun from the repository's own vocabulary — `screens`, `hardware`, `content`,
`tooling`, `curriculum`. It is what you would file it under to find it again.

Keep the list short and reuse existing values before inventing one. Three subjects with four
reminders each is a directory somebody can read; twelve subjects with one each is a list of
filenames.

## Closing one

Set `Status: done` and add a **`Closed:`** line directly beneath it, in the same bold-label
style as the rest of the block:

```markdown
**Status:** done
**Closed:** 2026-09-06 — Pushed from his laptop over the LAN; the key was never installed.
```

The date is the day it was answered, not the day it was raised. The sentence after the dash is
the whole point of keeping the file: **what actually happened.** "Done" on its own records that
somebody ticked a box, which is the one fact nobody will ever need.

Change nothing else. Do not reflow the prose, do not reorder the block, do not delete the
sections that are now historical — the reminder is a record of a question and its answer, and
the question has to survive for the answer to mean anything.

**Never delete the file.** A reminder that was raised and answered is the record that it was
answered. A reminder that turned out not to matter is `dropped`, with the reason on the same
`Closed:` line.

`Closed:` is a fixed label because it is read by machines as well as people — the VS Code
extension in `tools/vscode/reminders/` writes it when you tick a reminder off, and parses it
back. If it ever changes here, it changes there; that is what `reminders.closedLabel` is for.

### One more thing the files already do that this document did not say

`**Plan:**` is written **inside backticks** — `` **Plan:** `planning/**/feature_x_2026-08-27.md` ``.
Every existing reminder does this and the template above did not say so. Keep doing it: the glob
contains `*` characters that some markdown renderers will otherwise eat as emphasis.

## Checking the board

```bash
grep -l "Status:\*\* open" planning/reminders/*.md          # what is outstanding
grep -H "Audience:" planning/reminders/*.md                  # what needs whom
ls planning/**/feature_spa_*.md                              # where a referenced plan went
```
