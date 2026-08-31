"""Two Roads — the program takes one path or the other.

Everything you have written so far does the same thing every time. `if` is the
first order that lets a program do something different depending on what it
finds.

    if size > 100:
        turtle.color("red")
    else:
        turtle.color("blue")

The `if` line ends in a colon and asks a question. The indented block under it
runs only when the answer is True. The `else` block runs only when it is False.
Exactly one of them runs. Never both, never neither.

The question is a comparison and you met all six in session 3. What comes out of
a comparison is a `bool` -- True or False -- which is the fourth kind of thing
from Area 0, finally with a job.

Run:  py -3.14 s4e1_two_roads.py
"""
# concepts: if, else, comparison-operators, bool, variables, int, print
# dc: 10
# expect: ok
# min-strokes: 4

import turtle

turtle.speed(0)
turtle.pensize(3)

size = 140

print("size is", size)
print("the question 'size > 100' answers:", size > 100)
print("and that answer is a", type(size > 100))

if size > 100:
    print("taking the first road")
    turtle.color("red")
else:
    print("taking the second road")
    turtle.color("blue")

for side in range(4):
    turtle.forward(size)
    turtle.left(90)

print("the square is drawn. Only one of the two roads printed.")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Change `size` to 40 and run it. Which road printed this time? Was the
#    square a different color? Say why, using the word "False".
#
# 2. Change `size` to exactly 100 and predict which road runs BEFORE you run
#    it. Then change `>` to `>=` and predict again. This is the boundary and
#    it is where nearly every `if` bug in the world lives.
#
# 3. Delete the `else:` and its indented line. Run it. Does it still work?
#    What color is the square when size is 40, and where did that color come
#    from? An `if` with no `else` is legal and often right.
#
# 4. Type `if size = 100:` on purpose and run it. Read the error. Python is
#    telling you the difference between giving a name and asking a question.
#    Then fix it back.
#
# 5. CHOICE BOARD:
#      a. make the pen thick for big squares and thin for small ones
#      b. put a second, separate `if` after the first that prints "that is a
#         big square" only when size is over 200
#      c. make it draw a square when size is over 100 and a triangle when it
#         is not (you will need the polygon engine's turn rule)
# -----------------------------------------------------------------------------


turtle.done()
