# Session 12 — A Recipe Book

**Concepts:** `nested-structures` · `dict`, `dict-methods`, `list`, `tuple`, `indexing`,
`iteration`, `len`, `in`, `breakpoints` resurfacing
**Files:** `sessions/session-12/`
**Journal:** entry 36

Collections inside collections, which is what real data actually looks like — and which is
Boss 3's shape.

**This is the boss rehearsal.** A recipe book is a dict of dicts, the boss is a crafting
simulator with a real recipe book, and everything in tonight's second file is a thing they
will do next week under their own steam. Area 0 scheduled its session 6 the same way and the
DM guide said never to cut it. Same here.

Nothing new is really being introduced. A dict of dicts is a dict. Everything they know
about one level applies to both, and saying that out loud early stops it feeling like a new
topic.

---

## Beat 1 — Invasion (3 minutes)

1. List, dict or set — which one holds "the settings for a game"?
2. What does `.items()` hand back, per go round?
3. What does `p` do at a `(Pdb)` prompt?

Question 3 is deliberate: tonight is the first session where a breakpoint is genuinely the
fastest way out of confusion, and it was four sessions ago.

---

## Beat 2 — Forecast (1 minute)

Entry 35's forecast, read back, then what happened.

---

## Beat 3 — The hook (6 minutes)

Callback to session 8, task 3 — they were asked what shape would hold two recipes at once,
and told it was coming.

Put one recipe up:

```python
torch = {"stick": 1, "coal": 1}
```

> **"Now hold twenty of them, and look one up by name."**

They have both halves already. A dict looks things up by name; the thing being looked up is
a dict.

```python
book = {
    "torch":   {"stick": 1, "coal": 1},
    "pickaxe": {"stick": 2, "plank": 3},
}
book["torch"]["coal"]
```

**Read it left to right and say each step out loud.** `book["torch"]` hands you a dict.
`["coal"]` reaches into that one. Each bracket is one step inward, and there is no limit
except patience.

Then the habit that makes the rest of the session possible, given in advance because they
will need it within ten minutes:

> **"When you cannot see what you are holding — print the middle."**

Not the whole thing, which is a wall of text. Not the end, which is what failed. The step in
between, which is the one you were wrong about.

---

## Beat 4 — The work (30 minutes)

### `s12e1_a_recipe_book.py` — the shape, and what you can build

A book of three recipes, walked at both levels, and then the buildable check against an
inventory.

Task 2 adds a fourth recipe and asks whether any loop had to change. **Nothing does**, and
that is the argument for the shape rather than for twenty separate variables.

Task 3 rewrites the buildable flag to stop early. That is a `break`, which is Area 1
vocabulary getting a real use, and it is the first time this area has cared about doing
less work rather than getting the right answer.

### `s12e2_print_the_middle.py` — the habit, done deliberately

Walks four levels down into a structure, printing what each step holds *and what type it
is*. That is exactly what a person should do by hand when lost, done slowly enough to copy.

**Task 1 is the one to insist on.** Cover the output and predict `type(step2).__name__`
before looking. Getting it wrong is normal and is precisely why the habit exists.

Task 2 asks for `world["chests"]["mine"]` — reaching for a chest by name when chests are in
a list. The error is confusing; printing the middle makes it obvious. That is the session in
one task.

Task 3 reshapes chests from a list into a dict and asks what was lost. **The order.** That
is session 11's judgment applied to their own data, and anyone who answers it well is ready
for the boss.

---

## Beat 5 — Choice board (in the work time)

- **The full crafting check.** Every recipe, against one inventory, printing what is short.
- **Deepest lookup.** Build something four levels deep and reach the bottom of it.
- **The shopping list for two.** What do you need to build a torch *and* a pickaxe?
- **A world in a dict.** Chests, coordinates and contents, then build it with `world`.
- **Something else**, with a prediction first.

---

## Beat 6 — Journal (5 minutes)

Tonight's addition, and it is the boss prompt in disguise: **describe the shape of a recipe
book in your own words, without using the word dict twice.**

Then, per the DM guide, **reread the whole area's entries before the next session.** §5.6
asks for it before every boss, and this is the one where it pays — entry 35 has their own
sentence about how to choose a collection, and Boss 3 is that judgment applied for an hour.

---

## Where they will stall

See `dm-guide.md` §4. The predicted four:

1. **One bracket too few or too many.** *"What did the first bracket hand you? Print just
   that."*
2. **`KeyError` at the second level, read as an error at the first.** *"Which bracket
   failed? How can you tell from the message?"*
3. **A list indexed by name.** *"What kind of thing is `world['chests']`? What do you index
   one of those with?"*
4. **Losing the thread entirely.** This is the one to answer with the tool: *"Set a
   breakpoint on that line and look at it."* Four sessions ago that would have been a new
   idea. Tonight it is the answer.

---

## What you may not say

When the nesting confuses them: **do not read the structure aloud for them.** Say "print the
middle" and wait. The whole session is the transfer of one habit, and doing it for them is
the one way to guarantee it does not transfer.

---

## Success condition

They can reach two levels into a structure they did not write, and when they cannot, they
print the middle without being told.
