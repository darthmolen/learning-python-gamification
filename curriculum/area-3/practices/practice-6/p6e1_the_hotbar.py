"""The Hotbar — taking a piece of a list.

Your hotbar is the first nine slots of your inventory. That is a slice:

    hotbar = inventory[0:9]

Two numbers, a colon between them. **It starts at the first and stops BEFORE
the second.** So `[0:9]` gives you nine things -- slots 0 to 8 -- not ten.

You have met that stopping rule twice already. `range(9)` gives nine numbers,
0 to 8. `range(2, 5)` gives 2, 3, 4. Same rule, third place. This is the last
time it should surprise you.

Either number can be left out, and then it means "as far as it goes":

    inventory[:9]     from the start, up to slot 9
    inventory[9:]     from slot 9 to the end
    inventory[:]      the whole thing -- and, usefully, a real copy

That last one is worth remembering after practice 3: `spare = inventory[:]` is a
copy, where `spare = inventory` is a second name.

**A slice hands you a new list.** The original is never touched.

Run:  py -3.14 p6e1_the_hotbar.py
"""
# concepts: list, slicing, indexing, len, iteration, print, f-strings
# dc: 14
# expect: ok

inventory = [
    "torch", "bread", "rope", "pickaxe", "flint",
    "apple", "plank", "coal", "shovel", "bucket", "map", "key",
]

print(f"inventory holds {len(inventory)} things")
print()

hotbar = inventory[0:9]
print(f"hotbar  inventory[0:9] -> {len(hotbar)} things")
print(f"  {hotbar}")

rest = inventory[9:]
print(f"rest    inventory[9:]  -> {len(rest)} things")
print(f"  {rest}")

print()
print(f"first three  [:3]   -> {inventory[:3]}")
print(f"last three   [-3:]  -> {inventory[-3:]}")
print(f"a copy       [:]    -> {len(inventory[:])} things, a new list")

print()
print(f"the original is untouched: {len(inventory)} things")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Before running: `inventory[0:9]` -- how many things? Commit to a number.
#    Then say which slot numbers they are.
#
# 2. `hotbar` and `rest` together should account for everything. Check it:
#    does `len(hotbar) + len(rest)` equal `len(inventory)`?
#
# 3. Ask for `inventory[0:99]`. In practice 2, asking for a slot past the end
#    crashed. This does not. What is different about what you asked for?
#
# 4. `spare = inventory[:]` versus `spare = inventory`. Append to each and print
#    the original both times. Only one of them is a copy.
