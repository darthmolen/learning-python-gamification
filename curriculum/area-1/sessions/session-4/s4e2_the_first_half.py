"""The First Half — an `if` inside a loop, which is where it gets useful.

An `if` on its own is a fork in the road. An `if` inside a loop is a fork the
program takes over and over, answering the question fresh each time, and that
is what makes a picture look designed instead of repeated.

The counter is the thing being asked about. `side` is 0, then 1, then 2... so
"is this side in the first half?" has a different answer as the loop runs.

Watch the indentation. There are now three levels in this file and each one
means something:

    no indent      the program
    one indent     inside the loop
    two indents    inside the if, inside the loop

Run:  py -3.14 s4e2_the_first_half.py
"""
# concepts: if, else, comparison-operators, for, range, bool, variables, int, print
# dc: 12
# expect: ok
# min-strokes: 12

import turtle

turtle.speed(0)
turtle.pensize(4)

sides = 12
turn = 360 / sides

for side in range(sides):
    if side < 6:
        turtle.color("red")
        print("side", side, "is in the first half")
    else:
        turtle.color("black")
        print("side", side, "is not")
    turtle.forward(60)
    turtle.left(turn)

print("six red, six black, one loop, one question asked twelve times")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. The `turtle.forward` line is inside the loop but NOT inside the if or the
#    else. Point at it with your finger and count the spaces. Why does it have
#    to be where it is? What would happen if it were indented one level more?
#    Try it -- that one is worth breaking on purpose.
#
# 2. Change `side < 6` to `side < 3`. Then `side < 11`. Then `side < 0`.
#    That last one draws an all-black shape and no error appears anywhere.
#
# 3. Change 12 to 20 sides and run it. The colors no longer split evenly,
#    because the 6 is now a lie. Fix it so the split stays even whatever
#    `sides` is set to. One number becomes a small sum.
#
# 4. Add a print AFTER the loop that says how many sides were red. Do not count
#    by eye. Make the program count -- you did this in s3e2 and you will do it
#    properly in session 8.
#
# 5. CHOICE BOARD:
#      a. make the first half thick and the second half thin as well as
#         colored
#      b. make only the very first side red and everything else black
#      c. make the length of each side depend on which half it is in
# -----------------------------------------------------------------------------


turtle.done()
