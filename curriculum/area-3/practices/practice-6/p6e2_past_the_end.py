"""Past The End — why one of these crashes and the other does not.

Practice 2 taught you that reaching past the end of a list is an `IndexError`.
This file shows you the exception to that, and the exception is not an
inconsistency -- it comes from the two things meaning genuinely different
questions.

    inventory[99]        "give me the thing in slot 99"
    inventory[0:99]      "give me whatever is in slots 0 to 98"

The first one names a thing that must exist. There is no slot 99, so there is
no honest answer, and Python refuses.

The second one describes a **range**, and asks for whatever falls inside it. If
only three things fall inside it, three things is a perfectly good answer. An
empty range is a fine answer too -- you get an empty list, not a crash.

Once you can say that difference out loud, slices stop being a source of
surprises.

Run:  py -3.14 p6e2_past_the_end.py
"""
# concepts: list, slicing, indexing, len, reading-errors, print, f-strings
# dc: 16
# expect: ok

inventory = ["torch", "bread", "rope"]
print(f"three things: {inventory}")
print()

print("slicing well past the end:")
print(f"  inventory[0:99] -> {inventory[0:99]}")
print(f"  {len(inventory[0:99])} things, and no complaint")

print()
print("a slice that starts past the end:")
print(f"  inventory[10:20] -> {inventory[10:20]}")
print("  an empty list. Nothing fell inside that range, which is an answer.")

print()
print("a backwards slice, where the start is after the stop:")
print(f"  inventory[2:0] -> {inventory[2:0]}")
print("  also empty. Still not an error.")

print()
print("now the one that DOES refuse -- caught so this file can finish:")
try:
    print(inventory[99])
except IndexError as refused:
    print(f"  inventory[99] raised IndexError: {refused}")
    print("  because you named one slot, and that slot does not exist.")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Say the difference in your own words: when does reaching past the end
#    crash, and when does it hand you something? Write it in your journal.
#
# 2. `inventory[1:1]` -- predict the answer before running it. What about
#    `inventory[3:]` on a three-item list?
#
# 3. The `try`/`except` above is not Area 3 vocabulary; it arrives properly in
#    Area 5. It is here only so the file can print past its own crash. Read it
#    as "try this, and if it refuses, do that instead."
#
# 4. Write a slice that safely gives you "up to the first five things" from a
#    list you do not know the length of. How much guarding does it need?
