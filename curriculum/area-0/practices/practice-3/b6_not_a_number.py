"""Broken Sigil 6 — Not a Number

Broken on purpose.

int() turns text into a number. Usually.
"""
# concepts: reading-errors, int, str
# dc: 10
# expect: ValueError

import turtle

size = int("ten")
turtle.forward(size)

turtle.done()


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Say out loud what you think will happen. Do not run it yet.
# 2. Run it:  py -3.14 b6_not_a_number.py
# 3. Read the error. Write its NAME and its LINE NUMBER in error-log.md.
# 4. Fix it, and run it again to watch the sigil finish.
# -----------------------------------------------------------------------------
