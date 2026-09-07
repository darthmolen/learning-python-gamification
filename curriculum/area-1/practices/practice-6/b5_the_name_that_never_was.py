"""b5 — The Name That Never Was.

Broken on purpose. Do not fix it before the session.

This one crashes with an error you know well from Area 0. The error is easy.
The reason is not, and the reason is the whole file.

The name it complains about is right there in the code, three lines above,
spelled correctly.

Run:  py -3.14 b5_the_name_that_never_was.py
"""
# concepts: for, range, reading-errors, int, variables, print
# dc: 12
# expect: NameError

import turtle

turtle.speed(0)
turtle.color("maroon")

sides = 0

print("drawing", sides, "sides")

for side in range(sides):
    turtle.forward(80)
    turtle.left(90)

print("the last side drawn was number", side)


# --- THE QUESTIONS ------------------------------------------------------------
# 1. Read the error. Which name is it complaining about?
# 2. That name is spelled correctly and it is right there in the file. So when
#    does a name in a `for` line actually get created?
# 3. How many times did the loop body run? What is `range(0)`?
# 4. Notice what did NOT happen: the loop did not complain about running zero
#    times. It never does. A loop that runs zero times is a completely normal,
#    completely silent thing, and it is one of the three ways an Area 1 program
#    goes wrong without saying anything.
# 5. Fix it. There are two different fixes depending on what you think the
#    author meant. Say both out loud, pick one, and say why.
# -----------------------------------------------------------------------------


turtle.done()
