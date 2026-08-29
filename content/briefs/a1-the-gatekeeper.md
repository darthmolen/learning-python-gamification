# The Gatekeeper

A program that says no.

In Area 0 you wrote something that crashed when somebody typed a silly answer, and you
wrote in your Journal that you could not fix it. This is the fix.

## What it must do

1. Ask **How big?** and turn the answer into a whole number.
2. Then, as a ladder — tried from the top, first match wins:

| Size | What happens |
|---|---|
| below 20 **or** above 300 | print a line with the word **REFUSED** in it, and **draw nothing at all** |
| 20 to 100, ends included | pen size **3** |
| anything else | pen size **8** |

Unless it was refused, draw a **square** with sides that long.

## The two hard parts

**Not drawing.** Refusing is easy; refusing *and then not drawing the square anyway* is
the part that catches people. The square must not appear when the answer was rejected.

**The boundaries.** 20, 100 and 300 are all exact answers somebody will give. Decide what
each one does before you write the ladder, then check that your comparisons agree with
you. `<` and `<=` are one line apart and the tests know the difference.

## The ladder rule

Python tries the rungs from the top, stops at the **first** one that is true, runs that
block, and skips every rung below. Exactly one block runs — always one, never two, never
none if there is an `else` at the bottom.

Put a wide rung above a narrow one and the narrow one can never be reached. Nothing warns
you about that.

## The tools you need

- `input("...")` and `int(...)`
- `if` ... `elif` ... `else`
- `or` — true when **either** side is true
- `turtle.pensize(...)`, `turtle.forward(...)`, `turtle.left(...)`
- `for side in range(4):`

## When you are stuck

Put a `print` in every branch and run it with 10, 50, 200 and 400. Which branch fires each
time? If one of your branches never fires at all, that is the ladder telling you the order
is wrong.
