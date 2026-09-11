"""Broken Sigil 7 — No Error At All

This one is the important one.

It is broken. Python is perfectly happy with it. There is no error, no red text,
no traceback, and the program exits with a smile.
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


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Say out loud what you think will happen. Do not run it yet.
# 2. Run it:  py -3.14 b7_no_error_at_all.py
# 3. Nothing goes wrong. Say what is wrong anyway, out loud, in one sentence.
# 4. Write that sentence in error-log.md where the error's name would have gone,
#    then fix it.
# -----------------------------------------------------------------------------
