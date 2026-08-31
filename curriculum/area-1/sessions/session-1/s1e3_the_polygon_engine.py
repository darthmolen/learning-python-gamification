"""The Polygon Engine — one number at the top, any shape you like.

This is not an exercise. It is a machine, and it is the first thing you have
built that is worth keeping.

Every closed shape turns through 360 degrees in total, once, all the way round,
however many sides it has. So the turn for one side is not something to guess:

    turn = 360 / sides

Change `sides` at the top and everything downstream follows. Nothing else in the
file needs touching. That is what it means for a program to have a dial on it,
and it is the difference between a drawing and a generator.

Run:  py -3.14 s1e3_the_polygon_engine.py
"""
# concepts: for, range, variables, int, float, print
# dc: 10
# expect: ok
# min-strokes: 6

import turtle

sides = 6
length = 80

turn = 360 / sides

print("sides :", sides)
print("turn  :", turn, "degrees each")
print("total :", turn * sides, "degrees -- always. Every shape. That is the rule.")

turtle.speed(0)
turtle.pensize(3)
turtle.color("teal")

for side in range(sides):
    turtle.forward(length)
    turtle.left(turn)


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Change `sides` to 3. Then 5. Then 8. Then 12. Change nothing else, ever.
#    If you find yourself editing a second line, you have missed the point of
#    the file and it is worth stopping to work out why.
#
# 2. Change it to 36 and shorten `length` to 15. What did you just draw?
#    You did not type the word "circle" anywhere in this file.
#
# 3. Change it to 2. Predict first, then run. What IS a two-sided shape?
#
# 4. CHOICE BOARD. Pick one:
#      a. draw the shape twice, the second one turned 30 degrees from the first
#      b. make the pen a different colour when the shape has more than 6 sides
#         (you cannot say that properly until session 4 -- try anyway, and write
#          in the Journal what you wanted to say and could not)
#      c. draw the shape, then a smaller one inside it
#
# 5. KEEP THIS FILE. It is the most useful thing in Area 1. You will open it
#    again in session 7 and again in session 9. If an evening goes badly, come
#    back here and turn the dial until something good happens.
# -----------------------------------------------------------------------------


turtle.done()
