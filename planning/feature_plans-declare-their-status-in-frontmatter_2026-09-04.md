# Plans Declare Their Status In Frontmatter

**Status:** Planned — queued
**Track:** `main`
**Date:** 2026-09-04
**Author:** Claude (Opus 5)
**Lane:** neither — this changes the workflow the lanes are run with
**Requested by:** the DM, 2026-09-04 — "not-implemented / completed are the 2 ends of the
spectrum", and then "should we do frontmatter instead of markdown for status, metadata, etc?"

## Objective

Make the board machine-readable: one status field per document, from a closed vocabulary, checked
by a script — so that what a plan *is* can be read without grepping prose.

## The evidence

**109 of 113 planning documents carry a `**Status:**` line, in 24 distinct shapes.**

Five spellings of *finished* — `Completed`, `Complete`, `Completed 2026-09-04`,
`Complete — 2026-08-27`, `Complete -- 2026-08-29`. Six spellings of *ended without being built* —
`Closed — delivered`, `Closed 2026-09-01 —`, `Superseded`, `Superseded 2026-09-01 by`,
`Fixed 2026-09-01 in`, `Dropped 2026-08-31 —`. Two vocabularies: Title-case for plans, lowercase
`done`/`open` for the thirteen reminders.

**Status is currently recorded in three places that can disagree.** `plan-workflow` says "keep the
same filename as the document moves through directories — the path tells you the status", so a
plan's status is its **path**. Backlog stubs never move directories, so status went into the
**filename** (`feature_` / `promoted_` / `closed_`). And every document also carries a **prose
line**. Three mechanisms, one fact.

They have already disagreed, and the damage is still in the tree:

- `planning/completed/feature_node-services-get-a-dockerfile_2026-09-01.md:10` has a
  `**Promoted from:**` pointer to `planning/backlog/feature_compose-services-cannot-start-on-windows_2026-08-29.md`,
  **which does not exist** — commit `53be032` deleted the stub on promotion, against the skill's
  own "never delete plan documents". A dangling cross-reference no human will ever notice.
- `planning/backlog/feature_vscode-profile-and-tool-quests_2026-08-28.md` declares a *third*
  filing convention in its own body — "It moves straight to `planning/completed/`" — and its
  lines 123–125 record that it was in fact moved there on 2026-08-29 and moved back. The
  repository has had this argument once already and settled it in prose that nothing enforces.
- A promoted stub's pointer must be edited **twice** — once at promotion, once when the plan
  completes — and nothing asks for the second edit.
  `planning/backlog/promoted_a-submission-runs-as-the-worker_2026-09-03.md` is correct today only
  because its plan is still queued.

**A baseline was run before writing this.** An agent with the repository and the skill, and no
convention beyond them, was asked how it would file the four cases. It invented four status
shapes and three filing conventions, said honestly which parts were guesses, and could not answer
the fourth case at all — the skill has no state for a plan that was never implemented. Its
suggestions were reasonable and none of them agreed with each other, which is the whole argument
for a closed vocabulary.

## What frontmatter buys, and the condition on it

**The condition first, because without it this is worthless: frontmatter with no validator is
markdown with more punctuation.** The same 24 shapes reappear in YAML inside a month. This plan is
the schema *and* `validate:plans`, or it is not worth doing.

With a validator, the field becomes load-bearing: the dangling pointer above fails a check, the
double-edit gap fails a check, and a status outside the enum fails a check.

## The schema

Frontmatter carries what a machine reads. **Prose stays in the body** — the reasoning is what the
documents are *for*, and flattening it into YAML would be the tail wagging the dog.

```yaml
---
kind: plan            # plan | stub | reminder | review | wave
status: completed     # per-kind enum, below
track: main
date: 2026-09-04      # authored, or discovered for a stub
completed: 2026-09-03 # required when status: completed
---
```

`kind` exists because there are genuinely two vocabularies and forcing reminders into the plan
enum would be a lie about what they are. One field keeps them honest and lets the validator apply
the right rules to each.

### Status by kind

| kind | status values |
|---|---|
| `plan` | `queued` · `in-progress` · `completed` · `not-implemented` · `blocked` |
| `stub` | `open` · `promoted` · `closed` |
| `reminder` | `open` · `done` |
| `review`, `wave` | `open` · `done` |

### Fields a status requires

| status | requires | why |
|---|---|---|
| `completed` | `completed:` date | the thing `completed/` is claiming |
| `not-implemented` | `reason:` + its reference | see below |
| `blocked` | `blocked_on:` | a blocker with no name is a plan nobody can unblock |
| `promoted` | `promoted_to:` — a reference that **resolves** | the dangling pointer above |
| `closed` | `closed_by:` or `closed_reason:` | "closed" alone says nothing |

