# Session 1 — The Row Of Blocks

**Concepts:** `list`, `iteration` · `for`, `range`, `print`, `len`, `nesting` resurfacing
**Files:** `sessions/session-1/`
**Journal:** entry 25

Tonight the subject becomes the thing they actually care about.

Two weeks ago they were drawing hexagons. Tonight a list they typed turns into ground they
could walk on, and the whole of the new idea is **one name holding many things, in order.**

This session has more moving parts than any first session so far — a new import, a new
bracket, and a window that takes a moment to appear — so the first fifteen minutes are
deliberately thin. Get one row of blocks on screen before introducing anything else.

**Check `smoke.py` on their machine before tonight**, not during it. `dm-guide.md` §2.

---

## Beat 1 — Invasion (3 minutes)

1. What does `range(4)` give you? Say all the numbers out loud.
2. In Area 2, what does `python thing.py` need to be true about where you are standing?
3. What is the difference between `=` and `==`?

Question 1 is the one that matters tonight. The stopping rule is about to appear in a second
place and they should have it in their mouth before it does.

---

## Beat 2 — Forecast (1 minute)

Entry 24's forecast, read back, then what actually happened. First entry of a new area, so
this is also the moment to say out loud that Area 2's toolchain does not go away — they are
still in their own repository, still committing, still pushing.

---

## Beat 3 — The hook (8 minutes)

**Do not open with the word "list".** Open with the problem.

Ask them to imagine placing five blocks in a row, and to say what they would have needed
last month. They will describe five variables, or a loop with a lot of `if`s. Let them get
partway into it and be annoyed by it.

Then:

> **"What if one name could hold all five, and remember what order you put them in?"**

Write it on paper, not in the editor:

```python
kinds = ["grass", "dirt", "stone"]
```

Three things they should say back before anything runs: square brackets, commas between,
and **the order is kept**.

Then the second half of the hook, which is the one they will actually trip over:

| Line | What it does | What appears |
|---|---|---|
| `place(x, y, z, kind)` | remembers a block | nothing |
| `start()` | builds everything remembered | the window |

Say it once. They will not believe it until it bites them in Beat 4, which is fine and is
the plan.

---

## Beat 4 — The work (30 minutes)

### `s1e1_a_row_of_blocks.py` — a list becomes a row

Six kinds, one loop, one block each. The `for` loop is the one they already know; what is
new is that it walks a list of real things rather than `range(6)`.

**Task 1 is the important one and it is first for a reason.** They comment out `start()` and
run it again. The program prints everything, exits cleanly, complains about nothing, and
draws nothing at all. This is the signature failure of Area 3 and it is far better met here,
on purpose, in the first twenty minutes, than at half past eight on a night when they were
nearly finished.

Task 3 removes a comma. `["dirt" "stone"]` is one string and is not an error. `len()` is
what tells them, which is the first time `len` has a job.

### `s1e2_the_floor.py` — a loop inside a loop, and four hundred blocks

Nested loops are Area 1 session 7 vocabulary, so this is a resurfacing rather than a new
idea. What is new is the arithmetic having a visible cost.

Task 1 has them predict `built` before running. **Some will say forty.** Let them run it and
read 400, then work out why together.

Task 3 asks for the block count at `side = 71` *without running it* — 5,041, over the cap —
and how many seconds of black window that would be. That is the whole block-cap conversation
and it lands better as arithmetic they did than as a rule they were given.

---

## Beat 5 — Choice board (in the work time)

- **A tower.** Same list, stacked up `y` instead of along `x`.
- **A checkerboard.** Two kinds alternating across the floor. They will need the `%` from
  `s1e2` and should be made to say what it is doing.
- **A path.** A row of one kind with a different kind every fifth block.
- **The biggest thing you can build in under three seconds of loading.** Time it. This is
  the block cap as a game rather than a rule.
- **Something else**, as long as they say what they expect before running it.

---

## Beat 6 — Journal (5 minutes)

Four prompts as always. Tonight's addition: **what is the difference between `place` and
`start`, in your own words?** If the answer is one sentence and it is right, this session
landed.

---

## Where they will stall

See `dm-guide.md` §4. The predicted four:

1. **Nothing appears, no error.** No `start()`. *"Your program finished without complaining.
   So it did everything you asked. What did you ask it to do?"*
2. **Empty window.** `start()` called before the loop. *"Read your program from the top, out
   loud. Where does the building happen, and where does the window open?"*
3. **A missing comma, and a one-block row.** *"How many things are in that list? Ask Python
   — don't count them yourself."*
4. **They copy-paste a second row rather than nesting.** Let them, once. `s1e2` is the
   answer and it is more convincing after the copy-paste than before it.

---

## What you may not say

When nothing appears and they cannot see why: **do not point at the missing `start()`.** It
is obvious from where you are standing and worth nothing if you say it. It is the single
most valuable stall in the area — the first time a program has run perfectly and done
nothing — and finding it themselves is what makes the rest of the area make sense.

---

## Success condition

A row of blocks on screen that came out of a list they typed, and a sentence about why
commenting out one line made everything disappear.
