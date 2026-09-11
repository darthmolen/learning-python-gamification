"""Broken Sigil 2 — The Wrong Kind of Thing

Broken on purpose.

The number 100 and the text "100" look the same on the page.
Python does not think they are the same at all.
"""
# concepts: reading-errors, str, int
# dc: 8
# expect: TypeError

import turtle

turtle.forward("100")

turtle.done()


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Say out loud what you think will happen. Do not run it yet.
# 2. Run it:  py -3.14 b2_wrong_kind.py
# 3. Read the error. Write its NAME and its LINE NUMBER in error-log.md.
# 4. Fix it, and run it again to watch the sigil finish.
# -----------------------------------------------------------------------------
