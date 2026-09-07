# Practice 6 — The Hotbar

**Concepts:** `slicing` · `indexing`, `len`, `list`, `range`, `mutation`,
`reading-errors` resurfacing
**Files:** `practices/practice-6/`
**Journal:** entry 30

A hotbar is the first nine slots of an inventory. That is a slice, and the whole session is
one colon and one rule they have already met twice.

**This is the third encounter with the stopping rule** — `range(9)` gives nine numbers,
`range(2, 5)` gives three, `[0:9]` gives nine items — and it is scheduled to be the last time
it surprises them. Say that out loud tonight. A rule met three times in three places is a
rule; a rule met once is a fact about `range`.

**This session carries `a3-the-hotbar`, DC 14.**

---

## Beat 1 — Invasion (3 minutes)

1. What does `range(2, 5)` give you? All of them.
2. Where is the last item in a list of ten?
3. What does `in` hand back?

Question 1 was also asked in practice 4. That is deliberate — it is the concept tonight
needs, drilled twice on the ladder, immediately before use.

---

## Beat 2 — Forecast (1 minute)

Entry 29's forecast, read back, then what happened.

---

## Beat 3 — The hook (6 minutes)

Write it and ask before explaining anything:

```python
hotbar = inventory[0:9]
```

> **"How many things is that?"**

Take the answer. If they say ten, do not correct it — ask question 1 from the Invasion
again, and let them connect the two themselves. That connection is the session.

Then the three shorthands, quickly, as convenience rather than concepts:

```python
inventory[:9]     from the start
inventory[9:]     to the end
inventory[:]      all of it -- and a real copy
```

**That last one is worth a pause**, because it answers a question they had three sessions
ago: `spare = inventory[:]` is a copy where `spare = inventory` is a second name. Practice 3's
problem, solved by tonight's tool. Let them notice it if they can.

---

## Beat 4 — The work (30 minutes)

### `p6e1_the_hotbar.py` — the slice, and what it leaves behind

A twelve-item inventory split into a hotbar and the rest. Task 2 checks that the two halves
account for everything, which is the arithmetic that proves the stopping rule rather than
asserting it.

Task 4 is the practice-3 callback: `inventory[:]` against `inventory`, appending to each,
printing the original both times. Only one of them is a copy.

### `p6e2_past_the_end.py` — why one of these crashes and the other does not

In practice 2, reaching past the end was an `IndexError`. Tonight it is not, and the
difference is genuinely surprising the first time.

The distinction to land, and it is worth writing on paper:

| Asked | Means | Past the end |
|---|---|---|
| `inventory[99]` | give me the thing in slot 99 | **IndexError** |
| `inventory[0:99]` | give me whatever is in this range | three things, no complaint |

An index names a thing that must exist. A slice describes a range and takes what falls
inside it — and an empty range is a perfectly good answer.

**This file contains a `try`/`except`, which is Area 5 vocabulary.** It is there only so the
file can print past its own crash, and the docstring says so. If they ask, read it as "try
this, and if it refuses, do that instead" and move on. Do not teach it.

### The quest

`a3-the-hotbar`, DC 14, `local-repo`. Brief lands in `exercises/the-hotbar/BRIEF.md` with
the content items.

---

## Beat 5 — Choice board (in the work time)

- **Pages.** Print the inventory nine at a time, however long it is.
- **The last three.** Get the final three items without knowing the length.
- **Every other one.** Slices take a third number. Find out what it does.
- **A striped floor.** Back to `world`: use a sliced list of kinds to build stripes.
- **Something else**, with a prediction first.

---

## Beat 6 — Journal (5 minutes)

**Tonight's entry is the one the DM guide asks for by name.** Prompt: *write out the slicing
stopping rule, with an example.*

Third encounter, written down. That is what makes it the last one.

---

## Where they will stall

See `dm-guide.md` §4. The predicted three:

1. **`[0:9]` gives nine and they expected ten.** *"How many numbers does `range(0, 9)` give
   you? Same rule. Why do you think it is the same rule?"*
2. **A slice past the end does not crash.** *"Indexing past the end exploded. Slicing past
   the end did not. What is different about what you asked for?"*
3. **They slice and wonder why the original is unchanged.** Good. Ask what they expected and
   why.

---

## What you may not say

When they say ten: **do not say nine.** Ask the `range` question again. They have the rule
already and the only thing worth building tonight is the bridge between the two places it
lives.

---

## Success condition

They can say why `[0:9]` gives nine things without counting, and why slicing past the end is
allowed when indexing past the end is not.
