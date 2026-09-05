# Control

Area 0, the last lesson, gave you lines that run once each, top to bottom. This area gives
you the two things that change that: **repeating** and **choosing**.

The vehicle is still the turtle, but it stops drawing shapes and starts generating art —
which is what happens to drawing once a computer can repeat it a thousand times without
getting bored. Whether it is any good is still up to you.

## The loop that counts

The square from Area 0 had the same two lines four times. Here it is in a loop:

```python
for step in range(4):
    turtle.forward(100)
    turtle.right(90)
```

Read it as: *four times over, do the indented lines.*

**The indentation is not decoration — it is the syntax.** The indented lines are the
body of the loop. The moment a line stops being indented, it stops being part of the
loop. Other languages use `{` and `}` to mark where a loop starts and stops. Python has
neither: the shape of the text on the page *is* the structure of the program. Four spaces,
consistently.

`range(4)` produces `0, 1, 2, 3`. Four numbers, starting at zero, stopping *before* four.

```python
for n in range(4):
    print(n)          # 0 then 1 then 2 then 3
```

Starting at zero and stopping before the end is a Python habit you will meet again and
again. `range(4)` gives you four things; it does not give you a 4.

`range` takes up to three numbers, which we call **arguments**. The last two are optional:

```python
range(6)          # 0 1 2 3 4 5
range(2, 6)       # 2 3 4 5          — start, then stop-before
range(0, 10, 2)   # 0 2 4 6 8        — start, stop-before, how big a step
```

### Any shape you like

Once the count is a variable, the shape is a dial:

```python
sides = 8
for step in range(sides):
    turtle.forward(60)
    turtle.right(360 / sides)
```

The turn is always `360 / sides`, because a closed shape turns all the way round exactly
once. Change `sides` to 3 and you get a triangle; change it to 30 and you get something
indistinguishable from a circle. **You did not write thirty shapes. You wrote one, with
a number in it.**

## The loop that asks

A `for` loop knows how many times it will run before it starts. Sometimes you do not
know, and only the answer to a question can tell you when to stop.

```python
length = 200
while length > 20:
    turtle.forward(length)
    turtle.right(90)
    length = length - 20
```

The code above draws a square spiral winding inward until the lines get too short to bother
with. **Nowhere in it did you write down how many lines there are.** The condition decides.
That is the one job a `for` loop cannot do well.

### The three rules

A `while` loop needs all three of these, or it never stops.

Think of it as a race on an oval track. The cars go round and round, and what ends the race
is not the cars — it is somebody waving the checkered flag. The condition at the top of a
`while` loop is that flag, and it is checked at the start of every lap.

1. **The variable exists before the loop.** There is a car on the track before the start.
2. **The condition can be False.** Somebody is able to wave the flag.
3. **Something inside the body changes the variable the condition asks about.** Something
   changes each lap, or the flag never comes.

Miss the third and the race never ends. The cars do not crash and nothing catches fire —
they just keep going round while everyone sits in the stands, waiting. That is exactly what
a hung program looks like: there is no error message and no traceback, and the window simply
stops answering. The way out is **Ctrl-C in the terminal** — the window with the text, not
the drawing.

This will happen to you. It is worth making it happen on purpose once, so that the first
time it happens by accident you recognize it instead of assuming you broke the computer.

### Which loop to reach for

Most of the time you know how many. A shape has sides, a row has squares, a spiral has
however many turns you decided on. That is a `for` loop, and it cannot run away from you:
`range` has already settled when it ends before the first lap.

Reach for `while` only when the answer itself decides when to stop, and not before. It is
the one loop that can run forever, which makes it the one worth being suspicious of. People
who have written a lot of Python reach for `for` first and `while` last — and that habit is
not caution they were taught. It is caution they earned, by hanging a program at least once
and sitting there wondering why nothing was happening.

### Comparison

There are six ways to compare:

```python
a < b     # less than                 a > b     # greater than
a <= b    # less than or equal        a >= b    # greater than or equal
a == b    # is equal to               a != b    # is not equal to
```

Each of these produces a `bool` — `True` or `False`, and nothing else.

**`=` and `==` are different and confusing them is a rite of passage.** `=` gives a name
to a value. `==` asks whether two values are the same.

The boundary is where the mistakes live. `while length > 20` and `while length >= 20`
differ by exactly one go round. Before you run a loop, work out on paper how many times
it should go. Then check.

## [[if|Choosing]]

```python
if length > 100:
    turtle.color("red")
else:
    turtle.color("blue")
```

One question, two roads, and exactly one of them is taken.

For more than two, use `elif` — "else, if":

```python
if sides < 3:
    print("that is not a shape")
elif sides < 5:
    print("a small shape")
elif sides < 12:
    print("a proper polygon")
else:
    print("basically a circle")
```

**They are tested top to bottom and it stops at the first one that is True.** Order
matters. If you put `sides < 12` first, `sides < 5` would never be reached — the code
would be unreachable, and Python will not warn you about it.

## and, or, not

Questions can be joined:

```python
if sides >= 3 and sides <= 12:
    print("a reasonable shape")

if sides < 3 or sides > 100:
    print("that is going to look strange")

if not finished:
    print("still going")
```

- `and` — True only when **both** sides are True
- `or` — True when **either** side is True
- `not` — flips it

The one worth memorising: `or` is True when either side is true, **including both**. It
is not the "or" of "tea or coffee".

## Loops inside loops

The body of a loop is just code, and code can contain a loop.

```python
for row in range(5):
    for column in range(5):
        turtle.forward(20)
        turtle.right(90)
    turtle.forward(40)
```

The inner loop runs **completely** for every single pass of the outer one. Five rows of
five is twenty-five, not ten.

That multiplication is where [[nesting]] gets its power and its danger. Two nested loops of
a thousand each is a million passes, and a computer will do that without complaint while
you wonder why nothing is happening.

Again, the indentation is the structure. The inner loop is indented inside the outer
one; the last line is indented once, so it belongs to the outer loop and runs once per
row.

## Carrying a number

The last idea in this area is a pattern rather than a keyword, and it turns up
everywhere for the rest of your life:

```python
total = 0
for n in range(1, 11):
    total = total + n
print(total)      # 55
```

**Set something up before the loop, change it a little on every pass, read it after.**
That is the [[accumulator-pattern|accumulator]].

The three parts are all necessary and each has its own failure. Put `total = 0` *inside*
the loop and it resets every pass, so you end up with the last number rather than the
sum. Read it inside the loop and you see the running total rather than the answer.
Forget to change it and it stays zero.

`total = total + n` is the same right-hand-side-first rule from Area 0. Python has a
shorthand:

```python
total += n        # exactly the same thing
```

Applied to drawing, the accumulator is how a spiral grows:

```python
length = 5
for step in range(60):
    turtle.forward(length)
    turtle.right(91)
    length += 3
```

Ninety-one rather than ninety is why it spirals instead of closing.

## What you should be able to do now

- Write a `for` loop, and say what `range(2, 10, 2)` produces
- Explain why `360 / sides` is the turn for any closed shape
- Write a `while` loop, and name the three rules from memory
- Say what happens when rule three is missing, and how to get out of it
- Choose with `if` / `elif` / `else`, and explain why order matters
- Nest two loops and predict how many passes that is
- Write an accumulator, and name the three places it can go wrong

The test of this area is not whether you can read the code above. It is whether you can
sit in front of an empty file and write a loop that draws something nobody asked for.
