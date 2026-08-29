# The Polygon Engine

A machine with a dial on it. Somebody says a number and gets that shape.

This is the difference between a drawing and a generator, and it is the whole of Area 1
in one quest.

## What it must do

1. Ask **How many sides?** and turn the answer into a whole number.
2. Draw a regular shape with that many sides. **Every side is exactly 100 long.**
3. Turn the same amount after every side, and **work that amount out** from the number of
   sides rather than typing it.

Answer 6 and you get a hexagon. Answer 5 and you get a pentagon. Answer 12 and you get
something close to a circle. **One program, no editing between runs.**

## The rule you need

Every closed shape turns through 360 degrees in total, once, all the way round, however
many sides it has. So the turn for one side is:

```python
turn = 360 / sides
```

If you type `60` instead, the hexagon works and everything else is broken. The tests
change the number of sides, so a typed turn will not survive them.

## The tools you need

- `input("...")` shows a prompt and hands back a `str`, always
- `int(...)` turns that `str` into a number you can count with
- `for side in range(sides):` repeats the body once per side
- `turtle.forward(...)` and `turtle.left(...)` or `turtle.right(...)`

Write it as a plain script, top to bottom, the way every Area 1 exercise is written.

## When you are stuck

Read the error message before you change anything; it names the line.

If there is no error and the shape simply does not close, that is the other kind of
failure and you know the question for it: **add up every turn it made. What was the
total?**
