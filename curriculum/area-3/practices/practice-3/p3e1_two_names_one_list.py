"""Two Names, One List — the first thing this year that is true and invisible.

A list can be changed after you make it. That is called **mutation**, and it
sounds obvious until it costs you an evening.

    inventory.append("rope")     the list itself is now longer

Nothing new is made. The list you already had got longer. Compare that with what
you are used to:

    total = total + 1            a NEW number, put back under the old name

Numbers work the first way. Lists work the second way. And that difference is
invisible right up until two names point at the same list.

    backpack = inventory         this does NOT make a copy

It makes a second NAME for the list that already exists. Change it through one
name and the other one sees it, because there was only ever one list.

This program does exactly that, and prints both names after every step so you
can watch it happen. **Nothing here is a bug and nothing crashes.** That is
what makes it worth an evening.

Run:  py -3.14 p3e1_two_names_one_list.py
"""
# concepts: list, mutation, list-methods, variables, print, len, f-strings
# dc: 12
# expect: ok

inventory = ["torch", "bread"]
backpack = inventory

print("two names, made from one list:")
print(f"  inventory -> {inventory}")
print(f"  backpack  -> {backpack}")

print()
print("now appending 'rope' to BACKPACK only:")
backpack.append("rope")
print(f"  inventory -> {inventory}")
print(f"  backpack  -> {backpack}")

print()
print("inventory grew, and nothing touched it by name.")
print(f"there is one list, {len(inventory)} long, wearing two names.")

print()
print("this is what an actual copy looks like:")
spare = list(inventory)
spare.append("flint")
print(f"  inventory -> {inventory}")
print(f"  spare     -> {spare}")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Before running: after `backpack.append("rope")`, how many things does
#    `inventory` hold? Commit to a number out loud, then run it.
#
# 2. Remove something from `inventory` and print `backpack`. Does it work in
#    both directions, or only one?
#
# 3. `spare = list(inventory)` made a real copy. Change the copy, print the
#    original, and prove to yourself that it is a different list this time.
#
# 4. Numbers do not behave this way. Try it:
#        a = 5
#        b = a
#        b = b + 1
#    Print both. Why is `a` still 5? What is different about what `b = b + 1`
#    does compared with what `backpack.append(...)` does?
