"""The Floor — a loop inside a loop, over a list you wrote.

You built a nested loop in Area 1 to draw a mandala. Same shape here, and this
time the thing it builds is ground you could stand on.

Two things worth watching as you read it:

  * The inner loop runs all the way through for EVERY step of the outer one.
    Twenty by twenty is four hundred blocks, not forty.
  * `kinds[(x + z) % len(kinds)]` picks a kind by position. You have not been
    taught the square brackets yet -- that is next session -- so read it as
    "reach into the list and take one out" and leave it there for now.

Four hundred blocks builds in well under a second. Keep an eye on that number:
a world is capped near five thousand, and the reason is not smoothness. It is
that building blocks costs about a millisecond each, paid once, before anything
appears at all. Five thousand blocks is five seconds of black window.

Run:  py -3.14 s1e2_the_floor.py
"""
# concepts: list, iteration, for, range, nesting, print, len, f-strings
# dc: 12
# expect: ok
# min-blocks: 400

from world import place, start

kinds = ["grass", "sand"]

side = 20
built = 0

for x in range(side):
    for z in range(side):
        place(x, 0, z, kinds[(x + z) % len(kinds)])
        built = built + 1

print(f"{side} x {side} = {built} blocks")
print(f"the list only ever held {len(kinds)} kinds. The loop did the rest.")

start()


# --- YOUR MOVE ---------------------------------------------------------------
# 1. Work out what `built` will be before you run it. Two loops, twenty each.
#    Then run it and check. If you guessed forty, read the loops again.
#
# 2. Change `side` to 30. Predict the new block count first, then run it and
#    read the number. Did the window take noticeably longer to appear?
#
# 3. Now change `side` to 71 and work out the count WITHOUT running it. That is
#    over five thousand, which is the cap, and `verify.py` would refuse it. How
#    many seconds of waiting would that have been?
#
# 4. Add a third kind to the list. You do not need to touch the loop at all --
#    which is the whole reason the kinds live in a list instead of in the code.
