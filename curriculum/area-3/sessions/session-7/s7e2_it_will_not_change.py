"""It Will Not Change — a tuple refusing, on purpose.

The last crash-on-purpose of this half. Run it and read the message.

    spawn[0] = 10
    TypeError: 'tuple' object does not support item assignment

That sentence is worth reading slowly, because it is unusually well written. It
names the kind of thing (`tuple`), and it names the thing that kind will not do
(item assignment). Most errors you meet will not be this clear.

**A tuple refusing is not a limitation you work around.** It is the tuple doing
the one job it was chosen for. If this line needed to work, then a tuple was the
wrong choice and a list was the right one -- and that is a decision you make when
you build the thing, not a wall you climb over afterwards.

The fix, when you genuinely need a different coordinate, is to make a new one:

    spawn = (10, spawn[1], spawn[2])

A new tuple, put back under the old name. Which is exactly what `total = total +
1` does to a number, and for the same reason.

Run:  py -3.14 s7e2_it_will_not_change.py
"""
# concepts: tuple, indexing, mutation, reading-errors, print, f-strings
# dc: 14
# expect: TypeError

spawn = (0, 64, 0)
print(f"spawn: {spawn}")

print("making a NEW tuple and putting it back under the same name:")
spawn = (10, spawn[1], spawn[2])
print(f"spawn: {spawn}   -- this works, and nothing was changed in place")

print()
print("now trying to change one in place:")
spawn[0] = 99

print("this line never runs")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Read the error's last line out loud. Which two facts does it tell you?
#
# 2. The line above the crash reassigned `spawn` and worked perfectly. Explain
#    the difference between that line and the one that failed. They look
#    similar and they are not remotely the same.
#
# 3. Turn `spawn` into a list and run the file again. The crash goes away. Say
#    what you gave up to make it go away.
#
# 4. A tuple can hold a list, and then things get strange:
#        odd = (1, [2, 3])
#        odd[1].append(4)
#    Predict whether that crashes. Then run it. Then explain it -- what exactly
#    was and was not changed?
