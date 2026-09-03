# Never Closed

You met this one in session 3. Something is missing on one line, and Python never gets as
far as running anything at all.

That is the interesting part. Notice two things before you fix it, and neither one is the
missing bracket:

1. **Nothing draws.** Not even the first order, which is perfectly fine. Compare that with
   The Typo, where the turtle got a hundred steps in before it fell over.
2. **The error does not look like the others.** Count its lines. Is the word `Traceback`
   anywhere in it?

Some errors happen while a program runs. This one happens before it starts.

## What to do

1. **Run it.** Write down the error's name and the line number it points at.
2. **Look at the line above the one it points at.** Python noticed on one line that something
   went wrong on the line before. Work out why it could not have noticed any sooner.
3. **Close what was never closed.**

## The rule that matters

**All three orders stay.** Two sides and the corner between them. Deleting the unhappy line
is not closing the bracket.

## Done when

It runs without complaint and draws two hundred-step sides with a right-angle turn between
them.
