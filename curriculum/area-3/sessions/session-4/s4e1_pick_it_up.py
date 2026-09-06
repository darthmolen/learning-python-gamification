"""Pick It Up — the orders a list understands.

An inventory that cannot gain and lose things is not an inventory. These are the
five you will use constantly:

    inventory.append("rope")      add one on the end
    inventory.insert(0, "map")    put one at a position, shove the rest along
    inventory.remove("bread")     take out the first one that matches, BY NAME
    inventory.pop()               take the last one out and hand it back
    inventory.pop(0)              take the one at a position out and hand it back

Two of those are easy to confuse and it is worth being deliberate about it:

    remove(x)   takes a VALUE.    "get rid of the bread"
    pop(i)      takes a POSITION. "get rid of whatever is in slot 1"

And one difference that matters more than it looks: **`pop` hands the thing
back to you, and `remove` does not.** So `pop` is what you want when you are
taking something out in order to use it.

Run:  py -3.14 s4e1_pick_it_up.py
"""
# concepts: list, list-methods, mutation, indexing, len, iteration, print, f-strings
# dc: 12
# expect: ok

inventory = ["torch", "bread", "rope"]
print(f"start:            {inventory}")

inventory.append("pickaxe")
print(f"append pickaxe:   {inventory}")

inventory.insert(0, "map")
print(f"insert map at 0:  {inventory}")

inventory.remove("bread")
print(f"remove bread:     {inventory}")

taken = inventory.pop()
print(f"pop():            {inventory}   and it handed back {taken!r}")

first = inventory.pop(0)
print(f"pop(0):           {inventory}   and it handed back {first!r}")

print()
print(f"{len(inventory)} things left, in this order:")
for slot in range(len(inventory)):
    print(f"  {slot}: {inventory[slot]}")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. `remove` takes a value and `pop` takes a position. Write down, in English,
#    what `inventory.remove(0)` would try to do. Then run it and see whether you
#    were right about why it fails.
#
# 2. Print what `append` hands back:  `print(inventory.append("flint"))`.
#    You met this in the last file. Which methods hand something back?
#
# 3. Build a tiny program that empties the inventory one item at a time using
#    `pop()`, printing each thing as it comes out. What order do they come out
#    in? What would you change to empty it from the front?
#
# 4. This one is a trap and it is worth springing on purpose. Try to remove
#    every item using a `for` loop:
#        for thing in inventory:
#            inventory.remove(thing)
#    Print the inventory afterwards. It does not crash and it does not empty.
#    Print the list at the top of each go round to see what the loop is doing.
