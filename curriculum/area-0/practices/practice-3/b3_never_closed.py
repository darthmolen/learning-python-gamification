"""Broken Sigil 3 — Never Closed

Broken on purpose.

Two things to watch for while you run it, and neither of them is the missing bracket:

  - Does the turtle window open at all, even for a moment? Compare with what b1 did.
  - Does the error look like the others? Count the lines. Is the word "Traceback"
    anywhere in it?
"""
# concepts: reading-errors
# dc: 8
# expect: SyntaxError

import turtle

turtle.forward(100
turtle.left(90)
turtle.forward(100)

turtle.done()


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Say out loud what you think will happen. Do not run it yet.
# 2. Run it:  py -3.14 b3_never_closed.py
# 3. Read the error. Write its NAME and its LINE NUMBER in error-log.md.
# 4. Fix it, and run it again to watch the sigil finish.
# -----------------------------------------------------------------------------
