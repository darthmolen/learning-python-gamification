"""The Missing Pickaxe — asking a list to remove something it does not have.

Another crash on purpose. This one fails differently from session 2's, and the
difference is the lesson.

`inventory.remove("pickaxe")` means *find the pickaxe and take it out*. If there
is no pickaxe, there is nothing sensible to do. Python could shrug and carry on,
and that would be worse: your program would continue believing it had put down a
pickaxe it never had.

So it raises `ValueError` -- the value you named is not in there.

**The fix is not a bigger `try`. The fix is asking first.** There is a word for
that and you meet it properly next session:

    if "pickaxe" in inventory:
        inventory.remove("pickaxe")

`in` hands back True or False and never crashes. Once you have it, this whole
category of mistake stops happening.

Run:  py -3.14 s4e2_the_missing_pickaxe.py
"""
# concepts: list, list-methods, mutation, reading-errors, print, f-strings
# dc: 14
# expect: ValueError

inventory = ["torch", "bread", "rope"]

print(f"carrying: {inventory}")
print("putting down the torch, which is in there:")
inventory.remove("torch")
print(f"carrying: {inventory}")

print()
print("now putting down the pickaxe, which is not:")
inventory.remove("pickaxe")

print("this line never runs")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Read the error. It names the method and the problem in one short line.
#    Which of the two `remove` calls above failed, and how do you know from the
#    output rather than from reading the code?
#
# 2. Note that the first `remove` worked and its print ran. The program got
#    partway. Say out loud what state the inventory was in when it stopped.
#
# 3. Guard the second call with `if "pickaxe" in inventory:` and run it again.
#    The program should now finish, having quietly done nothing.
#
# 4. Now make the guard say something useful instead of nothing -- print
#    "you have no pickaxe" when it is missing. A program that silently does
#    nothing is only slightly better than one that crashes.
