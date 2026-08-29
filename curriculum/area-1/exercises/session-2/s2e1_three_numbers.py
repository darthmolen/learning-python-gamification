"""Three Numbers — range can start somewhere else, and it can step.

You know `range(4)`. It has two more forms, and between them they cover almost
everything you will ever ask a counted loop to do.

    range(stop)               0, 1, 2, ... up to but NOT including stop
    range(start, stop)        start, ... up to but NOT including stop
    range(start, stop, step)  start, start+step, ... still not including stop

The word to hold on to is *including*. The start is in. The stop is out. It is
lopsided on purpose and it stays lopsided for the rest of your life, so it is
worth ten minutes now.

PREDICT FIRST. Write down what each of the five loops prints before you run it.

Run:  py -3.14 s2e1_three_numbers.py
"""
# concepts: range, for, print, int, variables
# dc: 10
# expect: ok
# min-strokes: 18

import turtle

turtle.speed(0)

print("range(3, 8)      :", end=" ")
for n in range(3, 8):
    print(n, end=" ")
print()

print("range(0, 20, 5)  :", end=" ")
for n in range(0, 20, 5):
    print(n, end=" ")
print()

print("range(10, 0, -1) :", end=" ")
for n in range(10, 0, -1):
    print(n, end=" ")
print()

print("range(10, 0)     :", end=" ")
for n in range(10, 0):
    print(n, end=" ")
print("<- nothing at all, and no error either")

print("range(1, 10, 3)  :", end=" ")
for n in range(1, 10, 3):
    print(n, end=" ")
print()

# A fan of lines, one for every number in the run. The number IS the length.
turtle.color("orange")
for length in range(20, 200, 20):
    turtle.forward(length)
    turtle.backward(length)
    turtle.left(20)


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Check your five predictions. Score yourself out of five, honestly, and put
#    the score in your Journal. It is more interesting than it sounds -- you
#    will do this again in session 8 and want to compare.
#
# 2. `range(10, 0)` printed nothing and did not complain. That is a whole class
#    of bug you have just met: the loop that silently does not run. Say out loud
#    what is missing from it, then fix it so it counts down from 10 to 1.
#
# 3. In the fan, count the lines in the picture. Now count the numbers in
#    range(20, 200, 20) on paper. Do they match? Which end did you have to
#    think about?
#
# 4. Make the fan go the other way -- longest line first, shortest last --
#    by changing only the range.
#
# 5. CHOICE BOARD:
#      a. make every line 5 pixels longer than the last instead of 20
#      b. make the fan sweep exactly 180 degrees, no more, no less
#         (how many lines is that? work it out, do not guess)
#      c. draw the fan, then draw it again mirrored on the other side
# -----------------------------------------------------------------------------


turtle.done()
