"""Never Closed — the error that arrives before the program starts.

Broken sigil 3, from session 3. Something is missing on one line and Python
never gets as far as running anything.

Two things to notice before you fix it, and neither is the missing bracket:

  1. Nothing draws at all. Not even the first order. Compare that with what
     The Typo did.
  2. The error does not look like the others. Count its lines. Is the word
     "Traceback" anywhere in it?

Run:  py -3.14 solution.py
"""

import turtle

turtle.forward(100
turtle.left(90)
turtle.forward(100)


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Run it. Write down the error's NAME and the line number it points at.
#    Then look at the line ABOVE the one it points at.
#
# 2. Close what was never closed. Leave all three orders in place — two sides
#    and the corner between them.
# -----------------------------------------------------------------------------


turtle.done()
