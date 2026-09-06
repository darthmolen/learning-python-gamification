# Session 2 — The Inventory

**Concepts:** `indexing`, `len` · `list`, `iteration`, `for`, `range`, `reading-errors`
resurfacing
**Files:** `sessions/session-2/`
**Journal:** entry 26

Last session a list was something to walk through. Tonight it is something to reach into.

The whole session is one rule and its consequence: **positions start at zero, so the last
one is `len(x) - 1`.** They already half-know it — `range(4)` has been giving them 0, 1, 2, 3
since Area 1 — and tonight is where that rule stops being about `range` and starts being
about everything.

**This session carries the area's first quest**, `a3-the-inventory`, DC 10.

---

## Beat 1 — Invasion (3 minutes)

1. What does `len` give you — the last position, or how many things there are?
2. Say the numbers `range(3)` produces.
3. What did commenting out `start()` do last session, and why?

Question 1 is tonight's trap stated as a question. Expect a wrong answer, do not correct it,
and let the session answer it.

---

## Beat 2 — Forecast (1 minute)

Entry 25's forecast, read back, then what happened.

---

## Beat 3 — The hook (6 minutes)

Put five things in a list on paper and number the slots **with them**, out loud, starting at
zero. Make them say the number of the last slot.

Then ask the question the session turns on:

> **"There are five things. What is the number of the last one?"**

Four. Not five. Write both numbers down where they can see them, because in about ten
minutes they are going to type `inventory[5]` and the two numbers on the paper are what make
the error make sense instead of feeling arbitrary.

Then offer the useful shortcut as a *problem* rather than a rule:

> "Give me the last thing in the list — but you are not allowed to know how long it is."

`inventory[-1]`. Sell it as convenience, not as a new concept.

---

## Beat 4 — The work (30 minutes)

### `s2e1_the_inventory.py` — positions, both directions

Indexing forwards, indexing backwards, `len`, and the long way of getting the last item so
that `-1` has something to be shorter than.

Task 2 has them print `inventory[5]` deliberately. Task 3 asks them to predict what
`inventory[-5]` and `inventory[-6]` do **before** trying — negative indexing has exactly the
same edges as positive, counted from the other side, and almost nobody states that until
they are asked to.

Task 4 is the one worth the most conversation: rewrite the `range(len(...))` loop as a plain
`for thing in inventory:` loop, then say which is easier to read and which one could tell
you the slot number. There is no single right answer and they should not be given one.

### `s2e2_off_by_one.py` — the crash, on purpose

`inventory[len(inventory)]`, which is always wrong and always `IndexError`. It exists so
they meet this failure in a file built for it rather than in their own work.

Task 4 sends them to `inventory[0]` on an empty list. Worth the detour — it is the same
error for a reason that feels different.

### The quest

`a3-the-inventory`, DC 10, `local-repo`. Tests run against their own repository, so this is
the first Area 3 thing that has to be committed and pushed. The brief is not written yet;
when it lands it goes in `exercises/the-inventory/BRIEF.md`.

---

## Beat 5 — Choice board (in the work time)

- **A hotbar preview.** Print slots 0 to 8 with their numbers, nicely lined up.
- **Reverse it.** Print the inventory backwards using negative indexes only.
- **The middle one.** Print the middle item of any odd-length list. What about even?
- **Blocks by position.** Back to `world`: place a block for each item, using the slot
  number as the x coordinate.
- **Something else**, as long as they predict the output first.

---

## Beat 6 — Journal (5 minutes)

Tonight's addition: **write the rule for finding the last slot, in your own words, with an
example.** They will need it again in session 6 and having written it once is what makes the
third encounter with the stopping rule the last one.

---

## Where they will stall

See `dm-guide.md` §4. The predicted three:

1. **`inventory[3]` on a three-item list.** *"Read the error out loud. Now count the slots on
   your fingers, starting at zero. Which number is the last one?"*
2. **`len()` used as the last index.** *"If there are three things and the first is at zero,
   where is the third?"*
3. **Negative indexing looks like a trick.** Do not defend it. Give them the problem — *"the
   last thing, without knowing how long the list is"* — and let it be the answer.

---

## What you may not say

When they are one character from a working line: **do not read their list back to them.**
`print(len(...))` is always available and it is theirs to type. Reading their own data back
to themselves is the skill this whole area is teaching.

---

## Success condition

They can say where the last item is, in two ways, and explain why `inventory[len(inventory)]`
can never work.
