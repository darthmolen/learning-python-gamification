# Collections

Areas 0 and 1 drew pictures; Area 2 got you out of the sandbox. This is where the subject
becomes something you actually care about,
because **an inventory is a list, a crafting recipe is a dict, and a block palette is a
set.** The mapping is not a metaphor. It is what those things are.

## A [[list]] is things in order

```python
inventory = ["dirt", "stone", "torch"]
print(inventory[0])      # dirt
print(len(inventory))    # 3
```

Square brackets make one. `len` counts it. **Indexing starts at zero**, which is the same
habit `range(4)` taught you in Area 1 — the first thing is at 0, so the last thing in a
list of three is at 2.

`inventory[3]` is an `IndexError`. That is not the list being unhelpful; it is the list
refusing to invent a slot you never filled.

Negative indexes count from the end, which is more useful than it sounds:

```python
print(inventory[-1])     # torch — the last thing, without knowing how long the list is
```

### Slicing takes a piece

```python
print(inventory[0:2])    # ['dirt', 'stone']
print(inventory[:2])     # the same — from the start
print(inventory[1:])     # ['stone', 'torch'] — to the end
```

**A slice stops before its second number**, exactly like `range`. `[0:2]` gives you two
things, not three. This is the same rule in a third place, and by now it should stop
surprising you.

### Lists change

```python
inventory.append("plank")     # add to the end
inventory.remove("dirt")      # take one out by name
inventory[0] = "cobblestone"  # replace what is at a position
inventory.sort()              # rearrange, in place
```

A list is **mutable** — it can be changed after it is made. That sounds obvious until you
meet a tuple.

```python
spawn = (128, 64, 128)
spawn[0] = 0        # TypeError: 'tuple' object does not support item assignment
```

A tuple is a list that cannot change. Round brackets instead of square. You use one when
the *shape* is the meaning: a coordinate is always three numbers, and a coordinate that
could grow a fourth would be a bug rather than a feature.

## A [[dict]] is things by name

A list answers "what is at position 3?". A dict answers "what is the recipe for a torch?",
which is the question you actually have.

```python
recipe = {"stick": 1, "coal": 1}
print(recipe["coal"])        # 1
recipe["stick"] = 2          # change it
recipe["flint"] = 1          # add a new one
```

Curly brackets, and `key: value` pairs. The key is how you look it up; the value is what
you get back.

`recipe["diamond"]` on a key that is not there is a `KeyError`. When you are not sure,
ask:

```python
if "coal" in recipe:
    print("we can make a torch")

print(recipe.get("diamond", 0))    # 0 rather than an error
```

`.get` with a second argument is the polite version: *give me this, or this default if it
is missing.*

### Walking a dict

```python
for item, count in recipe.items():
    print(f"{count} x {item}")
```

`.items()` hands you both halves at once. `.keys()` and `.values()` give you one each,
when only one is what you need.

## A [[set]] is things without duplicates

```python
palette = {"stone", "stone", "dirt"}
print(palette)         # {'stone', 'dirt'} — the duplicate is gone
```

A set has no order and no duplicates. That is the whole idea, and it makes one question
very fast: **have I seen this before?**

```python
seen = set()
for block in world:
    if block not in seen:
        seen.add(block)
        print("new block:", block)
```

Two sets can be compared, which is where the power is:

```python
have = {"stick", "coal"}
need = {"stick", "coal", "flint"}
print(need - have)     # {'flint'} — what is missing
```

## `in`, `len`, `sorted`, `min`, `max`

These four work on all of them, which is what makes collections feel like one idea rather
than three:

```python
len(inventory)          # how many
"coal" in recipe        # is it there — checks keys, for a dict
sorted(inventory)       # a new sorted list; the original is untouched
min(counts), max(counts)
```

Note that `sorted()` **returns a new list** and `list.sort()` **changes the one you have**.
Two ways to do it, and picking the wrong one is a bug you will write at least once.

## [[nested-structures|Collections inside collections]]

This is where it gets real, and where it gets confusing:

```python
chest = {
    "row1": ["dirt", "stone"],
    "row2": ["torch", "torch"],
}
print(chest["row2"][0])     # torch
```

Read it left to right. `chest["row2"]` gives you a list; `[0]` takes the first thing from
that list. Each bracket is one step inward.

**When a nested structure confuses you, print the middle.** Not the whole thing, and not
the end — the middle:

```python
print(chest["row2"])        # ['torch', 'torch'] — now the next step is obvious
```

## [[breakpoints|Breakpoints]]

By now `print` is not enough, and this is the point in the year where you stop guessing.

A breakpoint pauses your program on a line and lets you look at everything that exists at
that moment.

```python
breakpoint()
```

Put that on a line and run the program. It stops there and gives you a prompt. Type the
name of any variable to see it. Type `c` to continue, `n` to run the next line, `q` to
quit.

**This replaces about half the `print` statements you have written this year.** The other
half are still worth writing.

## What you should be able to do by the end

- Say which of list, dict and set fits a problem, and why the other two do not
- Index and slice a list, and explain why `[0:2]` gives two things
- Say what mutable means, and why a coordinate is a tuple
- Look up a dict key safely, and walk one with `.items()`
- Use a set to answer "have I seen this?" and "what is missing?"
- Reach two levels into a nested structure, and print the middle when you cannot
- Stop a program on a line and look at what is actually there
