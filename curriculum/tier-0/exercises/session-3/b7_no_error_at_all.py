"""Broken Sigil 7 — No Error At All

This one is the important one.

It is broken. Python is perfectly happy with it. There is no error, no red text,
no traceback, and the program exits with a smile.

Run it. Look at the window. Then explain what is wrong.

Run:  py -3.14 b7_no_error_at_all.py
"""
# concepts: reading-errors, variables
# dc: 12
# expect: ok

import turtle

side = 120

turtle.forward(side)
turtle.left(80)
turtle.forward(side)
turtle.left(80)
turtle.forward(side)
turtle.left(80)
turtle.forward(side)
turtle.left(80)

print("Four sides, four turns. Square finished.")

turtle.done()
