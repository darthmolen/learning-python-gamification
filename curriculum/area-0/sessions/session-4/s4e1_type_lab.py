"""The Type Lab — four kinds of thing, and how to ask which is which.

Python has more kinds of value than four, but these are the four you now own:

    int     a whole number                 120        -3        0
    float   a number with a fractional part 1.5       33.33     2.0
    str     text, always in quotes         "red"      "120"     ""
    bool    a yes or a no, nothing else    True       False

type(x) tells you which kind x is. It is an instrument, like print. Programmers
reach for it constantly, and not only while they are learning.

BEFORE YOU RUN THIS: for each numbered line below, write down on paper what you
think prints. All thirteen. Being wrong is the point; a wrong prediction you wrote
down teaches you something, and a wrong prediction you kept in your head does not.

Run:  py -3.14 s4e1_type_lab.py
"""
# concepts: int, float, str, bool, print, variables
# dc: 12
# expect: ok

import turtle

print(" 1.", type(120))
print(" 2.", type(1.5))
print(" 3.", type("120"))
print(" 4.", type(True))

print(" 5.", 100 + 100)
print(" 6.", "100" + "100")
print(" 7.", type(100 + 100), type("100" + "100"))

print(" 8.", 100 / 4)
print(" 9.", type(100 / 4))

print("10.", 50 > 100)
print("11.", type(50 > 100))

# The turtle does not mind a float. Watch.
turtle.forward(100 / 3)
turtle.left(120)
turtle.forward(100 / 3)
turtle.left(120)
turtle.forward(100 / 3)

print("12. drew three sides of", 100 / 3, "which is a", type(100 / 3))
print("13. pen down?", turtle.isdown(), "which is a", type(turtle.isdown()))


# --- YOUR MOVE ---------------------------------------------------------------
# Answer these by experiment, not by asking. Every one is a print away.
#
#   1. Line 5 and line 6 use the same + symbol and do two different jobs.
#      What decides which job it does?
#
#   2. 100 / 4 is 25, a whole number. Why did line 9 not say int?
#      Find the OTHER division operator that does say int. It is one character
#      different. What does it give for 100 and 3?
#
#   3. What is type(int("120"))? What is type(str(120))? What is int("12.5")?
#      Predict all three first. The third one is not what you expect.
#
#   4. What is True + True? Predict. Then run it. Then decide whether you
#      approve of the answer.
# -----------------------------------------------------------------------------


turtle.done()
