"""A Row Of Blocks — your first list, and the world it builds.

A list is things in order, in square brackets, separated by commas:

    kinds = ["grass", "dirt", "stone"]

That is one name holding three things. Last year you would have needed three
names. The order is the point -- a list remembers what came first.

This program walks the list one item at a time and places a block for each one.
The loop is the same `for` you have been writing since Area 1. What is new is
what it walks over: not `range(5)`, a made-up run of numbers, but a list of real
things you chose.

Two words to keep apart, because mixing them up is the most common thing that
goes wrong in this area:

    place(...)   REMEMBERS a block. Nothing appears.
    start()      BUILDS everything remembered, and opens the window.

A program that places a hundred blocks and never calls `start()` runs perfectly,
finishes without a word of complaint, and draws absolutely nothing.

Run:  py -3.14 s1e1_a_row_of_blocks.py
"""
# concepts: list, iteration, for, print, len, f-strings
# dc: 10
# expect: ok
# min-blocks: 6

from world import place, start

kinds = ["grass", "dirt", "stone", "sand", "wood", "glass"]

print(f"the list holds {len(kinds)} kinds")

x = 0
for kind in kinds:
    place(x, 0, 0, kind)
    print(f"  placed {kind} at x={x}")
    x = x + 1

print("nothing has appeared yet. start() is the line that builds it.")

start()


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Comment out the `start()` line and run it again. Read what still prints.
#    The program does not crash and does not warn you. Say out loud what that
#    tells you about the difference between placing and starting.
#
# 2. Put a fourth kind into the list, anywhere you like except the end. Predict
#    where the new block will appear BEFORE you run it. Were you right?
#
# 3. Delete a comma -- turn `"dirt", "stone"` into `"dirt" "stone"`. Run it.
#    You will not get an error. How many blocks appear? Now print `len(kinds)`
#    and see what Python thinks you wrote.
#
# 4. `place(x, 0, 0, kind)` puts everything in a line along x. Change one of the
#    three zeros so the row climbs as it goes. Only one of them will do what you
#    want, and finding out which is the exercise.
