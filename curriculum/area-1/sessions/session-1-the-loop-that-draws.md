# Session 1 — The Loop That Draws

**Concepts:** `for`, `range` · `print`, `variables`, `int` resurfacing
**Files:** `sessions/session-1/`
**Journal:** entry 07

Tonight they delete typing they have already done, and get a machine out of it.

---

## Beat 1 — Invasion (3 minutes)

Area 0 only. Nothing of Area 1 exists yet.

1. What kind of thing does `input` always hand back?
2. Which line of a traceback do you read first?
3. What did `0.1 + 0.2` print, and why was that not a bug?

---

## Beat 2 — The hook (7 minutes)

Open `s4e2_the_dashed_orbit.py` from Area 0. Their file. Scroll through the four
identical blocks of four lines. Ask what number they wrote in their Journal when
that file asked them to count the blocks they had pasted.

Then show them, on screen, three lines:

```python
for step in range(4):
    turtle.forward(100)
    turtle.left(90)
```

Name three things and only three:

| Part | What it is |
|---|---|
| `for step in range(4)` | do the next bit, four times |
| the **colon** | "what follows is the body" |
| the **indentation** | which lines the body actually is |

Then say the thing that matters more than any of them:

> **"Blank space is not decoration any more. It is the only thing telling Python which
> orders are inside the loop. You met that in Area 0 as an IndentationError. From tonight
> it is the grammar."**

Hand over the keyboard. Minute ten at the latest.

---

## Beat 3 — The work (30 minutes)

Three files, in order.

### `s1e1_the_repeated_line.py` — the square, in three lines

Task 1 asks what the first number printed was. **Do not let them skip it.** The answer is
0 and it is the setup for the next file and for the next four weeks.

Tasks 2 and 3 are the pentagon. They change 4 to 3 and get an open shape; then they have
to work out the turn themselves. Let them guess. 90, then 100, then something. The
question when they stall:

> **"You went round once and a bit. How far round should you have gone in total?"**

**Do not say 360.** It is the single most valuable number in the area and it is worth two
minutes of guessing.

### `s1e2_what_range_gives.py` — predictions on paper first

Four loops, four written predictions before they run anything. Insist on it; it costs
ninety seconds and it is the whole mechanism.

Nearly everybody gets exactly one wrong, and it is nearly always `range(0)` — which
prints nothing, complains about nothing, and is one of the three silent Area 1 failures
they will meet properly in session 6.

Task 3 is the gap in the spoke drawing: the first spoke has length 0 and draws nothing.
There are two fixes and one of them changes a single number. Ask which one they would
rather read in a month.

### `s1e3_the_polygon_engine.py` — the machine

This is the file that pays for the evening.

`turn = 360 / sides`, and everything downstream follows. They change one number at the
top and get a triangle, a pentagon, an octagon, and at 36 sides a circle nobody asked for.

**Say this out loud when the circle appears:**

> "You did not type the word circle anywhere in that file."

**Tell them to keep this file.** It comes back in session 7 and session 9, and it is the
one to reach for when an evening goes badly — three minutes of turning the dial always
ends on something that works.

---

## Beat 4 — The choice (included above)

Every file ends in a choice board. One choice minimum. `s1e3`'s option (b) — a different
colour for shapes with more than six sides — is deliberately impossible tonight. If they
pick it, let them try, then have them write in the Journal what they wanted to say and
could not. Session 4 gives them the word.

---

## Beat 5 — Journal (5 minutes)

Entry 07, and there is one thing to say before they write it. Thirty seconds, once:

> "Same Journal, same ten XP, one change. From tonight the last question — what will break
> next time — gets read out at the start of the next session. Out loud. So write something
> you actually think. If you get it right I will say so."

The thing worth capturing tonight: **how many lines the loop deleted.** They have the
number from Area 0.

---

## Where they will stall

`dm-guide.md` §4. The two that will actually happen:

**They read `range(4)` as "1 to 4".** They are right about the count and wrong about the
numbers, and it will cost them in session 8 if it survives. *"Print every number it gives
you. What is the first one?"*

**They put `turtle.done()` inside the loop.** Indentation means something now. *"Which lines
are inside the loop? Read me only those."*

## Success condition

By the end of tonight they can write a `for` loop from scratch, say what `range(6)` gives,
and work out the turn for any polygon without being told.

The last one is the real test, and the way to check it is to ask for a nine-sided shape
and watch whether they reach for the calculator or the rule.
