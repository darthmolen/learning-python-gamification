# Area 7 glossary

One entry per concept this area teaches. The heading is the concept's id from
`pyquest/packages/content/src/concepts.ts`.

## pytest

Runs your tests and tells you which failed and why.

```python
def test_perimeter_of_a_square():
    assert perimeter(4) == 16
```

A file named `test_*.py`, functions named `test_*`, and plain `assert`. **A test you have never
seen fail proves nothing** — break the code on purpose once and check the test notices.

## debugger

Stopping a running program to look at it, rather than adding prints and guessing.

Set a breakpoint, run, and step: over a line, into a function, out again. The moment a bug is
about what a variable actually holds, this is faster than reasoning about what it should hold.

## type-hints

Saying what kind of thing goes in and comes out.

```python
def perimeter(side: float) -> float:
    return side * 4
```

Python ignores them at run time; a checker reads them and finds mistakes before anything runs.
They are also documentation that cannot quietly go stale, because the checker complains when it
does.

## comprehensions

Building a list from another list, in one line.

```python
names = [item.name for item in inventory]
```

The same loop with `append`, said shorter. Shorter is only better while it still reads in one
breath — a comprehension with two conditions and a nested loop is a `for` block wearing a
disguise.

## generators

Producing values one at a time instead of building the whole list first.

```python
def countdown(n):
    while n > 0:
        yield n
        n = n - 1
```

`yield` hands one value back and remembers where it was. It matters when the sequence is huge or
endless — you never hold more than one item at a time.

## refactoring

Changing how code is written without changing what it does.

The discipline is in the second half. If behavior moved, that was not a refactor — it was a
change, and it needs to be reviewed as one. Tests are what make it safe to try.

## performance-intuition

A sense of which operations get slower as data grows, before measuring.

Checking `in` on a list looks at every item; on a set or a dict it goes almost straight there.
A loop inside a loop over the same data does *n × n* work. Intuition tells you where to look —
then you measure, because intuition is wrong often enough to be worth checking.

## branches

A separate line of history to work on, so `main` keeps working while you do.

Same idea as Area 2, used for real now: one branch per piece of work, named for what it is doing.
Short-lived ones are easier to fold back in than long-lived ones, and that is most of the skill.

## pull-requests

Proposing a change and asking somebody to read it before it lands.

The value is the reading. A description saying what changed and why makes review possible;
"updates" makes the reviewer reconstruct your reasoning from the diff, and they will not.

## reading-unfamiliar-code

Working out what somebody else's program does without having written it.

Start where it starts and follow one path rather than reading top to bottom. Names and tests tell
you what things are *for*; the debugger tells you what actually happens. It is the most useful
skill in this area, because nearly all the code you will ever meet is somebody else's — including
this repository, which you can open right now.
