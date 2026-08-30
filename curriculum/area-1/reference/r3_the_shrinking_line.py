"""Datamine payload — s3e2 task 5c: shrink until the total ink passes 1000.

Unlocks: s3e2_the_shrinking_line.py, the third choice on the board.

The task nobody sees their way into is holding TWO things across the loop at
once: the length, which shrinks, and the total, which grows. The stall is almost
never the syntax. It is that they are working out the count in advance, and
there is no count -- the budget decides it.

The question to ask before showing them this:

    "You have a number that changes every go round. Can you have two?"

If the answer is yes, hand the keyboard back. They do not need this file.

Run:  py -3.14 r3_the_shrinking_line.py
"""
# concepts: while, accumulator-pattern, comparison-operators, variables, float, int, print
# dc: 14
# expect: ok
# min-strokes: 8

import turtle

turtle.speed(0)
turtle.pensize(2)
turtle.color("darkgreen")

length = 250.0
ink = 0.0
drawn = 0

while ink < 1000:
    turtle.forward(length)
    turtle.left(92)
    ink = ink + length
    length = length * 0.8
    drawn = drawn + 1

print("lines drawn :", drawn)
print("ink used    :", round(ink, 1))
print("last length :", round(length / 0.8, 1))

# The point to make out loud, and it is worth more than the answer:
#
#   The condition asks about `ink`. The drawing uses `length`. They are two
#   different variables changing at two different rates in the same loop, and
#   the loop stops when ONE of them says so.
#
# The follow-up question, which is the whole of session 8:
#
#   "What else could you total up in there? How far it travelled? How many
#    lines were longer than 100? How much of the ink went on the first half?"


turtle.done()
