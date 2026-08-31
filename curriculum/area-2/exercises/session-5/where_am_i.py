"""Two questions that look like one question, and are not.

Where is this file? And where were you standing when you ran it? Until
tonight those have always been the same answer, because something else was
choosing both for you.

    cd exercises/session-5
    py -3.14 where_am_i.py
"""

# concepts: files-on-disk, running-scripts, print, f-strings
# dc: 10
# expect: ok

import os

print("This file is at:")
print(f"    {__file__}")
print("You ran it from:")
print(f"    {os.getcwd()}")
print()
print("Those are two different facts. Read them again.")


# ---------------------------------------------------------------------------
# YOUR MOVE
#
# 1. Run it from this directory, exactly as the docstring says. Write down
#    both lines.
#
# 2. Go up one directory (`cd ..`) and run it again, this time naming the
#    path:
#
#        py -3.14 session-5/where_am_i.py
#
#    One of the two lines changed and one did not. WHICH ONE, and why?
#    Say it out loud before you read on.
#
# 3. Still one directory up, try it without the path:
#
#        py -3.14 where_am_i.py
#
#    Read the whole error. It names something it could not find. Is the
#    problem the file, or is it you?
#
# 4. `__file__` is a word Python fills in for you. It is the only thing in
#    this file you have not met before, and you never have to write it. It
#    means "the file I am currently running".
# ---------------------------------------------------------------------------
