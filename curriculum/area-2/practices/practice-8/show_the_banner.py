"""The file that imports the other one, and gets what it asked for.

Two files run and only one of them prints a banner. The one that stayed
quiet is the one that was imported, and it stayed quiet on purpose.

    py -3.14 show_the_banner.py
"""

# concepts: main-guard, running-scripts, str, print, f-strings
# dc: 12
# expect: ok

import banner

print("show_the_banner is running.")
print(f"I imported banner.py and borrowed its title: {banner.title}")
print("Notice what did NOT happen: banner.py did not print its own banner.")


# ---------------------------------------------------------------------------
# YOUR MOVE
#
# 1. Run it. Read the output. Two files ran and only one of them printed a
#    banner.
#
# 2. `banner.title` is you reaching into another file for something it made.
#    That is what importing is for, and Area 4 is where you start doing it
#    on purpose.
#
# 3. Do step 3 of banner.py's YOUR MOVE -- take the guard out -- and run
#    this file again. Then put it back.
#
# 4. The one sentence worth keeping: a file with a main-guard can be run AND
#    imported. A file without one can only safely be run.
# ---------------------------------------------------------------------------
