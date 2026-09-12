"""The Staircase — a variable can be given a new value.

    step = step + 20

That line is not maths. It is not a claim that a number equals itself plus 20,
which would be false. It is an order, and it happens left-to-right in two beats:

    1. work out what step + 20 is, using the value the variable step has RIGHT NOW
    2. point the variable step at that new value instead

The old value is gone. Nothing else in the program changed.

Run:  py -3.14 p2e2_the_staircase.py
"""
# concepts: variables, int, print
# dc: 10
# expect: ok

import turtle

step = 20

turtle.forward(step)
turtle.left(90)
print("step is now", step)

step = step + 20
turtle.forward(step)
turtle.right(90)
print("step is now", step)

step = step + 20
turtle.forward(step)
turtle.left(90)
print("step is now", step)

step = step + 20
turtle.forward(step)
turtle.right(90)
print("step is now", step)

step = step + 20
turtle.forward(step)
print("step is now", step)


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Predict the last printed value BEFORE you run it. Write it down. Check.
#
# 2. Add two more stairs. Notice exactly how much typing that took.
#    Remember the feeling. In the future you will learn the line that deletes it.
#
# 3. Make the staircase shrink instead of grow.
#
# 4. Harder: make each step 1.5 times the one before instead of 20 longer.
#    Run it. The numbers printed will start to look different from the others.
#    Do not fix that. Practice 4 is about why.
# -----------------------------------------------------------------------------


turtle.done()
