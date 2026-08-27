"""Where Am I — print is how you ask the program a question.

The turtle always knows two things about itself:
  - its position, an (x, y) pair. It starts at (0, 0), the middle of the window.
  - its heading, an angle in degrees. It starts at 0, which is "facing right".

You cannot see either of those by looking at the picture. print can.

BEFORE YOU RUN THIS: write down, on paper, what you think each of the four
prints will say. All four. Then run it and compare.

Run:  py -3.14 s1e2_where_am_i.py
"""
# concepts: print
# dc: 8
# expect: ok

import turtle

print("at the start :", turtle.position(), "facing", turtle.heading())

turtle.forward(100)
print("after forward:", turtle.position(), "facing", turtle.heading())

turtle.left(90)
print("after left   :", turtle.position(), "facing", turtle.heading())

turtle.forward(100)
print("after forward:", turtle.position(), "facing", turtle.heading())


# --- YOUR MOVE ---------------------------------------------------------------
# Questions to answer out loud, using print to check rather than guessing:
#
#   1. What does turtle.right(90) do to the heading? Is it the opposite of left?
#   2. Get the heading to say 270 without ever using the number 270.
#   3. turtle.forward(-50) — legal or an error? Predict first, then find out.
#   4. Get back to exactly (0.00, 0.00). Prove it with a print.
# -----------------------------------------------------------------------------


turtle.done()
