# Functions and Decomposition

By now you can write a long program. This area is about why you should stop.

The vehicle is a game loop, and a game loop is the perfect argument for functions: it runs
sixty times a second, and everything it does has to be named, small, and findable.

## A function is a name for some work

```python
def draw_square(size):
    for step in range(4):
        forward(size)
        right(90)


draw_square(100)
draw_square(40)
```

`def` starts one. The name is how you call it. **The indented block is the body**, the same
way a loop's body is indented — Python has one rule about indentation and it applies
everywhere.

The line that *calls* it is the one that makes it happen. Defining a function runs nothing;
it only teaches Python what the name means.

## Parameters are the holes you leave

`size` is a **parameter** — a blank the caller fills in. `draw_square(100)` passes `100` as
the **argument**. The words are worth keeping straight: the parameter is in the definition,
the argument is at the call.

More than one:

```python
def draw_shape(sides, size):
    for step in range(sides):
        forward(size)
        right(360 / sides)
```

### Defaults

```python
def draw_shape(sides, size=100):
    ...

draw_shape(6)            # size is 100
draw_shape(6, 40)        # size is 40
```

A default makes the parameter optional. **Parameters with defaults come last** — Python
refuses otherwise, because otherwise it could not tell which argument you meant.

### Keyword arguments

```python
draw_shape(sides=6, size=40)
draw_shape(size=40, sides=6)     # same thing; the names say which is which
```

Compare `draw_shape(6, 40, 3, True)` with
`draw_shape(sides=6, size=40, thickness=3, filled=True)`. The second one you can read a
month later without opening the definition. Use names once a call has more than two
arguments.

## return hands something back

```python
def area_of_square(size):
    return size * size


total = area_of_square(4)     # 16
```

`return` ends the function immediately and gives a value to whoever called it.

**A function with no `return` gives back `None`**, which is Python's word for nothing. That
is fine when the function's job was to *do* something rather than to *work out* something —
but it is the source of one very common confusion:

```python
def add(a, b):
    print(a + b)        # prints it

total = add(2, 3)       # total is None, because add returned nothing
```

Printing and returning are different. Printing shows a human. Returning hands it to the
program.

## Scope — what a function can see

```python
def counter():
    n = 0
    n = n + 1
    return n


print(n)      # NameError: n is not defined
```

`n` exists **inside** `counter` and nowhere else. When the function ends, it is gone.

This feels restrictive and it is the opposite. It means you can name a variable `n` inside a
function without checking whether some other part of the program already used that name.
**A function is a room with a door**, and scope is the door.

Reaching out is allowed; reaching in is not:

```python
scale = 2

def bigger(size):
    return size * scale     # works — the function can see outside itself
```

Possible, but be careful. A function that reads things you did not pass it is a function
you cannot understand from its own call.

## Pure and side-effecting

Two kinds of function, and knowing which you are writing is most of the skill.

```python
def total_cost(items):          # pure: same input, same answer, changes nothing
    return sum(items)


def save_score(score):          # side-effecting: it changes the world
    write_to_file(score)
```

A **pure** function takes things in, gives an answer back, and changes nothing else. You can
call it a thousand times and nothing drifts. It is trivially testable, because testing it is
just calling it.

A **side-effecting** function changes something: a file, the screen, a variable outside
itself. You need these — a program that changes nothing does nothing — but each one is a
place things can go wrong in a way that is hard to see.

**Keep them apart.** Work out the answer in a pure function; do the changing in a small
function next to it. When something is wrong you will know which half to look at.

## docstrings

```python
def draw_shape(sides, size=100):
    """Draw a closed shape with the given number of sides.

    The turn is 360 / sides, which is why any number of sides closes.
    """
```

A string on the first line of a function is its documentation. `help(draw_shape)` prints it.

Write one when the *why* is not obvious from the code. Do not write one that repeats the
name — `"""Draws a shape."""` on `draw_shape` is noise.

## Refactoring a long script

This is the real work of the area, and it has a method:

1. **Find a chunk that does one thing.** If you can say what it does in a sentence, it is a
   function.
2. **Give it the name from that sentence.** If the honest name is `do_stuff`, the chunk does
   more than one thing — split it again.
3. **See what it needs from outside.** Those are the parameters.
4. **See what it produces.** That is the return.
5. **Run it. It must do exactly what it did before.**

Step 5 is the whole discipline. Refactoring means *changing the shape without changing the
behavior*. If the output changed, you did not refactor — you rewrote, and you now have two
problems.

## Borrowing other people's functions

```python
import random
import math

random.randint(1, 6)        # a dice roll
random.choice(inventory)    # one item, at random
math.sqrt(16)               # 4.0
```

`import` brings in a module — a file of functions somebody already wrote. Four worth
knowing this area:

- `random` — dice, shuffling, picking
- `math` — square roots, pi, trigonometry
- `time` — how long something took, and pausing
- `pathlib` — where files are, without gluing strings together
- `json` — turning data into text and back

`pathlib` in particular is the fix for the absolute-path trap from Area 2:

```python
from pathlib import Path

here = Path(__file__).parent
data = here / "scores.json"      # works on every machine
```

## What you should be able to do by the end

- Write a function with parameters, a default, and a return
- Say the difference between printing and returning, and why `total = add(2, 3)` is `None`
- Explain what scope protects you from
- Say whether a function is pure or side-effecting, and keep the two apart
- Take a 200-line script and leave it as a dozen named functions that do the same thing
- Import from the standard library rather than writing it again
