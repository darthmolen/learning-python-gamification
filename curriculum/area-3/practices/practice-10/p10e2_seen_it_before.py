"""Seen It Before — a set as memory, and a world that builds itself.

Here the set does a job rather than demonstrating a property: it remembers which
coordinates have already been built on, so the same spot is never placed twice.

Placing a block twice is not an error and nothing complains. You just quietly
pay for two blocks and see one, and since the cap is about how long the world
takes to build, paying twice for nothing is exactly the thing worth not doing.

Note what goes into the set: a **tuple**. `(x, z)` is a fixed shape of exactly
two numbers, which is practice 7's argument arriving with a job. It also has to
be a tuple for a reason you can discover -- move 3 below.

Run:  py -3.14 p10e2_seen_it_before.py
"""
# concepts: set, tuple, in, len, iteration, nesting, for, range, print, f-strings
# dc: 18
# expect: ok
# min-blocks: 30

from world import place, start

wanted = [
    (0, 0), (1, 0), (2, 0), (1, 0),
    (0, 1), (1, 1), (2, 1), (0, 1),
]

built = set()
placed_count = 0

print("building a small patch, skipping repeats:")
for spot in wanted:
    if spot in built:
        print(f"  skipping {spot}, already built")
        continue
    built.add(spot)
    place(spot[0], 0, spot[1], "stone")
    placed_count = placed_count + 1

print(f"{len(wanted)} asked for, {placed_count} actually placed")

print()
print("now a floor that cannot double up on itself:")
for x in range(6):
    for z in range(4):
        spot = (x, z + 3)
        if spot not in built:
            built.add(spot)
            place(x, 0, z + 3, "grass")

print(f"{len(built)} distinct spots remembered")

start()


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Count the repeats in `wanted` by eye, then check your number against what
#    the program printed.
#
# 2. Delete the `if spot in built` guard entirely. The picture is identical.
#    How would you ever have known? Print `len(built)` against the number of
#    `place` calls to find out.
#
# 3. Change `spot = (x, z + 3)` to `spot = [x, z + 3]` -- a list instead of a
#    tuple -- and run it. Read the error. A set can only hold things that
#    cannot change, and a list can change. Say why that rule has to exist.
#
# 4. The second loop places 24 blocks. Make it 2,400 by changing two numbers,
#    and predict the startup wait before you run it. Keep it under the cap.
