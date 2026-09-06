# Session 3 — It Changes

**Concepts:** `mutation` · `list`, `list-methods`, `sorted`, `variables` resurfacing
**Files:** `sessions/session-3/`
**Journal:** entry 27

**This is the most important session in the first half of the area, and it looks like the
dullest.** Nothing crashes tonight. Nothing draws. Two names turn out to be one list, and
that is the entire hour.

It is scheduled third rather than ninth on purpose. Everything after tonight involves lists
being passed around, renamed and handed to things, and a learner who has not met aliasing
will eventually meet it as a mystery at the worst possible moment. Better here, on purpose,
with nothing else going on.

**Expect this session to feel flat while it is happening and to pay off three sessions
later.** That is normal and it is worth knowing in advance so you do not try to rescue it.

---

## Beat 1 — Invasion (3 minutes)

1. Where is the last item of a five-item list? Give both answers.
2. What does `len` count?
3. What is `total = total + 1` actually doing — changing a number, or making a new one?

Question 3 is tonight's whole lesson, asked before they know it is the lesson. Do not react
to whatever they say.

---

## Beat 2 — Forecast (1 minute)

Entry 26's forecast, read back, then what happened.

---

## Beat 3 — The hook (8 minutes)

Two lines on paper, and a question with money on it:

```python
inventory = ["torch", "bread"]
backpack = inventory
backpack.append("rope")
```

> **"How many things are in `inventory` now?"**

Almost everybody says two. Let them commit to it out loud — write the number down — and then
run it.

The follow-up is the one that does the teaching, and it must be asked in exactly this shape:

> **"How many lists are there? Not how many names. How many lists."**

One. There was only ever one. `backpack = inventory` did not make a copy; it made a second
label for a thing that already existed.

**Do not mention `copy()` or `[:]` in the hook.** The point is the surprise. The fix is
twelve minutes away and it means nothing until they have felt the problem.

---

## Beat 4 — The work (30 minutes)

### `s3e1_two_names_one_list.py` — the two names, watched

Prints both names after every step so the change is visible as it happens. Ends by showing
what a real copy looks like, `list(inventory)`, so they leave with the fix as well as the
problem.

Task 4 is the one to protect if time is short. It puts numbers beside lists:

```python
a = 5
b = a
b = b + 1
```

`a` is still 5. Ask why. The answer — `b = b + 1` makes a **new** number and puts it under
the old name, where `append` changes the **one list** that both names point at — is the
deepest idea in the first half of this area, and Invasion question 3 has already primed it.

### `s3e2_sort_hands_back_nothing.py` — the `None` that costs everybody an evening

`tidy = inventory.sort()` and `tidy` is `None`. Same underlying rule from the other side:
the list changed in place, so there was nothing to hand back.

Task 2 has them try the same trap with `append`. Once they see two methods behave the same
way, the rule generalizes without you stating it.

**`sorted()` appears here as the contrast and is properly taught in session 5.** Introduce
it as "the other name, which hands back a new list" and leave it there.

---

## Beat 5 — Choice board (in the work time)

- **Prove it both ways.** Change the list through each name in turn and show it works
  either direction.
- **Break the link.** Find three different ways to make a genuine copy.
- **The safe sort.** Sort a list for display while keeping the original order intact.
- **Which methods hand something back?** Try `append`, `remove`, `pop`, `sort`, `insert` and
  print what each one returns. Make a table.
- **Something else**, with a prediction first.

---

## Beat 6 — Journal (5 minutes)

**Tonight's entry is the one the DM guide asks for by name.** Prompt: *describe the moment
two names turned out to be one list, in your own words.*

It is the first thing this year that was true and invisible at the same time — no error, no
wrong picture, nothing red. Writing it down is what makes it recallable in Area 5 when
objects start getting passed around.

---

## Where they will stall

See `dm-guide.md` §4. The predicted three:

1. **`x = inventory.sort()` and now `x` is `None`.** *"What did `sort` hand back to you?
   Print it. Now print the inventory. Which one changed?"*
2. **Two names, one list — disbelief rather than confusion.** *"How many lists are there?
   Not how many names."*
3. **They expect `append` to hand back a new list.** Same family, same question.

---

## What you may not say

**Do not reach for `copy()` in the hook**, and do not reach for it in Beat 4 before they
have asked for it. A fix offered before the problem is felt turns the most memorable idea in
the area into a piece of syntax.

---

## Success condition

They can say, without help, that `backpack = inventory` makes a name and not a copy — and
they can say why `b = b + 1` does not behave the same way.
