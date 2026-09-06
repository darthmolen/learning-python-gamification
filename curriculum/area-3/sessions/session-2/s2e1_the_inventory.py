"""The Inventory — reaching into a list by position.

Square brackets take one thing out of a list, by its position:

    inventory[0]    the first thing

**Counting starts at zero.** That looks wrong for about a week and then stops.
`inventory[0]` is the first slot, not the zeroth thing you own.

You already know this rule from somewhere else. `range(4)` gives you 0, 1, 2, 3
-- four numbers, starting at zero, stopping before the four. Same idea, second
place you have met it.

Two facts that go together:

    len(inventory)        how many things there are
    inventory[len - 1]    where the last one is

The last position is always `len(x) - 1`, and that "minus one" is the whole
lesson. Ask for `inventory[len(inventory)]` and you are asking for a slot that
was never filled.

Negative numbers count from the other end, which is more useful than it sounds:

    inventory[-1]    the last thing, without knowing how long the list is

Run:  py -3.14 s2e1_the_inventory.py
"""
# concepts: list, indexing, len, iteration, for, range, print, f-strings
# dc: 10
# expect: ok

inventory = ["torch", "bread", "rope", "pickaxe", "flint"]

print(f"you are carrying {len(inventory)} things")
print(f"  first  inventory[0]  -> {inventory[0]}")
print(f"  third  inventory[2]  -> {inventory[2]}")
print(f"  last   inventory[-1] -> {inventory[-1]}")

last = len(inventory) - 1
print(f"  last, the long way, inventory[{last}] -> {inventory[last]}")

print()
print("every slot, with its number:")
for slot in range(len(inventory)):
    print(f"  {slot}: {inventory[slot]}")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Before running anything: there are five things. What is the number of the
#    last slot? Say it out loud, then check with `inventory[-1]`.
#
# 2. Print `inventory[5]`. Read the error. It names the thing it could not do
#    and it is right to refuse -- you asked for a slot nobody filled.
#
# 3. `inventory[-2]` gives you the second from the end. Work out what
#    `inventory[-5]` gives you, and what `inventory[-6]` will do, before trying
#    either.
#
# 4. The loop above walks positions with `range(len(...))`. Rewrite it as a
#    plain `for thing in inventory:` loop. Which of the two is easier to read?
#    Which one could tell you the slot number?
