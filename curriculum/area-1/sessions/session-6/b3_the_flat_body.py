"""b3 — The Flat Body.

Broken on purpose. Do not fix it before the session.

This one does crash, and it crashes before anything runs at all. No window
opens. Not a flicker. You worked out why that happens in Area 0 session 3 and
the reason has not changed.

Run:  py -3.14 b3_the_flat_body.py
"""
# concepts: for, range, reading-errors, int, print
# dc: 8
# expect: IndentationError

import turtle

turtle.speed(0)
turtle.color("seagreen")

print("drawing a triangle")

for side in range(3):
turtle.forward(120)
turtle.left(120)

print("triangle finished")


# --- THE QUESTIONS ------------------------------------------------------------
# 1. Read the last line of the error out loud. All of it.
# 2. Which line number does it name? Is that the line that is wrong, or the
#    line where Python noticed?
# 3. Did a window open? Did anything print? Why not -- what had to happen
#    before line one could run?
# 4. This error and b1's silence are the two ends of Area 1. Which of the two
#    would you rather have, and why?
# -----------------------------------------------------------------------------


turtle.done()
