# The Hotbar

Your hotbar is the first nine slots of your inventory. Everything else is in the bag. Both
halves have to come out of the same list, and both have to be right when the list changes.

## What it must do

Build this at the top of your repository:

```
the-hotbar/
    hotbar.py
    NOTES.md
```

**`hotbar.py` holds a list of at least twelve things** and prints three lines:

```
all: torch, bread, rope, pickaxe, flint, apple, plank, coal, shovel, bucket, map, key
hotbar: torch, bread, rope, pickaxe, flint, apple, plank, coal, shovel
rest: bucket, map, key
```

1. **`all:`** — everything, in order, comma-separated.
2. **`hotbar:`** — the first **nine**.
3. **`rest:`** — everything after them.

An empty half prints its label and nothing after it.

## The rule this quest is actually about

**Nine.** Not ten.

`inventory[0:9]` gives you nine things — slots 0 to 8 — because a slice stops *before* its
second number. You have met that rule twice already: `range(9)` gives nine numbers, and
`range(2, 5)` gives three. This is the third time and it is meant to be the last.

Two things a machine will check, and you can check both yourself:

- **`hotbar` and `rest` together must be `all`**, in that order, with nothing lost and
  nothing duplicated.
- **Add three more things to the list and run it again.** `hotbar:` must still be the same
  nine. `rest:` must grow by three. If `rest:` stays put, it was typed.

## When you are done

Take items away until there are fewer than nine. `hotbar:` should hold all of them and
`rest:` should be empty — and neither line should need you to change anything for that to be
true. A slice past the end does not crash; that is the whole reason this works.

## `NOTES.md`

Three real sentences, in your own words:

- why `[0:9]` gives nine things, said as a rule rather than as a fact about nine
- what `inventory[9:]` gives you when there are only three things in the list
- the difference between `spare = inventory[:]` and `spare = inventory`

## The tools you need

- `slicing`
- `indexing`
- `len`
- `list`

## Anything clever will fail this

Two lists typed out separately will pass a glance and fail the first edit. There is one
list here, and the other two lines are views of it.

## When you are stuck

Print `len(hotbar)` and `len(rest)` and add them together. If the total is not `len(all)`,
one of your two numbers is wrong — and the one that is wrong is almost always the one you
were most sure about.
