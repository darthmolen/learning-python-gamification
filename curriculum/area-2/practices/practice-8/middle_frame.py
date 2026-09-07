"""The file that imported the file that broke. Two frames deep.

This file contains no mistake at all. It gets named in the traceback anyway,
because it is the one that asked for the file that does.

    py -3.14 middle_frame.py
"""

# concepts: tracebacks, reading-errors, print, f-strings
# dc: 10
# expect: ValueError

import bottom_frame

print(f"middle_frame will never print this line: {bottom_frame}")


# ---------------------------------------------------------------------------
# YOUR MOVE
#
# 1. Count the files named in the traceback. Two. You wrote both.
#
# 2. Which line of it says WHAT went wrong? Which line says WHERE? They are
#    not the same line and they are not next to each other.
#
# 3. The only thing printed before the traceback came out of bottom_frame,
#    not out of this file. Why? Because an import runs the whole of the
#    other file before this one gets any further -- which is exactly what
#    banner.py's main-guard is about.
# ---------------------------------------------------------------------------
