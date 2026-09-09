# Boss 3 — The Crafting Table

**No scaffolding, no starter, no hints, and Socratic questions only** (§5.3). A blank file,
this specification, and one evening.

Spec §4 names this one: **a working crafting simulator with a real recipe book.**

Pick one of the framings below. They differ in the words and in nothing else; the program
underneath is the same, and choosing which words to work in is yours.

## The framings

- **The Crafting Table** — planks, sticks and torches, and a book of what makes what.
- **The Alchemist's Bench** — reagents and philtres, and a grimoire instead of a book.
- **The Forge** — ore, ingots and tools, and a smith who knows what each one costs.

## What makes this different from every quest so far

Every quest in this area printed an answer and stopped. **This one keeps its state and
answers again.** You will take a command, change what you are holding, and be asked another
question about the thing you just changed.

That is the whole step up, and it is why this is worth 24. There is no new syntax in it.
There is one data shape you have to hold in your head across an entire file.

## What it must do

At the top of your repository:

```
the-crafting-table/
    craft.py
    NOTES.md
```

`craft.py` **reads commands from standard input, one per line**, and answers each on its own
line. It stops on `quit`, or when the input runs out, and exits cleanly.

### The recipe book

**At least three recipes**, and it is a **dict of dicts** — each item's name mapped to what
that item needs.

At the start, **at least one recipe must be craftable and at least one must not be.** If
everything is affordable, nothing about refusing is ever tested; if nothing is, nothing about
crafting is.

### The five commands

| You type | It answers |
|---|---|
| `recipes` | `recipes: torch, pickaxe, chest` |
| `recipe torch` | `recipe torch: stick=1, coal=1` |
| `have` | `have: stick=4, coal=2, plank=8` |
| `can torch` | `can torch: yes` — or `can torch: no, short coal=1` |
| `craft torch` | see below |
| `quit` | stops |

**`craft` is the one with consequences.** When you can afford it:

```
crafted torch
have: coal=1, plank=8, stick=3, torch=1
```

The ingredients are **gone**, spent exactly as the recipe says, and the item you made is
**in your inventory** — one more of it than before.

When you cannot:

```
cannot craft pickaxe: short plank=1
```

And **nothing changes.** Not one ingredient is spent on a craft that failed. That is the
line most people get wrong, and it is the line this fight is really about.

An empty inventory prints `have:` and nothing after it.

## Where it will go wrong

Three, and you will meet at least two:

1. **Half-spending.** You take the ingredients as you check them, discover partway that one
   is short, and stop — with the earlier ones already gone. Check first. Spend after.
2. **Crafting from a stale copy.** You work out what you can afford once and answer from that
   forever, so the second `craft` succeeds against an inventory that no longer exists.
3. **Crafting something twice** when you only had ingredients for one. Run it and see.

## When you are done

The bar is not that it works once. It is:

- craft the same thing twice in a row, and the second attempt refuses honestly
- craft something you cannot afford, then `have` — and nothing has moved
- craft something affordable, then `can` it again — and the answer has changed

## `NOTES.md`

Four real sentences:

- what shape your recipe book is, said as a sentence, and why not a list
- what you check before spending anything, and what happens if you spend as you check
- one thing that worked the first time and failed the second, and why
- which of `[...]` and `.get(...)` you used for the inventory, and what a missing key means
  in your program

## How it is judged

`local-repo` — the tests run against your repository. But §5.3 binds every boss and this one
too: **it must run from a clean clone on somebody else's machine.** Push it, then have
somebody clone it into a folder that has never seen your code and drive it themselves.

They will type things you did not think of. That is the point.

## Scars

Unlimited attempts. Every failed one is recorded and displayed with pride (§5.3). A boss
beaten on the fourth go is worth exactly as much as one beaten on the first, and the record
of the three failures is the more interesting half.

## Before you start

Reread your Journal from the beginning of this area — §5.6 puts that here on purpose. Your
entry from practice 11 has your own sentence about how to choose between a list, a dict and
a set. Tonight is an hour of that judgment, and you wrote the note to yourself.
