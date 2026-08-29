"""The Hang — this program does not stop, and that is the lesson.

DO NOT FIX THIS FILE BEFORE YOU RUN IT.

It is broken in the most important way an Area 1 program can be broken, and it
is broken on purpose. Read it first and say what is wrong. Then run it anyway.

Nothing is damaged. Nothing is at risk. The window will stop responding and the
terminal will sit there, and both of those are exactly what is supposed to
happen.

    THE ESCAPE HATCH:
    Click on the TERMINAL window -- the black one with the text, not the
    drawing -- and press Ctrl and C together.

That kills a running program. Any running program, in any language, forever.
It is the single most useful key combination you will learn this year and this
file exists so that you learn it on a night when nothing is at stake.

Look at the three rules in s3e1 and say which one this file breaks. Out loud,
before you run it.

Run:  py -3.14 s3e4_the_hang.py    ...and then press Ctrl-C.
"""
# concepts: while, comparison-operators, variables, int, print, reading-errors
# dc: 10
# expect: hangs
# timeout-seconds: 6      the Tk canvas fills up if a runaway turtle runs much longer

import turtle

turtle.speed(0)
turtle.color("black")

print("starting. this will not stop on its own.")
print("click the terminal and press Ctrl-C when you have seen enough.")

side = 20

while side < 200:
    turtle.forward(side)
    turtle.left(90)

print("this line is never reached, and you will never see it.")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. What did Ctrl-C print into the terminal? It is red, it has the word
#    Traceback in it, and it is NOT an error you caused -- it is Python telling
#    you where it was when you interrupted it. Read the last line. What is the
#    error called? (KeyboardInterrupt. That is you, in the traceback, by name.)
#
# 2. Name the rule this file breaks. There is only one line missing.
#
# 3. Add it. Make the square grow: 20, then 40, then 60, and stop.
#    How many squares does it draw once you have fixed it? Predict, then count.
#
# 4. Now break it a second, different way: put the fix in, but change `< 200`
#    to `> 200`. Run it. What happens? How is this failure different from the
#    first one -- and which of the two is harder to notice?
#
# 5. Write both of tonight's failures in the Journal under "what broke". One
#    of them hung and one of them did nothing at all, and NEITHER of them
#    printed an error message. That is what Area 1 is about.
# -----------------------------------------------------------------------------


turtle.done()
