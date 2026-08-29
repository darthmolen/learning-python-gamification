# Session 7 — A Loop Inside A Loop

**Concepts:** `nesting` · `for`, `range`, `if`, `else`, `comparison-operators`,
`variables` resurfacing
**Files:** `exercises/session-7/`
**Journal:** entry 13

Tonight a shape becomes a pattern, and it costs three lines.

Nesting comes before the accumulator on purpose. It is visual and instantly rewarding — a
loop inside a loop is a mandala — whereas the accumulator is abstract and lands much
better once he has watched a shape grow.

---

## Beat 1 — Invasion (3 minutes)

1. Name a bug that produces no error message at all.
2. What is the first question to ask a loop that did the wrong number of things?
3. What was wrong with `b6`?

## Beat 2 — Forecast (1 minute)

Entry 12's forecast, read back, then what happened.

---

## Beat 3 — The hook (6 minutes)

Do not write any code yet. **Ask the question first:**

```python
for shape in range(3):
    for side in range(4):
        turtle.forward(60)
        turtle.left(90)
    turtle.left(120)
```

> **"How many times does `turtle.forward` run?"**

He will say seven. Everybody says seven. Everybody adds.

Then run it and count. Twelve. The inner loop runs all the way through *every single time*
the outer one goes round, so the counts multiply.

Then the second thing, and it is the harder one all evening:

> **"Which loop is `turtle.left(120)` in?"**

Point at the indentation with a finger. Do not read it out for him. Say plainly that
counting spaces with your finger is what professionals do and there is no shame in it.

---

## Beat 4 — The work (30 minutes)

### `s7e1_a_loop_inside_a_loop.py` — one line, three meanings

Three squares in a rosette. Tasks 2 and 3 move `turtle.left(120)` one level in and then one
level out, predicting before each run.

**That is the whole session in one exercise.** The same line means three different things
depending only on how far it is indented, and he sees all three in four minutes.

### `s7e2_the_grid.py` — both counters used

A 4×4 grid, where `row` and `col` become a position rather than just a tally. Sixteen cells
addressed by two numbers, which is how every tile map, spreadsheet, chessboard and
Minecraft chunk is laid out.

**Three loops deep now.** Task 1 asks him to say which loop each line is in and prove it by
predicting how many times each runs.

Task 5(a) — a chessboard with alternating fill — is deliberately just out of reach. It
wants an operator he has not met. Let him try, then have him write in the Journal what he
needed and did not have. That note is Area 3's problem and it is a good one to be waiting.

### `s7e3_the_rosette.py` — plain on purpose

It draws something correct and dull, with two dials. The value of the evening is entirely
in the choice board, and there is a Datamine payload for choices (a) and (b) in
`reference/r7_the_rosette.py`.

Task 2 is worth stopping for: **every number below the dials is worked out rather than
typed.** Find all four and say which dial each depends on. That is what "one number at the
top" bought him back in session 1.

Task 4 is the boss test arriving three sessions early:

> **"A pattern that only looks right at copies=8 is a drawing. A pattern that looks right
> at 8 and 12 and 30 is a generator. Boss 1 wants a generator."**

---

## Beat 5 — Journal (5 minutes)

Entry 13. Worth capturing honestly: **whether he predicted 12 or 7.** He will want to
record 12. Ask for the honest one.

---

## Where he will stall

`dm-guide.md` §4. The two that matter:

**The inner loop's turn is in the wrong loop.** *"Which loop is that line in? Point at it,
then count the spaces."*

**It is unbearably slow.** Twelve polygons at default speed genuinely is. *"How fast is it
drawing? Do you remember the throttle?"* — then `turtle.speed(0)`.

**Let him get wrong:** the multiplication. Ask for the prediction before every run tonight.

## Success condition

He can write a loop inside a loop, say how many times the inner body runs without running
it, and tell you which loop any given line belongs to by looking at the indentation.
