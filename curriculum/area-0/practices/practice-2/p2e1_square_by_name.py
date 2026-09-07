"""Square By Name — one number, one place.

Last session you drew shapes by typing numbers directly into the orders.
That works right up until you want to change the size, and then you have to
find and edit every single one. Miss one and the shape does not close.

A variable is a name for a value. Write the number once, use the name everywhere.

Run:  py -3.14 s2e1_square_by_name.py
"""
# concepts: variables, int, print
# dc: 8
# expect: ok

import turtle

side = 120

turtle.forward(side)
turtle.left(90)
turtle.forward(side)
turtle.left(90)
turtle.forward(side)
turtle.left(90)
turtle.forward(side)
turtle.left(90)

print("drew a square of side", side)


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Change the square's size by editing exactly ONE character. Do it twice.
#
# 2. Now make it a rectangle. You will need a second name. Choose it yourself;
#    "side" is no longer a good name for either number, so rename that too.
#
# 3. Make the rectangle exactly twice as wide as it is tall, in a way that
#    stays true when you change the height. Only ONE number should be editable.
#
# 4. Print the perimeter of your rectangle. Do not type the answer. Compute it.
# -----------------------------------------------------------------------------


turtle.done()
