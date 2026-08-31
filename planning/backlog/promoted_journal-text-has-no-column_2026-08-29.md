# The Journal Has Nowhere to Put the Journal

**Status:** Promoted 2026-08-31 to planning/in-progress/feature_journal-reads-from-git_2026-08-31.md
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

> **That paragraph is wrong, and it is the reason this item sat still. Ruled 2026-08-31 —
> see "The ruling" below.** There *is* another home, it was already built, and the sentence
> "no other home" is what stopped anybody looking for it.

The `db` track declined to invent the columns against a ruled appendix, which was right. It is
recorded here rather than fixed in flight for the same reason.

**Why this matters more than a missing column usually does.** §6.9 names the Journal as
unregenerable: quests can be re-authored and progress can be re-earned, but an 11–14-year-old's
written reflection on the evening he finally got recursion cannot. A schema that stores the
commit sha and drops the writing keeps the receipt and loses the thing.

## The ruling — 2026-08-31, by the DM

**Generalised as [`docs/decisions/0004-ceremony-earns-its-place-by-outliving-the-game.md`](../../docs/decisions/0004-ceremony-earns-its-place-by-outliving-the-game.md).** That record carries the rule; this section carries what it means for the Journal.

**Markdown in his repository is the system of record. Postgres is not.** No migration. No
`prompt`, `body` or `reply` columns.

The reasoning, in the DM's words: *"Markdown is the right call, it's transportable and could
conceivably live past the education viability of this whole tool. If we strand it in the db, it
dies with the game."*

**That is a stronger reading of §6.9 than the one this item was written on.** The item argued
unregenerable meant *store the writing, not just the receipt* — true, and it led to the wrong
place, because a Postgres column is only unregenerable until the game stops running. The
Journal has to outlive PyQuest. A markdown file in a git repository he owns does; a row in a
container's volume does not. **Backup was never the risk. Obsolescence was.**

### What the Journal is actually for

Named here because it decides the shape, and it was nowhere in this repository before:

1. **The CHANGELOG habit** — a real artifact professionals keep, learned by keeping one.
2. **Scrum-shaped reflection** — what happened yesterday, what I plan to do today, what is
   next. A standup, written down, before he has ever heard the word.
3. **Anticipating failure** — what could break — which is where troubleshooting starts.

All three are habits that transfer to any codebase he ever touches. **None of them survives
being a database column**, because the artifact is the point: the thing he can still open in
five years is the thing that taught him.

### What this dissolves

- **The four-prompt problem, entirely.** §5.6 wants four prompts where the contract modelled
  one `prompt: string`. Under Postgres that is schema churn — four columns, or a JSON blob, or
  a child table. **In markdown it is four headings**, and the structure is visible to the person
  writing it rather than encoded in a migration. The mismatch was an artifact of the wrong
  store.
- **`commit_sha NOT NULL` stops being a bug.** `journal_entries` keeps its four columns and is
  exactly what it was designed to be: the **ledger of paid journal commits**, not the journal.
  A row exists when a commit exists to point at. Nothing is unstorable, because nothing but the
  ledger was ever meant to be stored.

### What is already built and now becomes the path

- `apps/api/src/gitea.ts` — `DEFAULT_JOURNAL_PATH = 'journal.md'`, *"where a Journal commit has
  to land"*
- `apps/api/src/gitsignal.ts` — already watches for commits touching that path
- `packages/engine/src/scoring.ts` — already pays the Journal's 10 XP through that signal
- §5.6 already specifies the reply as **Gitea comments**, which is where `reply` comes from —
  no column, no thread model, and the DM replies where the writing is

## Known Scope, restated under the ruling

**No migration. No schema change at all.** The work is a read path and a contract correction:

1. **Correct the contract.** `JournalEntrySchema` in `endpoints.ts:541-551` requires `prompt`
   and `body` as non-empty strings, which is why `GET /journal` is annotated `— blocked`. It
   should describe what the API can actually serve by reading git.
2. **`POST /journal` probably should not exist.** He writes the file and commits it; that *is*
   the post. A route that writes journal text into the API is a second way to author the same
   artifact, and the second way is the one that goes stale.
3. **Read through to Gitea** for the entry text and the comments, assembling pieces
   `gitsignal.ts` already has.
4. **The SPA's Journal screen** renders that. Note it lives in `apps/web/**`, owned by the open
   `spa` track — coordinate rather than editing across it.

### Still open, and now a curriculum question rather than a schema one

**Does journalling earn XP before Area 2a?** §5.6 says the Journal begins in week 1 as plain
markdown and only becomes committed at Area 2a. XP is paid by `gitsignal` on commit — so under
this ruling, weeks 1 through 8 of journalling earn nothing, because there is no commit for the
game to see.

That may be exactly right: the habit precedes the reward, and the reward arrives the moment the
work becomes visible, which is also the lesson of Area 2a. But it is a **curriculum decision and
nobody has made it**, and it should be settled before Area 0 is taught rather than discovered in
week 2 when he asks why writing got him nothing.

## Trigger for Promotion

**Ruled and ready.** No longer blocked on a decision — it is now ordinary work, and it is clear
of every plan in `in-progress/`: `packages/contract/src/endpoints.ts` and `apps/api/src/**` are
touched by none of the four.

**One sequencing constraint:** `planning/feature_accounts-and-auth_2026-08-30.md` claims
`packages/db/**`, `apps/api/src/**`, `endpoints.ts` *and* `apps/web/src/screens/**`, and declares
itself "a gate, not a parallel track" that runs alone. **This should land before accounts
starts, not beside it.**
