# Ask And Draw

`input("...")` does three things: it prints your message, stops the program until somebody
types something and presses Enter, and hands back what they typed.

**What it hands back is always a `str`.** Always — even when they typed `150`. If you want a
number, you have to say so.

## What to do

The starter is broken in the way session 5 broke it on purpose.

1. **Run it first and type 150.** Read the error before you fix anything. Which of the
   broken sigils was that?
2. **Fix it.** `answer` is a `str` and `forward` needs a number. Say so **once**, at the top,
   and give the number its own name. Do not convert it four times.
3. **Print a receipt** as the last line, in this exact shape:

   ```text
   side 150, perimeter 600
   ```

   Use an f-string.

## The rule that matters

**Compute the perimeter. Do not type it.**

This gets run with 150, then 40, then 7. Both numbers on the receipt have to follow what was
typed, and so does the square.

## Done when

It asks, converts, draws a square of the size it was given, and prints a receipt whose
numbers are right for any number typed.
