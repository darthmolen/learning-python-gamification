"""Datamine payload — s5e3 task 4: one square, drawn once.

Unlocks: s5e3_the_gatekeeper.py, the de-duplication task.

The shipped file draws the same square twice with different settings, once in
the `elif` and once in the `else`. He can feel that it is wrong and often cannot
see the move, which is: **the ladder decides, and then the drawing happens after
it.** A branch sets values; it does not have to do the work.

There is one wrinkle and it is the interesting part. When the gate refuses, the
drawing must not happen at all -- so the refusal needs a way to say "nothing to
draw". Here it sets `draw = False` and one `if` after the ladder honours it.
That is a bool doing the job Area 0 had no job for.

The question to ask first:

    "Which lines in those two blocks are actually different? Circle them.
     Now what is left over, and does it care which branch it came from?"

Run:  py -3.14 r5_the_gatekeeper.py
"""
# concepts: boolean-operators, elif, if, else, comparison-operators, for, range, input, f-strings, bool, variables, int, print
# dc: 14
# expect: ok
# min-strokes: 4
# stdin: 200

import turtle

size = int(input("How big? (20 to 300) "))

draw = True
width = 2
ink = "steelblue"

if size < 20 or size > 300:
    print(f"REFUSED. {size} is outside 20 to 300, and I am not drawing that.")
    draw = False
elif size <= 100:
    print(f"{size} is a small one. Thin pen.")
else:
    print(f"{size} is a big one. Thick pen.")
    width = 8
    ink = "darkred"

turtle.speed(0)

if draw:
    turtle.pensize(width)
    turtle.color(ink)
    for side in range(4):
        turtle.forward(size)
        turtle.left(90)
    print(f"Drew a square of {size}, perimeter {size * 4}.")

print("done")

# Two things to say out loud after showing him this:
#
# 1. The ladder now DECIDES and the loop DRAWS. Each part does one job. That
#    split is most of what makes a long program readable, and he will see it
#    again as functions in Area 4.
#
# 2. `draw = True` is a bool with an actual job -- the thing Area 0 could not
#    give it. Point at it. He wrote his first useful boolean tonight.


turtle.done()
