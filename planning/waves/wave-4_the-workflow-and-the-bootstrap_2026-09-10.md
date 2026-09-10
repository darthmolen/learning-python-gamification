---
kind: wave
status: open
date: 2026-09-10
---

# Wave 4 — The Workflow, and the Bootstrap

**Status:** Open — `learner-setup-repairs` landed 2026-09-10; four tracks queued, one backlog
stub to promote before `practice-zero` can start
**Level:** Wave — coordinates plans, does not replace them
**Date:** 2026-09-10
**Author:** Claude (Opus 5)
**Tracks:** `learner-setup-repairs`, `practice-zero`, `audience-flag`, `workflow-catalog`,
`gitea-remote`

## Why this is a wave

Five questions were asked of the campaign loop — *how does the DM contribute, how does the
learner get exercises, how does a DM know what is his, where is each audience's content, and how
does peer or dm validation actually happen*. Every one has an answer. Not one of them is written
down in a place a person would look, and answering them turned up **four pieces of tooling that
no longer run**.

The work that follows is five separable bodies with two real dependencies between them. That is
what a wave is for. It is not one plan: it spans Lane A and Lane B, three packages, the database,
the infrastructure and an authored area.

## What the audit found

The full evidence is in each track's plan. The headline is that the repository is in better shape
than its documentation and worse shape than its green tests suggest.

**Built and undocumented.** Role-checked sign-off is finished. `POST /api/signoffs/:attemptId`
refuses a self-sign-off, checks `player_roles` against the quest's `by`, and pays through the
engine's `medalDelta`. Nobody reading this repository would know that, because §6.3 gives the
mechanic one table row and nothing else describes it.

**Broken and unnoticed.** Four things:

| What | Why it went unnoticed |
|---|---|
| `pack.sh` dies on a dead manifest path | nothing in CI runs it |
| `local-repo` and `git-signal` refuse everywhere | `GITEA_TOKEN` and `PLAYER_REPOS` are set in no environment |
| `seed-gitea-users.sh` dies on its first lookup | hyphenated keys against an underscored `.env` |
| `verify.py` under-reports for a learner | `rglob` on a missing directory yields nothing and exits 0 |

The second is the largest: **10 of 30 quests cannot be verified in any path today.**

**A convention that already failed.** `curriculum/area-0/practices/README.md:10` tells the learner
*"Copy this whole directory somewhere you own"* — and `practices/` holds the DM's plans beside the
learner's drills, including the one practice that works only because the learner does not know
what is coming. Areas 1 and 2 carry the same sentence. Audience is decided by directory and by
voice, and those two audiences share a directory.

The repository already has an audience predicate. It has two, both filename regexes —
`readsAsLesson` in the content validator and the `dm-guide.md` pickup in the Field Manual build —
and they already disagree about `game/how-to/`.

## The sequence

Two dependencies, and everything else runs when there is capacity.

```
gitea-lan-access (promote the stub)  ──┐
                                       ├──► practice-zero
gitea-remote (its LAN half)  ──────────┘

audience-flag  ──────────────────────────► workflow-catalog

learner-setup-repairs  (independent, start immediately)
```

### Gate — promote `gitea-lan-access-for-the-son`

**Moving the bootstrap to week 1 turns a backlog item into a blocker.** Practice 0 has the learner
create and clone a repository in their first week, which needs Gitea reachable from their machine.
`planning/backlog/feature_gitea-lan-access-for-the-son_2026-08-27.md` records the opposite, and
records it as *measured*: `GITEA_DOMAIN=localhost`, so the clone URLs Gitea advertises point at
the learner's own laptop, and no firewall rule exists for 3080 or 3022 — `LAN 3080 -> 000` against
`localhost 3080 -> 200`.

That stub has sat in the backlog since 2026-08-27 because nothing needed it yet. Practice 0 needs
it, so it goes first.

### The tracks

| Track | Depends on | Lane | What it is |
|---|---|---|---|
| ~~`learner-setup-repairs`~~ | nothing | A and B | **Done 2026-09-10.** All four tools run; `pack.sh` packs again |
| `gitea-remote` | nothing | A | wire two env vars, then `pack.sh --remote`; unblocks ten quests |
| `practice-zero` | the gate, `gitea-remote` | A and B | `n: 0` through schema, contract and database; Area 0 gains a bootstrap practice |
| `audience-flag` | nothing | A | `audience:` frontmatter, validated, replacing two filename regexes |
| `workflow-catalog` | `audience-flag` | B | walk Area 0, catalog the interactions, write the two HOW-TO documents |

`learner-setup-repairs` and `audience-flag` can start today and touch disjoint files.

## What this wave does not decide

Three questions surfaced that belong to the parent rather than to a plan, and each gets a stub
rather than an answer:

- **A solo-bootstrap path.** Practice 0 is DM-led by design and run 1 is DM-led, so this is not
  urgent — but a learner setting up a machine alone has no route, and the transport cannot
  deliver its own prerequisite.
- **No rule for choosing `peer` over `dm`** on a sign-off. The spec names both and never says when
  an author should pick which.
- **No position on self-study.** The spec has nothing on whether unsupervised work is legal or
  whether a learner may run ahead of the DM. §2.4's *"a parent in the room is the real thing"* is
  the closest it comes, and it assumes the answer rather than giving it.

## What this wave deliberately leaves alone

- **The spec.** The two gaps above become stubs, not edits to the document of record.
- **`dm-guide.md`'s "his father" sentence** — `feature_dm-guide-says-father_2026-08-31` owns it,
  and it is a voice decision rather than a workflow one.
- **Attendance, streak forgiveness, and the boss attempt log.** All three are specified and
  unbuilt. The catalog names them as such, which is the honest record and cheaper than pretending
  otherwise.
