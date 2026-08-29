"""What Range Actually Gives You — the most useful five minutes in Area 1.

`range(4)` does not mean "four". It means a run of numbers, and the numbers it
hands out are not the ones most people guess. This file prints them.

Getting this wrong is the most common mistake in programming, in every language,
forever. It has a name: the off-by-one. You will make it. Everyone makes it. The
point of tonight is that you make it here, on purpose, in a file whose only job
is to show you.

BEFORE YOU RUN THIS: write down, on paper, what you think each of the four loops
below prints. All four. Actual numbers, not "four numbers".

Run:  py -3.14 s1e2_what_range_gives.py
"""
# concepts: range, for, print, int, variables
# dc: 8
# expect: ok
# strokes: 18

import turtle

turtle.speed(0)

print("range(4) gives:")
for n in range(4):
    print("   ", n)

print("range(1) gives:")
for n in range(1):
    print("   ", n)

print("range(0) gives:")
for n in range(0):
    print("    this line never runs")
print("    ...nothing. The loop body did not run once, and nothing complained.")

count = 0
last = -1
for n in range(7):
    count = count + 1
    last = n
print("range(7) went round", count, "times and finished on", last)

# The picture: one spoke per number, and the number decides the length.
for n in range(10):
    turtle.forward(n * 10)
    turtle.backward(n * 10)
    turtle.left(36)


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Check your predictions against what actually printed. Which one did you get
#    wrong? Almost everybody gets exactly one wrong, and it is nearly always the
#    same one.
#
# 2. In the drawing loop the very first spoke has length 0, so it draws nothing
#    at all. Look at the picture. There is a gap. Find it with your eyes before
#    you believe this sentence.
#
# 3. Fix the gap so that all ten spokes are visible and the shortest is 10 long.
#    There are at least two ways to do it. Do the one that changes ONE number.
#
# 4. Say this sentence out loud until it is boring:
#       "range(n) starts at zero and stops BEFORE n."
#    Your dad will ask you for it in two weeks and he is not joking.
# -----------------------------------------------------------------------------


turtle.done()
