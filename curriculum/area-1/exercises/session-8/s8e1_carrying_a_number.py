"""Carrying A Number — the accumulator, which you have already written twice.

In s3e2 you wrote `drawn = drawn + 1`. In s2e2's choice board you tried to count
lines and did it the clumsy way. That pattern has a name:

    total = 0                 <- BEFORE the loop. Once.
    for thing in ...:
        total = total + something    <- INSIDE the loop. Every time.
    print(total)              <- AFTER the loop. Once.

It is called an accumulator, and it is the answer to every question that starts
with "how many", "how much", "how far" or "what is the biggest".

Two things go wrong with it and both of them are about WHERE the lines are, not
what they say:

    total = 0 inside the loop   -> it resets every go round, and the answer is
                                   whatever the last step contributed
    print inside the loop       -> you get one line per go round instead of one
                                   answer

Neither of those crashes. Neither prints anything red. You met that idea in
session 6 and here it is again, with money on it.

Run:  py -3.14 s8e1_carrying_a_number.py
"""
# concepts: accumulator-pattern, for, range, variables, int, float, print
# dc: 12
# expect: ok
# strokes: 9

import turtle

turtle.speed(0)
turtle.color("darkgoldenrod")
turtle.pensize(2)

sides = 9
turn = 360 / sides

total_ink = 0
total_turn = 0.0

for side in range(sides):
    length = 40 + side * 12
    turtle.forward(length)
    turtle.left(turn)
    total_ink = total_ink + length
    total_turn = total_turn + turn

print("sides drawn :", sides)
print("total ink   :", total_ink, "pixels")
print("total turn  :", total_turn, "degrees")
print()
print("nobody typed either of those numbers. The loop worked them out.")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Work out `total_ink` on paper before you trust the program. Nine lengths,
#    starting at 40, going up by 12. Do they match?
#
# 2. Move `total_ink = 0` inside the loop, as the first line of the body. Run
#    it. What does it print, and why is that number the LAST length rather than
#    a total? No error appeared. This is the accumulator bug and it is the one
#    you will write for the rest of your life.
#
# 3. Put it back. Now move the `print("total ink")` line inside the loop
#    instead. How many lines do you get? Which loop is that print in?
#
# 4. Change `total_ink = total_ink + length` to `total_ink = length`.
#    The picture is IDENTICAL. The number is wrong. Say out loud what the
#    difference between those two lines is, in English.
#
# 5. Add a third accumulator that counts how many sides were longer than 100
#    pixels. You will need a question inside the loop -- that was session 4.
#
# 6. CHOICE BOARD:
#      a. keep track of the LONGEST side drawn, not the total
#      b. accumulate a string instead of a number: build up "40, 52, 64, ..."
#         and print it once at the end (f-strings, Area 0)
#      c. stop drawing once the total ink passes 600. Which kind of loop does
#         that need? You cannot know the count in advance.
# -----------------------------------------------------------------------------


turtle.done()
