"""The file you actually ran. Three frames deep, and none of them is a lie.

You ran this. This imported middle_frame. middle_frame imported
bottom_frame. bottom_frame is where it broke. The traceback prints that
chain in exactly that order, top to bottom, and the last line is the
answer.

    py -3.14 top_frame.py
"""

# concepts: tracebacks, reading-errors, print, f-strings
# dc: 12
# expect: ValueError

import middle_frame

print(f"top_frame will never print this line either: {middle_frame}")


# ---------------------------------------------------------------------------
# YOUR MOVE
#
# 1. Run all three, in this order: bottom_frame, middle_frame, top_frame.
#    One frame, then two, then three. Same error every time.
#
# 2. Read the last line of each traceback. It is identical in all three.
#    THE ERROR NEVER MOVED. Only the distance between you and it changed.
#
# 3. Read a traceback from the bottom up. The bottom line tells you what
#    broke. The frame above it tells you where. Everything above THAT is the
#    story of how Python got there, and you can usually ignore it.
#
# 4. Fix it -- one word, in one file -- and run top_frame again. Which file
#    did you have to open? Was it the one you ran?
# ---------------------------------------------------------------------------
