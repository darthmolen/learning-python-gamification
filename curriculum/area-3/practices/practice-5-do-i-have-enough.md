# Practice 5 — Do I Have Enough

**Concepts:** `in`, `min`, `max`, `sorted` · `list`, `if`, `else`, `comparison-operators`,
`accumulator-pattern`, `len` resurfacing
**Files:** `practices/practice-5/`
**Journal:** entry 29

Four small names that turn a list from something you read into something you ask questions
of.

**This is deliberately the cheapest session in the first half**, and it sits directly after
the two heaviest. Practices 3 and 4 were about invisible behavior; tonight everything does
exactly what it says. If the last two evenings were hard, this is the one that pays them
back.

Nothing here is difficult. The value is that `in` retires the `ValueError` from last
session, and `min`/`max` retire six lines of Area 1 accumulator into one word — and the
learner has *written* those six lines, which is what makes the one word mean something.

---

## Beat 1 — Invasion (3 minutes)

1. What is the difference between `remove` and `pop`?
2. Two names for one list — what happens when you change one?
3. In Area 1 you found the biggest number in a loop. How did you start it off?

Question 3 is tonight's `max()` primed one beat early.

---

## Beat 2 — Forecast (1 minute)

Entry 28's forecast, read back, then what happened.

---

## Beat 3 — The hook (6 minutes)

Start from last session's crash, which they caused themselves:

> **"Last week `remove` blew up because the thing was not there. How would you check first?"**

Some of them will already have `in`, because practice 4's task 3 handed it to them. Good —
have them explain it to you.

```python
"torch" in inventory        # True or False, and it never crashes
```

Then the second half, and it should be sold as a refund rather than as new material:

> **"In Area 1 you wrote six lines to find the biggest number. Watch."**

```python
max(heights)
```

Then say the thing that stops this feeling like a cheat: **they are not being handed a magic
word, they are being handed the six lines they already wrote.** Knowing the long way first
is what makes the short way mean anything, and `p5e2` has both side by side for exactly that
reason.

---

## Beat 4 — The work (30 minutes)

### `p5e1_do_i_have_enough.py` — `in`, and the crash that stops happening

Walks a list of needed things against a list of carried things. Task 4 sends them back to
`p4e2_the_missing_pickaxe.py` to guard its deliberate crash with `in` — **fixing a file that
was written to be broken**, which is a good feeling and makes the two sessions one thing.

Task 3 shows `in` working on a string, `"or" in "torch"`. Worth thirty seconds, not more.

### `p5e2_the_tallest_tower.py` — one idea, asked in both directions

`min` and `max` share a file because they are the same question. The long-way loop is
printed underneath so the two can be compared directly.

Task 1 is the good one: *why `tallest = heights[0]` and not `tallest = 0`?* Make them find a
list where starting at zero gives the wrong answer. All-negative heights does it.

**Note the `# noqa` in this file.** Ruff would rewrite the teaching loop into `max()`, which
would use the answer to demonstrate not needing the answer. The comment explains it. If a
learner asks what it is, that is a good two-minute conversation about tools being right in
general and wrong in particular.

### `p5e3_tidy_it_up.py` — the two sorts, settled

`sorted()` versus `.sort()`, side by side, after practice 3 introduced the trap. The question
that picks between them is not which is better but **do I still need the original order?**

Task 3 — `sorted(["10", "9", "2"])` — is the classic surprise and they should predict before
running.

---

## Beat 5 — Choice board (in the work time)

- **The shopping list.** Print only what is missing, using `not in`.
- **Count the missing.** The Area 1 accumulator, doing a real job.
- **Highest and lowest, with names.** Given towers and their heights, print which tower is
  tallest, not just how tall.
- **Sort by the other thing.** Sort a list of words by length instead of alphabetically.
  This needs something they have not been taught; let them find it or let it go.
- **Something else**, with a prediction first.

---

## Beat 6 — Journal (5 minutes)

Tonight's addition: **when would you use `sorted()` and when would you use `.sort()`?** One
line each. If they answer in terms of *keeping the original order* rather than in terms of
syntax, they have understood it.

---

## Where they will stall

See `dm-guide.md` §4. The predicted three:

1. **`sorted(x)` versus `x.sort()`.** *"One hands you a new list and leaves yours alone. The
   other rearranges yours and hands back nothing. Which did you just use, and which did you
   want?"*
2. **`min` on a mixed list.** *"What would it even mean for a word to be smaller than a
   number?"*
3. **`in` feels too easy and they distrust it.** It is that easy. Point at last session's
   crash and let that be the argument.

---

## What you may not say

**Do not skip the long-way loop in `p5e2` for time.** Deleting it turns `max()` from a
refund into a magic word, and the whole reason this session is cheap is that they already
did the expensive version in Area 1.

---

## Success condition

They reach for `in` before removing something, without being told, and they can say what
`max()` is doing in terms of the loop they wrote in Area 1.
