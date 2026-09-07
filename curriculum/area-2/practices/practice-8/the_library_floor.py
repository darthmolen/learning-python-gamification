"""A traceback where most of the files are not yours.

The three frame files were all your code. This one is the other shape, and
it is the one that makes people panic: four frames, and you wrote exactly
one of them.

    py -3.14 the_library_floor.py
"""

# concepts: tracebacks, reading-errors, str, print
# dc: 12
# expect: JSONDecodeError

import json

print("Reading some settings that a mod might have written...")

# There is a bracket missing at the end. On purpose.
settings = json.loads('{"blocks": 3, "name": "quarry"')

print(settings)


# ---------------------------------------------------------------------------
# YOUR MOVE
#
# You have never been taught `json` and you do not need it tonight. It is a
# way of writing settings in a text file, and Minecraft mods are full of it.
# It is here because it is somebody else's code, and somebody else's code is
# what makes a stack tall.
#
# 1. Count the frames. Now count the ones that name a file YOU wrote.
#
# 2. Say the answer out loud: one. Line 20, this file.
#
# 3. That is the whole skill. The other three frames are Python explaining
#    itself to itself, and reading them costs you ten minutes and teaches
#    you nothing tonight.
#
# 4. Fix the settings line so it runs. The error message told you what was
#    missing -- read it again if you have forgotten.
# ---------------------------------------------------------------------------
