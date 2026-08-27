"""Broken Sigil 5 — No Such Order

Broken on purpose. Predict first, then run.

This one is close to b1, but it is NOT the same error. Work out why.
Python 3.14 also offers you a guess. Notice that it does not fix anything for you.

Run:  py -3.14 b5_no_such_order.py
"""
# concepts: reading-errors
# dc: 10
# expect: AttributeError

import turtle

turtle.forward(100)
turtle.forwrd(100)

turtle.done()
