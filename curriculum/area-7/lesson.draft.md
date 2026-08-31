# Craft

Twelve weeks, and the last area. Everything before this was about making a program work.
This is about **making it good** — and about working on code you did not write, which is
what programming actually is once you are not alone.

At the end of it you open the repository that runs all of this, read it, and change
something in it.

## pytest — proving it, instead of hoping

You have been checking your programs by running them and looking. That does not scale, and
it does not survive you changing something later.

```python
# test_inventory.py

def test_adding_an_item_puts_it_in_the_list():
    inventory = Inventory()
    inventory.add("torch")
    assert "torch" in inventory.items
```

```bash
pytest
```

Any file named `test_*.py`, any function named `test_*`, and `assert` for the claim. That is
the whole framework to start with.

**The name of the test is half its value.** `test_adding_an_item_puts_it_in_the_list` tells
you what broke without opening the file. `test_inventory_1` tells you nothing.

### A test you have not seen fail is worth nothing

This is the rule that matters most, and it is not obvious.

Write the test **first**, run it, and **watch it fail**. Then write the code, and watch it
pass. A test written after the code, and passing on its first run, has never demonstrated
that it can notice anything.

That is not caution for its own sake. This repository has found five checks that were green
while measuring nothing — a regex escaped so it could never match, an assertion pointed at
the wrong half of a page. Each looked like a passing test and each guarded nothing at all.

The stronger move: once it passes, **break the code on purpose** and confirm the test
notices. Then put it back. If the suite stays green while the code is wrong, the suite is
decoration.

## The debugger, properly

Area 3 gave you `breakpoint()`. Now use it as the first move rather than the last.

```
n     next line
s     step into the function being called
c     continue until the next breakpoint
p x   print x
l     show where you are
q     quit
```

The habit worth building: when something is wrong, **do not add three prints and re-run.**
Stop on the line before and look at what is actually there. It is faster and it answers
questions you did not know to ask.

## Type hints

```python
def take_damage(self, amount: int) -> None:
    self.health -= amount


def find_block(position: tuple[int, int, int]) -> Block | None:
    ...
```

A hint says what a function expects and gives back. **Python ignores them at run time** —
they change nothing about how the program behaves.

They are for two readers. A person, who no longer has to trace the code to find out what
goes in. And a checker like `pyright`, which reads them and tells you about mistakes
*without running anything*.

`Block | None` is the one worth learning early: it says this can hand back nothing, so the
caller must deal with that. Most of the crashes you have had this year were a `None` where
something was expected.

## Comprehensions

```python
names = [block.name for block in world]
solid = [b for b in world if b.is_solid()]
counts = {item: inventory.count(item) for item in set(inventory)}
```

A comprehension builds a collection from another one in a line. The long form:

```python
names = []
for block in world:
    names.append(block.name)
```

Same thing. The comprehension is better when it fits on one line and reads as a sentence.
**When it needs two conditions and a nested loop, write the loop** — a comprehension nobody
can read is worse than four plain lines.

## Generators

```python
def blocks_in(world):
    for block in world:
        yield block
```

`yield` hands back one value and **pauses**, keeping its place. The next request continues
from there.

The point is memory. A list of a million blocks holds a million blocks. A generator holds
one at a time and the position it is at. When you are walking something once and only need
one item at a time, that difference is the difference between running and not.

## Refactoring, with a net

Area 4 taught the moves. Now you have tests, which changes what refactoring is.

**Green, change, green.** Run the suite. Make the change. Run it again. If it goes red, the
change was wrong — undo it and make a smaller one.

Without tests, refactoring is a leap. With them it is a series of steps you can check. That
is why this area puts them in this order.

## Performance intuition

```python
import time

start = time.perf_counter()
do_the_thing()
print(f"{time.perf_counter() - start:.3f}s")
```

**Measure before you optimise.** Every programmer's guess about what is slow is wrong at
least half the time, and time spent speeding up code that was never the problem is time
spent making it harder to read for nothing.

The one piece of intuition worth carrying: a loop inside a loop over the same data is
*n squared*. A thousand items becomes a million steps. Area 1's nesting arithmetic, arriving
with consequences.

Checking `if x in my_list` inside a loop is the usual culprit — a list has to look through
everything, a set does not. That is what Area 3's sets were for.

## Branches and pull requests

Area 2 gave you `git branch`. Now use it the way it is meant to be used.

```bash
git switch -c fix-the-inventory-bug
# work, commit
git push -u origin fix-the-inventory-bug
```

Then open a **pull request**: a proposal to merge, with a description of what you changed
and why, that somebody can read and comment on before it lands.

**A pull request is a conversation, not a submission.** The description is where you explain
what you were trying to do — reviewers who understand the intent give useful comments, and
reviewers who have to guess give nitpicks.

Comments on your code are about the code. That is a distinction worth practising, because it
never stops mattering.

## Reading unfamiliar code

The last skill, and the one you will use most.

You will open a repository you did not write and have to change something in it. Everyone
finds this hard. The method:

1. **Find the entry point.** What runs first? `main.py`, a `__main__` guard, a script in
   `package.json`.
2. **Follow one thread.** Pick a single thing the program does and trace only that. Do not
   read the whole codebase — nobody does, including the people who wrote it.
3. **Run it, with a breakpoint.** Reading tells you what it is supposed to do; stopping it
   tells you what it does.
4. **Read the tests.** They are worked examples of how the code is meant to be used, and
   they are usually more honest than the documentation.
5. **Change one small thing and see what breaks.** Fastest way to find out what a piece is
   connected to.

You do not need to understand all of it. You need to understand enough to change one thing
safely, and to know when you have not.

## What you should be able to do by the end

- Write a test before the code, watch it fail, then make it pass
- Break the code deliberately and confirm the test notices
- Debug with a breakpoint instead of a handful of prints
- Add type hints, and say what `Block | None` obliges a caller to do
- Write a comprehension where it reads better, and a loop where it does not
- Say when a generator beats a list, and why
- Measure before optimising, and spot a loop inside a loop over the same data
- Open a pull request with a description somebody can review
- Open a repository you have never seen and change one thing in it without breaking the rest
