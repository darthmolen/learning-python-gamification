"""Sort Hands Back Nothing — the None that costs everybody one evening.

Here is a line that looks completely reasonable and is completely wrong:

    tidy = inventory.sort()

`sort()` rearranges the list you already have. It does not build a new one, and
it does not hand one back. So `tidy` ends up holding `None`, which is Python's
word for nothing at all.

**Most list methods work this way.** `append`, `remove`, `insert`, `sort` and
`reverse` all change the list and hand back nothing. The rule underneath is the
one from the last file: a list is changed in place rather than replaced.

There is a second name that does the other thing, and having both is the point:

    sorted(inventory)     hands back a NEW sorted list, original untouched
    inventory.sort()      rearranges yours, hands back nothing

Two ways to do it, and picking the wrong one is a bug you will write at least
once. This file is that once.

Run:  py -3.14 p3e2_sort_hands_back_nothing.py
"""
# concepts: list, mutation, list-methods, sorted, variables, print, f-strings
# dc: 12
# expect: ok

inventory = ["torch", "bread", "rope", "apple"]

print(f"starting out: {inventory}")

print()
print("the wrong way -- catching what sort() hands back:")
tidy = inventory.sort()
print(f"  tidy      -> {tidy}")
print(f"  inventory -> {inventory}")
print("  the list DID get sorted. `tidy` just is not it.")

print()
inventory = ["torch", "bread", "rope", "apple"]
print(f"back to the start: {inventory}")

print()
print("the other name, which hands back a new list:")
tidy = sorted(inventory)
print(f"  tidy      -> {tidy}")
print(f"  inventory -> {inventory}")
print("  this time the original is untouched, and `tidy` is a real list.")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Print `type(None)` and `type([])`. One of them is a list. Which one did
#    `inventory.sort()` hand you?
#
# 2. Try `tidy = inventory.append("flint")` and print `tidy`. Same trap, second
#    method. How many of the list methods do you think behave this way?
#
# 3. You want the list sorted AND the original kept. Which of the two names do
#    you use? Write the line.
#
# 4. `sorted()` works on words. What order does it put them in, and where would
#    "Apple" with a capital A end up? Guess first, then find out.
