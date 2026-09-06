"""Off By One — a crash on purpose, so you have met it before it matters.

This file is SUPPOSED to fail. Run it and read what comes out.

The mistake in it is the most common one there is with lists, and it is worth
making deliberately, in a file that exists for the purpose, rather than at
half past eight on a night when you were nearly finished.

The code asks for `inventory[len(inventory)]`. There are three things, so
`len(inventory)` is 3, so it asks for slot 3. The slots are 0, 1 and 2. There is
no slot 3, there never was, and Python refuses rather than inventing one.

**That refusal is the list doing its job.** A language that handed back an empty
answer here would let the mistake travel somewhere else and fail later, where
you could not see it.

Run:  py -3.14 s2e2_off_by_one.py
"""
# concepts: list, indexing, len, reading-errors, print, f-strings
# dc: 12
# expect: IndexError

inventory = ["torch", "bread", "rope"]

print(f"there are {len(inventory)} things")
print(f"the slots are numbered 0 to {len(inventory) - 1}")
print("now asking for the slot one past the end:")

print(inventory[len(inventory)])


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Read the last line of the error out loud. It is one short sentence and it
#    says exactly what happened.
#
# 2. Fix it so it prints the LAST item. There are two good ways -- one uses a
#    minus, the other uses a minus one. Write both, then pick the one you would
#    rather read in a month.
#
# 3. Add a fourth item to the list and run your fixed version. If it still
#    prints the last item without you editing anything else, you picked well.
#
# 4. What is the shortest list this program could crash on? What about an empty
#    list, `[]` -- does `inventory[0]` work on that? Try it and see.
