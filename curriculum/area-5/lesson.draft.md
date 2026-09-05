# State and Objects

Area 4 gave you functions — work with a name. This area gives you objects:
**data and the work that belongs to it, kept together.**

The vehicle is modeling a world. A block has a position and a type. A player has an
inventory and a health. Those things travel together everywhere in your program, and this
is the moment the language stops making you carry them by hand.

## The problem objects solve

Here is a player, built from what you already know:

```python
player_name = "Sam"
player_health = 20
player_inventory = ["torch"]


def take_damage(health, amount):
    return health - amount


player_health = take_damage(player_health, 3)
```

It works. Now add a second player and watch what happens — every variable doubles, every
function grows an argument, and nothing stops you passing player one's health with player
two's inventory.

## A [[class]] is a shape for a thing

```python
class Player:
    def __init__(self, name):
        self.name = name
        self.health = 20
        self.inventory = []


sam = Player("Sam")
print(sam.health)       # 20
```

`class` describes a kind of thing. `Player` is the **class**; `sam` is an **instance** — one
actual player made from that description. `Player("Sam")` builds one.

`__init__` runs once, when the instance is made. Its job is to set the thing up.

**`self` is the instance itself.** It is the first parameter of every method, Python passes
it for you, and `self.health = 20` means *this particular player's health*. Two players have
two healths and they cannot be confused, because each one lives on its own object.

## [[attributes|Attributes]] are what it knows

```python
sam.health = 17
sam.inventory.append("torch")
print(sam.name)
```

`name`, `health` and `inventory` are **attributes**. The dot is the same dot from
`turtle.forward` in Area 0 — the thing on the right belongs to the thing on the left. It
always meant this.

## [[methods|Methods]] are what it can do

```python
class Player:
    def __init__(self, name):
        self.name = name
        self.health = 20

    def take_damage(self, amount):
        self.health = self.health - amount
        if self.health <= 0:
            self.health = 0

    def is_alive(self):
        return self.health > 0


sam = Player("Sam")
sam.take_damage(3)
print(sam.is_alive())     # True
```

A **method** is a function that lives on a class. The difference from Area 4 is that it can
reach its own data through `self` — you do not pass the health in, because the object
already has it.

Look at what disappeared: no `player_health` variable, no function that could be handed the
wrong one. **The data and the work that uses it are in the same place**, which is the entire
argument for objects.

## `__repr__` — what printing shows

```python
sam = Player("Sam")
print(sam)          # <__main__.Player object at 0x000001C...>
```

Useless. Fix it:

```python
    def __repr__(self):
        return f"Player({self.name!r}, health={self.health})"


print(sam)          # Player('Sam', health=20)
```

Write one on every class you make. It costs two lines and it pays for itself the first time
you print a list of them.

## [[instance-vs-class|Instance versus class]]

```python
class Player:
    max_health = 20          # class attribute: one, shared by all players

    def __init__(self, name):
        self.name = name     # instance attribute: one per player
```

`max_health` belongs to `Player` itself — every player sees the same one. `name` belongs to
each instance.

The rule of thumb: **if it varies between instances, it goes in `__init__`.** If it is the
same for every instance ever, it can live on the class.

## [[composition|Composition]] — objects made of objects

```python
class Inventory:
    def __init__(self):
        self.items = []

    def add(self, item):
        self.items.append(item)


class Player:
    def __init__(self, name):
        self.name = name
        self.inventory = Inventory()      # a player HAS an inventory


sam = Player("Sam")
sam.inventory.add("torch")
```

A player **has** an inventory. That is composition, and it is the tool you will reach for
almost every time.

## [[inheritance|Inheritance]] — lightly

```python
class Block:
    def __init__(self, position):
        self.position = position

    def is_solid(self):
        return True


class Water(Block):           # Water IS a Block
    def is_solid(self):
        return False          # but this part differs
```

`Water` inherits everything `Block` has, and replaces the one method that differs.

**Use it sparingly, and only when the sentence "an X is a Y" is actually true.** Water is a
block. A player is not an inventory — a player *has* one. Getting that backwards produces
code nobody can follow, and it is the single most common way object-oriented programming
goes wrong.

When you are unsure, use composition. It is almost always the better answer.

## try / except — catching a failure

Some failures you can see coming and cannot prevent — a missing file, a number that was
supposed to be a number.

```python
try:
    health = int(input("health: "))
except ValueError:
    print("that was not a number")
    health = 20
```

`try` runs the risky part. `except` catches one *kind* of failure and decides what to do.

**Catch the specific error, never everything.** A bare `except:` swallows your own typos and
turns a five-second bug into an hour, because the program keeps running and tells you
nothing.

## raise — refusing on purpose

```python
def take_damage(self, amount):
    if amount < 0:
        raise ValueError("damage cannot be negative")
    self.health -= amount
```

`raise` stops and complains. Negative damage would silently heal the player, and a bug that
heals is far harder to find than one that crashes.

**Refusing early is a kindness.** The traceback points at the caller who passed the bad
value, rather than at some distant place where the wrong number finally caused trouble.

### Your own kinds of error

```python
class InventoryFull(Exception):
    """Raised when an item cannot be added."""


raise InventoryFull("no room for a torch")
```

A custom exception lets a caller catch *your* failure specifically, without catching
everything else too.

## What you should be able to do by the end

- Write a class with `__init__`, attributes and methods, and say what `self` is
- Explain why two instances cannot get each other's data confused
- Write a `__repr__` that tells you something
- Say which of composition and inheritance fits, and default to composition
- Catch a specific exception and say why a bare `except` is a trap
- `raise` on a value your function should refuse
- Model a small world — blocks, a player, an inventory — where each thing owns its own state
