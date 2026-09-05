# Area 3 glossary

One entry per concept this area teaches. The heading is the concept's id from
`pyquest/packages/content/src/concepts.ts`.

## list

Things in order, in square brackets. The order is the point — a list remembers what came first.

```python
inventory = ["torch", "bread", "rope"]
```

A list can hold anything, including other lists, and it can grow and shrink after you make it.

## indexing

Getting one item out by its position, counting from **zero**.

```python
inventory[0]   # "torch"
inventory[-1]  # "rope", counting from the end
```

Zero-based looks wrong for about a week and then stops. `inventory[0]` is the first slot, not the
zeroth thing you own.

## slicing

Taking a piece of a list, from one position up to *but not including* another.

```python
inventory[0:2]  # ["torch", "bread"]
```

Same stopping rule as `range`, and for the same reason: `[0:2]` gives you two items.

## mutation

Changing a thing in place, rather than making a new one.

```python
inventory.append("shield")   # inventory itself is now longer
```

This is why two names for the same list are dangerous: change it through one and the other sees
it too, because there was only ever one list.

## list-methods

The orders a list understands: `append` to add one on the end, `remove` to take one out, `pop` to
take the last one and hand it back, `insert` to put one at a position, `sort` to reorder in
place.

Most of them change the list and hand back nothing, which is why `x = inventory.sort()` leaves
you holding `None`.

## tuple

Things in order, in round brackets, that **cannot be changed** once made.

```python
position = (100, 250)
```

Use one when the shape is fixed — a coordinate, a color, a row from a table. The immovability is
a promise to whoever reads it later.

## dict

Pairs: a key, and the value it points at. Curly brackets, colons between.

```python
recipe = {"planks": 4, "sticks": 2}
recipe["planks"]   # 4
```

A list answers "what is in position 3". A dict answers "what is the value for `planks`", which is
the question you actually have most of the time.

## dict-methods

`keys()` for the names, `values()` for the values, `items()` for both together, and `get()` for
looking something up without crashing when it is missing.

`recipe["gold"]` raises `KeyError`. `recipe.get("gold")` hands back `None` instead, which is the
right tool when absent is a normal answer rather than a mistake.

## set

A bag of items with no order and no duplicates.

```python
seen = {"torch", "bread"}
```

Adding something twice changes nothing. Use one when the only questions are "is this in here" and
"what are all the different ones".

## iteration

Going through a collection one item at a time.

```python
for item in inventory:
    print(item)
```

Looping a dict gives you its **keys**; use `.items()` when you want the values too. Changing a
collection while you are looping over it is a good way to confuse both Python and yourself.

## nested-structures

Collections inside collections — a list of dicts, a dict whose values are lists.

```python
chests = [{"planks": 4}, {"sticks": 2}]
chests[0]["planks"]   # 4
```

Read the brackets left to right: get item 0, then get `planks` out of that. Real data is nearly
always this shape.

## len

How many items are in a thing.

```python
len(inventory)   # 3
```

Works on lists, dicts, sets and strings — `len("torch")` is 5. It gives you a count, so the last
position is always `len(x) - 1`.

## in

Asks whether something is present, and hands back `True` or `False`.

```python
"torch" in inventory     # True
"planks" in recipe       # checks the KEYS, not the values
```

The dict case surprises people once and then never again.

## sorted

Hands back a **new** list in order, leaving the original alone.

```python
sorted(inventory)
```

That is the difference between `sorted(x)` and `x.sort()`: one gives you a copy, the other
rearranges what you had and hands back nothing.

## min

The smallest item.

```python
min([4, 2, 9])   # 2
```

Works on anything Python can compare, including strings, where "smallest" means earliest
alphabetically.

## max

The largest item, by the same rules as `min`.

```python
max([4, 2, 9])   # 9
```

## breakpoints

Telling the editor to stop your program on a line so you can look at what everything holds.

It is `print` without the mess: instead of adding lines to see values and deleting them
afterwards, you pause and inspect. The moment a bug is about *what a variable actually contains*,
this is faster than guessing.
