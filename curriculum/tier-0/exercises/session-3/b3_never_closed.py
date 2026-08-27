"""Broken Sigil 3 — Never Closed

Broken on purpose. Predict first, then run.

Two things to watch for, and neither of them is the missing bracket:

  1. Does the turtle window open at all, even for a moment?
     Compare with what b1 did.
  2. Does the error look like the others? Count the lines. Is the word
     "Traceback" anywhere in it?

Run:  py -3.14 b3_never_closed.py
"""
# concepts: reading-errors
# dc: 8
# expect: SyntaxError

import turtle

turtle.forward(100
turtle.left(90)
turtle.forward(100)

turtle.done()
