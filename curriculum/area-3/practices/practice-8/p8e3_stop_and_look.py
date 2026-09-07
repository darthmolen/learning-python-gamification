"""Stop And Look — pausing a program to see what it actually holds.

Put this on a line and the program stops there:

    breakpoint()

It hands you a prompt. At that prompt you can type the name of anything that
exists at that moment and see it. You are not guessing any more, and you are not
adding six `print` lines and deleting them afterwards.

The four commands worth knowing tonight:

    p name    print the value of `name`
    n         run the NEXT line and stop again
    c         continue -- run on until the end, or the next breakpoint
    q         quit

**This replaces about half the `print` statements you have written this year.**
The other half are still worth writing: a `print` that stays in the program is
telling you something every time it runs, and a breakpoint only tells you
something while you are standing there.

This file runs with its answers fed in from a script so the harness can check
it. **When YOU run it, nothing is fed in** -- you get the prompt, and you should
poke around before typing `c`.

Run:  py -3.14 p8e3_stop_and_look.py
"""
# concepts: breakpoints, dict, dict-methods, list, iteration, print, f-strings
# dc: 16
# expect: ok
# stdin: p recipe | p thing | n | c | c
# The loop goes round twice, so the program stops twice, so there are two `c`s.
# Feeding one fewer leaves pdb reading an empty stdin at the second stop, and
# the file fails with no error text at all -- which is exactly what happened
# the first time this was written.

recipe = {"stick": 1, "coal": 1}
wanted = ["stick", "coal"]

print("about to walk the recipe. The program will stop on the way.")

total = 0
for thing in wanted:
    breakpoint()  # noqa: T100 -- the breakpoint IS the subject of this file
    total = total + recipe[thing]

print(f"total ingredients: {total}")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Run it yourself, with nothing piped in. At the `(Pdb)` prompt type `p
#    recipe`, then `p thing`, then `p total`. Then `c` to carry on.
#
# 2. Add "diamond" to `wanted` and run it again. When it stops, ask it `p
#    recipe` BEFORE you continue. You are now looking at the dict at the exact
#    moment the crash is about to happen -- which is the thing practice 8's
#    error would not tell you.
#
# 3. Type `n` a few times instead of `c` and watch it walk one line at a time.
#    Where does it go at the bottom of the loop?
#
# 4. Move `breakpoint()` to the line AFTER the `total = ...` line. Same program,
#    different moment. Which position would you want if you were hunting a
#    total that came out wrong?
