"""A Bag With No Order — the third collection, and the smallest idea in it.

A set has **no duplicates** and **no order**. That is all of it.

    palette = {"stone", "stone", "dirt"}
    print(palette)          {'stone', 'dirt'}

The duplicate did not raise anything and was not rejected. It was simply never a
second thing. A set does not hold two of anything, ever.

Curly brackets, like a dict, but no colons -- just the items. The one wrinkle:

    empty = set()       an empty set
    empty = {}          an empty DICT, which is not the same thing

`{}` was taken by dicts first, so an empty set has to say its own name.

**What a set is for** is one question asked very fast: *have I already got this
one?* A list can answer it -- `if block in seen` -- but a list has to walk itself
to find out, and a set does not. On three items that difference is nothing. On
thirty thousand it is the whole program.

Run:  py -3.14 p10e1_a_bag_with_no_order.py
"""
# concepts: set, in, len, iteration, list, sorted, print, f-strings
# dc: 18
# expect: ok

# Ruff is right that a set literal should not repeat itself, and removing the
# repeats would delete the entire demonstration: five items written, three held.
# The duplicates are the lesson.
palette = {"stone", "stone", "dirt", "grass", "dirt"}  # noqa: B033 -- the repeats are the point

print(f"written with five items: {sorted(palette)}")
print(f"the set holds {len(palette)}")
print("the duplicates were never a second thing.")

print()
print("adding one that is already there changes nothing:")
palette.add("stone")
print(f"  {len(palette)} items, still")
palette.add("sand")
print(f"  after adding sand: {len(palette)} items")

print()
world = ["grass", "grass", "dirt", "stone", "grass", "sand", "dirt"]
print(f"a world of {len(world)} blocks: {world}")

seen = set()
for block in world:
    if block not in seen:
        seen.add(block)
        print(f"  new kind: {block}")

print(f"{len(seen)} different kinds in {len(world)} blocks")

print()
print("and the short way, which is the same question in one word:")
print(f"  set(world) -> {sorted(set(world))}")

print()
print(f"an empty set is {set()!r}, because {{}} was already taken by dicts")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Print `palette` on its own, twice, in the same program. Is the order the
#    same? Is it the order you typed? Should you rely on either?
#
# 2. `set(world)` did in one word what the loop did in five lines. Write down
#    what the loop can do that `set(world)` cannot -- there is something.
#
# 3. Try `palette.add(["stone"])` -- adding a LIST to a set. Read the error. It
#    is telling you something real about what a set can hold.
#
# 4. Turn a set back into a list, sorted. You now have three collections and
#    can move between all of them. Which one would you store an inventory in,
#    and why not the other two?
