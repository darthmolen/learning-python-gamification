# The Countdown

A square spiral that winds inward until the lines get too short to bother with.

Nowhere in this program do you write down how many lines there are. **The condition
decides.** That is the one job a `for` loop cannot do honestly, and it is what `while` is
for.

## What it must do

1. Start with a length of **200**.
2. **While the length is more than 20**, do all three of these, in this order:
   - draw a line that long
   - turn **right 90**
   - make the length **20 shorter**
3. Stop. Nothing else.

## The three rules

A `while` loop needs all three of these or it never stops, and a loop that never stops
does not crash — it just sits there.

1. The variable exists **before** the loop.
2. The condition **can** be False.
3. Something **inside the body** changes the variable the condition asks about.

If your program hangs, it is rule 3, and the way out is **Ctrl-C in the terminal**.

## The boundary, which is where the marks are

`more than 20` is `> 20`, not `>= 20`, and the difference is exactly one line.

Work out on paper how many lines that is before you run it. Start at 200, go down by 20,
keep going while it is bigger than 20. Then check.

## The tools you need

- `while length > 20:` — a question asked at the top of every go round
- `length = length - 20` — an order, not a claim. The right-hand side is worked out
  first, using the value `length` has right now
- `turtle.forward(...)` and `turtle.right(...)`

## When you are stuck

If the shape is not the shape you expected, do not count the picture. **Make the program
count**: put a `print` inside the loop and see how many lines come out.
