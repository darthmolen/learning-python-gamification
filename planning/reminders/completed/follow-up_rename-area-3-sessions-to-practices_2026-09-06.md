---
kind: reminder
status: done
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

---

## Closed — 2026-09-06

**Done, on the `area-3` track, as instructed.**

The rename moved 40 paths with `git mv`: `sessions/` → `practices/`, twelve plan files,
twelve drill directories, and 26 drills from `s<n>e<m>` to `p<n>e<m>`. `reference/` needed no
renaming — Area 3's two payloads are `r2_` and `r6_`, keyed to the practice they answer
rather than named for a session.

References were rewritten by a rule that requires a **digit or a slash**, which is this
reminder's own test made mechanical. 228 lines across 45 files. Bare `session` was never
matched, so *the shape of a session*, *next session*, *one entry per session*, *last
session*, *the whole session* and *Compressing to eleven sessions* all survive — and all of
them survive in areas 0–2 too, which is what they were checked against rather than against
taste.

`practices.yml` is added with **every `exercises` list empty**, which is the truth about this
area: `curriculum/area-3/exercises/` does not exist yet, because the five quests, the
breakpoints rung and Boss 3 are the plan's Phase 4. A slug listed before its directory exists
fails `practice-missing-exercise`, so naming them early would be writing a promise the tree
cannot keep. The intended pairing is recorded in the file's own comment, and each slug lands
when its brief does.

**Practice 13 is absent rather than empty.** Boss 3 has no plan file — it is gated on the
Pygame Zero spike — so the numbers run 1..12 with no gap, and 13 is appended when written.

Both spine rules were seeded and watched to fail against Area 3 before being trusted:

```text
practice 2 lists "the-inventory", and area-3/exercises/the-inventory/ does not exist
the practice numbers are not 1..12 — expected 5, found 6
```

### The collision, reconciled — and it was worse than the merge reported

The merge was **textually clean and semantically broken**, which is the dangerous shape. My
in-flight fix had repointed `SEARCH` at `sessions`; this rename moved that directory. Git saw
two edits to different files and merged them happily.

The result: `curriculum/area-0/verify.py` reported **2 of 2, and passed**, having found only
`reference/`. A green harness measuring almost nothing — the same failure the fix existed to
repair, arriving by a different road. All four now read `practices`.

### Two defects found in the shipped rename, and fixed

1. **`curriculum/area-1/verify.py`'s sort key was dead.** `re.fullmatch(r"session-(\d+)", …)`
   never matches `practice-N`, so every directory scored 0 and the output order collapsed to
   `practice-6, practice-10, practice-1, practice-2, …`. Its docstring still claimed it "puts
   practice-2 before practice-10". One word; the order is 1..10 again.
2. **A half-renamed sentence** in the same file — *"Session 3 and Practice 6 each ship a loop
   that does not stop"* — one clause kept the old noun while the next took the new one.

Internal identifiers in areas 0–2 (`in_session_order`, the loop variable) were **left alone
deliberately.** They are another track's file and `main` chose not to rename them;
reconciling the collision is this track's job, restyling their code is not.

### Verified

```console
area-0  19 of 19      area-1  35 of 35
area-2  13 of 13      area-3  28 of 28, 1 walkthrough uncovered
ruff curriculum/area-3/      clean
validate:content             OK, 23 items across 8 areas
validate:plans               OK, 122 documents
```

Areas 0 and 1 carry 7 pre-existing ruff findings between them — an unsorted import block in a
starter and a deliberate `10 < 10` in a teaching drill. Both are on `main` unchanged and
neither is this track's.
