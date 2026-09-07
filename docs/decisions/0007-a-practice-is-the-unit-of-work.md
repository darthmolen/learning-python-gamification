# 0007 — A practice is the unit of work, a session is the unit of time

**Status:** Accepted
**Date:** 2026-09-06

## Context

The parent worked Area 0 as a player and it felt disjointed. Planning Area 4 produced the
question behind it — *what is the difference between a session and a quest?* — and the answer
turned out not to be a wording problem.

**The app rendered the graded subset of the curriculum and never admitted it was a subset.**

Quests are deliberately unordered. `game/area-1/quests/a1-the-sigil.yml` refuses `requires` in
a comment, because §5.2 gives an area five quests of which any three unlock the boss and "a
prerequisite list here would quietly take that choice back." That refusal is correct. Its
consequence was not noticed: **the only ordering in the curriculum lived in session plans the
learner never opens**, so taking order out of quests took it out of the product entirely. He
was given freedom without a map.

Meanwhile the relation between the sequence and the scored work was authored three ways and
stored in none:

- `curriculum/area-1/README.md` — a prose table, `s1e3 + s2e3`
- `curriculum/area-{2,3}` plans — a `### The quest` section in each
- `curriculum/area-0/` — neither, only a section proposing in future tense quests that had
  shipped months earlier, pointing at `packages/content/`, a path the overlay had left

`ContentItemSchema` is `.strict()` with no `session` field, so `validate:content` could not
catch the drift. CLAUDE.md's own rule — *frontmatter with no validator is markdown with more
punctuation* — one level worse, because none of the three was even frontmatter.

## Decision

**A practice is the unit of work. A session is the unit of time. They are different objects and
they now have different names.**

| Unit | Is | Ordered? | Lives |
|---|---|---|---|
| **Practice** | a numbered unit of the curriculum | **yes** — this is the spine | `curriculum/area-<n>/practices.yml` |
| **Exercise** | one brief-bearing piece of that work | within its practice | `curriculum/area-<n>/exercises/<slug>/` |
| **Quest** | an exercise the game scores | no — any three unlock the boss (§5.2) | `game/area-<n>/quests/*.yml` |
| **Session** | the evening — attendance, §5.9's streak | calendar | Postgres, Defend |

The shipped `sessions` table and every line of Defend copy are untouched. No migration.

## Why "practice" and not "session"

The convenient answer is that `sessions` was already taken — by a household-scoped,
`scheduled_for date UNIQUE` table, and by §5.9's "consecutive scheduled sessions attended". Two
different numbers called "session" on adjacent screens is reason enough to rename one.

**The real argument is that "Session 3" fails ADR 0006's own test as a name.** That record asks
one question of learner-facing prose: *would this still be true for a learner who took twice as
long?* A session asserts a sitting. A learner who takes two evenings over Session 3 is told, by
the noun, before he reads a word, that something has gone wrong. ADR 0006 caught six lessons
opening with "Six weeks." and never looked at the word naming the unit itself.

"Practice 3" survives the test. It is an amount of work, not a length of time.

The DM guide can then say something true and previously unsayable: **plan one practice per
session, and let it run to two when it needs to.**

## The loop closes through the exercise

Both edges are wanted. Only one is authored, and which one is which is what keeps the lanes
intact.

```text
Practice ──► Exercise      authored, in curriculum/practices.yml
Quest    ──► Exercise      already authored, in game/, as the `brief:` path
Practice ──► Quest         DERIVED — the join, and it cannot drift
```

Storing the third edge breaks something either way. In `curriculum/` it points the curriculum
at game ids, and `packages/content/tests/two-roots.test.ts` fails on the next run. In `game/`
it is a second source of truth for a fact the `brief:` path already states — and two sources of
one fact is exactly how three hand-maintained tables came to disagree.

So the loader materialises it once and the validator proves it. Everything downstream — engine,
API, SPA, Field Manual — reads one derivation.

## Consequences

- **`validate:content` gains four rules.** Two are the spine's: a listed slug must resolve to a
  directory, and **every exercise directory must be claimed by at least one practice**. The
  second is the one that catches the drift that left Area 0's README stale for months.
- **Empty is legal and common.** 5 of the 24 authored practices carry no exercise at all;
  Area 3 plans 6 of 13. The work is delivered at the table and `area-1/README.md` records why
  for each. A schema that required one would make an author invent an exercise to satisfy it.
- **Many-to-many is legal.** `a1-the-polygon-engine` is built from practices 1 and 2 together,
  `a1-the-growing-spiral` from 7 and 8. A one-practice-per-exercise rule rejects the real
  curriculum on the day it is written.
- **The published Field Manual was fixed by the same change.** Its `exercises` came from
  `items.filter(kind === 'quest')`, so the site's "the work" *was the quest list* — the same
  blind spot as the app, on the one surface a confused learner could consult instead.
- **The directories were renamed in areas 0 to 2, and area 3 was left alone.** `sessions/` →
  `practices/`, `session-<n>-<slug>.md` → `practice-<n>-<slug>.md`, `sNeM_*.py` → `pNeM_*.py`,
  and `reference/session-<n>-answers.md` with them: 85 paths, moved with `git mv`. Area 3 is
  held by another track with 6 of its 13 practices unwritten, so it carries instructions
  instead — `planning/reminders/follow-up_rename-area-3-sessions-to-practices_2026-09-06.md`.

  The rename was *possible* to defer, and that is the useful fact: the manifest names exercise
  slugs and never plan files, so nothing in the model depended on the directory being called
  anything in particular.

- **A DM document still says *session* where it means the evening**, and that is the rename
  working rather than a miss. "The shape of a session" is five beats and 45–60 minutes; "at the
  start of the next session" is §5.4's invasions; "one entry per session" is §5.6's Journal,
  which the database also keys by session date. The test is whether a number follows the word:
  **a digit after it names the unit, an amount of an evening is a session.** A blanket
  find-and-replace gets both halves wrong, in opposite directions.

- **One collision was left deliberately unresolved.** `verify.py`'s `SEARCH` tuple reads
  `(ROOT / "exercises", ROOT / "reference")` and fails on every starter and hidden test for
  carrying no `# expect:` tag — a pre-existing bug with an in-flight fix repointing it at
  `sessions`, which after this rename must say `practices`. That line belongs to whoever is
  fixing the search drift, so this decision did not touch it in any area.

## What this does not decide

**Whether the `sessions` table is ever filled.** It is provisioned and unwired — one reader at
`repository.ts:230`, no `INSERT` anywhere, no endpoint, and both screens that would draw it
decline in comments ("a panel would be a picture of a feature"). §5.9's streak is derived from
rows that do not exist. That remains an unbuilt feature.

It is also the reason not to quietly repurpose it, which an empty table sitting right there
invites: **a practice is untimed by construction, so it cannot feed a streak that counts days.**
That is the rename working, not duplication.
