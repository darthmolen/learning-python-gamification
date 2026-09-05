# Ask And Draw

`input("...")` does three things: it prints your message, stops the program until somebody
types something and presses Enter, and hands back what they typed.

**What it hands back is always a `str`.** Always — even when they typed `150`. If you want a
number, you have to say so.

## What to do

The starter is broken on purpose, the same way it broke in session 5.

1. **Run it first and answer 150.** Read the error before you change anything.
2. **Fix it.** `answer` is a `str` and `forward` needs a number. Convert it **once**, at the
   top where the answer arrives — not four times further down.
3. **Optional.** The turtle turns by the same amount at every corner. Give that number a name
   of its own, written once and used four times.
4. **Print a receipt** as the last line, in this exact shape:

   ```text
   side length: 150
   ```

   Use an f-string.

## How to read the error you get

Python says it cannot multiply a sequence. A **sequence** is Python's word for a row of
things, and text is a row of letters — so the message is telling you that it was handed
letters at the point where it needed a number.

Errors are worth reading slowly. This one names the exact moment your `str` reached something
that only works on numbers, and once you can see that in the message you will not need anyone
to tell you what went wrong.

## The rule that matters

**The receipt has to follow what was typed.**

This gets run with 150, then 40, then 7. The number on the receipt changes every time, and so
does the square.

## Done when

It asks, converts, draws a square of the size it was given, and prints a receipt whose number
is right for whatever was typed.
