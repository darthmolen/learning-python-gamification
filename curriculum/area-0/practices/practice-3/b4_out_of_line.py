"""Broken Sigil 4 — Out of Line

Broken on purpose.

In Python, blank space at the start of a line is not decoration. It means something.
"""
# concepts: reading-errors
# dc: 8
# expect: IndentationError

import turtle

turtle.forward(100)
    turtle.left(90)
turtle.forward(100)

turtle.done()


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Say out loud what you think will happen. Do not run it yet.
# 2. Run it:  py -3.14 b4_out_of_line.py
# 3. Read the error. Write its NAME and its LINE NUMBER in error-log.md.
# 4. Fix it, and run it again to watch the sigil finish.
# -----------------------------------------------------------------------------
