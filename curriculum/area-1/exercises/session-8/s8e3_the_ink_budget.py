"""The Ink Budget — an accumulator inside a while loop, which is the pair.

`while` knows when to stop but not how many times to go. An accumulator knows
how much has happened so far. Put them together and you can write conditions
that no `for` loop can express:

    "keep drawing until you have used 2000 pixels of ink"

Nobody knows how many lines that is. The program finds out.

This is the shape of a huge amount of real software: keep going until a budget
runs out, a file ends, a user says stop, or a total is reached.

Run:  py -3.14 s8e3_the_ink_budget.py
"""
# concepts: accumulator-pattern, while, comparison-operators, variables, int, float, print
# dc: 16
# expect: ok
# strokes: 29

import turtle

turtle.speed(0)
turtle.pensize(2)
turtle.color("darkslategray")

budget = 2000

ink = 0
length = 15
lines = 0

while ink < budget:
    turtle.forward(length)
    turtle.left(92)
    ink = ink + length
    length = length + 4
    lines = lines + 1

print("budget      :", budget)
print("ink used    :", ink)
print("lines drawn :", lines)
print("overspend   :", ink - budget)
print()
print("nobody typed the number", lines, "anywhere. The budget decided it.")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. The overspend is not zero. The loop checks the budget at the TOP, draws a
#    whole line, and only then adds it up -- so the last line always takes it
#    over. Is that a bug? Decide, and say what you would want instead.
#
# 2. Double the budget. Predict whether the number of lines doubles before you
#    run it. It does not. Say why -- the lines are getting longer.
#
# 3. Set `budget` to 5. Predict what happens. How many lines does it draw?
#    Not zero. Say why, using the words "checked at the top".
#
# 4. Change `length = 15` to `length = 0`, and change the `+ 4` to `+ 0`.
#    Now read the three rules from session 3 and say which one is broken,
#    before you run it. Then decide whether to run it -- and if you do, know
#    where the terminal window is.
#
# 5. Rewrite this as a `for` loop that draws exactly `lines` lines, using the
#    number the while version printed. Now change the budget. What has to
#    happen to the `for` version, and what has to happen to the `while`
#    version? That difference is the answer to "when do I use which", and it
#    is worth one honest sentence in the Journal.
#
# 6. CHOICE BOARD:
#      a. spend the budget on a rosette instead of a spiral
#      b. stop when EITHER the ink runs out or 40 lines have been drawn
#         (you have `or` now -- session 5)
#      c. print a receipt at the end with an f-string: budget, spent, left over,
#         lines, average line length
# -----------------------------------------------------------------------------


turtle.done()
