---
kind: plan
status: queued
track: workflow-catalog
date: 2026-09-10
---

# The loop, written down, and the two documents that explain it

**Status:** Planned
**Track:** `workflow-catalog`
**Date:** 2026-09-10
**Author:** Claude (Opus 5)
**Lane:** B
**Wave:** `wave-4_the-workflow-and-the-bootstrap_2026-09-10`

## Objective

Trace one Area 0 evening end to end, record every interaction it contains as a directed edge
between the three actors, and write the two orientation documents the campaign has never had.

## Why this exists

Five questions were asked of the campaign, and every answer turned out to exist only as fragments:

| Question | Where the answer lives |
|---|---|
| How does the DM contribute? | §5.11's five powers, one sentence; then four per-area `dm-guide.md` files |
| How does the learner get exercises? | `tools/learner-setup/`, plus three "copy this directory" sentences |
| How does a DM know what is his? | a voice table in `curriculum/README.md`, plus four naming conventions |
| Where is each audience's content? | directory and voice; `audience-flag` is making it a field |
| How does peer or dm validation work? | one row of §6.3's verifier table |

**The mechanics are more complete than the prose.** Sign-off is finished in the API and described
nowhere. Conversely, three things the spec describes are unbuilt — attendance, streak forgiveness
and the boss attempt log — and nothing tells a reader which is which. A person cannot currently
find out what happens when they press Submit without reading `server.ts`.

**And the transitive paths are the ones that matter.** `dm→system→learner` and
`learner→system→dm` are where the software earns its place, and they are precisely what no
document describes. §5.5's whole argument — *"shame produces hiding, and hiding destroys the
parent's signal about what the learner actually knows"* — is a claim about a signal that travels
`learner→system→dm`, and neither party is told it exists.

## Depends on

**`audience-flag`.** This plan writes documents *about* the DM/learner split and, in one case,
must be certain which files a learner may be pointed at. Writing that against a convention that
has already failed once would be writing it twice.

## Scope

### 1. Walk Area 0, end to end

Area 0 is the right subject because it *needs no application* — `curriculum/area-0/README.md`
says so, and spec §8 explains why. That isolates the human half of the loop from the software
half, which is exactly the confusion being untangled.

The spine to walk, in order:

`area-0/README.md`'s reading order → `dm-guide.md` §1's five beats → `practices.yml` (from
Practice 0, once `practice-zero` lands) → the drills under `practices/practice-N/` → the eleven
`exercises/<slug>/` → `game/area-0/quests/` → Run and Submit → `journal/` → Boss 0
(`a0-first-light.yml`, `peer-signoff`, `by: peer`).

**Walk it against the artifacts, not against the spec.** The spec is the document of record for
intent; this document records behavior, and the two differ in at least three known places.

### 2. Diff areas 1 to 3, recording only what changes

The transitions are the substance, and they are sharper than they look:

- **Area 1** — same shape. Ten practices, six exercises.
- **Area 2a** — git's *teaching* arrives, and `git-signal` verifiers with it. The journal gains
  its commit-and-push half, which §5.6 has always specified and Area 0 deliberately deferred.
- **Area 2b** — the toolchain arrives; `local-repo` replaces `hidden-tests`; VS Code at week 7.
- **Area 3** — `by: dm` sign-offs appear beside `by: peer`, and ursina brings the 5,000-block cap.

Across 30 quests the mix is 16 `hidden-tests`, 8 `local-repo`, 5 `peer-signoff`, 2 `git-signal`.
The catalog should carry that table, because "how is this verified" has four answers and the area
decides which.

### 3. `docs/design/workflow-catalog.md`

The six direct directions, each entry naming the artifact or route that carries it:

`system→dm` · `system→peer` · `peer→dm` · `dm→peer` · `peer→system` · `dm→system`

Then **the transitive paths, as a first-class section rather than an appendix**:

| Chain | The trace |
|---|---|
| `dm→system→learner` | `new:quest` → `validate:content` → git → field-manual publish → the brief in the Tome |
| `dm→system→learner` | Console grant → `resolveSignoff` flips `passed`, `medalDelta` prices it → XP on the Area screen |
| `dm→system→learner` | `pack.sh` → the learner's repository on a branch → they pull |
| `dm→system→learner` | a journal reply as a Gitea comment → the learner reads it |
| `learner→system→dm` | push → the API pulls → the runner → an attempt row → the DM's sign-off queue |
| `learner→system→dm` | boss Submit → `passed=false` + `awaitingSignoff` → `GET /api/signoffs` |
| `learner→system→dm` | a journal commit → `git-signal` → `journal_entries` → the DM reads and replies |
| `learner→system→dm` | a missed invasion steps a concept back one rung → the next Defend queue → the questions asked out loud |
| `learner→system→dm` | a scar or a datamine → §5.5's signal about what they actually know |

