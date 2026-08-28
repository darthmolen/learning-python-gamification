"""Broken Sigil 2 — The Wrong Kind of Thing

Broken on purpose. Predict first, then run.

The number 100 and the text "100" look the same on the page.
Python does not think they are the same at all.

Run:  py -3.14 b2_wrong_kind.py
"""
# concepts: reading-errors, str, int
# dc: 8
# expect: TypeError

import turtle

turtle.forward("100")

turtle.done()
