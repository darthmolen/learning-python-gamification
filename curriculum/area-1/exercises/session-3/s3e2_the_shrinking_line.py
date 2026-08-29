"""The Shrinking Line — the loop whose count nobody knows.

This is the case a `for` loop cannot do honestly.

Each line is 0.8 times the one before. Start at 250 and keep going while the
line is longer than 4 pixels. How many lines is that?

You do not know. Neither do I, without working it out, and working it out is
harder than just asking the computer. That is what `while` is for: **you know
when to stop, not how many times to go.**

Run:  py -3.14 s3e2_the_shrinking_line.py
"""
# concepts: while, comparison-operators, variables, float, int, print
# dc: 14
# expect: ok
# min-strokes: 19

import turtle

turtle.speed(0)
turtle.pensize(2)
turtle.color("darkgreen")

length = 250.0
drawn = 0

while length > 4:
    turtle.forward(length)
    turtle.left(92)
    length = length * 0.8
    drawn = drawn + 1

print("lines drawn:", drawn)
print("final length:", length)
print("nobody typed the number", drawn, "anywhere in this file.")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Predict, before running, whether it draws more or fewer than 20 lines.
#    Then run it. Then say out loud how you would have worked it out on paper.
#
# 2. Change 0.8 to 0.9. Predict what happens to the count first -- more, or
#    fewer? Now change it to 0.5. Then 0.99. That last one takes a moment.
#
# 3. Change 0.8 to 1.0 and DO NOT RUN IT. Look at the three rules from s3e1.
#    Which one breaks? What would the program do? Now decide whether you want
#    to run it, and if you do, know where the terminal window is.
#
# 4. `drawn = drawn + 1` is a counter, and you have now written one twice.
#    It has a name -- the accumulator -- and session 8 is entirely about it.
#    Notice that it is set to 0 BEFORE the loop, not inside it. Move it inside
#    the loop and run it. What does it print? Say why.
#
# 5. CHOICE BOARD:
#      a. change 92 to 91, then 95, then 120
#      b. make the pen thinner as the line gets shorter
#      c. start at 250 and shrink until the total ink used passes 1000
#         (you will need a second counter. Try. It is session 8's job and
#          having tried it once makes session 8 twenty minutes shorter.)
# -----------------------------------------------------------------------------


turtle.done()
