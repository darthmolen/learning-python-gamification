# Session 4 — Two Roads

**Concepts:** `if`, `else` · `comparison-operators`, `bool`, `for`, `range`, `input`,
`f-strings` resurfacing
**Files:** `sessions/session-4/`
**Journal:** entry 10

Tonight the program stops doing the same thing every time.

`if` arrives now rather than in session 1 on purpose. A conditional with nothing to
condition on is the "tour of types before you need a type" mistake Area 0 explicitly
refused. By tonight they have a loop with a counter in it, so *"the first six sides are
red"* is a thing they actually want.

---

## Beat 1 — Invasion (3 minutes)

1. What has to happen inside a `while` loop for it ever to stop?
2. `10 >= 10` and `10 > 10` — say both answers.
3. `print("5" + "5")` — what comes out?

## Beat 2 — Forecast (1 minute)

Entry 09's forecast, read back. Then what actually happened. They will have predicted
another hang; find out whether they were right.

---

## Beat 3 — The hook (6 minutes)

Four lines on screen:

```python
if size > 100:
    turtle.color("red")
else:
    turtle.color("blue")
```

Three things to name:

| Part | What it is |
|---|---|
| `if size > 100:` | a question, and it ends in a colon like every other block opener |
| the indented block | runs only when the answer is True |
| `else:` | runs only when it is False |

Then the sentence that prevents half of tonight's confusion:

> **"Exactly one of them runs. Never both. Never neither."**

Then connect it back rather than presenting it as new. `size > 100` is a comparison —
session 3, all six of them — and what it hands back is a `bool`, which is the fourth kind
of thing from Area 0 that has had nothing to do until tonight.

---

## Beat 4 — The work (30 minutes)

### `s4e1_two_roads.py` — the fork on its own

Predictions before running: the file prints the question, the answer, and the type of the
answer, so they can see `True` and `<class 'bool'>` next to each other.

Task 2 is the boundary — `size` exactly 100, then `>` swapped for `>=`. **This is where
nearly every `if` bug in the world lives** and it costs ninety seconds to meet it
deliberately.

Task 4 asks them to type `if size = 100:` on purpose. It is a `SyntaxError`, which is a
mercy, and it is Python naming the difference between giving a name and asking a
question.

### `s4e2_the_first_half.py` — the fork inside a loop

Twelve sides, red for the first six and black for the rest. One question asked twelve
times, with a different answer each time, because the counter is what it asks about.

**Three levels of indentation now, and each one means something.** Task 1 asks why
`turtle.forward` is inside the loop but not inside the `if`, and invites them to indent it
one level further and see what happens. Let them do it — the picture goes wrong in a way
that is instantly readable.

Task 3 is the real one: change 12 sides to 20 and the `6` becomes a lie. The fix makes the
split work itself out from `sides`, which is the same move as `turn = 360 / sides` and
worth naming as such.

### `s4e3_the_choice_board.py` — the person decides

`input` and `if` together. Four different pictures out of one file with nothing edited
between runs.

Task 2 is the silent bug: answering `Big` with a capital B draws a small one, with no
error, because `"Big" == "big"` is False. They may or may not be able to fix it; either
way it goes in the Journal in their own words.

Task 3 is the one to protect the time for. Answering 0 crashes the program, and they can
now stop that — an `if` that refuses a number below 3. **Getting the drawing to not happen
is the tricky part**, and if it defeats them tonight, session 5 gives them the cleaner way
and they will recognise it when it arrives.

---

## Beat 5 — Journal (5 minutes)

Entry 10. Worth capturing: **the first program they have written that does different
things on different runs.** Ask what the smallest change to an answer was that changed the
picture.

---

## Where they will stall

`dm-guide.md` §4. The two that matter:

**`if i == 0 or 1 or 2:`** — it runs, it is always true, and nothing complains. If they
write it, do not correct it. *"That ran and did the wrong thing. What is `or 1` asking?
Print `1 == 0 or 1` on its own."* This is Area 1's `b7` arriving early and it is worth
more than anything you could tell them.

**The colour changes and never changes back.** `color` is a setting, not a one-off order.
*"When did you tell it red? When did you tell it anything else?"*

## Compression note

If the calendar bites, this session merges into session 5, which teaches the same material
under more pressure. Keep `s4e1`'s boundary task and `s4e2`'s indentation task; `s4e3`
folds into session 5's gatekeeper.

## Success condition

They can write an `if`/`else` inside a loop, say which lines belong to which block by
pointing at the indentation, and explain why exactly one branch runs.
