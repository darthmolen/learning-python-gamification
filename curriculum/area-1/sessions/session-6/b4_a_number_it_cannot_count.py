"""b4 — A Number It Cannot Count.

Broken on purpose. Do not fix it before the session.

This crashes, and the error is one you have met in another disguise. The
message is short and it says exactly what is wrong, which is more than you will
usually get.

The interesting part is not the error. It is that the author of this file was
being *sensible*: they worked out a number and handed it to `range`, which is
what you would do.

Run:  py -3.14 b4_a_number_it_cannot_count.py
"""
# concepts: for, range, reading-errors, int, float, variables, print
# dc: 12
# expect: TypeError

import turtle

turtle.speed(0)
turtle.color("indigo")

sides = 8
turn = 360 / sides

print("turn is", turn)
print("drawing", sides, "sides")

for side in range(360 / turn):
    turtle.forward(70)
    turtle.left(turn)

print("finished")


# --- THE QUESTIONS ------------------------------------------------------------
# 1. Read the last line of the error. What kind of thing does `range` insist on?
# 2. `360 / turn` is 8. Print it. Print `type(360 / turn)` as well. It is 8,
#    and it is still the wrong kind of 8. Which of Area 0's four kinds is it?
# 3. Which single operator, changed, fixes this? (There is a division that
#    always gives a whole number. You have seen it in the orders list.)
# 4. There is also a much simpler fix that does not need a new operator at all,
#    because the right number is already sitting in a variable. Find it. Which
#    of the two fixes would you rather read in a month?
# -----------------------------------------------------------------------------


turtle.done()
