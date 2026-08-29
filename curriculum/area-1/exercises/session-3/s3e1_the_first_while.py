"""The First While — a loop that asks a question instead of counting.

A `for` loop knows how many times it will run before it starts. A `while` loop
does not. It asks a question at the top of every go round, and keeps going for
as long as the answer is True.

    while length > 10:
        ...body...

Three things have to be in place or it will never stop, and they are worth
naming, because for the next four weeks every stuck program you write will be
missing one of them:

    1. the variable exists BEFORE the loop
    2. the condition can be False
    3. something INSIDE the body changes the variable the condition asks about

Miss number 3 and the program hangs. That is not a crash, there is no error
message, and the fix is Ctrl-C in the terminal window. You will do it tonight,
on purpose, in s3e4.

The question is built from a comparison operator. There are six:

    <   less than                 >   greater than
    <=  less than or equal        >=  greater than or equal
    ==  is equal to               !=  is not equal to

`=` gives a name to a value. `==` asks whether two values are the same. They are
not the same thing and confusing them is a rite of passage.

Run:  py -3.14 s3e1_the_first_while.py
"""
# concepts: while, comparison-operators, bool, variables, int, print
# dc: 10
# expect: ok
# strokes: 9

import turtle

print("the six questions, answered:")
print("  10 <  10 :", 10 < 10)
print("  10 <= 10 :", 10 <= 10)
print("  10 >  10 :", 10 > 10)
print("  10 >= 10 :", 10 >= 10)
print("  10 == 10 :", 10 == 10)
print("  10 != 10 :", 10 != 10)
print("  all six of those answers are the kind of thing called bool.")
print()

turtle.speed(0)
turtle.color("navy")

length = 200

while length > 20:
    print("length is", length, "-- is it still bigger than 20?", length > 20)
    turtle.forward(length)
    turtle.left(90)
    length = length - 20

print("length is", length, "-- is it still bigger than 20?", length > 20)
print("so the loop stopped. It did not count. It asked.")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Count the lines the loop printed. Now work out on paper how many times it
#    should have gone round, from 200, down by 20, while bigger than 20.
#    Did you get the same number? Which end did you argue with?
#
# 2. Change `> 20` to `>= 20`. Predict the difference BEFORE running. It is
#    exactly one go round, and knowing which one is the whole skill.
#
# 3. Change `length - 20` to `length - 30`. The loop no longer lands exactly on
#    20. Does it still stop? Why?
#
# 4. Delete the line `length = length - 20` and DO NOT RUN IT. Just look at it.
#    Which of the three rules at the top is now broken? Put the line back.
#
# 5. CHOICE BOARD:
#      a. write the same square spiral as a `for` loop instead. Which is
#         shorter? Which one would you rather read?
#      b. make it halve the length each time instead of subtracting 20
#      c. make it stop when the length gets below 20 OR after 6 lines,
#         whichever comes first (you cannot say "or" yet -- session 5 -- so
#         find a way round it, and write in the Journal what you wanted)
# -----------------------------------------------------------------------------


turtle.done()
