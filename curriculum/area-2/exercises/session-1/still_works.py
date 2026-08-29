"""Does Python still work in here? Run this before you type `git init`.

Nothing in this file is new, and that is the point. Session 1 is about the
folder, not about Python. This file exists so you can prove the folder is an
ordinary folder BEFORE you turn it into a repository -- and then prove it is
still an ordinary folder afterwards.

    py -3.14 still_works.py
"""

# concepts: print, variables, f-strings
# dc: 5
# expect: ok

project = "PyQuest"
week = 6

print(f"{project}, week {week}.")
print("Python still works in this folder.")
print("Nothing about this folder has changed yet.")


# ---------------------------------------------------------------------------
# YOUR MOVE
#
# 1. Change `project` to whatever you are going to call your repository.
#    You choose the name. Nobody gets to improve it.
#
# 2. Run the file again and check it says what you expected.
#
# 3. Run `git status` in this folder. It will refuse. Read the refusal out
#    loud -- it is a whole sentence and it is telling you something true.
#
# 4. Now do the walkthrough in w1_the_folder_that_remembers.md, and come
#    back and run this file one more time afterwards.
#
#    Nothing about the file will have changed. That is worth noticing: a
#    repository does not touch your files. It sits beside them.
# ---------------------------------------------------------------------------
