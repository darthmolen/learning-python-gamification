"""The Choice Board — the program answers back.

In Area 0 session 5 you wrote a program that crashed when someone typed
something silly, and you wrote in your Journal that you could not fix it and
would have to wait for Area 1.

This is Area 1. You can fix half of it tonight and the other half next session.

The shape here depends on what the person typed. Not on what you typed when you
wrote the file -- on what they type when they run it. That is the difference
between a picture and a program.

Run:  py -3.14 s4e3_the_choice_board.py
"""
# concepts: if, else, comparison-operators, for, range, input, f-strings, bool, variables, int, str, print
# dc: 12
# expect: ok
# min-strokes: 5
# stdin: 5 | big

import turtle

sides = int(input("How many sides? "))
size = input("Big or small? ")

if size == "big":
    length = 140
else:
    length = 50

print(f"Right: {sides} sides, {length} pixels each.")

turn = 360 / sides

turtle.speed(0)
turtle.pensize(3)

if sides > 8:
    turtle.color("purple")
else:
    turtle.color("green")

for side in range(sides):
    turtle.forward(length)
    turtle.left(turn)

print(f"Total ink: {sides * length} pixels.")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Run it four times: 5/big, 5/small, 12/big, 12/small. Four different
#    pictures, one file, nothing edited between runs.
#
# 2. Answer "Big" with a capital B. It draws a small one. There is no error and
#    the program thinks it did the right thing. Why? What is `"Big" == "big"`?
#    Print it and find out. Fix it if you can work out how; if you cannot,
#    write in the Journal exactly what is wrong, in your own words.
#
# 3. Answer 0 to the first question. It crashes. Read the error and say which
#    line it is on. You can stop this crash from happening -- add an `if` that
#    refuses a number below 3 and prints a message instead of drawing.
#    (Getting the drawing to NOT happen is the tricky part. Have a go. If it
#     defeats you, session 5 gives you a cleaner way.)
#
# 4. CHOICE BOARD:
#      a. a third size, "huge", using a second if after the first
#      b. ask for a colour and use it, but fall back to black if they type
#         something that is not a colour you offered
#      c. draw a small shape inside the big one when they answer "big"
# -----------------------------------------------------------------------------


turtle.done()
