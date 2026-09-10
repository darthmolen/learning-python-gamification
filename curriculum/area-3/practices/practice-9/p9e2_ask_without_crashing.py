"""Ask Without Crashing — `.get()`, and when absent is a normal answer.

Last session's `KeyError` had two fixes and you have now met both:

    if "coal" in recipe:        ask first, then reach
        recipe["coal"]

    recipe.get("coal", 0)       reach, and say what to do if it is missing

They are not interchangeable, and picking between them is the actual skill.

**Use `[...]` when a missing key means something has gone wrong.** If a recipe
has no `stick`, your recipe book is broken and you want to hear about it loudly,
right now, at the line that caused it.

**Use `.get(...)` when missing is a perfectly ordinary answer.** How much coal
is in an empty inventory? Zero. Not an error -- zero.

    recipe.get("diamond")       None
    recipe.get("diamond", 0)    0, which you can do arithmetic with

`.get` with no second argument hands back `None`, and `None + 1` is a
`TypeError` about three lines later, somewhere that will not obviously be this
line's fault. **Give it a default nearly every time.**

Run:  py -3.14 p9e2_ask_without_crashing.py
"""
# concepts: dict, dict-methods, in, if, else, iteration, list, print, f-strings
# dc: 18
# expect: ok

have = {"stick": 5, "coal": 2}
recipe = {"stick": 2, "coal": 1, "flint": 1}

print(f"you have:    {have}")
print(f"torch needs: {recipe}")
print()

print("the guarded way, with `in`:")
for name, needed in recipe.items():
    if name in have:
        print(f"  {name}: have {have[name]}, need {needed}")
    else:
        print(f"  {name}: have none, need {needed}")

print()
print("the same thing with .get(), and a default of 0:")
for name, needed in recipe.items():
    print(f"  {name}: have {have.get(name, 0)}, need {needed}")

print()
print("which lets you just do the arithmetic:")
short = 0
for name, needed in recipe.items():
    missing = needed - have.get(name, 0)
    if missing > 0:
        print(f"  short {missing} {name}")
        short = short + missing
print(f"{short} items short in total")

print()
print(f".get with no default hands back {have.get('diamond')!r}")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Rewrite the last block using `in` instead of `.get`. Count the lines in
#    each. Which one says what it means?
#
# 2. Delete the `, 0` from one of the `.get` calls and run it. Where does it
#    break, and is that where the mistake is?
#
# 3. Which of the two would you use to look up a player's score in a game where
#    a new player has never scored? Which for looking up a recipe by name in a
#    recipe book? Say why they differ.
#
# 4. `have` and `recipe` have the same shape. Write a check that says whether
#    you can build the torch at all -- one True or False, not a list of lines.
