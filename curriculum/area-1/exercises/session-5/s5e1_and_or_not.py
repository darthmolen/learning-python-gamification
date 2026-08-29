"""And, Or, Not — three words that join questions together.

One comparison answers one question. Real rules need more than one:

    "between 20 and 100"          two questions, both must be true
    "too small or too big"        two questions, either one will do
    "not facing north"            one question, answered backwards

Python spells those `and`, `or` and `not`, and they mean what they mean in
English about eighty percent of the time. The other twenty percent is where the
bugs live, so this file prints all of it.

    A and B    True only when BOTH are true
    A or  B    True when EITHER is true (or both)
    not A      flips it

The trap, and it is a bad one: `if n == 1 or 2:` looks like it asks whether n is
1 or 2. It does not. It always runs. This file shows you why.

PREDICT FIRST: write down True or False for all twelve lines below before
running.

Run:  py -3.14 s5e1_and_or_not.py
"""
# concepts: boolean-operators, comparison-operators, bool, if, else, variables, int, print
# dc: 12
# expect: ok
# min-strokes: 4

import turtle

size = 60

print("size is", size)
print()
print("  size > 20               :", size > 20)
print("  size < 100              :", size < 100)
print("  size > 20 and size < 100:", size > 20 and size < 100)
print("  size > 20 or  size < 100:", size > 20 or size < 100)
print("  not (size > 20)         :", not (size > 20))
print()
print("  size < 20               :", size < 20)
print("  size < 20 and size < 100:", size < 20 and size < 100)
print("  size < 20 or  size < 100:", size < 20 or size < 100)
print()
print("THE TRAP:")
print("  size == 60 or 70        :", size == 60 or 70)
print("  size == 99 or 70        :", size == 99 or 70)
print("  ...that second one should be False and it is not.")
print("  what Python read was: (size == 99) or (70), and 70 on its own is truthy.")
print("  what you meant was:   size == 99 or size == 70")
print("  size == 99 or size == 70:", size == 99 or size == 70)

turtle.speed(0)
turtle.pensize(3)

if size > 20 and size < 100:
    turtle.color("green")
else:
    turtle.color("red")

for side in range(4):
    turtle.forward(size)
    turtle.left(90)


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Score your twelve predictions. Which of `and` and `or` did you get wrong
#    more often? Almost everybody has a favourite mistake here.
#
# 2. Set `size` to 10, then 60, then 400. The square is green for exactly one
#    of those. Say the rule out loud as an English sentence containing the
#    word "both".
#
# 3. Rewrite the green rule using `not` and `or` so that it means the same
#    thing. (Hint: "in the middle" is the same as "not too small and not too
#    big", which is the same as "not (too small or too big)". That last swap
#    has a name and mathematicians are proud of it.)
#
# 4. The trap line: write your own version of it. Pick a rule like "the shape
#    has 3 or 4 or 5 sides", write it the wrong way first, run it, and see it
#    be true for 900 sides. Then write it properly.
#
# 5. CHOICE BOARD:
#      a. add a third condition with a second `and`
#      b. make the pen thick only when the size is NOT between 20 and 100
#      c. print the whole truth table for `and`: four lines, using True and
#         False directly instead of comparisons
# -----------------------------------------------------------------------------


turtle.done()
