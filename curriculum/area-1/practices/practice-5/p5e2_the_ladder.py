"""The Ladder — elif, and why the order of the rungs decides everything.

`if` and `else` give you two roads. `elif` gives you as many as you like:

    if   n < 5:   ...
    elif n < 10:  ...
    elif n < 20:  ...
    else:         ...

Read it as a ladder. Python tries the rungs from the top, stops at the FIRST one
that is true, runs that block, and skips every rung below it. Exactly one block
runs. Always exactly one, never two, and the `else` at the bottom catches
anything that got past every rung.

That "first one wins" rule is the whole of this file. Put a wide rung above a
narrow one and the narrow one can never be reached -- and nothing complains,
nothing crashes, and the picture is quietly wrong.

Run:  py -3.14 s5e2_the_ladder.py
"""
# concepts: elif, if, else, comparison-operators, for, range, bool, variables, int, print
# dc: 14
# expect: ok
# min-strokes: 16

import turtle

turtle.speed(0)
turtle.pensize(5)

sides = 16
turn = 360 / sides

for side in range(sides):
    if side < 4:
        turtle.color("red")
    elif side < 8:
        turtle.color("orange")
    elif side < 12:
        turtle.color("gold")
    else:
        turtle.color("darkgreen")
    turtle.forward(50)
    turtle.left(turn)

print("four bands of four. One ladder, sixteen climbs, one rung each time.")
print()
print("now the broken ladder, which is the point of the file:")

for n in range(16):
    if n < 12:
        band = "wide rung"
    elif n < 4:
        band = "THIS CAN NEVER HAPPEN"
    else:
        band = "the rest"
    print("  n =", n, "->", band)


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Look at the second loop's output. The rung that says THIS CAN NEVER HAPPEN
#    never happened. Say why in one sentence. There was no error, no warning,
#    and nothing red anywhere.
#
# 2. Fix the broken ladder by swapping two lines. Run it again. Now every rung
#    is reachable.
#
# 3. In the drawing loop, change every `elif` into an `if`. Run it. The picture
#    changes and it should not have. What is different about four separate
#    questions compared with one ladder?
#
# 4. Change `sides` to 20. The bands stop being equal, because 4, 8 and 12 were
#    written for 16. Make the band edges work themselves out from `sides`.
#
# 5. CHOICE BOARD:
#      a. five bands instead of four
#      b. make the pen get thinner with each band as well as changing color
#      c. make the LAST side of the shape a different color from all the
#         others, using one extra rung placed in the right position
# -----------------------------------------------------------------------------


turtle.done()
