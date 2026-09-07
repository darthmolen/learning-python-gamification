"""Do I Have Enough — asking a list a question instead of reading it.

`in` asks whether something is present and hands back True or False:

    "torch" in inventory        True
    "diamond" in inventory      False

It never crashes, which is what makes it the answer to the last session's
`ValueError`. Ask before you take.

It also works the other way round, with `not in`:

    if "rope" not in inventory:
        print("you should pack a rope")

This is the cheapest thing in the whole area and it is the one you will type
most often for the rest of your life.

Run:  py -3.14 p5e1_do_i_have_enough.py
"""
# concepts: list, in, if, else, iteration, print, f-strings
# dc: 14
# expect: ok

inventory = ["torch", "bread", "rope"]
needed = ["torch", "rope", "pickaxe", "flint"]

print(f"carrying: {inventory}")
print(f"the job needs: {needed}")
print()

for thing in needed:
    if thing in inventory:
        print(f"  have    {thing}")
    else:
        print(f"  MISSING {thing}")

print()
if "pickaxe" in inventory:
    inventory.remove("pickaxe")
    print("put the pickaxe down")
else:
    print("no pickaxe to put down, and asking first cost nothing")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Rewrite the loop using `not in` so it only prints the missing things. Which
#    version reads better when the list of missing things is short?
#
# 2. Count the missing ones. You will need a number that starts at zero before
#    the loop and grows inside it -- the accumulator from Area 1, doing a job.
#
# 3. `in` works on a word, too:  `print("or" in "torch")`. What do you think it
#    is checking there? Try `print("hct" in "torch")` and explain the answer.
#
# 4. Go back to p4e2_the_missing_pickaxe.py and guard the crash with `in`. That
#    file should now run to the end. You have just fixed a bug in a file that
#    was written to have one.
