"""The Growing Spiral — the accumulator IS the drawing.

In s8e1 the accumulator was bookkeeping: the picture would have been the same
without it. Here it is the other way round. The number being carried is the
length of the next line, so the accumulator is the reason the shape grows.

    length = 10
    for step in range(60):
        turtle.forward(length)
        turtle.left(89)
        length = length + 3     <- this line is the spiral

Delete that line and you get a circle. It is one line and it is the whole shape.

Run:  py -3.14 s8e2_the_growing_spiral.py
"""
# concepts: accumulator-pattern, for, range, variables, int, float, print
# dc: 16
# expect: ok
# strokes: 60

import turtle

turtle.speed(0)
turtle.pensize(2)
turtle.color("darkred")

steps = 60
turn = 89
growth = 3

length = 10
ink = 0

for step in range(steps):
    turtle.forward(length)
    turtle.left(turn)
    ink = ink + length
    length = length + growth

print("lines drawn :", steps)
print("first line  :", 10)
print("last line   :", length - growth)
print("total ink   :", ink, "pixels")
print()
print("two accumulators in one loop: one draws the picture, one measures it.")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Why is `length - growth` the last line drawn rather than `length`?
#    Say what the last thing the loop did was. This is an off-by-one and it is
#    the friendly kind, because it is in a print rather than in the drawing.
#
# 2. Turn `turn` to 90. Then 60. Then 120. Then 144. Then 91. Then 121.
#    Two of those are much better than the rest. Write the good ones down.
#
# 3. Turn `growth` to 1, then to 10, then to 0. What is a spiral with zero
#    growth?
#
# 4. Swap the order of the last two lines in the loop, so `length` grows before
#    the ink is added. The picture stays the same and the total is wrong.
#    By how much? Predict the difference before you run it.
#
# 5. CHOICE BOARD:
#      a. make the pen get thicker as the spiral grows
#      b. change the colour every ten steps using a ladder
#      c. make it grow for the first half and shrink for the second, so it
#         comes back to the middle (one `if`, one sign change)
#      d. run it with steps = 400 and turn = 89.5, and turn the throttle down
# -----------------------------------------------------------------------------


turtle.done()
