"""The Perimeter — write the number once, compute the rest.

This is the rectangle from session 2, and it is already wrong in the way
session 2 warned you about: the size is typed into four different orders, so
changing it means finding and editing every one. Miss one and it does not close.

Run:  py -3.14 solution.py
"""

import turtle

turtle.forward(120)
turtle.left(90)
turtle.forward(60)
turtle.left(90)
turtle.forward(120)
turtle.left(90)
turtle.forward(60)
turtle.left(90)

print("perimeter:", 360)


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Give the height a name, and set it once at the top.
#
# 2. Make the width exactly twice the height, in a way that stays true when you
#    change the height. There should be exactly ONE number you can edit.
#
# 3. Draw the rectangle using those names, not typed numbers.
#
# 4. Print the perimeter in this exact shape:
#
#        perimeter: 360
#
#    Do not type the answer. Compute it from the names. If somebody changes
#    your height to 50, the printed number has to change with it.
# -----------------------------------------------------------------------------


turtle.done()
