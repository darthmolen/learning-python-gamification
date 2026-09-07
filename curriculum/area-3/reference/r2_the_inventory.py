"""Worked answer to p2e1's YOUR MOVE. DM's copy — spec 5.5 Datamine payload.

Not a handout. Taking this costs 5 XP and it should, because every question it
answers is one the learner could have answered by printing something.

The four moves, worked:

  1. Five things, so the last slot is 4. `len(inventory) - 1`.
  2. `inventory[5]` raises IndexError. Covered by p2e2 deliberately.
  3. `inventory[-5]` is the first item; `inventory[-6]` raises IndexError.
     Negative indexing has exactly the same edges as positive, counted from the
     other side, which is the thing most people never quite state.
  4. Both loops below. The `range(len(...))` form is the only one that knows
     the slot number, and that is the honest reason to keep it around.

Run:  py -3.14 r2_the_inventory.py
"""
# concepts: list, indexing, len, iteration, for, range, in, print, f-strings
# dc: 10
# expect: ok

inventory = ["torch", "bread", "rope", "pickaxe", "flint"]

print("move 1 — where is the last slot")
print(f"  len is {len(inventory)}, so the last slot is {len(inventory) - 1}")
print(f"  inventory[{len(inventory) - 1}] -> {inventory[len(inventory) - 1]}")
print(f"  inventory[-1]                  -> {inventory[-1]}")

print()
print("move 3 — how far negative indexing reaches")
print(f"  inventory[-5] -> {inventory[-5]}   (the first item)")
print("  inventory[-6] -> IndexError, one step too far")

print()
print("move 4 — the two loops, side by side")
print("  by position, which knows the slot number:")
for slot in range(len(inventory)):
    print(f"    {slot}: {inventory[slot]}")

print("  by item, which is easier to read and does not:")
for thing in inventory:
    print(f"    {thing}")

print()
print("the second one is what you want unless you need the number.")
