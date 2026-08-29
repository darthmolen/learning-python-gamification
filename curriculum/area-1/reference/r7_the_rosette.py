"""Datamine payload — s7e3 choice board a and b: growing copies, own colour each.

Unlocks: s7e3_the_rosette.py, choices (a) and (b) together.

Two separate stalls hide in this one file and they are worth separating before
showing it:

**(a) growing copies.** The outer counter is right there and he is not using it.
`length = 30 + copy * 6` is the whole answer, and the question that gets him
there is *"what number is different on every copy, and where is it already?"*

**(b) a colour per copy.** He reaches for a ladder of `elif`s, which works and
is long. The ladder here is deliberately short and uses bands rather than one
rung per copy, because one rung per copy is the version that teaches him nothing
and takes twenty minutes to type.

Run:  py -3.14 r7_the_rosette.py
"""
# concepts: nesting, accumulator-pattern, for, range, if, elif, else, comparison-operators, variables, int, float, print
# dc: 16
# expect: ok
# strokes: 72

import turtle

turtle.speed(0)
turtle.pensize(2)

copies = 12
sides = 6

turn_within = 360 / sides
turn_between = 360 / copies

ink = 0

for copy in range(copies):
    if copy < copies / 3:
        turtle.color("mediumvioletred")
    elif copy < copies * 2 / 3:
        turtle.color("darkorange")
    else:
        turtle.color("darkcyan")

    length = 30 + copy * 6

    for side in range(sides):
        turtle.forward(length)
        turtle.left(turn_within)
        ink = ink + length

    turtle.left(turn_between)

print("copies      :", copies)
print("sides each  :", sides)
print("lines drawn :", copies * sides)
print("ink used    :", ink, "pixels")

# Three things to say out loud, in this order:
#
# 1. `length` is worked out from `copy`, so it is different on every copy and
#    nobody typed twelve numbers. Ask him what happens if he changes `copies`
#    to 30. Then have him do it.
#
# 2. The band edges are `copies / 3` and `copies * 2 / 3`, not 4 and 8. Ask
#    which version still works when `copies` changes. That is the difference
#    between a drawing and a generator and it is the whole of Boss 1.
#
# 3. `ink` is the accumulator from session 8 arriving one session early, in the
#    innermost loop. Ask him how many times that line runs. It is not 12.


turtle.done()