### References are names, not paths — decided 2026-09-04

**A cross-reference names a document; it does not say where the document lives.** The DM's call,
and it is the better design because it *removes* a failure mode this plan had otherwise planned
only to detect.

```yaml
promoted_to: a-submission-runs-as-the-worker_2026-09-03   # not planning/feature_….md
```

Documents move constantly — `planning/` → `in-progress/` → `completed/` is the normal life of a
plan, and a stub outlives all of it. **A stored path is wrong the moment the thing it names
moves**, which is exactly the double-edit gap: today a promoted stub's pointer has to be rewritten
when its plan completes, and nothing asks for that second edit. A name never goes stale, because
the name is the identity and the directory is the status.

It also reframes the dangling pointer in `completed/feature_node-services-get-a-dockerfile`: a
path broke because the target was deleted, but a path would equally have broken had the target
merely *moved*. Paths are the fragile part.

**Is a name distinct enough? Measured: almost.** Across the 111 non-README documents, stripping
the prefix leaves **two** slug+date collisions:

| collision | the two documents |
|---|---|
| `a-submission-runs-as-the-worker_2026-09-03` | the stub, and its plan |
| `the-glossary-reaches-a-reader_2026-09-03` | the stub, and its plan |

Both are stub↔plan pairs — a stub promoted the same day it was filed shares its slug and its date
with the plan it became. That is the only collision shape in the corpus, and **`kind` resolves
it**: `promoted_to` wants a plan and never a stub; a plan's `promoted_from` wants a stub. So every
reference glob is scoped by the kind the field expects.

The residual risk is real and is handled by making it loud: **a reference resolving to zero or to
more than one document is a validation error**, naming every candidate. Globbing without a
validator would be trading a stale-path bug for a silent wrong-target bug; globbing *with* one
turns ambiguity into a build failure at the moment it is introduced.

