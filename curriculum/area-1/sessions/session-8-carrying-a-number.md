# Session 8 — Carrying A Number

**Concepts:** `accumulator-pattern` · `for`, `while`, `range`, `variables`, `int`,
`float`, `comparison-operators` resurfacing
**Files:** `exercises/session-8/`
**Journal:** entry 14

Tonight the loop starts answering questions the picture cannot.

They have already written an accumulator twice without the word — `drawn = drawn + 1` in
s3e2, and the clumsy line-counting in s2e2's choice board. Tonight it gets a name and a
job, which is the right order: session 8 gives the pattern something to do rather than
defining it at them.

---

## Beat 1 — Invasion (3 minutes)

1. Outer loop three times, inner loop four times — how many times does the inner body run?
2. Where does the counter in a `for` line come from, and when does it get created?
3. Say an `if` out loud that makes every side after the sixth black.

## Beat 2 — Forecast (1 minute)

Entry 13's forecast, read back, then what happened.

---

## Beat 3 — The hook (6 minutes)

Three lines, in three places, and **the places are the lesson**:

```python
total = 0                          # BEFORE the loop. Once.
for thing in ...:
    total = total + something      # INSIDE the loop. Every time.
print(total)                       # AFTER the loop. Once.
```

Ask what it is for, and give the answer as a list of questions rather than a definition:

> **"How many? How much? How far? What is the biggest? Every one of those is this
> pattern."**

Then name the two ways it goes wrong, because they are about to write both:

| Mistake | What you get | Does it crash? |
|---|---|---|
| `total = 0` inside the loop | the last step's contribution, not a total | **no** |
| `print` inside the loop | twenty lines instead of one answer | **no** |

Neither prints anything red. They met that idea two sessions ago; tonight it has money on
it.

---

## Beat 4 — The work (30 minutes)

### `s8e1_carrying_a_number.py` — the pattern, deliberately broken and fixed

Two accumulators running side by side: total ink and total turn.

Task 1 has them work the total out on paper before trusting the program. Do not skip it —
an accumulator checked by hand once is an accumulator they believe.

Tasks 2 and 3 are the two mistakes, made on purpose. Move `total_ink = 0` inside the loop
and read what prints. Move the `print` inside the loop and count the lines.

Task 4 is the silent one and it is why this session sits after session 6: change
`total_ink = total_ink + length` to `total_ink = length`. **The picture is identical. The
number is wrong.** Nothing complains.

### `s8e2_the_growing_spiral.py` — the accumulator IS the drawing

In s8e1 the accumulator was bookkeeping. Here the number being carried is the length of the
next line, so one line — `length = length + growth` — is the entire reason the shape
grows. Delete it and you get a circle.

Task 2 is the play: turn 90, 60, 120, 144, 91, 121. Two of those are much better than the
rest and they should find them rather than be told.

Task 4 is a real one: swap the order of the last two lines so `length` grows before the
ink is added. The picture is unchanged and the total is wrong by a predictable amount. Ask
them to predict the amount.

### `s8e3_the_ink_budget.py` — the accumulator meets `while`

*"Keep drawing until you have used 2000 pixels of ink."* Nobody knows how many lines that
is; the program finds out. This is the shape of an enormous amount of real software.

Task 1 is worth two minutes of argument: the overspend is never zero, because the loop
checks the budget at the top, draws a whole line, and only then adds it up. **Is that a
bug?** Make them decide and say what they would want instead. There is no right answer and
having the argument is the point.

Task 5 is the one that goes in the Journal: rewrite it as a `for` loop using the number the
`while` version printed, then change the budget. What has to happen to each version? That
is the answer to *when do I use which*, in one sentence, in their words.

Payload for choices (b) and (c) in `reference/r8_the_ink_budget.py`.

---

## Beat 5 — Journal (5 minutes)

Entry 14. Worth capturing: **the number the program worked out that they never typed
anywhere.** There are several tonight. Ask which one surprised them.

---

## Where they will stall

`dm-guide.md` §4. The two that matter:

**They reset the total inside the loop.** The defining accumulator bug. *"Which line sets
the total to zero? How many times does that line run? How many times did you want it to?"*

**`total = length` instead of `total = total + length`.** Silent, and the picture still
looks right. *"Say that line out loud in English. Now say the one you meant."*

## Success condition

They can answer "how much line did that draw?" about a program they wrote — by making the
program answer it — and they can say where the three parts of an accumulator go and why
each one is where it is.
