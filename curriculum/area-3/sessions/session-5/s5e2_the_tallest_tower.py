"""The Tallest Tower — the same question asked in opposite directions.

    min(heights)    the smallest
    max(heights)    the largest

That is the whole of it. They are one idea asked two ways, which is why they
share a file.

Both work on anything Python can compare, and that includes words, where
"smallest" means earliest alphabetically. It does NOT include a mixture: ask for
`min(["torch", 3])` and Python will tell you it has no idea whether a word is
smaller than a number, because nobody does.

Worth noticing as you read: you wrote this by hand in Area 1. Carrying a
"biggest so far" through a loop and comparing every item against it is the
accumulator pattern, and it took six lines. These take one. **Knowing the long
way first is what makes the short way mean something** -- you are not being
handed a magic word, you are being handed the six lines you already wrote.

Run:  py -3.14 s5e2_the_tallest_tower.py
"""
# concepts: list, min, max, len, iteration, accumulator-pattern, print, f-strings
# dc: 14
# expect: ok

heights = [4, 11, 7, 2, 9]

print(f"tower heights: {heights}")
print(f"  shortest, min() -> {min(heights)}")
print(f"  tallest,  max() -> {max(heights)}")

print()
print("the long way, which you already know how to write:")
tallest = heights[0]
for height in heights:
    # Ruff is right that `tallest = max(tallest, height)` is better Python, and
    # wrong for this file. These lines exist to show the long way BEFORE max()
    # is trusted, and rewriting them with max() would use the answer to
    # demonstrate not needing the answer. Suppressed on the line below.
    if height > tallest:  # noqa: PLR1730 -- the long way is the lesson
        tallest = height
print(f"  carried through a loop -> {tallest}")

print()
blocks = ["torch", "bread", "rope", "apple"]
print(f"and on words: {blocks}")
print(f"  min() -> {min(blocks)}   (earliest alphabetically)")
print(f"  max() -> {max(blocks)}")


# --- YOUR MOVE ---------------------------------------------------------------
# 1. The long way starts with `tallest = heights[0]`. Why not `tallest = 0`?
#    Find a list of heights where starting at zero gives the wrong answer.
#
# 2. Try `min(["torch", 3])`. Read the error. It is telling you something true
#    about words and numbers.
#
# 3. `max()` on an empty list crashes too. What would the right answer even be?
#    Guard it with `if len(heights) > 0:`.
#
# 4. Find the tallest tower AND its position. `max()` gives you the height;
#    getting the slot number takes something else. `heights.index(...)` is worth
#    meeting here.
