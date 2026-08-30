# The Journal Has Nowhere to Put the Journal

**Status:** Backlog
**Date Discovered:** 2026-08-29
**Discovered During:** `planning/completed/feature_progress-schema_2026-08-28.md`, Wave 3

## Context

Two plans disagree about one table, and both were written by the same hand a day apart.

`journal_entries` was built exactly as the progress schema's appendix ruled:

```
(player_id, session_date, commit_sha, xp_awarded)
```

The API plan's `JournalEntry` promises the client:

```ts
{ sessionDate, prompt, body, commitSha, xpAwarded, reply? }
```

**`prompt`, `body` and `reply` have no column, and no other home.** They are not content — a
learner's journal text is the most purely per-player thing in the system — so §6.7 puts them in
Postgres, and there is no row for them there. §6.7's own screen list names the Journal as
"entries, prompts, parent replies (§5.6)", so all three are specified; only the table is missing.

The `db` track declined to invent the columns against a ruled appendix, which was right. It is
recorded here rather than fixed in flight for the same reason.

**Why this matters more than a missing column usually does.** §6.9 names the Journal as
unregenerable: quests can be re-authored and progress can be re-earned, but an 11–14-year-old's
written reflection on the evening he finally got recursion cannot. A schema that stores the
commit sha and drops the writing keeps the receipt and loses the thing.

## Known Scope

A forward-only migration — the runner supports nothing else — adding to `journal_entries`:

- `prompt text` — what the DM asked. Nullable: an unprompted entry is legitimate.
- `body text NOT NULL CHECK (length(trim(body)) > 0)` — the entry. §5.6 pays for substance, and
  an empty body that was paid XP is a row that should not exist.
- `reply text` — the DM's reply. Nullable, and lands later than the entry, which is why
  `JournalEntry.reply` is optional on the wire.

Then the repository reader, its contract shape in `progress.ts`, and the constraint pair the db
track established as its standard: refuse the bad row, then prove the same row lands once the
constraint is dropped.

**Do not** add a `replied_at`, a thread, or more than one reply until someone asks. §5.6
describes a reply, singular.

## Trigger for Promotion

The API's Journal endpoints — `GET` and `POST /api/players/:playerId/journal` — cannot be built
against the table as it stands, so whichever wave carries the api plan's Journal work carries
this first. It is small enough to be that plan's first phase rather than a plan of its own.
