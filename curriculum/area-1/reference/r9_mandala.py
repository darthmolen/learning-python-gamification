"""Datamine payload — a complete, honest Area 1 mandala.

Unlocks: session 9, and ONLY after two real attempts and a written sentence.

Show this one whole, or not at all. A half-revealed mandala is worse than none,
because the half they get is always the half they already had.

**Read this before you show it.** Everything in it is Area 1 vocabulary and
nothing else. No functions, no lists, no random, no modulo. That is deliberate:
if the reference solution uses something they have not met, it teaches them that
the good version was out of their reach, which is the opposite of the message.

It is three rings and about forty lines. Every one of the mandala brief's seven
requirements is in here exactly once, so it doubles as the checklist.

Run:  py -3.14 r9_mandala.py
"""
# concepts: nesting, accumulator-pattern, for, while, range, if, elif, else, comparison-operators, boolean-operators, variables, int, float, print
# dc: 18
# expect: ok
# min-strokes: 100

import turtle

# --- THE DIALS ---------------------------------------------------------------
petals = 12
sides = 5
# -----------------------------------------------------------------------------

turtle.speed(0)
turtle.tracer(0)

turn_between = 360 / petals
turn_within = 360 / sides

lines = 0
ink = 0

# Ring 1 -- the petals. Each one a little larger than the last: an accumulator
# whose value is the drawing rather than a note about it.
length = 22
for petal in range(petals):
    if petal < petals / 2:
        turtle.color("mediumvioletred")
    else:
        turtle.color("darkorange")
    turtle.pensize(2)
    for side in range(sides):
        turtle.forward(length)
        turtle.left(turn_within)
        lines = lines + 1
        ink = ink + length
    turtle.left(turn_between)
    length = length + 3

# Ring 2 -- ticks around the outside. Twice as many as there are petals, and
# every third one longer, so the ring has a rhythm rather than a texture.
turtle.color("darkslategray")
turtle.pensize(1)
ticks = petals * 3
for tick in range(ticks):
    if tick < ticks / 3:
        reach = 18
    elif tick < ticks * 2 / 3:
        reach = 11
    else:
        reach = 18
    turtle.penup()
    turtle.home()
    turtle.setheading(tick * 360 / ticks)
    turtle.forward(150)
    turtle.pendown()
    turtle.forward(reach)
    lines = lines + 1
    ink = ink + reach

# Ring 3 -- the boundary. A while loop, because the stopping rule is a size and
# not a count: keep adding rings inward until they get too small to see.
turtle.color("black")
turtle.pensize(3)
radius = 185.0
while radius > 140:
    turtle.penup()
    turtle.home()
    turtle.setheading(0)
    turtle.forward(radius)
    turtle.left(90)
    turtle.pendown()
    turtle.circle(radius)
    lines = lines + 1
    ink = ink + radius * 6
    radius = radius * 0.88

turtle.penup()
turtle.home()
turtle.update()

print(f"petals {petals}, sides {sides}, ticks {ticks}")
print(f"lines drawn {lines}, ink about {int(ink)} pixels")

# What to say while they read it, in this order:
#
# 1. "Find the two dials. Change one. Run it." Do this FIRST, before any
#    explanation. The point of the file is that it survives being turned.
#
# 2. "Which lines are in which loop?" Make them point. Three of the rings are
#    nested two deep and one is nested one deep, and the indentation is the
#    only thing that says so.
#
# 3. "Where does `length` change, and why is it not inside the inner loop?"
#    That is the accumulator, and it is the one thing here they are most likely
#    to have put in the wrong place.
#
# 4. tracer(0) and update() are equipment, not a concept. They have earned them by
#    having a drawing slow enough to need them. Say that out loud.


turtle.done()
