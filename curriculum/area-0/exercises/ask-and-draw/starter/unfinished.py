"""Ask And Draw — the program stops and waits for a human.

input("...") always hands back a str. Always. Even when they typed 150.
If you want a number, you have to say so.

This one is broken on purpose, the same way it broke in session 5. Run it
before you change anything, and read what falls out.

There are two ways to run it. In the browser, press Run and put your answer in
the Input box beside the editor — the program has no keyboard to ask with, so
it reads your answer from there. On your own machine, save this file as
solution.py, open a terminal in the folder it is in, and type:

    py -3.14 solution.py

Then answer the question and press Enter.


--- YOUR MOVE ---------------------------------------------------------------

1. Run it and answer 150. Read the error.

   Python says it cannot multiply a sequence. A sequence is a row of things,
   and text is a row of letters — so it is telling you that it was handed
   letters at the point where it needed a number.

2. Fix it. `answer` is a str and forward needs a number. Convert it once, at
   the top, where the answer arrives. Not four times further down.

2a. Optional. The turtle turns by the same amount at every corner. Give that
    number a name of its own, written once and used four times.

3. Print a receipt as the last line, in this exact shape:

       side length: 150

   Use an f-string, and build it from the number that was typed. Answer 40 and
   the receipt has to say 40.

-----------------------------------------------------------------------------
"""

import turtle

answer = input("How long should each side be? ")

turtle.pensize(4)

turtle.forward(answer)
turtle.left(90)
turtle.forward(answer)
turtle.left(90)
turtle.forward(answer)
turtle.left(90)
turtle.forward(answer)
turtle.left(90)

print("Done.")


turtle.done()
