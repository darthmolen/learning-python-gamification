"""Pen and Colour — the turtle drags a pen. The pen can be lifted.

Four new orders:
  turtle.penup()        stop drawing, but keep moving
  turtle.pendown()      start drawing again
  turtle.pensize(8)     thickness, in pixels
  turtle.color("red")   colour of the line

Run:  py -3.14 s1e3_pen_and_colour.py
"""
# concepts: print, str, bool
# dc: 8
# expect: ok

import turtle

turtle.pensize(6)

turtle.color("red")
turtle.forward(80)

turtle.penup()
turtle.forward(30)
turtle.pendown()

turtle.color("orange")
turtle.forward(80)

turtle.penup()
turtle.forward(30)
turtle.pendown()

turtle.color("gold")
turtle.forward(80)

print("pen is down:", turtle.isdown())
print("pen size is:", turtle.pensize())


# --- YOUR MOVE ---------------------------------------------------------------
# Pick ONE:
#
#   (a) carry the stripe on through green, blue and purple
#   (b) make each stripe thicker than the last
#   (c) turn 90 degrees between stripes instead of going straight
#   (d) draw a dashed line that goes all the way round a square
#
# Colours that work: any of "red" "orange" "gold" "green" "blue" "purple"
# "black" "white" "cyan" "magenta" "brown" "pink" "gray".
# A colour name Python does not know is an error. Try one on purpose, once,
# and read what it says. That is the whole of session 3 in advance.
# -----------------------------------------------------------------------------


turtle.done()
