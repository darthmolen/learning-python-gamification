"""REFERENCE -- Datamine payload for s5e1 tasks 3 and 4. The DM's copy.

Do not put this on the learner's machine. See README.md in this directory for the rules
that come with unlocking it.

Run:  py -3.14 r5_ask_and_draw.py
"""
# concepts: input, str, int, f-strings, variables, print
# dc: 12
# expect: ok
# stdin: 120 | blue | 4

import turtle

size = int(input("How long should each side be? "))
shade = input("What colour? ")
sides = int(input("How many sides? "))

turn = 360 / sides

print(f"A {sides}-sided shape needs a turn of {turn} degrees at each corner.")
print(f"That is {turn * sides} degrees of turning in total, which is one full circle.")
print(f"Drawing four sides of it in {shade}, because four is all I can do without a loop.")

turtle.pensize(4)
turtle.color(shade)

turtle.forward(size)
turtle.left(turn)
turtle.forward(size)
turtle.left(turn)
turtle.forward(size)
turtle.left(turn)
turtle.forward(size)
turtle.left(turn)

print(f"Done. Four sides of {size}, turning {turn} each time.")


# Notes for the DM, not for the learner:
#
# * `shade` is not converted, and they should be able to say why: turtle.color
#   wants text, and input already hands back text. The conversion in int() is
#   not a ritual you perform on every input -- it is a conversion you do when
#   the kind you have is not the kind you need.
#
# * The name is `shade` rather than `color` on purpose. Naming a variable
#   `color` shadows nothing here, but it will confuse the two the moment they
#   read the line back. Worth mentioning only if they ask.
#
# * `turn` is a float even when it divides evenly -- 360 / 4 is 90.0. That is
#   session 4 resurfacing on its own, which is what concept tags are for.
#
# * This only draws four sides no matter what was asked for, and says so out
#   loud rather than pretending. Being honest in the output about a limitation
#   is better craft than hiding it, and Area 1 removes the limitation.

turtle.done()
