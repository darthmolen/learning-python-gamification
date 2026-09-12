---
audience: dm
---

# Practice 4 — Pick It Up

**Concepts:** `list-methods` · `mutation`, `list`, `indexing`, `iteration`,
`reading-errors` resurfacing
**Files:** `practices/practice-4/`
**Journal:** entry 28

An inventory that cannot gain and lose things is not an inventory. Tonight it becomes one.

Five methods — `append`, `insert`, `remove`, `pop`, and `sort` from last session — and the
whole difficulty is that two of them look alike and are not: **`remove` takes a value,
`pop` takes a position.**

Last session established that these methods change the list in place. Tonight gives them
something to do, which is the right order: practice 3 named the behavior, practice 4 uses it.

**This session carries `a3-pick-it-up`, DC 12.**

---

## Beat 1 — Invasion (3 minutes)

1. What does `inventory.sort()` hand back?
2. `backpack = inventory`. How many lists?
3. What does `range(2, 5)` give you?

Question 3 is planted for practice 6 and has nothing to do with tonight. That is rule 3 of
the invasion selection — retrieval immediately before use is the cheapest kind, and slicing
is two sessions away.

---

## Beat 2 — Forecast (1 minute)

Entry 27's forecast, read back, then what happened.

---

## Beat 3 — The hook (6 minutes)

Two lines on the board, and one question:

```python
inventory.remove(0)
inventory.pop(0)
```

> **"One of those takes a position and one takes a value. Which is which, and what does the
> other one do with a `0`?"**

Let them argue. `remove(0)` looks for the *value* zero, does not find it, and raises
`ValueError`. `pop(0)` takes the item in slot 0. Both are legal lines and only one does what
someone reaching for "get rid of the first thing" meant.

Then the difference that matters more than it looks:

> **"Which of these hands the thing back to you?"**

`pop` does. `remove` does not. So `pop` is what you want when you are taking something out
*in order to use it* — which is most of the time in a game.

---

## Beat 4 — The work (30 minutes)

### `p4e1_pick_it_up.py` — the five orders, one after another

Prints the list after every operation, so the effect of each is visible rather than
inferred.

Task 1 asks what `inventory.remove(0)` would try to do, in English, before running it. Task
2 revisits the `None` trap with `append` — third encounter, and it should be getting boring,
which is the goal.

**Task 4 is the session's real content and it is the last one on purpose.** Removing every
item with a `for` loop:

```python
for thing in inventory:
    inventory.remove(thing)
```

It does not crash. It does not empty the list. It skips every other item, because the loop
is walking positions while the list is getting shorter underneath it. Printing the list at
the top of each pass is what makes it visible.

This is the area's **second** silent failure, after practice 3's aliasing, and it is worth
ten minutes even if it costs the choice board.

### `p4e2_the_missing_pickaxe.py` — `ValueError`, on purpose

`remove` on something that is not there. The interesting detail is that the program got
*partway* — the first `remove` worked and printed — so they should be able to say what state
the inventory was in when it stopped.

Task 3 guards it with `if "pickaxe" in inventory:`. **`in` is practice 5's material arriving
one session early because they asked for it.** Let it. A concept that arrives because the
learner needed it is worth three that arrive on schedule.

### The quest

`a3-pick-it-up`, DC 12, `local-repo`. Brief lands in `exercises/pick-it-up/BRIEF.md` when
the content items are authored.

---

## Beat 5 — Choice board (in the work time)

- **Empty it safely.** Empty the inventory one item at a time with `pop()`, printing each.
  Then do it from the front.
- **A swap.** Swap the items in slots 0 and 1 without losing either.
- **Drop the heaviest.** Given a matching list of weights, remove the heaviest thing.
- **Fix the broken loop.** Task 4's loop, made to actually work. There are at least three
  ways and one of them is a slice.
- **Something else**, with a prediction first.

---

## Beat 6 — Journal (5 minutes)

Tonight's addition: **what is the difference between `remove` and `pop`?** One sentence
each. If they write "one takes a value and one takes a position" they have it.

---

## Where they will stall

See `dm-guide.md` §4. The predicted three:

1. **`remove()` on something absent.** *"What does the error say it was looking for? Is it in
   the list? How would you check before asking?"*
2. **`pop` and `remove` mixed up.** *"Say what each of those two lines does, in English,
   before you run either."*
3. **Mutating while iterating.** *"Print the list at the top of every go round. Watch where
   the loop thinks it is."*

---

## What you may not say

When they hit the broken loop in task 4: **do not explain it.** Tell them to print the list
at the top of every pass and then be quiet. The output explains it better than any sentence
you have, and this is the second of the two silent failures this area is built around.

---

## Success condition

They can add and remove things from a list on purpose, and they have seen a loop quietly do
the wrong thing without crashing.
