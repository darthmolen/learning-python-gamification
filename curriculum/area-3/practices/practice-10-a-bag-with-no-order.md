# Practice 10 — A Bag With No Order

**Concepts:** `set` · `list`, `dict`, `tuple`, `in`, `len`, `iteration`, `nesting`,
`sorted` resurfacing
**Files:** `practices/practice-10/`
**Journal:** entry 34

The third and last collection, and the smallest idea of the three: **no duplicates, no
order.**

That is genuinely all of it. A set is easier than a list and much easier than a dict, and
the difficulty is not the syntax — it is knowing when the question you have is a set
question. Tonight teaches the shape; practice 11 is where it earns its place.

The DC band steps up here — practices 10 to 13 sit at 18–22 — not because sets are hard but
because from now on **they choose the collection instead of being given one.**

---

## Beat 1 — Invasion (3 minutes)

1. What does `.items()` give you?
2. What does `.get("x", 0)` do that `["x"]` does not?
3. What is a tuple, and why would you want one?

Question 3 is needed tonight: a set can only hold things that cannot change, and `p10e2`
puts tuples in one.

---

## Beat 2 — Forecast (1 minute)

Entry 33's forecast, read back, then what happened.

---

## Beat 3 — The hook (6 minutes)

Write it and let it be strange:

```python
palette = {"stone", "stone", "dirt"}
print(palette)
```

> **"How many things are in that?"**

Three, they will say. It is two. **The duplicate was not rejected and did not raise anything
— it was simply never a second thing.**

Then the question that makes it useful rather than a curiosity:

> **"You are walking through a world of thirty thousand blocks. How do you answer 'which
> kinds have I seen?'"**

With a list, you check `if block in seen` and the list walks itself every time. With a set,
it does not. On three items that is nothing. On thirty thousand it is the program.

One wrinkle to hand them before they trip: `set()` is an empty set; `{}` is an empty dict,
because dicts got the curly brackets first.

---

## Beat 4 — The work (30 minutes)

### `p10e1_a_bag_with_no_order.py` — the property, then the job

Five items written, three held. Adding a duplicate changes nothing. Then the "seen before"
loop, and the one-word version — `set(world)` — that does the same thing.

**Task 2 matters more than it looks:** `set(world)` did in one word what the loop did in
five lines, so what can the loop still do that the word cannot? It can act on each *new*
kind as it is discovered. Knowing what you gave up for the shorter version is the difference
between using a tool and reaching for it.

Task 3 tries to put a list inside a set and fails. That error is the setup for `p10e2`.

**Note the `# noqa: B033`.** Ruff objects to a set literal repeating itself, and the repeats
are the demonstration. Worth showing them if they ask — a tool being right in general and
wrong about this one line is a real thing they will meet again.

### `p10e2_seen_it_before.py` — a set as memory, and blocks that build once

Now it does a job: remembering which coordinates have been built on, so nothing is placed
twice. Placing twice is not an error and looks identical — you just pay for it in startup
time, which is the block cap's currency.

**Task 3 is the session's best question.** Swap the tuple for a list and it fails: a set can
only hold things that cannot change. Ask *why that rule has to exist* — if the thing could
change after it went in, the set could not keep its promise about duplicates. That is the
first time this year that two ideas from different weeks have combined into a reason.

---

## Beat 5 — Choice board (in the work time)

- **The kinds in your world.** One line that lists every distinct block kind.
- **Both directions.** Which kinds are in world A and not world B?
- **Dedupe the pickups.** A list of pickups, and the distinct kinds, and the counts. Three
  shapes, one dataset.
- **A big floor, built once.** Use a set of coordinates to build a floor with a deliberate
  overlap, and print how many placements it saved.
- **Something else**, with a prediction first.

---

## Beat 6 — Journal (5 minutes)

Tonight's addition: **what question is a set the right answer to?** If they write something
like "which ones, when you do not care how many or in what order", that is exactly it.

---

## Where they will stall

See `dm-guide.md` §4. The predicted four:

1. **The set that did not keep its order.** *"What order did you expect? Where would a set
   have got that order from?"*
2. **`{}` made a dict.** *"Print its type. What did you get, and what did you want?"*
3. **A list inside a set fails.** *"A set promises no duplicates. If the thing inside it
   could change after it went in, could it still promise that?"*
4. **"Why not just use a list and check `in`?"** Right question. *"How many things does the
   list have to look at to answer that? How many does the set?"*

---

## What you may not say

**Do not lead with performance.** A set is not "the fast one" — it is the shape for *which
ones*. A learner who picks a set for speed picks it in places where order mattered and loses
the order. Speed is a consequence; the question shape is the reason.

---

## Success condition

They can say what a set is for in one sentence, and they know why a tuple can go in one and
a list cannot.
