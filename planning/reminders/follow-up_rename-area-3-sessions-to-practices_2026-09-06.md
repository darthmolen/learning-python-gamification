---
kind: reminder
status: open
category: follow-up
audience: dm
subject: area-3 curriculum
date: 2026-09-06
plan: practice-spine_2026-09-06
---

# Rename Area 3's sessions to practices, and add its practices.yml

Areas 0, 1 and 2 were renamed on 2026-09-06 under ADR 0007 — **a practice is the unit of work,
a session is the unit of time.** Area 3 was deliberately left alone because the `area-3` track
holds `curriculum/area-3/**` in progress with 6 of its 13 practices unwritten, and
`plan-workflow` admits a plan only when its files are disjoint from every other in-progress
plan's.

**Do this in the `area-3` track, not in `practice-spine`.** These are the instructions, not a
request to hand the files over.

## Why the word changed

The short reason is that `session` was already taken: the shipped `sessions` table is
household-scoped and keyed `scheduled_for date UNIQUE`, and §5.9's streak counts "consecutive
scheduled sessions attended". Two different numbers called "session" on adjacent screens.

The better reason is that **"Session 3" fails ADR 0006's own test as a name.** That record asks
one question of anything a learner reads: *would this still be true for a learner who took
twice as long?* A session asserts a sitting, so a learner who takes two evenings over Session 3
is told by the noun, before he reads a word, that he is behind. "Practice 3" survives it.

## What to rename

Mechanical, and all of it inside `curriculum/area-3/`:

| From | To |
|---|---|
| `sessions/` | `practices/` |
| `sessions/session-<n>-<slug>.md` | `practices/practice-<n>-<slug>.md` |
| `sessions/session-<n>/` | `practices/practice-<n>/` |
| `practice-<n>/s<n>e<m>_<name>.py` | `practice-<n>/p<n>e<m>_<name>.py` |
| `reference/session-<n>-answers.md` | `reference/practice-<n>-answers.md` |

Use `git mv` so the history follows. Areas 0–2 moved 85 paths this way; area 3 will be fewer.

Then rewrite references, and **only the ones naming the unit**:

- `sessions/` → `practices/`
- `session-<digit>` → `practice-<digit>`
- `s<n>e<m>` → `p<n>e<m>`, including bare ones in README tables
- `Session <digit>` / `session <digit>` → `Practice <digit>` / `practice <digit>`

## What must not be renamed

**A DM document may still say *session* where it means the evening.** ADR 0006 says session
plans and the DM guide "are written for somebody running a calendar", and the DM is running an
evening. These all stay exactly as they are:

- `## The shape of a session` — the five beats and the 45–60 minutes
- "at the start of the next session" — §5.4's invasions
- "one entry per session" — §5.6's Journal, which the database also keys by session date
- "if a session goes badly", "costs a session for no gain" — an evening, spent

The test is the one ADR 0007 uses: **if it has a number after it, it is the unit; if it is an
amount of an evening, it is a session.** A blanket find-and-replace gets both halves wrong.

## Then add the spine

`curriculum/area-3/practices.yml`, following `area-0/practices.yml`:

```yaml
area: 3
practices:
  - n: 1
    title: The Row Of Blocks
    exercises: []            # legal, and common — this one is worked at the table
  - n: 2
    title: The Inventory
    exercises: [the-inventory]
```

`exercises` names slugs under `area-3/exercises/`, **never the plan files** — the learner never
opens a plan, and naming slugs is what keeps the manifest independent of the directory the
plans live in.

`validate:content` will then check four things, and two of them will bite:

- every slug listed resolves to `area-3/exercises/<slug>/`
- **every `area-3/exercises/<slug>/` is claimed by at least one practice** — so the spine has to
  be finished as the briefs are, not after
- the practice numbers run 1..N with no gap
- a slug may appear in more than one practice, which is legal and real

Area 3's README already carries a `Quest` column naming its quests per practice, so the
mapping is authored — it just is not yet in a file anything can read.

## The collision to know about

**`verify.py`'s `SEARCH` tuple.** The committed version reads
`SEARCH = (ROOT / "exercises", ROOT / "reference")` and fails on every `test.py` and
`unfinished.py` for carrying no `# expect:` tag — a pre-existing bug. There is an in-flight fix
repointing it at `sessions`, which after this rename must say **`practices`**.

`practice-spine` deliberately did not touch that line in areas 0–2, because it belongs to
whoever is fixing the search drift. Whoever merges second has to reconcile the two: the fix is
right and the directory name changed under it.
