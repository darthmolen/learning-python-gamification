# The DM's reply, when it becomes a Gitea comment

**Status:** Backlog
**Track:** unassigned — `api`
**Date Discovered:** 2026-08-31
**Discovered During:** `planning/in-progress/feature_journal-reads-from-git_2026-08-31.md` Phase 3

## Context

§5.6 gives the DM's reply two homes, one after the other:

- **Areas 0–1** — written under `### DM reply` in the entry itself, the same evening. The Area 0
  prompt sheet calls this non-negotiable: *"a Journal nobody answers becomes a diary, and a diary
  becomes an unfilled form."*
- **From Area 2a** — *"this becomes a comment on a commit in Gitea, and from there it is code
  review."*

**Phase 3 shipped the first and not the second.** `GET /journal` reads the reply out of the
markdown, which is correct for weeks 1–10 and is where the campaign actually is. From Area 2a the
DM starts replying in Gitea, and those replies will not appear.

## Why it was deferred rather than guessed at

**Gitea's API for commit comments could not be confirmed from here, and a wrong endpoint fails
silently in exactly the shape this plan exists to prevent.** A `readComments` that requests a path
Gitea does not serve gets a 404, and 404 on this route already means "he has not written one yet"
— so a mistyped endpoint would render every Area 2a entry as unanswered, look completely normal,
and be indistinguishable from the DM not having replied.

That is the third time in two days this repository has been bitten by two halves that were each
internally consistent, and it is not worth a fourth for a feature nobody needs for ten weeks.
Implementing it against a running Gitea, where the endpoint can be *observed* rather than
recalled, costs an hour and removes the guess entirely.

## Known Scope

- Confirm the endpoint against a live Gitea — comments on a commit, by sha, for a repository the
  token can read. Write down what it actually answered
- A `readComments(repo, sha)` on the `Gitea` interface, parsed through a named raw shape the way
  `commits()` and `readFile()` are
- In `server.ts`, prefer a Gitea comment over the file's `### DM reply` section when one exists.
  **Prefer, not replace** — an Area 0 entry keeps its in-file reply forever, and an entry could
  legitimately carry both
- A test with more than one comment on one commit: §5.6's reply is singular but Gitea's comments
  are a list, and "the DM's reply" then needs a rule — most recent, or all of them joined
- The `reply` field on `JournalEntrySchema` needs no change either way

## Trigger for Promotion

**Before Area 2a is taught**, which §4 puts at week 6. That is the session where the DM stops
writing in the file and starts commenting on commits, and the first reply that lands in Gitea and
does not appear on the Journal screen will be read as the game losing it.

Sooner if a Gitea instance is up for another reason and somebody is already in `gitea.ts` — the
confirmation step is the expensive half and it is cheap when the server is already running.
