"""b2 — The Loop That Never Ends.

Broken on purpose. Do not fix it before the session.

You have met this shape of bug already, in session 3, and you were told what it
was before you ran it. This time nobody told you.

Read it first. Say what will happen. Then run it, and have the terminal window
ready -- Ctrl-C is your key out.

Run:  py -3.14 b2_the_loop_that_never_ends.py
"""
# concepts: while, comparison-operators, reading-errors, variables, int, print
# dc: 10
# expect: hangs
# timeout-seconds: 6      the Tk canvas fills up if a runaway turtle runs much longer

import turtle

turtle.speed(0)
turtle.color("darkorange")

height = 0
steps = 0

print("climbing a staircase until it is 200 tall")

while height < 200:
    turtle.forward(20)
    turtle.left(90)
    turtle.forward(20)
    turtle.right(90)
    steps = steps + 1

print("staircase finished:", steps, "steps,", height, "tall")


# --- THE QUESTIONS ------------------------------------------------------------
# 1. Which of the three rules from session 3 does this break?
#      1. the variable exists before the loop
#      2. the condition can be False
#      3. something inside the body changes the variable the condition asks about
# 2. This file HAS a line that changes a variable, every single time round.
#    Why does that not save it? Name the two variables and say which one the
#    condition is actually asking about.
# 3. The obvious "fix" is to delete the loop. That is not a fix. Say why.
# 4. Fix it by adding ONE line inside the loop.
# 5. Once it is fixed: how many steps does it draw? Predict, then check.
# -----------------------------------------------------------------------------


turtle.done()
