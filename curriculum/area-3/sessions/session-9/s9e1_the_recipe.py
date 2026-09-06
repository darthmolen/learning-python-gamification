"""The Recipe — walking a dict, and getting both halves at once.

Looping a dict gives you its **keys**. That is the default and it catches
everybody once:

    for key in recipe:        <- keys only

Three methods change what you get:

    recipe.keys()      the names
    recipe.values()    the amounts
    recipe.items()     both, as pairs

`.items()` is the one you will use most, because most of the time the question
needs both halves:

    for name, amount in recipe.items():
        print(name, amount)

That line unpacks each pair into two names as it goes. You saw a pair like that
in session 7 -- a tuple of two things -- and this is where they start turning up
without you making them.

Run:  py -3.14 s9e1_the_recipe.py
"""
# concepts: dict, dict-methods, iteration, tuple, len, sorted, print, f-strings
# dc: 16
# expect: ok

recipe = {"stick": 2, "coal": 1, "flint": 1}

print("looping it plainly gives you the keys:")
for key in recipe:
    print(f"  {key}")

print()
print(".values() gives the amounts:")
for amount in recipe.values():
    print(f"  {amount}")

print()
print(".items() gives both, and this is the useful one:")
for name, amount in recipe.items():
    print(f"  {amount} x {name}")

print()
total = 0
for amount in recipe.values():
    total = total + amount
print(f"{total} items in total, across {len(recipe)} kinds")

print()
print("sorted() works on it too, and sorts the keys:")
for name in sorted(recipe):
    print(f"  {name}")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Print `recipe.items()` on its own, without a loop. What shape is each
#    thing inside it? You met that shape two sessions ago.
#
# 2. Rewrite the total using `sum()`. It works on `.values()` directly. Then say
#    which version you would rather read in six months.
#
# 3. Print the recipe sorted by AMOUNT instead of by name. This is harder than
#    it looks and it is fine not to get it -- say what makes it awkward.
#
# 4. Find the ingredient you need most of. `max()` on `.values()` gives you the
#    number but not the name. How would you get the name?