**Every entry says whether it is built.** Where something is specified and unbuilt it must say so
and name what is missing — attendance and streak forgiveness (`sessions` is provisioned and has
no `INSERT` anywhere), the boss attempt log (`BossScreen.tsx` declines in a comment), and the ten
quests `gitea-remote` unblocks. A catalog that describes intent as if it were behavior is worse
than no catalog, because it is the document people would trust.

### 4. `game/how-to/how-to-run-a-session.md`

The first **global** DM document. Today `dm-guide.md` is per-area and all four repeat the same
five-beat table, the keyboard rule and the 90-second rule; this lifts the invariant half out once
and lets each area's guide keep only what is that area's.

It lives in `game/how-to/` because `curriculum/how-to/` bans the words it needs — see below. It
sorts after `how-to-play.md`, and filename order is reading order (`build.ts:62`,
`apps/api/src/content.ts:226`). It needs no wiring: the directory is scanned.

**Accepted consequence:** `/api/how-to` is unauthenticated and unscoped and returns both roots
(`server.ts:1118`), so a learner can read this page in the SPA. That is acceptable for a document
about how an evening is run, and it is the reason this page **must hold no answer keys, no stall
table and no Socratic ladder.** Those stay in `dm-guide.md`, which the Field Manual only reads for
the DM build.

### 5. `curriculum/how-to/how-to-study-alone.md`

Sorts after `how-to-learn.md`.

**It may not contain the words *quest*, *xp*, *dc*, *medal*, *boss*, *invasion* or *session*.**
That is `game-vocabulary` (`validate.ts:509-551`), it is case-insensitive and underscore-aware,
and it will fail the build. So this page covers the curriculum half only: working practices in
order, what `lesson.md` and `glossary.md` are for, briefs and starters, the stuck ladder, and the
journal.

Its hardest paragraph is the fourth step of the stuck ladder. `how-to-learn.md` currently ends
*"Ask. There is somebody sitting there for this."* — and this document is for the case where
nobody is.

**The solo-at-a-boss half therefore cannot live here.** Extend `game/how-to/how-to-play.md`
instead, with the async sign-off section: the learner works, pushes, writes the teach-back, and
the attempt waits in the queue as `passed=false` with `awaitingSignoff` until the DM grants it.
**This already works in the shipped API** — no code change — and it is exactly §6.4's *"push is
the verification mechanism"*.

The vocabulary rule is doing its job here rather than obstructing: working alone through the
curriculum and waiting on somebody to press a button are two subjects, and the rule forces them
into two documents.

## House rules that apply

- **US spelling.** Both files are read by a learner.
- **ADR 0005** — a heading names what follows it. Curriculum and game prose, not plans.
- **ADR 0006** — the lesson places the reader in the sequence, never on the calendar. The test is
  whether the sentence survives a learner who took twice as long.
- `how-to-study-alone.md` is `audience: learner`; `how-to-run-a-session.md` is `audience: dm`.

## Files expected to change

- `docs/design/workflow-catalog.md` (new)
- `game/how-to/how-to-run-a-session.md` (new)
- `curriculum/how-to/how-to-study-alone.md` (new)
- `game/how-to/how-to-play.md`
- `curriculum/area-{0,1,2,3}/dm-guide.md` — only to remove what the global document now carries

## Verification

```bash
cd pyquest
npm run validate:content   # game-vocabulary against how-to-study-alone.md is the real check here
npm test                   # no-game.test.ts still passes: deleting game/ must leave this valid
```

Then with the stack up (`infra/dev-stack.sh --with-spa`), open `/how-to` and confirm all four
sections render in filename order, and that the curriculum half still reads correctly with
`game/` deleted — which `no-game.test.ts` asserts and a person should also see once.

## Evidence

`planning/evidence/how-to-vocabulary-RED.txt` — the rule firing on a draft that used the game's
words, captured before the rewrite. A page that never tripped the rule is a page nobody proved the
rule was watching.
