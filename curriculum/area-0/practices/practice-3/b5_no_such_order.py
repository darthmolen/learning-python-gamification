"""Broken Sigil 5 — No Such Order

Broken on purpose.

This one is close to b1, but it is NOT the same error. Work out why.
Python 3.14 also offers you a guess. Notice that it does not fix anything for you.
"""
# concepts: reading-errors
# dc: 10
# expect: AttributeError

import turtle

turtle.forward(100)
turtle.forwrd(100)

turtle.done()


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Say out loud what you think will happen. Do not run it yet.
# 2. Run it:  py -3.14 b5_no_such_order.py
# 3. Read the error. Write its NAME and its LINE NUMBER in error-log.md.
# 4. Fix it, and run it again to watch the sigil finish.
# -----------------------------------------------------------------------------
