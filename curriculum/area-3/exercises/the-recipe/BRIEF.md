# The Recipe

A list can tell you what you are carrying. It cannot tell you how much of it. This one
answers the question you actually have: **can I build this thing, and if not, what am I
short?**

## What it must do

Build this at the top of your repository:

```
the-recipe/
    recipe.py
    NOTES.md
```

**`recipe.py` holds two dicts** — what a thing needs, and what you have — and prints:

```
recipe: stick=2, coal=1, flint=1
have: stick=5, coal=2
short: flint=1
can build: no
```

1. **`recipe:`** — every ingredient and its amount, `name=amount`, comma-separated.
2. **`have:`** — the same shape, for your inventory.
3. **`short:`** — every ingredient you do not have enough of, and **by how much**. If you
   are short of nothing, print `short:` and nothing after it.
4. **`can build: yes`** or **`can build: no`**.

## The rule this quest is actually about

**At least one ingredient in the recipe must be missing from `have` entirely** — not set to
zero, absent.

That is the whole quest. `have["flint"]` on a dict with no flint is a `KeyError`, and the
program stops. But *not having any flint* is not an error; it is an ordinary answer, and the
answer is zero.

Which of the two you reach for is the decision:

| | when |
|---|---|
| `have[name]` | a missing key means something has gone **wrong**, and you want to hear about it |
| `have.get(name, 0)` | missing is a **normal answer** — how much coal is in an empty bag? |

**Give `.get` a default.** `have.get("flint")` hands back `None`, and `None` does arithmetic
with nothing at all; the crash arrives three lines later, somewhere that will not look like
this line's fault.

## When you are done

Add enough of the missing thing to `have` and run it again. `short:` should empty and
`can build:` should flip — with you having edited only the inventory.

## `NOTES.md`

Three real sentences, in your own words:

- when you would use `have[name]` and when `have.get(name, 0)`, in terms of what a missing
  key *means* rather than which one crashes
- what `.get` hands back when you leave the default off, and where that bites
- what `for name, amount in recipe.items():` gives you that looping the dict plainly does not

## The tools you need

- `dict`
- `dict-methods`
- `in`
- `iteration`

## Anything clever will fail this

`short:` and `can build:` must both follow from the two dicts. A program that prints the
right answer for the inventory it was born with, and the same answer after you change it, is
not answering — it is remembering.

## When you are stuck

Print `have.get(name, 0)` for every name in the recipe, on its own, before you try to work
out what you are short of. Four numbers on four lines will show you which one is the
surprise.
