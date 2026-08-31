"""A receipt for the push, written by you, committed after it.

Run it AFTER the push has worked, and answer its two questions honestly. Then
commit it and push again -- which means the second push contains the record of
the first one, which is a joke that will be funnier in about ten years.

    py -3.14 receipt.py
"""

# concepts: input, str, variables, print, f-strings
# dc: 8
# expect: ok
# stdin: the-forge | 4

repo = input("What is your repository called? ")
commits = input("How many commits did you just push? ")

print(f"Pushed {commits} commit(s) to {repo}.")
print("It is now on a machine that is not this one.")
print("If you did not push it, it did not happen.")


# ---------------------------------------------------------------------------
# YOUR MOVE
#
# 1. Run it and answer the two questions.
#
# 2. `commits` came back from input(). What kind of thing is it? You met this
#    in Area 0 and it caused you real trouble at the time.
#
#    Prove your answer rather than remembering it. There is a way to make the
#    program tell you, and you already know it.
#
# 3. Add a third question of your own -- where you pushed it to, or what you
#    would have lost if the laptop died an hour ago -- and print the answer.
#
# 4. Commit this file with a message that says what tonight was. Then push
#    again.
#
#    Now go and look at the remote. Both commits are there: the one that got
#    pushed, and the one that says it got pushed.
# ---------------------------------------------------------------------------
