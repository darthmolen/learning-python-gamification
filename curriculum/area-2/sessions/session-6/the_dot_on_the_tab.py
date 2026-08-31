"""A file whose entire job is to be edited badly.

Session 6 is the editor session, and the editor's first lesson is not a
keyboard shortcut. It is that the thing on your screen and the thing on the
disk are two different objects, and only one of them runs.

    py -3.14 the_dot_on_the_tab.py
"""

# concepts: vscode, running-scripts, variables, print, f-strings
# dc: 10
# expect: ok

version = 1

print(f"This is version {version} of the file.")
print("If you just changed that number and this still says 1, you did not save.")


# ---------------------------------------------------------------------------
# YOUR MOVE
#
# Do these in order, in VS Code, without saving until step 4. The order is
# the whole lesson.
#
# 1. Run it in the terminal. It says version 1.
#
# 2. Change `version` to 2. DO NOT SAVE. Look at the top of the editor --
#    something small has changed to tell you what you just did.
#
# 3. Run it again, exactly the same command. It still says 1.
#
#    Nothing is broken. You have two copies of this file: the one you are
#    looking at, and the one on the disk. Python cannot see the one you are
#    looking at.
#
# 4. Save (Ctrl+S). Watch the mark disappear. Run it again.
#
# 5. Now say what the mark means, in your own words, out loud. You will lose
#    ten minutes to this exact thing at some point anyway -- the mark is how
#    you get those ten minutes back.
# ---------------------------------------------------------------------------
