---
name: plan-review-record
description: Records what a plan review actually decided — accepted, merged, rejected, flagged — so the reasoning outlives the conversation. Use immediately after plan-receive-review, before moving on. Closes the gap where a review is acted on and nothing in the repository says which findings were taken or why the others were not.
metadata:
  category: review-helpers
  order: 30
  extends: plan-receive-review
---

# Record What the Review Decided

`plan-send-review` copies a plan out. `plan-receive-review` evaluates each finding and presents
the four dispositions — **accept**, **merge**, **reject**, **flag**. Then the conversation ends,
and unless somebody writes the outcome down, it is gone.

**That is a real hole and it has already cost this repository.** Of seventeen reviews filed by
2026-08-30, six recorded nothing about their outcome. The review file survives, the revised plan
survives, and the mapping between them — which finding produced which change, and which was
argued down — does not. See `planning/needs-review/completed/README.md`.

## The asymmetry that makes this matter

An **accepted** finding leaves evidence: the plan changed, and a reader can usually see where.

A **rejected** finding leaves nothing at all. The plan looks exactly as it did before, and
nothing distinguishes "we considered this and here is why it is wrong" from "nobody noticed."
So the same finding gets raised again, re-argued from scratch, and possibly accepted next time by
someone with less context than the person who rejected it.

**Rejections are the reason this skill exists.** If you record only one thing, record those.

## Three places, and the first one is the primary record

### 0. A `## Disposition` section on the review file itself

**Appended to the review in `planning/needs-review/completed/`, below the reviewer's findings,
under a line saying it is the author's response.** This is the primary record, because it is the
only one that sits next to the question it answers: somebody re-reading a finding two months from
now is holding that file, not the plan and not the log.

```markdown
---

## Disposition

*Appended by the author after `plan-receive-review`. Everything above is the review as
received and is unaltered.*

**N accepted, N merged, N rejected, N flagged** — applied in `<commit>`.

<A paragraph per rejection, with the evidence. Then anything flagged, and how it was ruled.>
```

**This does not violate the audit trail.** That rule protects the reviewer's *words* from
alteration — never edit a finding, never delete one, never soften one. Appending an attributed
response below them alters nothing, and is the same move the review made when it was appended to
a copy of the plan.

**Write it even when there is nothing to say.** A review filed unread, or one whose findings were
all rejected, still gets a section saying so. "Not acted on, set aside by the parent" is a
disposition. An absent section means nobody knows, which is the state this skill exists to end.

## Two more places, both of which already exist

### 1. A `## Review History` block in the plan

The summary, for a reader of the plan rather than of the review.

Appended to the plan itself, one paragraph per round, in its source location — not in the review
copy, which is an audit trail and is never edited.

```markdown
## Review History

**v1 reviewed YYYY-MM-DD — <the reviewer's verdict, verbatim>.** N taken: <what, briefly>.

<One paragraph per rejection, with the technical reasoning. This is the part that has to
survive, because nothing else in the repository will carry it.>

<Anything flagged, and how the person ruled.>
```

Write it in the plan's own voice, as prose. A table of finding-numbers is unreadable six weeks
later, because the numbers refer to a document nobody will open.

### 2. A commit that says the counts and the reasoning

The commit is what a reader finds when they run `git log` on a file and ask why it looks like
this. Its subject names the round; its body carries the argument.

```
[PLAN] <plan> v2 review applied: N taken, M declined

<What was accepted, in one or two sentences.>

<Why each rejection was rejected. Name the evidence — a file, a line, a
command you ran — rather than asserting the reviewer was wrong.>
```

**Verify before you reject.** A rejection recorded without evidence is an opinion that will not
survive contact with the next reviewer. Two of this repository's rejections were only defensible
because somebody ran the command: a "wrong test count" that was a static count missing an
`it.each` expansion, and a request to add `npm run lint` to a checklist when no linter is
configured anywhere in the workspace.

## When a review is rejected wholesale

Still record it. `[PLAN] Area 3 v2 review returned; both findings rejected, no changes` is a
good commit — it says a review happened, was taken seriously, and changed nothing, which is a
different fact from a review nobody read.

## Do not

- **Do not edit the reviewer's findings.** Append below them, attributed. Never reword a
  finding, never delete one, never soften one — the value of the file is that it says what was
  actually said.
- **Do not build an index of dispositions.** A hand-maintained table is a second place for the
  same fact, and the second place is the one that goes stale — it is wrong the first time
  somebody files a review without updating it. The review file carries its own answer.
- **Do not record only counts.** "3 accepted, 2 rejected" without the reasoning is the same hole
  in a smaller font.
- **Do not defer it.** The disposition is clearest in the minutes after the evaluation and is
  reconstructed badly from a diff a week later — where it can be reconstructed at all.

## Checking

```bash
# reviews filed without a disposition — the state this skill exists to prevent
for f in planning/needs-review/completed/*.md; do
  [ "$(basename "$f")" = README.md ] && continue
  grep -q "^## Disposition" "$f" || echo "no disposition: $f"
done

# plans that have been through review and say nothing about it
for f in planning/**/feature_*.md; do
  grep -q "## Review History" "$f" || echo "no disposition recorded: $f"
done

# what the log says about a given plan's reviews
git log --oneline --all --grep="review" -i -- planning/
```
