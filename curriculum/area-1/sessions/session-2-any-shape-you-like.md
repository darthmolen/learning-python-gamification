# Session 2 — Any Shape You Like

**Concepts:** `range` (three-arg), `variables` · `for`, `int`, `float`, `input`,
`f-strings` resurfacing
**Files:** `sessions/session-2/`
**Journal:** entry 08

Tonight `range` grows two more numbers, and the machine gets a person on the other end of
it.

---

## Beat 1 — Invasion (3 minutes)

1. `range(4)` — say every number it gives you, in order.
2. What does the colon at the end of a `for` line do?
3. Why give something a name instead of typing the number?

## Beat 2 — Forecast (1 minute)

Read entry 07's *what will break next time* back to them. Say what actually happened. Two
sentences, then move on.

---

## Beat 3 — The hook (6 minutes)

Three forms, on screen, nothing else:

```python
range(stop)                # 0, 1, 2, ... up to but NOT including stop
range(start, stop)         # start, ... up to but NOT including stop
range(start, stop, step)   # start, start+step, ... still not including stop
```

The word to land is **including**. The start is in. The stop is out.

Say why it is lopsided, because they will ask and "that is just how it is" is a bad answer:

> **"`range(4)` gives four numbers and `range(0, 4)` gives four numbers and `range(4, 8)`
> gives four numbers. The stop minus the start is always the count. That only works
> because the stop is left out."**

Do not demonstrate the third form. They meet it in the file.

---

## Beat 4 — The work (30 minutes)

### `s2e1_three_numbers.py` — predictions on paper first

Five loops, five written predictions. They score themselves out of five and the score
goes in the Journal, because they do this again in session 8 and comparing is the point.

The one to sit on is `range(10, 0)`, which prints **nothing at all** and does not
complain. That is the second time they have met a loop that silently does not run. Do not
name it yet. Session 6 names it.

### `s2e2_counting_down.py` — the counter is the drawing

The counter stops being a tally and becomes the side length. Nothing in the body says
"get smaller"; the range says it.

Task 2 is worth the time: 89, then 90, then 91, 60, 121, 144. **144 is the good one** and
they should find it rather than be told.

Task 3 asks why the last length was 8 and not 0. The stop is out. Again.

### `s2e3_the_shape_dial.py` — the machine, with a person on it

`input` from Area 0 meets the polygon engine from session 1. One trap, and they have met
it before: `input` hands back a `str`, and `forward("90")` is a `TypeError` from Area 0
session 3.

Task 3 asks them to answer 1 and then 0. One crashes and one does something strange but
legal. **They cannot fix either tonight and both go in the Journal.** Session 5 fixes
both, and finding their own note from three sessions ago is the point of writing it down.

---

## Beat 5 — Journal (5 minutes)

Entry 08. The thing worth capturing: **their score out of five on the predictions**, and
which one they got wrong.

---

## Where they will stall

`dm-guide.md` §4. The two that will actually happen:

**`range(2, 10)` gives 8 numbers and they expected 9.** The most common off-by-one in the
language. *"Write down what you think it gives. Then print it. Which end did you get
wrong?"*

**They change `sides` and the turn does not follow**, because they typed the turn as a
number. This is the whole session in one bug. *"You changed one number and the shape
broke. Which other number secretly depended on it?"*

**Let them get wrong:** the hard-coded turn. The fix — `turn = 360 / sides` — is a line
they should write themselves, out of irritation.

**Say nothing** when they copy a loop three times to draw three shapes. Say nothing at
all. Session 7 lands much harder if they have felt this first.

## Compression note

If the calendar bites, this session merges into session 1. Keep `s2e1`'s five predictions
and `s2e3`'s dial; `s2e2` can go to their own time.

## Success condition

They can write `range(start, stop, step)` without looking it up, say which end is included,
and change one number at the top of a file to get a different shape out of the bottom.
