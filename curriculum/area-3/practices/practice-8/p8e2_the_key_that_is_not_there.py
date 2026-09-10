"""The Key That Is Not There — the bug you are about to learn to hunt.

A crash on purpose, and this one has a job beyond being read: it is the bug the
rest of tonight is spent stopping inside.

`recipe["diamond"]` on a recipe with no diamond in it raises `KeyError`, and the
message is the shortest of any error you have met. It is literally the key it
could not find:

    KeyError: 'diamond'

**That brevity is the problem.** `IndexError` told you the index was out of
range. `ValueError` told you what `remove` was looking for. This one names the
key and stops. It does not tell you what WAS in the dict, which is the thing
you actually want to know, and printing the whole dict every time you hit one
gets old within an evening.

That is the argument for a breakpoint, and it is why this file exists before
the walkthrough rather than after it.

Run:  py -3.14 p8e2_the_key_that_is_not_there.py
"""
# concepts: dict, reading-errors, in, len, print, f-strings
# dc: 16
# expect: KeyError

recipe = {"stick": 1, "coal": 1}
wanted = ["stick", "coal", "diamond"]

print(f"the recipe knows about {len(recipe)} things")
print("collecting what the recipe says we need:")

total = 0
for thing in wanted:
    print(f"  looking up {thing}")
    total = total + recipe[thing]

print(f"this line never runs. total was {total}")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Read the error. How much does it tell you? Now say what you would need to
#    know to fix it, and notice that the error does not contain it.
#
# 2. The loop printed as it went. Which lookup failed, and how do you know that
#    from the output rather than from reading the code?
#
# 3. Guard it with `in` so the loop skips what the recipe does not have. You
#    used exactly this fix in practice 5 on a different error.
#
# 4. Now do it the other way, with no `if` at all -- `recipe.get(thing, 0)`.
#    That is next session, and it is worth meeting one evening early.
