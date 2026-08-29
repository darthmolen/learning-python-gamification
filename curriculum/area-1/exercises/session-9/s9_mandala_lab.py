"""The Mandala Lab — starter file.

This file runs. It draws one plain ring and prints one number. That is all it
does, and everything past that is yours.

Read mandala-brief.md first. Then delete anything in here you do not want,
including this docstring.

Run:  py -3.14 s9_mandala_lab.py
"""
# concepts: nesting, accumulator-pattern, for, range, if, else, comparison-operators, variables, int, float, print
# dc: 18
# expect: ok
# strokes: 60

import turtle

# --- THE DIALS ---------------------------------------------------------------
# Two, at minimum, and they must be named. Turn them at the end and check the
# picture still looks deliberate. That is the test the boss is judged on.
copies = 12
sides = 5
# -----------------------------------------------------------------------------

turtle.speed(0)
turtle.pensize(2)
turtle.color("black")

turn_within = 360 / sides
turn_between = 360 / copies

ink = 0

for copy in range(copies):
    for side in range(sides):
        turtle.forward(40)
        turtle.left(turn_within)
        ink = ink + 40
    turtle.left(turn_between)

print("copies:", copies, " sides:", sides, " ink:", ink)


# --- THE ORDERS YOU OWN -------------------------------------------------------
# Movement       forward(n)  backward(n)  left(deg)  right(deg)  goto(x, y)
#                home()  setheading(deg)  circle(r)
# The pen        penup()  pendown()  pensize(n)  color("name")
# Speed          speed(0)          ...and, if you need it:
#                tracer(0) near the top, update() just before done()
# Asking         position()  heading()  isdown()
# Text           write(text, False, "center", ("Arial", 20, "bold"))
# Python         for x in range(a, b, c):      while question:
#                if / elif / else       and  or  not
#                >  <  >=  <=  ==  !=
#                total = total + n      print(...)  input("...")  int(...)
#                f"...{...}..."
# -----------------------------------------------------------------------------


turtle.done()
