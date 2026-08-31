# The DM's reply, when it becomes a Gitea comment

**Status:** Backlog — **blocked on a decision, not on work.** See *What the API actually has*
**Track:** unassigned — `api`, and the ruling is the DM's
**Date Discovered:** 2026-08-31
**Discovered During:** `planning/in-progress/feature_journal-reads-from-git_2026-08-31.md` Phase 3

## Context

§5.6 gives the DM's reply two homes, one after the other:

- **Areas 0–1** — written under `### DM reply` in the entry itself, the same evening. The Area 0
  prompt sheet calls this non-negotiable: *"a Journal nobody answers becomes a diary, and a diary
  becomes an unfilled form."*
- **From Area 2a** — *"this becomes a comment on a commit in Gitea, and from there it is code
  review."*

**Phase 3 shipped the first and deferred the second**, on the grounds that the endpoint could not
be confirmed without a running Gitea and a wrong guess would fail silently.

## What the API actually has — checked 2026-08-31 against the running instance

**Gitea 1.27.2 has no REST endpoint for commit comments. Not for reading them, not for writing
them.** Taken from that instance's own `swagger.v1.json`, 308 paths, not from memory:

Every path containing `comment` belongs to issues or pull requests —
`/repos/{owner}/{repo}/issues/{index}/comments`, `/pulls/{index}/reviews/{id}/comments`, and their
siblings. Every path containing `commit` is read-only history or status:

```text
/repos/{owner}/{repo}/commits
/repos/{owner}/{repo}/commits/{ref}/status
/repos/{owner}/{repo}/commits/{ref}/statuses
/repos/{owner}/{repo}/commits/{sha}/pull
/repos/{owner}/{repo}/git/commits/{sha}
/repos/{owner}/{repo}/git/commits/{sha}.{diffType}
/repos/{owner}/{repo}/pulls/{index}/commits
```

No operation in the whole document mentions both a commit and a comment.

**So §5.6's mechanism cannot be read back by the API as written.** The DM can still comment on a
commit in Gitea's web UI — that feature exists for people — but nothing the game can call will
ever see it. An implementation that guessed the obvious path would have 404'd forever, and this
route already reads a 404 as *"he has not written one yet"*, so every Area 2a entry would have
rendered unanswered and looked completely normal. **That is the failure this deferral avoided**,
and it is the fourth instance of that shape in three days.

## The decision this now needs

**Recommended: leave the reply in the file, and let the Gitea comment be for the humans.**

§5.6's stated purpose is *"relatedness, plus code-review culture learned before he writes code
worth reviewing"* — and a comment the DM leaves on a commit in the Gitea UI delivers all of that
to the person it is for, whether or not the game reads it. Meanwhile `### DM reply` already works,
already renders on the Journal screen, and needs nothing built. The two are complementary rather
than competing: the file is what the game shows, the commit comment is where the code-review habit
gets practised.

Under this ruling the item closes as **dropped**, the curriculum's Area 2a line is reworded so the
DM is not told the reply moves, and Phase 3 is complete as shipped.

The alternatives, for completeness:

- **An issue per entry.** The issue-comment API is complete and would work. It also puts a bug
  tracker in the middle of a child's journal, and the artifact stops being one file he owns —
  which is most of what ADR 0004 bought.
- **A pull request per entry.** Real code review, and genuinely how the habit works in industry.
  It is also a branch, a PR and a merge per journal entry, in week 6, from an 11–14-year-old who
  has just learned `commit` and `push`. §7's rule applies: *a first `git commit` rejected by a
  linter he did not install is a bad first day.*
- **Read Gitea's database directly.** It is the same Postgres (§6.1). It is also Gitea's schema,
  which we do not own and which changes on their release schedule, to read a field with a
  supported alternative sitting in a file we already parse.

## Trigger for Promotion

**Before Area 2a is taught, week 6** — not to build anything, but because the curriculum currently
tells the DM the reply moves to Gitea, and under the recommendation it does not. That is a
sentence in `curriculum/area-0/journal/entry-01-prompt.md`, one in
`curriculum/area-1/journal/entry-07-prompt.md`, and the §5.6 line in the spec.
