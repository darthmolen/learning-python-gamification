"""b1 — The Hexagon With Five Sides.

Broken on purpose. Do not fix it before the session.

It runs. It exits cleanly. It prints nothing red. Python has no complaint of any
kind about this file, and the file is wrong.

Read it first. Predict out loud. Then run it and LOOK AT THE PICTURE.

Run:  py -3.14 b1_five_of_six.py
"""
# concepts: for, range, reading-errors, int, variables, print
# dc: 10
# expect: ok
# min-strokes: 5

import turtle

turtle.speed(0)
turtle.pensize(4)
turtle.color("navy")

print("drawing a hexagon")

for side in range(5):
    turtle.forward(90)
    turtle.left(60)

print("hexagon finished")


# --- THE QUESTIONS ------------------------------------------------------------
# 1. How many sides does a hexagon have?
# 2. How many sides did this draw? Do not count them by eye -- you will get it
#    wrong. Make the program tell you.
# 3. There was no error. Whose job was it to notice?
# 4. Fix it by changing ONE character.
# -----------------------------------------------------------------------------


turtle.done()
