# Area 5 glossary

One entry per concept this area teaches. The heading is the concept's id from
`pyquest/packages/content/src/concepts.ts`.

## class

A kind of thing, with its own data and its own orders.

```python
class Player:
    ...
```

A dict holds values. A class holds values **and** the things you can do to them, in one place, so
the data and the code that understands it stop drifting apart.

## init

The method that runs when a new one is made, and sets up what it starts with.

```python
class Player:
    def __init__(self, name):
        self.name = name
        self.health = 20
```

You never call it directly — `Player("Ada")` calls it for you.

## attributes

The values one object holds. `self.name`, `self.health`.

`self` is how a method refers to the object it was called on. Two players each have their own
`health`, and `self` is what keeps them apart.

## methods

Functions that belong to a class. The first parameter is always `self`.

```python
    def take_damage(self, amount):
        self.health = self.health - amount
```

Called as `player.take_damage(3)` — Python passes the object as `self` without you writing it.

## repr

What an object should look like when it is printed.

```python
    def __repr__(self):
        return f"Player({self.name!r}, health={self.health})"
```

Without it, printing an object gives you `<__main__.Player object at 0x7f...>`, which tells you
nothing at the exact moment you most wanted to know something.

## instance-vs-class

The **class** is the kind of thing. An **instance** is one actual thing made from it.

`Player` is a class; `Player("Ada")` is an instance. Everything in `__init__` belongs to the
instance, so each one has its own; anything set on the class itself is shared by all of them,
which is occasionally what you want and usually a surprise.

## composition

Building a thing out of other things.

```python
class Player:
    def __init__(self, name):
        self.inventory = Inventory()
```

A player *has* an inventory. Most of the time this is the right answer, and it is worth reaching
for before inheritance.

## inheritance

Making a class from another class, keeping what it already had.

```python
class Boss(Enemy):
    ...
```

`Boss` *is* an `Enemy` and gets its methods for free. Useful when the "is a" is genuinely true;
when it is not, composition holds up better as the program grows.

## try-except

Doing something that might fail, and saying what to do when it does.

```python
try:
    side = int(answer)
except ValueError:
    print("That was not a number.")
```

**Catch the error you expected.** A bare `except:` swallows everything, including the mistakes
you would rather have been told about.

## raise

Stopping on purpose, because something is wrong.

```python
if side <= 0:
    raise ValueError("side must be positive")
```

Better than printing a complaint and carrying on with a value you know is bad — the failure ends
up where the mistake is, instead of somewhere later that is hard to trace back.

## custom-exceptions

Your own kind of error, so callers can catch exactly that one.

```python
class InventoryFull(Exception):
    """Raised when something is added to a full inventory."""
```

Worth it once a caller needs to tell your failure apart from every other `ValueError` in the
program.
