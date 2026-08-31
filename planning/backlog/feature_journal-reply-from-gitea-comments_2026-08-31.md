# The DM's reply, when it becomes a Gitea comment

**Status:** Dropped 2026-08-31 — ruled by the DM, and nothing needs building.
**Closed:** The reply goes in **both** places from Area 2a: under `### DM reply` in `journal.md`,
which is what the game reads and what outlives the game, and as a comment on the commit, which is
where the code-review habit is actually practiced. Not a compromise between the two — they do
different jobs. Justified for the DM in `curriculum/area-2/dm-guide.md` §6, and the two prompt
sheets no longer say the reply *moves*.
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

## The decision, taken 2026-08-31

**Ruled: the reply goes in both places, and they do different jobs.**

§5.6's stated purpose is *"relatedness, plus code-review culture learned before he writes code
worth reviewing"* — and a comment the DM leaves on a commit in the Gitea UI delivers all of that
to the person it is for, whether or not the game reads it. Meanwhile `### DM reply` already works,
already renders on the Journal screen, and needs nothing built. The two are complementary rather
than competing: the file is what the game shows, the commit comment is where the code-review habit
gets practiced.

**The DM added the caveat that makes this a design rather than a shrug: the two-location practice
has to be justified where the person doing it will read it.** It is, in
`curriculum/area-2/dm-guide.md` §6 — the file feeds the game and is the copy that outlives it, the
comment feeds a lifelong habit, and the artifact carrying both halves of the conversation is the
thing of lasting value as authorship moves into the AI age. It closes with the instruction that
matters on a tired Saturday: **if you can only do one, do the file.**

So the item is dropped, the curriculum no longer says the reply *moves*, and Phase 3 is complete
as shipped.

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

## What was changed when this closed

- `curriculum/area-2/dm-guide.md` §6 — the justification, and the migration beat corrected to one
  `journal.md` rather than a `journal/` directory. **That second fix was a Phase 1 miss**: the
  layout change swept nine files and did not reach this one
- `curriculum/area-0/journal/entry-01-prompt.md` and `curriculum/area-1/journal/entry-07-prompt.md`
  — the reply is joined by a commit comment rather than replaced by one

**Left alone, and owed:** §5.6 in the spec still reads *"The parent replies, as comments in
Gitea"* with no mention of the copy in the file. It is not wrong — that comment does happen — but
it is now the smaller half of the practice, and the spec is the document of record. **A one-clause
correction, and the DM's to make.**
