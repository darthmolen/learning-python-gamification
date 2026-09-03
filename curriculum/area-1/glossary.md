# Area 1 glossary

One entry per concept this area teaches. The heading is the concept's id from
`pyquest/packages/content/src/concepts.ts`.

## if

Runs the block underneath only when the condition is true. The colon ends the question and the
indentation is what says "this part belongs to the `if`".

```python
if score > 10:
    print("you win")
```

Forget the colon and Python stops before it runs anything.

## elif

"Otherwise, try this question instead." Comes after an `if`, and you can have as many as you
like.

Only the first true one runs. That is the difference between `elif` and a stack of separate
`if`s, and it is the reason a chain of `elif` cannot fire twice.

## else

"Otherwise, do this." No condition of its own — it catches everything the questions above did
not.

```python
if score > 10:
    print("you win")
else:
    print("not yet")
```

## comparison-operators

The questions you can ask about two values: `==` equal, `!=` not equal, `<` less than, `>`
greater than, `<=` and `>=` for "or equal".

`=` gives something a name. `==` asks whether two things are the same. Using the first where you
meant the second is a mistake everyone makes, so it is worth knowing by name rather than by
surprise.

## boolean-operators

`and`, `or` and `not` — for joining questions together.

`and` needs both sides true. `or` needs one. `not` flips whatever it is given. Python also stops
reading as soon as the answer is settled, so the right-hand side of an `and` never runs when the
left is already false.

## while

Repeats the block underneath for as long as the condition stays true.

**Something inside has to change, or it never stops.** `while True:` with no way out is the loop
that freezes a program, and meeting it deliberately is worth more than avoiding it by accident.

## for

Repeats the block once for each item in a collection, handing you the item each time.

```python
for side in range(4):
    turtle.forward(100)
    turtle.right(90)
```

Use `for` when you know what you are going through, and `while` when you only know when to stop.

## range

Produces a run of numbers to loop over. `range(4)` is 0, 1, 2, 3 — four numbers, starting at
zero, stopping *before* the one you named.

That off-by-one shape looks wrong until you notice `range(4)` gives you exactly four turns, which
is what you asked for.

## nesting

Putting one block inside another — a loop inside a loop, or an `if` inside a `for`.

The indentation is the only thing that says which belongs to which, so it is doing real work
rather than making the page tidy. The inner block runs all the way through on every pass of the
outer one.

## accumulator-pattern

Start with an empty total, add to it inside a loop, use it after the loop ends.

```python
total = 0
for price in prices:
    total = total + price
print(total)
```

The name is worth having because you will write this shape for the rest of your life — counting,
summing, collecting, building a list. Once you can see it, you stop reinventing it.
