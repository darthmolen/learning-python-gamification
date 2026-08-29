"""A Loop Inside A Loop — the shape becomes a pattern.

A loop repeats its body. If the body is itself a loop, the inner one runs all
the way through every single time the outer one goes round.

    for shape in range(3):        <- runs 3 times
        for side in range(4):     <- runs 4 times, for EACH of those 3
            turtle.forward(60)
            turtle.left(90)
        turtle.left(120)          <- runs 3 times: it belongs to the outer loop

Twelve sides get drawn, not seven. That is the first thing everybody gets wrong
about nesting, and it is worth getting wrong out loud: predict the number
before you run it.

The second thing everybody gets wrong is which loop a line belongs to. There is
only one way to tell and it is the indentation. Count the spaces with your
finger. There is no shame in it; professionals do it too.

Run:  py -3.14 s7e1_a_loop_inside_a_loop.py
"""
# concepts: nesting, for, range, variables, int, print
# dc: 12
# expect: ok
# strokes: 12

import turtle

turtle.speed(0)
turtle.pensize(2)
turtle.color("darkslateblue")

shapes = 3
sides = 4

print("outer loop runs", shapes, "times")
print("inner loop runs", sides, "times, for each of those")
print("so the forward line runs", shapes * sides, "times in total")

for shape in range(shapes):
    print("starting shape", shape)
    for side in range(sides):
        turtle.forward(60)
        turtle.left(90)
    turtle.left(120)

print("finished")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Count the "starting shape" lines. Three. Now count the squares. Three.
#    Now say how many `turtle.forward` calls happened. It is not three and it
#    is not seven.
#
# 2. Move `turtle.left(120)` one level in, so it sits inside the inner loop.
#    Predict what changes BEFORE running. Then run it. Then put it back.
#
# 3. Move it one level OUT, so it is after both loops entirely. Predict, run,
#    put it back. You have now seen the same line mean three different things
#    depending only on how far it is indented.
#
# 4. Change `shapes` to 12 and the 120 to 30. Predict how many sides get drawn
#    in total. Then check by making the program count them.
#
# 5. CHOICE BOARD:
#      a. make the inner shape a triangle instead of a square
#      b. make each shape a bit bigger than the last (the outer counter is
#         sitting right there and you are not using it)
#      c. move the turtle between shapes instead of turning, so they sit in a
#         row rather than a rosette
# -----------------------------------------------------------------------------


turtle.done()
