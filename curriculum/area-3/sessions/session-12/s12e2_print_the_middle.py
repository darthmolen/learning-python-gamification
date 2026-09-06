"""Print The Middle — what to do when a nested structure stops making sense.

You will write `book["torch"]["coal"]["amount"]` one day and get an error you
cannot read, and the reason is always the same: **you have lost track of what
each step actually hands back.**

The fix is one habit, and it is the most useful thing in this session:

    print the MIDDLE

Not the whole structure -- that is a wall of text. Not the end -- that is the
thing that failed. The step in between, which is the one you were wrong about.

    print(book["torch"])        <- what IS this, actually?

Once you can see it, the next bracket is obvious. This works at every depth and
it never stops working.

This file walks down a structure one step at a time, printing what it holds and
what type it is at each level, which is what you should do by hand the moment
you are confused.

Run:  py -3.14 s12e2_print_the_middle.py
"""
# concepts: nested-structures, dict, list, indexing, iteration, len, print, f-strings
# dc: 20
# expect: ok

world = {
    "chests": [
        {"name": "start",  "items": ["torch", "bread"]},
        {"name": "mine",   "items": ["pickaxe", "coal", "coal"]},
    ],
    "spawn": (0, 64, 0),
}

print("walking down to a single item, one step at a time:")
print()

step1 = world["chests"]
print(f"1. world['chests']            {type(step1).__name__}, {len(step1)} long")

step2 = step1[1]
print(f"2. ...[1]                     {type(step2).__name__}, keys {sorted(step2)}")

step3 = step2["items"]
print(f"3. ...['items']               {type(step3).__name__}, {step3}")

step4 = step3[0]
print(f"4. ...[0]                     {type(step4).__name__}, {step4!r}")

print()
print("all four steps at once, which is what you would actually write:")
print(f"  world['chests'][1]['items'][0] -> {world['chests'][1]['items'][0]}")

print()
print("every chest and what is in it:")
for chest in world["chests"]:
    print(f"  {chest['name']}: {len(chest['items'])} items")
    for item in chest["items"]:
        print(f"      {item}")

print()
print(f"and spawn is still a tuple: {world['spawn']}, {len(world['spawn'])} numbers")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Cover the output and predict what `type(step2).__name__` is before you
#    look. Getting this wrong is normal and is exactly why you print middles.
#
# 2. Ask for `world["chests"]["mine"]` -- reaching for a chest by name, when
#    chests are in a LIST. Read the error, then print the middle and say what
#    you should have asked for instead.
#
# 3. Reshape `chests` from a list into a dict keyed by name, so that
#    `world["chests"]["mine"]` DOES work. What did you lose by doing that?
#
# 4. Count every item in every chest. Two loops, or one loop and a `sum`.
