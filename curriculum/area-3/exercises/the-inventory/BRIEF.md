# The Inventory

You have been reading lists all week. This one has to read itself back, and it has to still
be right when you change what is in it.

## What it must do

Build this at the top of your repository. The names matter, because a machine is going to
look for them.

```
the-inventory/
    inventory.py
    NOTES.md
```

**`inventory.py` holds a list of at least five things** and prints exactly this shape:

```
carrying: 5
first: torch
last: flint
  0: torch
  1: bread
  2: rope
  3: pickaxe
  4: flint
```

Line by line:

1. **`carrying: N`** — how many things there are. Ask the list; do not type the number.
2. **`first: <thing>`** — the thing in the first slot.
3. **`last: <thing>`** — the thing in the last slot.
4. **One line per slot**, numbered from **0**, two spaces in front, in the order they are in
   the list.

It may print other things before or after. It has to exit cleanly.

## The rule this quest is actually about

**Nothing above may be typed out by hand.** Not the count, not the first, not the last, not
the slot numbers.

That is not a style preference and it is the whole quest. Here is the test:

> **Add a sixth thing to the list. Change nothing else. Run it again.**

If `carrying:` still says 5, or `last:` still names the old last thing, or the numbering
stops at 4 — you typed something you should have asked for. The program was describing a
list it was no longer looking at.

## When you are done

Run it. Add something. Run it again. Remove two things. Run it again. Every line should
follow, every time, with you having edited only the list.

## `NOTES.md`

Three real sentences, in your own words:

- where the last slot is, and why it is not the same as how many things there are
- one thing you tried that printed the wrong number, and what it was
- what `inventory[-1]` does, and when you would reach for it instead

## The tools you need

- `list`
- `indexing`
- `len`
- `iteration`

## Anything clever will fail this

Five prints in a row pass nothing. The list is what is being read, and a program that only
happens to agree with it today is the bug this quest exists to catch.

## When you are stuck

There are five things and the last one is in slot 4. Write both numbers down and look at
them. Which of the two does `len` give you, and what do you have to do to the other one?

If the slot numbers are the problem: you have walked a list before. What did `range` give
you when you asked it for four?
