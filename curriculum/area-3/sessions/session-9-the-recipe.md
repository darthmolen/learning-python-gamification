# Session 9 — The Recipe

**Concepts:** `dict-methods` · `dict`, `iteration`, `in`, `tuple`, `sorted`, `len`
resurfacing
**Files:** `sessions/session-9/`
**Journal:** entry 33

Last session made a dict. Tonight it gets walked, and the missing key stops being a crash.

Two ideas, and they pair naturally: **`.items()` gives you both halves at once**, and
**`.get()` lets absent be an answer rather than an error.**

**This is the strongest session in the area.** A recipe is the most honest dict there is —
a name and an amount, which is exactly what a dict is — and by the end of it they can answer
"can I build this" about real data. If one session in Area 3 is going to click, it is this
one.

**This session carries `a3-the-recipe`, DC 16.**

---

## Beat 1 — Invasion (3 minutes)

1. What does `recipe["coal"]` do if there is no coal?
2. What does looping a dict give you — keys, values, or both?
3. What shape is a coordinate, and why that shape?

Question 3 is planted: `.items()` hands back pairs, and a pair is a tuple.

---

## Beat 2 — Forecast (1 minute)

Entry 32's forecast, read back, then what happened.

---

## Beat 3 — The hook (6 minutes)

Start from the annoyance they already have. Last session's loop over a dict gave keys only,
and to get the amount they had to reach back in:

```python
for name in recipe:
    print(name, recipe[name])
```

Ask what is clumsy about that. Someone will see it: you already had the key, and you went
back to the dict to fetch something it could have handed you.

```python
for name, amount in recipe.items():
    print(name, amount)
```

**Two names on the left of the `in`.** That is new, and worth one sentence: `.items()` gives
out pairs, and this unpacks each pair into two names. Ask what a pair of exactly two things
is called — they met it in session 7.

Then the second idea, from last session's crash:

> **"How much diamond do you have?"**

`have["diamond"]` is a `KeyError`. But the honest answer is not an error. It is **zero**.

```python
have.get("diamond", 0)
```

---

## Beat 4 — The work (30 minutes)

### `s9e1_the_recipe.py` — `.keys()`, `.values()`, `.items()`

The three methods, then a total, then `sorted()` on a dict — which sorts the keys, and is a
small surprise worth letting land.

Task 3 asks them to sort by amount instead of by name. **It is genuinely hard and they are
told so.** It needs something they have not met. The goal is that they can say what makes it
awkward, not that they solve it.

### `s9e2_ask_without_crashing.py` — `.get()`, and which fix to use

Both fixes side by side: `if name in have` and `have.get(name, 0)`. They are not
interchangeable and choosing is the skill:

| Use | When |
|---|---|
| `have[name]` | a missing key means something is **wrong**, and you want to hear about it loudly |
| `have.get(name, 0)` | missing is an **ordinary answer** — how much coal in an empty inventory? Zero |

**Task 2 is the one that teaches the trap.** Delete the `, 0` and the program breaks three
lines later with a `TypeError` about `None`, somewhere that is not obviously this line's
fault. That is why the default is nearly always worth giving.

Task 4 asks for a single True or False: can this be built at all? That is the boss's core
question arriving four sessions early, and anyone who gets it has understood the area.

### The quest

`a3-the-recipe`, DC 16, `local-repo`. Brief lands in `exercises/the-recipe/BRIEF.md` with
the content items.

---

## Beat 5 — Choice board (in the work time)

- **The shopping list.** Print exactly what is short, and by how much.
- **Sum it up.** Total items in a recipe, using `sum()` on `.values()`.
- **Most of what?** The ingredient needed in the largest amount — the name, not the number.
- **Build it in blocks.** One tower per ingredient, height = amount. Back to `world`.
- **Something else**, with a prediction first.

---

## Beat 6 — Journal (5 minutes)

Tonight's addition: **when do you use `[...]` and when do you use `.get(...)`?** If the
answer is about whether missing is a mistake or a normal answer, they have it. If it is
about avoiding crashes, ask one more question — that is the half-understanding, and it leads
to `.get` everywhere and bugs that hide.

---

## Where they will stall

See `dm-guide.md` §4. The predicted four:

1. **`for name, amount in recipe:`** without `.items()`. The error is about unpacking and is
   not obvious. *"What does looping a dict give you? How many things is that, per go round?"*
2. **`.get` returning `None` and breaking later.** *"What did `.get` hand back? What did you
   then do with it?"*
3. **`.keys()` printed raw** looks strange — `dict_keys([...])`. *"It is not a list. Can you
   loop it? Can you index it? Try both."*
4. **Sorting by value (task 3).** Do not rescue this. *"What is `sorted` comparing when you
   hand it a dict?"*

---

## What you may not say

When they reach for `.get` everywhere after task 2: **do not let it pass without the
question.** `.get` with a default on a key that should always exist hides a broken recipe
book instead of reporting it. Ask: *"If the stick were missing from this recipe, would you
want to know?"*

---

## Success condition

They can walk a dict with `.items()` without being reminded, and they can say which of the
two lookups they want and why.
