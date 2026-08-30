# Reviews, and what was decided about them

Every file here is a review as it was received, **with a `## Disposition` section appended below
it** saying what was accepted, merged, rejected or flagged — and, where it applies, that nobody
recorded it at all.

The reviewer's text is never altered. Appending a clearly attributed response is the same move
the review itself made when it was appended to a copy of the plan; editing their findings would
destroy the evidence this directory exists to hold.

**Read the review file. The answer is at the bottom of it.** There is deliberately no index of
dispositions here — a hand-maintained table is a second place for the same fact, and the second
place is the one that goes stale. It would have been wrong the first time anyone filed a review
without updating it.

## Where the disposition is written, and why in three places

| Where | Who reads it | The question they are asking |
|---|---|---|
| This directory, `## Disposition` | someone re-reading a review | *what did we do about this?* |
| The plan's `## Review History` | someone reading the plan | *why does it say this?* |
| The commit message | someone running `git log` or `blame` | *why did this change?* |

Not redundancy — three different readers arriving from three directions, none of whom will find
the other two. The rule is `.claude/skills/plan-review-record/SKILL.md`.

## Six of these are unrecoverable, and it is worth knowing why

Reviews filed before 2026-08-30 carry a disposition only where an author happened to write one.
Six say **not recorded**: `area-1-control`, both `area-2` rounds, `area-3-collections` v1,
`shared-files`, and partially `the-spa`. Somebody read each, decided what to take, and the
reasoning is gone.

The cost falls almost entirely on rejections. An accepted finding leaves evidence — the plan
changed, and a reader can usually see where. **A rejected one leaves nothing at all**, so nothing
distinguishes *"we considered that and here is the argument against it"* from *"nobody noticed"*.
The same finding gets raised again, re-argued from scratch, and possibly accepted next time by
someone with less context than the person who rejected it.

Two of this repository's rejections would have been lost that way, and both were only defensible
because somebody ran a command rather than asserting: a "wrong test count" that was a static
count missing an `it.each` expansion, and a request to add `npm run lint` to a checklist when no
linter is configured anywhere in the workspace.

The six were left as they are. Reconstructing a plausible disposition from a diff would put
fiction in the slot where the record belongs, and a fabricated record is worse than a missing one
that admits it is missing.
