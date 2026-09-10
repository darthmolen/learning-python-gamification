"""Worked answer to p6e1's YOUR MOVE. DM's copy — spec 5.5 Datamine payload.

Not a handout. 5 XP, and the fourth move below is the one worth making them
find rather than read, because it closes practice 3's loop.

The four moves, worked:

  1. `[0:9]` gives nine things, slots 0 to 8. Third meeting with the stopping
     rule, after `range(9)` and `range(2, 5)`.
  2. The two halves account for everything, and the check is one line.
  3. `[0:99]` does not crash. A slice describes a range and takes what falls
     inside it; an index names a slot that must exist. Full treatment in p6e2.
  4. `inventory[:]` is a real copy and `inventory` is a second name. This is
     practice 3's aliasing lesson arriving again with a new tool attached, and
     it is the reason slicing is taught after mutation rather than before.

Run:  py -3.14 r6_the_hotbar.py
"""
# concepts: list, slicing, indexing, len, mutation, list-methods, print, f-strings
# dc: 14
# expect: ok

inventory = [
    "torch", "bread", "rope", "pickaxe", "flint",
    "apple", "plank", "coal", "shovel", "bucket", "map", "key",
]

hotbar = inventory[0:9]
rest = inventory[9:]

print("move 1 — how many, and which slots")
print(f"  [0:9] gives {len(hotbar)} things, slots 0 to 8")

print()
print("move 2 — the two halves account for everything")
print(f"  {len(hotbar)} + {len(rest)} = {len(hotbar) + len(rest)}")
print(f"  len(inventory) = {len(inventory)}")
print(f"  they agree: {len(hotbar) + len(rest) == len(inventory)}")

print()
print("move 4 — a copy, and a second name")

copied = inventory[:]
copied.append("COPY ONLY")
print(f"  after appending to inventory[:]  -> inventory is {len(inventory)} long")

alias = inventory
alias.append("BOTH")
print(f"  after appending to a second name -> inventory is {len(inventory)} long")
print("  one of those touched the original. The other did not.")
