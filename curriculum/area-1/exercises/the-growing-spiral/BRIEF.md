# The Growing Spiral

Three arms, and a number nobody typed.

A loop inside a loop makes the shape. An accumulator measures it. Both of those are in
here and neither is decoration.

## What it must do

1. Set a running total of ink to **0**, before any loop.
2. Draw **three arms**. Each arm is:
   - **twelve lines**. The first is **10** long, and each one after it is **5 longer**
     than the line before — so 10, 15, 20 ... up to 65
   - turn **left 90** after every line
   - add each line's length to the running total
3. Between arms, turn **left 120**. Each arm starts its lengths again at 10.
4. At the end, and only at the end, print exactly one line:

```text
Ink used: 1350
```

## Where the three parts of an accumulator go

| Line | Where it goes | How many times it runs |
|---|---|---|
| `total = 0` | **before** the loops | once |
| `total = total + length` | **inside** the inner loop | every line |
| `print(...)` | **after** the loops | once |

Put `total = 0` inside a loop and it resets every go round; what prints is the last
contribution rather than a total. Put the `print` inside a loop and you get thirty-six
lines instead of one answer.

**Neither of those crashes.** Neither prints anything red. That is why the number is in
this brief: you can check your own answer.

## Nesting

The outer loop runs three times. The inner loop runs twelve times **for each of those**,
so the `forward` line runs thirty-six times, not fifteen. Counts multiply.

Which loop a line belongs to is decided by its indentation and by nothing else. Point at
it with your finger and count the spaces.

## The tools you need

- `for arm in range(3):` with `for line in range(12):` inside it
- `length = length + 5` — the accumulator that draws
- `ink = ink + length` — the accumulator that measures
- `turtle.forward(...)`, `turtle.left(...)`
- `print(f"Ink used: {ink}")`

## When you are stuck

If the total is wrong, ask how many times each of your three accumulator lines actually
ran. Put a `print` next to each one and count. The answer is always in the count.