(The first measurement of this reported the names as fully unique. It was wrong — the `sed`
expression used `|` as both its delimiter and its alternation, so the prefix strip silently did
nothing. The same class of escaping mistake CLAUDE.md's heredoc warning is about.)

### `not-implemented` — the second terminal state

The state the DM asked for, and the reason this plan started. `completed/` is wrong for a plan
that built nothing — a reader counting `completed/` to see what the system does would count it.
`planning/` is worse: the queue root means *ready to start*, so a dead plan there is a permanent
false positive on "what is next".

`reason:` comes from a closed set of four, and each must name something:

| reason | means | must name |
|---|---|---|
| `superseded` | a later plan covers this ground | the plan that replaced it |
| `folded-in` | absorbed into another plan, which shipped | the plan that absorbed it |
| `obsoleted` | the ground moved, or the DM ruled it out | what changed, or who ruled |
| `abandoned` | tried, and the approach was rejected | what was learned |

`abandoned` is the one that earns the directory. **A rejected approach is knowledge** — the next
person to have the same idea should find the document saying it was tried.

## The prefixes stay, and become a checked invariant

The DM likes `closed_`, and `ls planning/backlog/` reading as a status board is a real
affordance frontmatter does not give back. Keeping both would normally mean two sources of truth
that drift — which is the disease this plan treats.

**So the validator enforces that they agree.** `status: closed` requires the `closed_` prefix and
vice versa. Redundancy that is checked is not drift; it is a second opinion. The filename stays
human-scannable, the field stays queryable, and disagreement is a build failure rather than a
discovery six weeks later.

## `validate:plans`

Modelled on `validate:content` exactly — same shape, same reporting, run the same way from
`pyquest/`, because a second validator that behaves differently from the first is a second thing
to learn.

Checks:

1. Every document has frontmatter with `kind` and `status`.
2. `status` is in `kind`'s enum.
3. Status-required fields are present.
4. Every reference resolves to **exactly one** document of the expected kind — zero is a broken
   reference, two or more is an ambiguous one, and both name every candidate.
   *(Catches the dangling pointer.)*
5. The directory agrees with the status — `status: completed` lives in `completed/`.
6. The filename prefix agrees with the status, for stubs.
7. One `in-progress` plan per `track`. *(Today's `grep -H "^\*\*Track:\*\*"` becomes a parse.)*

The check this plan originally listed — "`promoted_to` points at a document whose own status is
current" — **is gone, and its absence is the point.** It existed to catch a pointer left aiming at
`planning/` after its plan reached `completed/`. With references by name there is nothing to go
stale, so the bug cannot be introduced rather than being caught after it is. A check you can
delete because the design no longer permits the failure beats a check that passes.

## Phases

### Phase 1 — schema and validator, against the corpus as it is

Write `validate:plans` first, with the current 109 documents as the fixture. It should fail
loudly and specifically. RED captured; that failure output is the migration's to-do list.

### Phase 2 — migrate

~70 are mechanical (`Backlog`, `Completed`, `Planned` → an enum value). ~25 carry pointers that
become fields and need reading. 13 reminders take `kind: reminder`. Scripted where it is
mechanical, by hand where it is not; the validator is the acceptance test.

### Phase 3 — the two real defects

Fix the dangling `Promoted from:` pointer, and settle the vscode stub's third convention — it
does not get to keep its own filing rule.

### Phase 4 — `plan-workflow`, `plan-writing-syntax`, and CLAUDE.md

`plan-workflow` gains `not-implemented/` and the fifth directory — it owns *where a document goes
and when it moves*, which is what it has always been about.

**`plan-writing-syntax` is a new skill and owns the shape of a document**: the frontmatter fields,
the per-kind status enums, what each status requires, and references-as-names. The split is the
one that already exists between a board and a form — `plan-workflow` says which column a card is
in, `plan-writing-syntax` says what is written on it.

It was going to be called `plan-backlog-syntax`, and the rename is not cosmetic: the skill was
scoped to backlog filename prefixes back when prefixes were the only queryable status. Frontmatter
covers all 113 documents, so a name saying "backlog" would have been wrong on its first day.

**It ships in this phase and not before.** A skill instructing agents to write frontmatter that no
document carries would be a convention with no corpus — every plan it was applied to would fail
its own validator until Phase 2 finished. The skill and the migration land together or the skill
is lying.

CLAUDE.md's planning bullet currently describes only `plan-workflow`'s four directories and
mentions none of `blocked/`, `not-implemented/`, `evidence/` or `waves/` — all four exist here.

## Success Criteria

- [ ] `npm run validate:plans` passes on all 113 documents.
- [ ] Every status value comes from a per-kind closed enum.
- [ ] `not-implemented` requires a reason from four, and its pointer resolves.
- [ ] References are names, not paths, and resolve to exactly one document of the expected kind.
- [ ] The dangling `Promoted from:` pointer is fixed and the check that catches it is proven to
      fail without the fix.
- [ ] Moving a document between directories breaks no reference — asserted by a test that moves
      one and re-runs the validator.
- [ ] Filename prefix and `status` are enforced to agree.
- [ ] `plan-workflow` and CLAUDE.md describe the directories this repository actually has.

## Files Expected to Change

| File | Change |
|---|---|
| `pyquest/scripts/validate-plans.ts` | new — the validator |
| `pyquest/package.json` | `validate:plans` script |
| `planning/**/*.md` | frontmatter on 109 documents |
| `planning/completed/feature_node-services-get-a-dockerfile_2026-09-01.md` | the dangling pointer |
| `planning/backlog/feature_vscode-profile-and-tool-quests_2026-08-28.md` | drop its private convention |
| `planning/not-implemented/.gitkeep` | added 2026-09-04 |
| `c:\dev\ai-plugins-and-skills\skills\plan-workflow\SKILL.md` | `not-implemented/`, the fifth directory |
| `c:\dev\ai-plugins-and-skills\skills\plan-writing-syntax\SKILL.md` | new — frontmatter, enums, references |
| `c:\dev\ai-plugins-and-skills\index.json` | regenerated by `scripts/build_index.py` |
| `CLAUDE.md` | the planning bullet |

**This crosses repositories.** `plan-workflow` lives in `c:\dev\ai-plugins-and-skills` with its
own history and its own `index.json` (regenerated by `scripts/build_index.py`). Two commits.

## Open Questions

1. Is `not-implemented` the right directory name, or does `closed` match the stub prefix better?
   One word across both surfaces beats either being ideal alone.
2. Does `blocked` fold into this? `planning/blocked/` exists and is empty. A plan blocked forever
   is not implemented; a plan blocked on a delivery date plainly is not dead. Probably separate.
3. Do stubs ever enter `completed/`? The vscode stub says yes, was moved there once, and was moved
   back. Recommendation: never — `completed/` holds documents with a `## Status` block, and a stub
   has no plan to report against.
4. Should `validate:plans` run in the same gate as `validate:content`, or only on demand?
5. Do references carry the date — `the-glossary-reaches-a-reader_2026-09-03` — or just the slug?
   The date is what makes two filings of the same topic distinguishable, and it is also the part
   most likely to be typed wrong from memory. Carrying it is the safer default; dropping it would
   make references easier to write and would need a different tie-breaker.
