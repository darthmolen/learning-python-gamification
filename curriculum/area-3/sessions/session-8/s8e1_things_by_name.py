"""Things By Name — when position stops being the useful question.

A list answers "what is in slot 2?". A dict answers "what does a torch cost?",
which is the question you actually have.

    recipe = {"stick": 1, "coal": 1}

Curly brackets, and `key: value` pairs with a colon between. The **key** is how
you look it up. The **value** is what you get back.

    recipe["coal"]      1

That is the whole idea. Everything else this session is a consequence of it.

Two things worth noticing straight away, because they are what makes a dict
different from a list rather than just prettier:

  * **The key does the work, not the position.** Adding twenty more ingredients
    does not move `coal` anywhere. In a list it would.
  * **There is no order to rely on.** A dict keeps insertion order in modern
    Python, but the moment you find yourself asking "what is the third thing in
    this dict" you have almost certainly wanted a list.

Run:  py -3.14 s8e1_things_by_name.py
"""
# concepts: dict, in, len, iteration, list, print, f-strings
# dc: 16
# expect: ok

recipe = {"stick": 1, "coal": 1}

print(f"a torch needs {len(recipe)} things:")
print(f"  sticks: {recipe['stick']}")
print(f"  coal:   {recipe['coal']}")

print()
print("changing one, and adding one:")
recipe["stick"] = 2
recipe["flint"] = 1
print(f"  {recipe}")

print()
print("asking whether a key is there, which never crashes:")
print(f"  'coal' in recipe    -> {'coal' in recipe}")
print(f"  'diamond' in recipe -> {'diamond' in recipe}")

print()
print("walking it gives you the KEYS:")
for key in recipe:
    print(f"  {key}")

print()
inventory = ["stick", "stick", "coal"]
print(f"the same data as a list: {inventory}")
print("to answer 'how much coal' you would have to count. The dict just knows.")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Print `recipe["diamond"]`. Read the error. Which part of the message is
#    the bit you actually needed?
#
# 2. `in` on a dict checks the KEYS, not the values. Prove it: is `1` in the
#    recipe? Predict before you run.
#
# 3. Add a second recipe, for a pickaxe, as its own dict. Then say out loud
#    what shape you would need to hold BOTH recipes at once. You are describing
#    session 12.
#
# 4. Count the coal in `inventory` with a loop, then get it out of `recipe`
#    with one lookup. Both give you a number. Which one still works when the
#    inventory has four hundred things in it?
