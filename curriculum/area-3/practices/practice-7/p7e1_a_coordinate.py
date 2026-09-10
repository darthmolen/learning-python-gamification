"""A Coordinate — a thing whose shape is the meaning.

Round brackets instead of square ones make a **tuple**:

    spawn = (128, 64, 128)

It holds things in order and you index it exactly like a list. The one
difference is the whole point: **a tuple cannot be changed once it is made.**

That sounds like a list with a feature removed, and the honest question is why
anybody would want one. The answer is that some things have a fixed shape, and a
shape that could change would be a bug rather than a feature.

A coordinate is always exactly three numbers. If your program can grow a fourth
number onto a coordinate, something has gone wrong somewhere and you would
rather find out immediately than three files later. Writing it as a tuple is how
you say "this is three numbers, permanently" to whoever reads the code next --
which, by next year, is you.

You have been handling coordinates since practice 1. `place(x, y, z, kind)` takes
three of them every single time.

One trap, and it catches everybody once: a single-item tuple needs a trailing
comma. `(5)` is just the number five in brackets. `(5,)` is a tuple.

Run:  py -3.14 p7e1_a_coordinate.py
"""
# concepts: tuple, list, indexing, len, iteration, print, f-strings
# dc: 14
# expect: ok
# min-blocks: 4

from world import place, start

spawn = (0, 0, 0)
print(f"spawn is a {type(spawn).__name__}: {spawn}")
print(f"  x -> {spawn[0]}, y -> {spawn[1]}, z -> {spawn[2]}")
print(f"  len() works the same: {len(spawn)}")

print()
corners = [(0, 0, 0), (4, 0, 0), (0, 0, 4), (4, 0, 4)]
print(f"a list of {len(corners)} tuples -- four corners of a square:")

for corner in corners:
    place(corner[0], corner[1], corner[2], "stone")
    print(f"  placed stone at {corner}")

print()
# The parentheses around 5 are the entire point of these two lines, so ruff's
# advice to remove them -- and to fold `type((5))` down to `int` -- would delete
# the demonstration. Same call, and the same rule, as
# area-0/exercises/the-type-lab/starter/unfinished.py.
print(f"(5)  is a {type((5)).__name__} -- brackets around a number")  # noqa: UP003, UP034
print(f"(5,) is a {type((5,)).__name__} -- the comma is what makes it one")

start()


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Try `spawn[0] = 10`. Read the error. It names exactly what a tuple will
#    not do.
#
# 2. The list `corners` holds tuples. Can you `append` a fifth corner to the
#    list? Can you change the numbers inside one of the corners already in it?
#    Those are two different questions and they have different answers.
#
# 3. Make the square into a cube by adding four more corners at y=4. Eight
#    tuples, one loop, no repetition if you can manage it.
#
# 4. Argue the other side: rewrite `corners` as a list of lists and get the same
#    picture. It works. So what did the tuple buy you? Write the answer in your
#    journal -- it is the whole point of this session.
