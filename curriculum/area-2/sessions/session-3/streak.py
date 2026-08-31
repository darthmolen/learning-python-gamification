"""How much have you actually written? A file worth committing more than once.

Session 3 uses this file three times: once on `main`, once on a branch where
you change it, and once more after the branch comes back. The point is not
the program. The point is that `git log` afterwards tells the story of what
you did to it, and that the story is readable.

    py -3.14 streak.py
"""

# concepts: for, range, accumulator-pattern, variables, int, print, f-strings
# dc: 8
# expect: ok

entries = 6
words_each = 80

total = 0
for entry in range(1, entries + 1):
    total = total + words_each
    print(f"entry {entry}: {total} words so far")

print(f"{entries} entries. {total} words. You wrote all of them.")


# ---------------------------------------------------------------------------
# YOUR MOVE
#
# On `main`, first:
#
#   1. Change `entries` to the number of journal entries you actually have.
#      Run it. Commit it, and write a commit message that says what you
#      changed and why.
#
# Then make a branch called `longer-entries` and, ON THE BRANCH:
#
#   2. Make `words_each` a number you would have to be proud of.
#   3. Add one more line at the end that prints the average, using the
#      accumulator you already have. (You do not need anything new. You have
#      `total` and you have `entries`.)
#   4. Run it. Commit it.
#
# Then switch back to `main` and open this file.
#
#   5. Before you look: what do you expect to see? Say it out loud first.
#
# The walkthrough tells you when to do each of these. Follow it rather than
# racing ahead, because the order is the lesson.
# ---------------------------------------------------------------------------
