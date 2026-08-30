"""REFERENCE -- Datamine payload for Commission A. The DM's copy.

Do not put this on the learner's machine. See README.md in this directory for the rules
that come with unlocking it.

This is what a good Area 0 answer looks like: it uses nothing the learner has
not been taught, no clever tricks, and every name means something. If their own
version is messier than this but works, theirs is better, because it is theirs.

Run:  py -3.14 r6_nameplate.py
"""
# concepts: print, variables, int, float, str, input, f-strings
# dc: 18
# expect: ok
# stdin: Ada | Blacksmith | 360 | gold

import turtle

owner = input("Whose nameplate is this? ")
title = input("And their title? ")
width = int(input("How wide, in pixels? "))
frame_colour = input("What colour should the frame be? ")

height = width / 3
edging = width * 2 + height * 2

print(f"Plate for {owner}, {title}.")
print(f"{width} wide by {height} tall, so {edging} pixels of {frame_colour} edging.")

turtle.speed(0)
turtle.pensize(8)
turtle.color(frame_colour)

turtle.penup()
turtle.goto(0 - width / 2, 0 - height / 2)
turtle.pendown()

turtle.forward(width)
turtle.left(90)
turtle.forward(height)
turtle.left(90)
turtle.forward(width)
turtle.left(90)
turtle.forward(height)
turtle.left(90)

turtle.penup()
turtle.goto(0, 10)
turtle.color("black")
turtle.write(f"{owner}", False, "center", ("Arial", 28, "bold"))

turtle.goto(0, 0 - 30)
turtle.write(f"{title}", False, "center", ("Arial", 14, "normal"))

print("Plate finished.")


# Notes for the DM, not for the learner:
#
# * `0 - width / 2` rather than `-width / 2` is deliberate. Unary minus on an
#   expression is not something Area 0 has been shown, and writing it the long
#   way costs nothing and keeps every line inside their vocabulary. If they write
#   `-width / 2` themselves, that is them reaching, and it is correct -- say so.
#
# * The plate still does not resize itself around a long title. Neither does
#   theirs. That is an Area 1 problem and fine to leave standing; if they ask
#   how, the honest answer is "you need a way to ask how long the text is, and
#   a way to decide -- you get both soon".
#
# * `edging` is computed, not typed. The brief requires exactly one number that
#   the program worked out rather than was told, and this is it.

turtle.done()
