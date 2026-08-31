# The First Half

One question, asked twelve times, answered differently each time.

An `if` on its own is a fork in the road. An `if` **inside a loop** is a fork the program
takes over and over, and that is what makes a picture look designed instead of repeated.

## What it must do

1. Draw a shape with **12 sides**, each one **60** long, turning the same amount after
   every side and working that amount out from the 12.
2. **Before drawing each side**, set the pen colour:
   - the **first six** sides are `"red"`
   - the **other six** are `"black"`

So the colours come out `red red red red red red black black black black black black`, in
that order, and the shape closes.

## The counter is the thing you ask about

`for side in range(12):` makes `side` count 0, 1, 2 ... 11. So "is this side in the first
half?" is a question about `side`, and it has a different answer as the loop runs.

Remember which number `range` starts at. It is not 1.

## Indentation is now three levels deep

| Indent | What lives there |
|---|---|
| none | the program |
| one | inside the loop |
| two | inside the `if`, inside the loop |

`turtle.forward(...)` belongs at **one** level — inside the loop, but not inside either
branch. Put it at two and half the shape disappears, with no error message at all.

## The tools you need

- `for side in range(12):`
- `if side < 6:` ... `else:`
- `turtle.color("red")` — a setting, not a one-off order. It stays until you change it
- `turtle.forward(...)` and `turtle.left(...)`

## When you are stuck

Point at a line with your finger and count the spaces. That is how you find out which
loop, or which branch, it belongs to. There is no other way and everybody does it.
