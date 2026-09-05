"""The Shape Dial — the machine, with a person on the other end of it.

s1e3 had one number at the top and you turned it by editing the file. That is
fine for you. It is useless for anybody else, because nobody else is going to
open your file and edit it.

`input` was Area 0. Put the two together and the file stops being yours.

There is one trap and you have met it before: `input` always hands back a `str`,
even when the person typed a number. `int(...)` is the fix, and forgetting it
gives you a TypeError you have seen in Area 0 session 3.

Run:  py -3.14 s2e3_the_shape_dial.py
"""
# concepts: for, range, variables, int, float, input, f-strings, print
# dc: 12
# expect: ok
# min-strokes: 7
# stdin: 7 | 90

import turtle

sides = int(input("How many sides? "))
length = int(input("How long is each side? "))

turn = 360 / sides

print(f"Drawing {sides} sides of {length}, turning {turn} degrees each time.")
print(f"That is {sides * length} pixels of line in total.")

turtle.speed(0)
turtle.pensize(3)
turtle.color("crimson")

for side in range(sides):
    turtle.forward(length)
    turtle.left(turn)

print("done")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Run it and answer 5 and 120. Then 12 and 40. Then 3 and 200.
#
# 2. Run it and answer "seven" to the first question. Read the error. You have
#    seen it before -- which quest was it in Area 0? What was wrong
#    there, and is it the same thing wrong here?
#
# 3. Run it and answer 1. Then 0. One of those crashes and one of those does
#    something strange but legal. Predict which is which before you try.
#    Write both answers in the Journal. You cannot fix either of them tonight,
#    and in session 5 you can fix both.
#
# 4. The line that prints the total pixels works out a number rather than being
#    told one. Add another like it: how far round does the turtle turn in
#    total? Print it. It should be the same every single time, whatever the
#    person answers, and if it is not then something is wrong.
#
# 5. CHOICE BOARD:
#      a. ask for a color as well, and use it
#      b. ask how many shapes, and draw that many, each turned a little from
#         the last (this is session 7 arriving early -- have a go)
#      c. print a receipt at the end with an f-string: shape name if you know
#         it, side count, side length, total ink
# -----------------------------------------------------------------------------


turtle.done()
