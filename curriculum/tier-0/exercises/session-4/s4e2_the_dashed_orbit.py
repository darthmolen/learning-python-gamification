"""The Dashed Orbit — where float actually earns its keep.

You want a dashed ring: a fixed number of dashes spaced evenly all the way round.
A full turn is 360 degrees. Twelve dashes means turning 360 / 12 between them.

Try that with 7 dashes and the answer stops being a whole number. A float is
not a worse int. It is the only kind of number that can answer the question.

Run:  py -3.14 s4e2_the_dashed_orbit.py
"""
# concepts: float, int, variables, print
# dc: 12
# expect: ok

import turtle

dashes = 12
turn = 360 / dashes
dash_length = 25
gap = 15

print("dashes     :", dashes, type(dashes))
print("turn       :", turn, type(turn))
print("total turn :", turn * dashes)
print("the famous one:", 0.1 + 0.2)

turtle.pensize(5)
turtle.color("cyan")

turtle.forward(dash_length)
turtle.penup()
turtle.forward(gap)
turtle.pendown()
turtle.left(turn)

turtle.forward(dash_length)
turtle.penup()
turtle.forward(gap)
turtle.pendown()
turtle.left(turn)

turtle.forward(dash_length)
turtle.penup()
turtle.forward(gap)
turtle.pendown()
turtle.left(turn)

turtle.forward(dash_length)
turtle.penup()
turtle.forward(gap)
turtle.pendown()
turtle.left(turn)

print("after four dashes, heading is", turtle.heading())


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Change dashes to 7 and run it. Read the printed turn. Count its decimals.
#
# 2. "total turn" prints 360.0 with a point-zero on the end, even when the
#    answer is exactly 360. Why? Which of the four kinds is it?
#
# 3. Look at the line that prints 0.1 + 0.2. Read the answer twice.
#    That is not a bug in your code and it is not a bug in Python. Every
#    programming language on earth prints that, for the same reason. Ask your
#    dad about it; he has been bitten by it at work, with real money.
#
# 4. Keep adding dashes until the ring closes. Count how many blocks of four
#    lines you had to paste. Write that number in your Journal. It is the
#    single best argument for the thing you learn in Tier 1.
# -----------------------------------------------------------------------------


turtle.done()
