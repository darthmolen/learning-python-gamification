"""Ask And Draw — the program stops and waits for a human.

input("...") always hands back a str. Always. Even when they typed 150.
If you want a number, you have to say so.

This one is broken in the way session 5 broke it on purpose. Run it first and
read what falls out before you fix anything.

Run:  py -3.14 solution.py
"""

import turtle

answer = input("How long should each side be? ")

turtle.pensize(4)

turtle.forward(answer)
turtle.left(90)
turtle.forward(answer)
turtle.left(90)
turtle.forward(answer)
turtle.left(90)
turtle.forward(answer)
turtle.left(90)

print("Done.")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Run it and type 150. Read the error. Which of the broken sigils was that?
#
# 2. Fix it. `answer` is a str and forward needs a number; say so once, at the
#    top, and give the number its own name. Do not convert it four times.
#
# 3. Print a receipt as the last line, in this exact shape:
#
#        side 150, perimeter 600
#
#    Use an f-string. Compute the perimeter — do not type it. If somebody
#    types 40 instead, both numbers have to change.
# -----------------------------------------------------------------------------


turtle.done()
