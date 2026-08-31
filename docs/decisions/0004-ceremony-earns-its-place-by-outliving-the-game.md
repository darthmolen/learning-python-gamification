# 0004 — Ceremony earns its place by outliving the game

**Status:** Accepted
**Date:** 2026-08-31

## Context

The Journal forced this. Two designs were coherent — journal text as columns on
`journal_entries`, or markdown in his own repository read through Gitea — and **§6.7's partition
rule did not reach the case.** "Content lives in git, progress lives in Postgres" leaves journal
prose homeless: it is neither authored content nor earned progress. Two plans by the same hand,
a day apart, disagreed, which is the signal that the rule being applied is not the rule that
decides.

The tie-break did not come from the architecture. It came from asking what the ceremony is
*for*: the Journal teaches the CHANGELOG habit, a scrum-shaped reflection — what happened, what
is next, what might break — and the beginnings of troubleshooting. **All three transfer to any
codebase he ever touches. None of them survives being a database column.**

## Decision

**A ceremony is justified by the habit it trains outside the game, and its artifact lives in the
portable format that habit uses in the real world, owned by the learner.**

The test is one question, asked of every ritual this game imposes:

> **If PyQuest were deleted tonight, what would he still have — and would he still do it?**

A ceremony that survives that question is real practice wearing a costume. One that does not is
**scaffolding**: permitted, useful, and named as such, so that it can be removed on a schedule
instead of mistaken for the lesson.

| Ceremony | Habit it trains | What survives us |
|---|---|---|
| The Journal | changelog, standup, anticipating failure | `journal.md`, his repo |
| Push as verification (§6.4) | version control; if you didn't push it didn't happen | his commit history |
| Teach-back | explaining code aloud | the ability, not an artifact — and that is fine |
| Idiomatic medal (§5.10) | ruff and pyright clean | the code, in his repo |
| Conjured medal (§5.12) | disclosing what the machine wrote | the note in his own commit |
| The un-stripping ladder | knowing what each tool does before it is switched on | his editor, and the habit of asking |

**Scaffolding, correctly:** XP, gold, DC, Areas, Invasions, the medals *as medals*, the lexicon
itself. These are motivation and structure. They live in Postgres and they **die with the game**,
which is not a compromise — it is the right outcome for a scoreboard.

That inversion is what this record adds to §6.7. The partition reads as a storage rule; it is
really a **survivability** rule. Content and journal are the learner's and outlive us. Progress
is the game's own bookkeeping about a game, and should not.

## Why not columns on `journal_entries`

It is less code, it matches the contract as already written, and it keeps one store instead of
two. The case is good and it still loses.

**§6.9 calls the Journal unregenerable, and that was read as a backup problem.** It is an
obsolescence problem. A Postgres column is unregenerable right up until the container stops
running, and this game has an expected lifespan of about forty-eight weeks. In the DM's words:
*if we strand it in the db, it dies with the game.*

There is also no gap to fill. He commits `journal.md` anyway — `gitea.ts` already names
`DEFAULT_JOURNAL_PATH`, `gitsignal.ts` already watches it, `scoring.ts` already pays its 10 XP,
and §5.6 already specifies the DM's reply as Gitea comments. Storing the text a second time in
Postgres creates a copy that diverges the first time he edits the file.

## Consequences

**Two recorded defects dissolve rather than get fixed**, which is the usual sign the argument
came out the right way. §5.6's four prompts are schema churn in Postgres and four headings in
markdown. `commit_sha NOT NULL` stops being a bug once `journal_entries` is understood as the
**ledger of paid journal commits** rather than as the journal.

**It constrains what comes next.** A new quest, medal or ritual must answer the test question in
its brief. "Because the game says so" is a valid answer only where the thing is declared
scaffolding, and scaffolding needs a removal schedule the way `world.py` has one.

**It opens one question this record does not settle:** journalling earns no XP before Area 2a,
because until then there is no commit for the game to see. That may be exactly right — the habit
precedes the reward, and the reward arrives when the work becomes visible, which is Area 2a's
own lesson. It is a curriculum decision and it should be made before Area 0 is taught.
