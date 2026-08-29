"""The Rosette — nesting, the polygon engine, and a branch, all at once.

Everything from the last six sessions is in this file and none of it is new.
A shape drawn by a loop, drawn many times by another loop, with a question
asked inside to decide the colour.

This file is deliberately plain. It draws something correct and dull. The whole
value of the evening is in the CHOICE BOARD at the bottom, and there is a
reference solution for one of those in `../../reference/` if you get two real
attempts in and need it (spec 5.5 -- it is a legal move with a name, and it
costs difficulty, not honour).

Run:  py -3.14 s7e3_the_rosette.py
"""
# concepts: nesting, for, range, if, else, comparison-operators, variables, int, float, print
# dc: 16
# expect: ok
# min-strokes: 48

import turtle

turtle.speed(0)
turtle.pensize(2)

copies = 8
sides = 6
length = 45

turn_within = 360 / sides
turn_between = 360 / copies

print("copies       :", copies)
print("sides each   :", sides)
print("lines drawn  :", copies * sides)
print("turn within  :", turn_within)
print("turn between :", turn_between)

for copy in range(copies):
    if copy < copies / 2:
        turtle.color("mediumvioletred")
    else:
        turtle.color("darkcyan")
    for side in range(sides):
        turtle.forward(length)
        turtle.left(turn_within)
    turtle.left(turn_between)

print("finished")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Turn the two dials. `copies` to 12, `sides` to 3. Then copies 18, sides 4.
#    Then copies 36, sides 36 -- that one is worth waiting for, and it is why
#    turtle.speed(0) is at the top.
#
# 2. Every number below the dials is worked out rather than typed. Find all
#    four and say which dial each one depends on. This is what "one number at
#    the top" bought you back in session 1.
#
# 3. CHOICE BOARD -- pick at least one, and this is the actual work tonight:
#      a. make each copy slightly bigger than the last, so it spirals outward
#      b. give every copy its own colour from a ladder of `elif` branches
#      c. draw the rosette twice, the second one smaller and turned, so it
#         sits inside the first
#      d. move the turtle a little between copies instead of only turning
#
# 4. Whatever you pick, change ONE dial at the end and check it still works.
#    A pattern that only looks right at copies=8 is a drawing. A pattern that
#    looks right at 8 and 12 and 30 is a generator, and Boss 1 wants a
#    generator.
# -----------------------------------------------------------------------------


turtle.done()
