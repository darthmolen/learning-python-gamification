# Area 4 glossary

One entry per concept this area teaches. The heading is the concept's id from
`pyquest/packages/content/src/concepts.ts`.

## def

Makes a function: a piece of work with a name, written once and used as often as you like.

```python
def draw_square(side):
    for _ in range(4):
        turtle.forward(side)
        turtle.right(90)
```

Defining it runs nothing. The body waits until somebody calls `draw_square(100)`.

## parameters

The names a function gives to whatever it is handed.

In `def draw_square(side)`, `side` is a parameter — a name that only means anything inside the
function. What you pass in at the call is an argument; the parameter is the label the function
puts on it.

## return

Hands a value back to whoever called the function.

```python
def perimeter(side):
    return side * 4
```

A function with no `return` hands back `None`. That is the usual explanation for "it printed the
answer but the variable is empty" — printing and returning are different acts.

## default-arguments

A parameter with a value ready in case the caller does not supply one.

```python
def draw_square(side=100):
    ...
```

**Never default to a list or a dict.** That value is made once and shared by every call, so it
quietly accumulates between them. Default to `None` and make the list inside.

## keyword-arguments

Naming the argument at the call, instead of relying on its position.

```python
draw_square(side=150)
```

Worth it as soon as there is more than one, because `move(10, 200, True)` at the call site tells
the reader nothing about which is which.

## scope

Where a name is visible. A name made inside a function belongs to that call and is gone when it
ends.

That is a feature: two functions can both use `total` without colliding. It is also why a
function cannot see a variable from another function, only ones passed to it.

## docstrings

A string at the top of a function saying what it does.

```python
def perimeter(side):
    """The distance around a square of this side."""
```

Say what it is *for*, not what the lines do. The code already says what the lines do; the reason
it exists is the thing that is otherwise lost.

## pure-vs-side-effecting

A **pure** function works only on what it was handed and only hands something back. A
**side-effecting** one changes something outside itself — prints, draws, writes a file.

`perimeter(side)` is pure and can be tested by asking it a question. `draw_square(side)` is not,
and has to be tested by watching what happened. Knowing which you are writing tells you how hard
it will be to check.

## refactoring-a-script

Turning a long run of lines into named functions that say what each part is for.

Nothing about what it does changes, which is the discipline: if the behavior moved, that was not
a refactor. Do it in small steps and run it after each one, so a break has only one place to
hide.

## import

Brings in code somebody else wrote — the standard library, or another file of yours.

```python
import random
from pathlib import Path
```

`import random` gives you the module, and you say `random.choice`. `from ... import` gives you
the one name directly.

## stdlib-random

Randomness: pick something, shuffle something, roll a number.

```python
random.randint(1, 6)
random.choice(inventory)
```

It is not truly random but a repeatable sequence, which is useful — `random.seed(7)` makes a game
that behaves the same way twice, and that is how you debug one.

## stdlib-math

Mathematics beyond the operators: `math.sqrt`, `math.floor`, `math.pi`, the trigonometry the
turtle work has been circling.

```python
math.sqrt(16)   # 4.0
```

## stdlib-time

Clocks and waiting.

```python
time.sleep(1)          # pause for a second
time.time()            # seconds since 1970, as a float
```

Timing something is two calls and a subtraction, which is the beginning of knowing whether your
code is actually slow or just feels slow.

## stdlib-pathlib

Paths as objects instead of strings.

```python
from pathlib import Path
Path("saves") / "world.json"
```

The `/` joins path parts and gets the separator right on every operating system, which is the
whole reason to prefer it over gluing strings together.

## stdlib-json

Turns Python data into text and back.

```python
json.dumps({"planks": 4})   # to text
json.loads(text)            # back to a dict
```

`dumps` and `loads` work on strings; `dump` and `load`, without the `s`, work on open files. The
missing letter is the difference and it catches everybody.

Only some things survive the trip — lists, dicts, strings, numbers, booleans and `None`. A tuple
comes back as a list.
