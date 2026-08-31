# Data and the Outside World

Everything you have written so far forgets everything the moment it stops.

This area is about **data that outlives the program** — saving a world so it is still there
tomorrow, sharing a seed with somebody else, and asking a machine on the other side of the
internet a question.

## Reading a file

```python
from pathlib import Path

here = Path(__file__).parent
text = (here / "world.txt").read_text(encoding="utf-8")
print(text)
```

`Path` from Area 4 is how you say *where*, without gluing strings together and without the
absolute-path trap from Area 2. `/` joins path pieces — it works on every machine.

**Always pass `encoding="utf-8"`.** Without it, Python guesses based on the computer it is
running on, and a file that works on yours will fail on someone else's the first time it
contains a character outside plain English. This is the single most common cross-machine
file bug.

## Writing a file

```python
(here / "scores.txt").write_text("Sam 400\n", encoding="utf-8")
```

That **replaces** the whole file. There is no undo, and no warning. Writing to the wrong
path is how people lose work.

## Context managers — the `with` block

```python
with open(here / "scores.txt", "a", encoding="utf-8") as f:
    f.write("Sam 400\n")
```

`open` gives you a file that is *held open*. The operating system will only let you hold so
many at once, and a half-written file that was never closed can be corrupt.

`with` closes it for you — **including when the code inside raises**. That is the whole
point. The manual version has to remember to close on every path out, including the ones you
did not think about:

```python
f = open(path)
data = f.read()      # if this raises, the file is never closed
f.close()
```

Use `with` every time you open a file. There is no case where the manual form is better.

The modes: `"r"` read, `"w"` write from scratch, `"a"` append to the end.

## JSON — structure that survives

A text file is fine for a line of text. The moment you want to save a *dict*, you need a
format:

```python
import json

world = {"seed": 4815, "blocks": ["dirt", "stone"], "player": {"health": 20}}

(here / "world.json").write_text(json.dumps(world, indent=2), encoding="utf-8")

loaded = json.loads((here / "world.json").read_text(encoding="utf-8"))
print(loaded["player"]["health"])     # 20
```

`json.dumps` turns Python data into text. `json.loads` turns it back. `indent=2` makes it
readable by a human, which matters when you are trying to work out why a save is wrong.

**What survives:** dicts, lists, strings, numbers, booleans, `None`. **What does not:** your
own classes, tuples (they come back as lists), and sets. To save a `Player` from Area 5, give
it a method that returns a plain dict — and one that builds a player back from one.

That pairing is worth naming. It is the shape of every save system you will ever write.

## CSV — rows and columns

```python
import csv

with open(here / "scores.csv", newline="", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        print(row["name"], row["score"])
```

CSV is what a spreadsheet exports. `DictReader` gives you each row as a dict keyed by the
header, which is far easier to read than counting columns.

**Every value comes back as a string**, exactly like `input` in Area 0. `int(row["score"])`
or your comparisons will be quietly wrong — `"9" > "10"` is `True`, because that is how text
sorts.

## Asking another machine

```python
import requests

response = requests.get("https://api.example.com/seed")
response.raise_for_status()
data = response.json()
```

`requests` is not built into Python — it is the first thing this year you have to install,
which is why Area 2's `venv` and `pip` were worth the trouble.

**Three things that are always true of a network call**, and none of them are true of a
file:

1. **It can fail** in ways nothing local does — no internet, the server is down, the server
   moved. `raise_for_status()` turns a failed request into an exception instead of letting a
   page of error HTML flow on as if it were data.
2. **It is slow.** A file read is instant; a request takes as long as it takes. Never put
   one inside a loop that runs sixty times a second.
3. **It is somebody else's computer.** Be polite: ask once, keep what you got, and do not
   hammer it.

```python
try:
    response = requests.get(url, timeout=5)
    response.raise_for_status()
except requests.RequestException as error:
    print("could not reach it:", error)
```

`timeout` is not optional. Without one, a server that never answers hangs your program
forever — the same silence as the missing third rule of a `while` loop, from a different
direction.

## argparse — a program somebody else can run

```python
import argparse

parser = argparse.ArgumentParser(description="Generate a world from a seed.")
parser.add_argument("seed", type=int, help="the world seed")
parser.add_argument("--size", type=int, default=64, help="world size in blocks")
args = parser.parse_args()

print(args.seed, args.size)
```

```bash
py -3.14 world.py 4815 --size 128
py -3.14 world.py --help
```

`--help` is generated for you, and it is the reason this beats editing a variable at the top
of the file. **A program with `--help` is one somebody else can run** without reading your
source — which is the cold clone from Area 2, made routine.

## Dependencies

```bash
pip install requests
pip freeze > requirements.txt
```

`requirements.txt` is the list of what your project needs. Commit it; never commit `.venv`.
Somebody with your repository and that file can rebuild your environment exactly — that is
what makes the clone work on a machine that is not yours.

## What you should be able to do by the end

- Read and write a file with `with` and an explicit encoding, and say what `with` protects
- Save a nested structure as JSON and load it back
- Convert your own objects to plain dicts and back
- Read a CSV and remember that every value arrives as text
- Call an API with a timeout, handle the failure, and say why it is not like reading a file
- Give a program `--help` with argparse
- Record dependencies so somebody else can run it
