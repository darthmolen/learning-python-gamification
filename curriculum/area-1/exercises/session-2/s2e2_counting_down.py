"""Counting Down — a shape that gets smaller because the counter does.

The counter is not just a tally. It is a value you can use, and using it is what
turns a loop from "do this four times" into "do this, but a bit different each
time".

Here the counter is the length of the side. It counts down, so the shape spirals
inward. Nothing in the body says "get smaller"; the range says it.

Run:  py -3.14 s2e2_counting_down.py
"""
# concepts: range, for, variables, int, float, print
# dc: 10
# expect: ok
# strokes: 25

import turtle

turtle.speed(0)
turtle.pensize(2)
turtle.color("purple")

print("side lengths, in the order they are drawn:")

for length in range(200, 0, -8):
    print(length, end=" ")
    turtle.forward(length)
    turtle.left(89)

print()
print("the turn is 89 and not 90, which is the entire reason it spirals")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Change the 89 to 90 and run it. Then change it back. Say out loud what one
#    degree did.
#
# 2. Try 91. Try 60. Try 121. Try 144. One of those is much better than the
#    others and it is not the one you expect.
#
# 3. The last length drawn was 8, not 0. Look at the range and say why.
#    Which end is "included"?
#
# 4. Make it spiral OUTWARD instead: start small, get bigger. Only the range
#    changes.
#
# 5. CHOICE BOARD:
#      a. make the step -3 instead of -8 and turn the throttle to speed(0)
#         if you have not already
#      b. spiral in, then spiral back out, so it ends where it started
#      c. print the number of lines it drew. You will need to count them
#         yourself -- there is a proper way to do this and it is session 8,
#         so do it the clumsy way tonight and remember that you did.
# -----------------------------------------------------------------------------


turtle.done()
