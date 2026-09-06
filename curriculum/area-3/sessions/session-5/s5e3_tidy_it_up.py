"""Tidy It Up — two ways to sort, and why there are two.

You met this trap in session 3. Here it is on purpose, side by side, because the
difference is worth being able to state rather than merely avoid.

    sorted(inventory)     hands back a NEW list, in order. Yours is untouched.
    inventory.sort()      rearranges YOURS, in place. Hands back nothing.

The question that picks between them is not "which is better". It is **do I
still need the original order?**

  * Showing a tidy list on screen while keeping pickup order -> `sorted()`
  * Putting the inventory itself in order, for good           -> `.sort()`

`sorted()` also takes anything you can loop over and always gives you back a
list, which will matter more than you expect in a few sessions.

Run:  py -3.14 s5e3_tidy_it_up.py
"""
# concepts: list, sorted, list-methods, mutation, len, print, f-strings
# dc: 14
# expect: ok

picked_up = ["torch", "rope", "apple", "bread"]

print(f"in the order you found them: {picked_up}")

shown = sorted(picked_up)
print(f"sorted() gives a new list:   {shown}")
print(f"and the original is intact:  {picked_up}")

print()
print("now sorting the real one, in place:")
picked_up.sort()
print(f"picked_up is now:            {picked_up}")
print("the pickup order is gone. That was the cost, and it was a choice.")

print()
backwards = sorted(picked_up, reverse=True)
print(f"sorted(..., reverse=True):   {backwards}")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Before running: after `picked_up.sort()`, what does `shown` hold? Is it
#    affected? Say why or why not, then check.
#
# 2. You want to show the inventory alphabetically but still know what was
#    picked up first. Which of the two do you use? Write the two lines.
#
# 3. `sorted()` on numbers-as-words is a classic surprise. Try
#    `sorted(["10", "9", "2"])` and explain the order it gives you.
#
# 4. Sort a list of heights smallest-first and largest-first without writing
#    the list out twice.
