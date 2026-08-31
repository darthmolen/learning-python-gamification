"""One line of yours, so the first commit is not an empty README.

This goes into your repository next to your journal. It is three lines of
Python you could have written in week one, and that is deliberate: session 2
is about `add` and `commit`, and a file you have to think about would get in
the way of the thing you are actually learning tonight.

    py -3.14 motto.py
"""

# concepts: print, variables, str, f-strings
# dc: 5
# expect: ok

name = "put your name here"
motto = "I would rather it broke in front of me than behind my back."

print(f"{name} says:")
print(motto)


# ---------------------------------------------------------------------------
# YOUR MOVE
#
# 1. Put your actual name in. Change the motto to one of your own -- it does
#    not have to be clever and it does not have to be about programming.
#
# 2. Run it.
#
# 3. Now do this, in this order, and read what comes back each time:
#
#        git status
#        git add motto.py
#        git status
#        git commit -m "my motto"
#        git status
#
#    Three `git status` runs, and all three say something different. That is
#    the whole lesson. Do not skip reading them because they look the same.
#
# 4. Change the motto again. Run `git status` one more time.
#
#    It has noticed. You did not tell it to look. Where do you think it is
#    comparing your file TO?
# ---------------------------------------------------------------------------
