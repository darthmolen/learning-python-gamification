# Decide whether the Journal's system of record is Postgres or the son's git repository

**Category:** decide
**Audience:** dm
**Subject:** progress data
**Raised:** 2026-08-31
**Plan:** `planning/**/feature_journal-text-has-no-column_2026-08-29.md`
**Status:** done
**Closed:** 2026-08-31 — Ruled B, markdown in git. The reason given was better than either option as written: the Journal teaches the CHANGELOG habit and a scrum-shaped reflection, and markdown outlives the game. "If we strand it in the db, it dies with the game." Unregenerable meant obsolescence, not backup. Ruling written into the backlog item; the four-prompt and commit_sha mismatches both dissolve under it.

## What to do

Rule on one question, and write the ruling into the backlog item so the next person finds a
decision rather than a contradiction:

> **When the Journal screen shows an entry, where did that text come from?**

Then the code follows in half a day. The decision is the expensive part; the code is not.

## Why this is not the question the backlog item asks

The backlog item proposes adding `prompt`, `body` and `reply` columns to `journal_entries`, on
the grounds that *"they are not content, and there is no other home."*

**There is another home, and it is already built.** §5.6 says the Journal is "a markdown
journal, one entry per session, which becomes committed and pushed"; §7 gives the son's
repository "one directory per project, **plus the Journal**"; §5.6 says "**the parent replies**,
as comments in Gitea". And the code agrees: `apps/api/src/gitea.ts` already defines
`DEFAULT_JOURNAL_PATH = 'journal.md'` — *"where a Journal commit has to land"* — and
`gitsignal.ts` already watches for commits touching that path and already pays the Journal's
10 XP through it.

So the premise the proposed fix rests on is not true, which makes "add three columns" a choice
rather than the obvious repair it looks like.

## The two coherent answers

**A — Postgres is the record.** Add the three columns. Matches the contract as written and is
the smaller change. Costs: the text is then in two places, because he also commits `journal.md`,
and they diverge the first time he edits the file.

**B — Git is the record; the API reads through.** `journal_entries` stays the XP and streak
ledger its four columns were designed to be. The screen renders `journal.md` from his repository
through the Gitea client that already exists, and `reply` comes from Gitea comments, which is
what §5.6 literally specifies. §6.9's backup already mirrors every Gitea repository, so calling
the Journal unregenerable argues *for* this rather than against it. `POST /journal` probably
stops existing as a text-writing route.

§6.7's *"content lives in git, progress lives in Postgres"* does not settle it — journal prose is
neither authored content nor earned progress. **That is precisely why two plans by the same
author, a day apart, disagreed**, and why no amount of re-reading the spec will decide it.

## Two things the ruling must also cover

Both were found on 2026-08-31 and neither is recorded anywhere else. Either answer has to
address them, so decide them at the same time:

- **§5.6 has four prompts, not one** — *what I built, what broke, what I would do differently,
  what will break next time* — and §5.4's Defend opener reads back **the fourth one
  specifically**. The contract models `prompt: string` and `body: string`, a single
  question-and-answer pair, which cannot serve that.
- **`commit_sha` is `NOT NULL`, and §5.6 says the Journal predates git.** Entries begin in week 1
  as plain markdown and only become committed at Area 2a. As it stands, **Area 0 and Area 1
  entries cannot be stored at all** — roughly the first eight weeks of the artifact the spec
  calls unregenerable.

## Why it cannot be a test

A test can assert that whatever is chosen works. It cannot choose. Both designs are internally
consistent, both satisfy the spec's words, and the spec's own partition rule does not reach the
case — the disagreement is upstream of any assertion.

It also cannot be inferred from the code, because the code currently states both positions: the
contract requires text columns that the schema does not have, and the Gitea client already
names the file where that same text is expected to live.

## What it changes

**Ruled A or B:** the Journal endpoints get built and the SPA's Journal screen stops being a
frame. Roughly half a day to a day of work, and it is clear of every plan in `in-progress/` —
`packages/db/**`, `endpoints.ts` and `apps/api/src/**` are untouched by all four.

**One sequencing constraint, whichever way it goes.** The queued
`planning/feature_accounts-and-auth_2026-08-30.md` claims `packages/db/**`, `apps/api/src/**`,
`endpoints.ts` *and* `apps/web/src/screens/**`, and declares itself "a gate, not a parallel
track" that runs alone. **The Journal work should land before accounts starts, not beside it.**

**Left unruled:** the Journal screen stays a frame, `GET /journal` stays annotated `— blocked`
in the contract, and the two mismatches above stay unrecorded outside this file. Meanwhile the
son writes journal entries into a `journal.md` that the game can already see and already pays
him for — which is the outcome that makes the whole question look less urgent than it is, and is
exactly how it has stayed open since 2026-08-29.

## Not blocked by this

**The Console is not waiting on this ruling**, despite the SPA plan having paired them. Its
sign-off queue is served and typed today; it needs one gateway function and a screen. If the
Journal decision takes a week, the Console can ship first.
