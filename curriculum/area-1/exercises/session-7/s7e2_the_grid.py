"""The Grid — two counters, and the outer one is not decoration.

In s7e1 the outer counter did nothing except count. Here both counters are used,
and that is where nesting stops being a way to repeat and starts being a way to
*build*.

    row goes 0, 1, 2, 3
    col goes 0, 1, 2, 3 -- all the way through, once for every row

Sixteen cells, addressed by two numbers. That is a grid, and a grid is how every
tile map, spreadsheet, chessboard and Minecraft chunk you will ever touch is
laid out.

Run:  py -3.14 s7e2_the_grid.py
"""
# concepts: nesting, for, range, variables, int, print
# dc: 14
# expect: ok
# strokes: 64

import turtle

turtle.speed(0)
turtle.pensize(2)
turtle.color("black")

rows = 4
cols = 4
cell = 45

print("drawing a", rows, "by", cols, "grid --", rows * cols, "cells")

for row in range(rows):
    for col in range(cols):
        turtle.penup()
        turtle.goto(col * cell - 100, row * cell - 100)
        turtle.setheading(0)
        turtle.pendown()
        for side in range(4):
            turtle.forward(cell - 6)
            turtle.left(90)
    print("row", row, "done")

turtle.penup()
turtle.home()

print("that was three loops deep. Count the indents on the forward line.")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. The `turtle.forward` line is three levels in. Count the spaces. Which loop
#    is it in? Which loop is `print("row", row, "done")` in? Prove your answer
#    by predicting how many times each one runs, then checking.
#
# 2. Change `rows` to 2 and `cols` to 6. Predict the picture before running.
#    Which number moved which way?
#
# 3. Make every cell in the top row a different colour from the rest. You know
#    how to ask a question about `row` -- that was session 4.
#
# 4. The two lines `col * cell - 100` and `row * cell - 100` are what turn two
#    counters into a position. Change the -100 to 0 and run it. Where did the
#    grid go, and why is the middle of the screen not where you expected?
#
# 5. CHOICE BOARD:
#      a. draw a chessboard: fill alternate cells with a colour
#         (alternating is genuinely hard without an operator you have not met.
#          Try. Write down in the Journal what you needed and did not have.)
#      b. make the cells get bigger towards the right
#      c. draw a triangle in each cell instead of a square, using the polygon
#         turn rule so you can change the shape with one number
# -----------------------------------------------------------------------------


turtle.done()
