"""b6 — The Shape That Does Not Close.

Broken on purpose. Do not fix it before the session.

This is the b7 of Area 1 and it is the file the whole session is built around.

It runs. It exits cleanly. It draws five lines, which is the number it says it
is going to draw. Every count in it is correct. There is no error, no warning,
and no clue of any kind.

It is still wrong, and it is wrong in a way you can prove with arithmetic before
you even look at the picture.

Run:  py -3.14 b6_the_shape_that_does_not_close.py
"""
# concepts: for, range, reading-errors, int, float, variables, print
# dc: 14
# expect: ok
# strokes: 5

import turtle

turtle.speed(0)
turtle.pensize(4)
turtle.color("teal")

sides = 5
turn = 70

print("drawing a pentagon:", sides, "sides, turning", turn, "degrees each time")

for side in range(sides):
    turtle.forward(110)
    turtle.left(turn)

print("pentagon finished")


# --- THE QUESTIONS ------------------------------------------------------------
# 1. Count the sides in the picture. Five. The program said five. It drew five.
#    So what is wrong?
# 2. Add up every turn the turtle made. Five turns of 70. What is the total?
# 3. What does the total HAVE to be for a shape to close? You worked this out
#    in session 1 and you have used it in every file since.
# 4. Fix it so that changing `sides` to any number still closes the shape.
#    Do not type 72.
# 5. The sentence to remember, and your dad will ask you for it:
#       "Errors are the easy failures."
#    Say what the hard ones are.
# -----------------------------------------------------------------------------


turtle.done()
