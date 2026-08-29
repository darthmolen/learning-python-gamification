"""The Gatekeeper — the program refuses, politely, and does not crash.

Area 0 session 5, in your own Journal: *it crashed when I typed something silly
and I could not fix it.*

Fix it tonight.

A gatekeeper is a rule at the top of a program that checks what it was given
before it does anything with it. Everything you have learned this week is in it:
a comparison, a boolean operator, a ladder, and an `else` that catches whatever
got past.

This file is deliberately unfinished. It asks, it checks the easy case, and then
it stops. The rest is yours.

Run:  py -3.14 s5e3_the_gatekeeper.py
"""
# concepts: boolean-operators, elif, if, else, comparison-operators, for, range, input, f-strings, bool, variables, int, print
# dc: 14
# expect: ok
# min-strokes: 4
# stdin: 60

import turtle

size = int(input("How big? (20 to 300) "))

turtle.speed(0)

if size < 20 or size > 300:
    print(f"REFUSED. {size} is outside 20 to 300, and I am not drawing that.")
elif size <= 100:
    print(f"{size} is a small one. Thin pen.")
    turtle.pensize(2)
    turtle.color("steelblue")
    for side in range(4):
        turtle.forward(size)
        turtle.left(90)
else:
    print(f"{size} is a big one. Thick pen.")
    turtle.pensize(8)
    turtle.color("darkred")
    for side in range(4):
        turtle.forward(size)
        turtle.left(90)

print("done -- and notice that it printed 'done' even when it refused.")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Run it with 5, then 60, then 200, then 900. Four answers, three of them
#    drawings, none of them a crash.
#
# 2. Run it with 20 exactly, and with 300 exactly, and with 100 exactly.
#    Those are the boundaries and the ladder decides each of them. Are they
#    the answers you wanted? If not, which comparison operator is wrong?
#
# 3. Run it with "sixty". It still crashes, and you still cannot fix that one
#    -- the crash happens on the very first line, before the gate. Write that
#    down in the Journal properly: what you wanted, and what happened. The fix
#    is called try/except and it is Area 5, week 21. Finding your own note from
#    week 5 on the night you finally fix it is a good day.
#
# 4. Two blocks of this file draw the same square with different settings.
#    That repetition is ugly and you can feel it. Get rid of it: set the pen
#    and colour in the ladder, and draw the square ONCE, after it.
#    (This is the real task in the file. Do this one.)
#
# 5. CHOICE BOARD:
#      a. a third band -- small, medium, large -- with three sizes of pen
#      b. ask for the number of sides as well, and gate that too: refuse
#         anything below 3 with its own message
#      c. keep asking until they give you a number you will accept
#         (that needs a `while` around the whole thing. It is legal. Try it.)
# -----------------------------------------------------------------------------


turtle.done()
