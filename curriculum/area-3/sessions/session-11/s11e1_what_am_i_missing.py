"""What Am I Missing — the loop you wrote in session 5, in one character.

Two sets can be compared, and that is where the power is:

    need - have        what is in `need` and not in `have`
    need & have        what is in both
    need | have        everything, from either

The first one is the one that earns its place tonight. **"What am I missing"
is a subtraction.**

You already wrote this. Session 5 walked a list of needed things, checked each
against what you were carrying, and collected the failures. Six lines. Here it
is again, both ways, side by side -- and the point of the file is that they give
the same answer.

**This session introduces no new concept.** It is the strongest possible
argument for the one in front of it: a thing you already built, now smaller.

Run:  py -3.14 s11e1_what_am_i_missing.py
"""
# concepts: set, in, list, len, iteration, sorted, print, f-strings
# dc: 18
# expect: ok

have = {"stick", "coal", "plank"}
need = {"stick", "coal", "flint", "string"}

print(f"carrying: {sorted(have)}")
print(f"need:     {sorted(need)}")

print()
print("the long way, from session 5:")
missing_long = []
for thing in need:
    if thing not in have:
        missing_long.append(thing)
print(f"  {sorted(missing_long)}")

print()
print("the short way:")
missing_short = need - have
print(f"  {sorted(missing_short)}")

print()
print(f"the same answer: {sorted(missing_long) == sorted(missing_short)}")

print()
print("the other two, which answer different questions:")
print(f"  need & have -> {sorted(need & have)}   (what you can already use)")
print(f"  need | have -> {sorted(need | have)}   (everything involved)")

print()
print("and the direction matters, which is worth being caught by once:")
print(f"  need - have -> {sorted(need - have)}   (still to find)")
print(f"  have - need -> {sorted(have - need)}   (carrying, not needed)")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Before running: what is in `have - need`? Say it out loud. Subtraction on
#    sets is not symmetrical and this is the move that proves it.
#
# 2. The long way collected into a list; the short way gave a set. Does the
#    difference matter here? When would it?
#
# 3. Write "can I build this at all" as one line, using `&` or `-` and nothing
#    else. It should be True or False.
#
# 4. Sets lost the AMOUNTS. `need` says you want flint but not how much. Say
#    what shape you would need to keep amounts as well -- you have been using
#    it since session 8.
