"""The file where it actually goes wrong. One frame deep.

Run this one on its own first. It breaks, and the traceback is the shortest
one you will see tonight: one file, one line, one arrow. Everything after
this is the same error further away from you.

    py -3.14 bottom_frame.py
"""

# concepts: tracebacks, reading-errors, int, str, variables, print
# dc: 10
# expect: ValueError

print("bottom_frame is about to do something silly.")

# `four` is a number in English. It is not a number in digits, and int()
# only reads digits. You met this in Area 0 and it is here on purpose.
sides = int("four")

print(f"A shape with {sides} sides.")
