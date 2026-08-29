"""Datamine payload — s8e3 choices b and c: two stop conditions, and a receipt.

Unlocks: s8e3_the_ink_budget.py, choices (b) and (c).

The stall in (b) is that he has two reasons to stop and only one `while` line.
The move is `or` -- session 5 -- inside the condition, and the reason he does
not reach for it is that `or` has so far only appeared inside `if`. A condition
is a condition wherever it sits, and saying that out loud is usually enough.

The trap in (b), and it is worth letting him hit it first: the loop must stop
when EITHER limit is reached, so the condition that keeps it going is *neither
limit reached yet* -- `and`, not `or`. Writing it with `or` gives a loop that
keeps going until BOTH limits are blown, which is not what anybody meant and
does not crash.

(c) is an f-string receipt, which is Area 0 vocabulary. If he stalls there, the
stall is arithmetic, not Python: an average is a total divided by a count and
he has both.

Run:  py -3.14 r8_the_ink_budget.py
"""
# concepts: accumulator-pattern, while, boolean-operators, comparison-operators, f-strings, variables, int, float, print
# dc: 16
# expect: ok
# min-strokes: 24

import turtle

turtle.speed(0)
turtle.pensize(2)
turtle.color("darkslategray")

budget = 2000
most_lines = 24

ink = 0
length = 15
lines = 0

while ink < budget and lines < most_lines:
    turtle.forward(length)
    turtle.left(92)
    ink = ink + length
    length = length + 4
    lines = lines + 1

if ink >= budget:
    reason = "the ink ran out"
else:
    reason = "it hit the line limit"

print("--- receipt ---------------------")
print(f"  budget       {budget}")
print(f"  spent        {ink}")
print(f"  left over    {budget - ink}")
print(f"  lines        {lines} of at most {most_lines}")
print(f"  average line {ink / lines:.1f} pixels")
print(f"  stopped because {reason}")
print("---------------------------------")

# The sentence that carries this file:
#
#   "Keep going while there is still budget AND still lines left" -- and.
#   "Stop when the budget is gone OR the lines are gone"           -- or.
#
# Those two sentences describe the same loop and they use opposite words,
# because one is about carrying on and the other is about stopping. Make him
# say both. That swap has a name and it is the same one from s5e1 task 3.


turtle.done()
