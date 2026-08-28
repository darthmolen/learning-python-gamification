"""Ask And Draw — the program stops and waits for a human.

input("...") does three things, in this order:
  1. prints the message you gave it
  2. stops the program dead until someone types something and presses Enter
  3. hands back what they typed

What it hands back is ALWAYS a str. Always. Even when they typed 120.
If you want a number, you have to say so.

Run:  py -3.14 s5e1_ask_and_draw.py
"""
# concepts: input, str, int, f-strings, variables, print
# dc: 12
# expect: ok
# stdin: 150

import turtle

answer = input("How long should each side be? ")

print(f"You typed {answer}, and Python is holding it as a {type(answer)}.")

side = int(answer)

print(f"Converted. Now it is a {type(side)} and I can draw with it.")

turtle.pensize(4)

turtle.forward(side)
turtle.left(90)
turtle.forward(side)
turtle.left(90)
turtle.forward(side)
turtle.left(90)
turtle.forward(side)
turtle.left(90)

print(f"Done. A square of side {side} has a perimeter of {side * 4}.")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Delete the int() line and use `answer` directly in turtle.forward.
#    Run it. Read the error. Put it back. You have now seen b2 in the wild.
#
# 2. Run it again and type "big" instead of a number. Which error is that?
#    You have met it before. Which broken sigil was it?
#
# 3. Ask a second question: what colour? Use it. Remember what kind of thing
#    a colour name is, and whether it needs converting.
#
# 4. Ask for the number of sides too, then print the total turn the turtle
#    would have to make. You cannot draw it yet. Printing it is enough.
# -----------------------------------------------------------------------------


turtle.done()
