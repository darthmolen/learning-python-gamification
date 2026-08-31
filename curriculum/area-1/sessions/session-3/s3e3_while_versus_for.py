"""While Versus For — the same hexagon, twice, and when to use which.

Both loops below draw an identical hexagon. Neither is cleverer than the other.
The difference is what you knew when you started writing it:

    for   you know HOW MANY TIMES before you begin
    while you know WHEN TO STOP, and the count falls out of it

Almost every counted loop should be a `for`. Almost every "keep going until"
loop has to be a `while`. Using `while` where `for` would do is how you write
an infinite loop by accident, because you have taken on all three of the rules
from s3e1 for no reason.

Run:  py -3.14 s3e3_while_versus_for.py
"""
# concepts: while, for, range, comparison-operators, variables, int, print
# dc: 12
# expect: ok
# min-strokes: 12

import turtle

turtle.speed(0)

# --- the for version ---
turtle.color("blue")
for side in range(6):
    turtle.forward(70)
    turtle.left(60)

turtle.penup()
turtle.forward(160)
turtle.pendown()

# --- the while version, doing exactly the same work ---
turtle.color("red")
side = 0
while side < 6:
    turtle.forward(70)
    turtle.left(60)
    side = side + 1

print("two hexagons. Count the lines of code that made each one.")
print("for  : 3 lines")
print("while: 5 lines, and two of them are bookkeeping you have to get right")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. In the `while` version, name the two lines that exist only to keep the
#    counter going. The `for` version does that work for you, invisibly.
#
# 2. Delete `side = side + 1` from the while version and predict what happens.
#    Then decide whether to run it. If you do, have the terminal window ready.
#
# 3. Change `side < 6` to `side <= 6` and run it. You get a seven-sided
#    six-sided shape. Look at the picture and find the extra line.
#
# 4. Here is the real question, and it is the point of the file:
#    "Draw lines until the turtle has traveled more than 1000 pixels."
#    Which loop would you use, and why can the other one not do it cleanly?
#    Write your answer in the Journal in one sentence.
#
# 5. CHOICE BOARD:
#      a. write a third hexagon, in green, using range with a start and a stop
#      b. make the two hexagons different sizes without touching the 70 twice
#      c. put them on top of each other, offset by 30 degrees
# -----------------------------------------------------------------------------


turtle.done()
