"""The Repeated Line — the line that deletes typing.

In Area 0 you drew a square by writing four pairs of orders. Twenty lines to add
a step to the staircase. You counted the blocks of four you had to paste on the
dashed orbit and wrote the number in your Journal.

This is the line that deletes all of it:

    for step in range(4):
        turtle.forward(100)
        turtle.left(90)

Read it out loud as English: *for each step in a run of four, go forward and
turn left.* Two things make it work and both of them are punctuation:

    the colon        says "what follows is the body"
    the indentation  says "this line, and this one, are the body"

Blank space is not decoration. It is the only thing telling Python which orders
belong to the loop and which come after it. You met that in Area 0 as an
IndentationError. Here it is the whole grammar.

Run:  py -3.14 s1e1_the_repeated_line.py
"""
# concepts: for, range, print, int
# dc: 8
# expect: ok
# strokes: 4

import turtle

turtle.speed(0)  # the throttle. 0 means no animation at all -- you will want it.

print("four sides, one loop")

for step in range(4):
    print("side", step)
    turtle.forward(100)
    turtle.left(90)

print("done. the turtle is back where it started, facing the way it started.")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Before you change anything: how many lines did that loop print? Look at the
#    numbers it printed. What is the FIRST one? Write it down. It matters more
#    than you think it does, and it matters as soon as the next file.
#
# 2. Change the 4 to a 3 and run it. You get a shape that does not close.
#    Do not fix it yet. Just look at it and say what is wrong out loud.
#
# 3. Now make it close. You changed the number of sides, so something else has
#    to change too. All the turns of a closed shape add up to the same total,
#    always, whatever the shape. Work out that total from the square, then use
#    it to get the turn for a triangle.
#
# 4. Try 6 sides. Try 8. Try 36 -- that one is worth doing.
#
# 5. CHOICE BOARD. Pick one, or invent one:
#      a. draw the square with turtle.right instead of turtle.left
#      b. make each side a different length: 100, then 120, then 140, then 160
#         (you will have to do something clever with `step`, or give up and
#          write four lines by hand -- both are legal tonight)
#      c. draw a triangle, then a square, then a pentagon, one under the other
# -----------------------------------------------------------------------------


turtle.done()
