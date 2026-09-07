"""A Recipe Book — collections inside collections, which is what real data is.

One recipe was a dict. A book of them is a dict whose values are dicts:

    book = {
        "torch":   {"stick": 1, "coal": 1},
        "pickaxe": {"stick": 2, "plank": 3},
    }

    book["torch"]              {"stick": 1, "coal": 1}
    book["torch"]["coal"]      1

**Read the brackets left to right, one step inward at a time.** `book["torch"]`
hands you a dict; `["coal"]` reaches into that. Each bracket is one step, and
there is no limit to how deep it goes except your patience.

This is the shape of nearly all real data, and it is the shape Boss 3 is built
on. It is also where people stop being able to see what they are holding, which
is what the next file is about.

Nothing new is being introduced here. A dict of dicts is a dict, and everything
you know about one applies to both levels.

Run:  py -3.14 p12e1_a_recipe_book.py
"""
# concepts: nested-structures, dict, dict-methods, list, iteration, len, in, print, f-strings
# dc: 20
# expect: ok

book = {
    "torch":   {"stick": 1, "coal": 1},
    "pickaxe": {"stick": 2, "plank": 3},
    "chest":   {"plank": 8},
}

print(f"the book knows {len(book)} recipes: {sorted(book)}")

print()
print("one step in:")
print(f"  book['torch']         -> {book['torch']}")
print("two steps in:")
print(f"  book['torch']['coal'] -> {book['torch']['coal']}")

print()
print("every recipe, both levels:")
for item, recipe in book.items():
    parts = len(recipe)
    total = sum(recipe.values())
    print(f"  {item}: {parts} kinds, {total} items")
    for name, amount in recipe.items():
        print(f"      {amount} x {name}")

print()
have = {"stick": 4, "plank": 8, "coal": 0}
print(f"you have: {have}")
print("what you can build right now:")
for item, recipe in book.items():
    buildable = True
    for name, amount in recipe.items():
        if have.get(name, 0) < amount:
            buildable = False
    print(f"  {item}: {buildable}")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Print `book["chest"]["stick"]`. Read the error. WHICH bracket failed, and
#    how can you tell?
#
# 2. Add a recipe for a "furnace" needing 8 stone. Did you have to change any
#    of the loops? That is the whole reason the data is shaped this way.
#
# 3. The buildable check uses a flag that starts True and gets set False. That
#    is an accumulator wearing a different hat. Rewrite it so it stops looking
#    the moment it finds something missing.
#
# 4. Which recipe needs the most items in total? You have `sum`, `max` and
#    `.items()`, and you will need all three.
