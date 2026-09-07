"""Broken Sigil 4 — Out of Line

Broken on purpose. Predict first, then run.

In Python, blank space at the start of a line is not decoration. It means something.

Run:  py -3.14 b4_out_of_line.py
"""
# concepts: reading-errors
# dc: 8
# expect: IndentationError

import turtle

turtle.forward(100)
    turtle.left(90)
turtle.forward(100)

turtle.done()
