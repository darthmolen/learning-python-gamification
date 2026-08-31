# No Such Order

Broken sigil 5, from session 3. This one is close to The Typo, and it is **not** the same
error. Working out why is the quest.

Both files misspell exactly one word. In The Typo, Python could not find the thing on the
left of the dot. Here it finds it immediately — and then cannot find what you asked it for.
Two different failures, two different names, and the name is how you know where to look.

Python 3.14 also offers you a guess at what you meant. Notice that it only guesses. It does
not fix anything for you, and it is not always right.

## What to do

1. **Run it.** Write down the error's name and its line number.
2. **Say why this is not the same error as The Typo.** What did Python manage to find in each
   case, and what did it fail to find?
3. **Fix the order.**

## The rule that matters

**Fix the order. Do not delete it.** Both sides still get walked, a hundred steps each.

## Done when

It runs without complaint and the turtle walks two hundred steps in two orders.
