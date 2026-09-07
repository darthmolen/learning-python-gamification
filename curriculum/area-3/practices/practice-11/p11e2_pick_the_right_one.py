"""Pick The Right One — three collections, one problem each.

You now have all three, and this is the session where choosing between them
becomes the actual skill. The rule is short:

    list    the ORDER matters, and duplicates are real
    dict    you look things up BY NAME
    set     you only care WHICH ONES, never how many or in what order

Each block below solves the same underlying situation with the right shape, and
then shows what goes wrong with the wrong one. **The failures are the content.**
Nothing here crashes -- every wrong choice below runs perfectly and answers a
slightly different question than the one that was asked.

That is the whole difficulty with collections. A wrong list is not a broken
program, it is a program that confidently answers something else.

Run:  py -3.14 p11e2_pick_the_right_one.py
"""
# concepts: list, dict, set, in, len, iteration, sorted, print, f-strings
# dc: 20
# expect: ok

pickups = ["dirt", "coal", "dirt", "stone", "dirt"]

print(f"you picked up, in order: {pickups}")

print()
print("QUESTION 1 -- what did I pick up first?")
print(f"  list  -> {pickups[0]}    correct: order is kept")
# `min` would be the idiomatic way to get the smallest, and it would hide what
# this line is demonstrating: that the answer came from SORTING, not from the
# set having a first item. Move 2 asks the reader to delete the `sorted`.
print(f"  set   -> {sorted(set(pickups))[0]}    WRONG: a set has no first")  # noqa: FURB192
print("  a set answered a question nobody asked -- alphabetically first.")

print()
print("QUESTION 2 -- how much dirt do I have?")
counts = {}
for thing in pickups:
    counts[thing] = counts.get(thing, 0) + 1
print(f"  dict  -> {counts['dirt']}    correct: a name, and a number")
print(f"  set   -> {'dirt' in set(pickups)}  WRONG: that is whether, not how many")

print()
print("QUESTION 3 -- which kinds have I seen at all?")
print(f"  set   -> {sorted(set(pickups))}   correct")
print(f"  list  -> {pickups}   WRONG: dirt three times, and you asked WHICH")

print()
print(f"the counting dict, in full: {counts}")
print("built with .get(thing, 0) + 1 -- practice 9's default, doing real work.")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. The counting loop is four lines and worth knowing by heart. Say what
#    `counts.get(thing, 0) + 1` does on the FIRST time a thing is seen.
#
# 2. Question 1's set answer was not random -- it was alphabetical, because of
#    `sorted`. Remove the `sorted` and run it a few times. Is it stable? Would
#    you bet a program on it?
#
# 3. For each of these, name the collection and say why: a chat history; the
#    settings for a game; the set of players currently online; the top ten
#    scores.
#
# 4. Convert `counts` into "the thing I have most of". You need the name, not
#    just the number, and practice 9's move 4 asked the same thing.
