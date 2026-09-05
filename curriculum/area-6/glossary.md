# Area 6 glossary

One entry per concept this area teaches. The heading is the concept's id from
`pyquest/packages/content/src/concepts.ts`.

## file-read

Getting what is in a file into your program.

```python
with open("world.json") as f:
    text = f.read()
```

You get text back, not data. Turning that text into something you can use is a separate step, and
forgetting it is why `text["planks"]` fails.

## file-write

Putting something from your program into a file.

```python
with open("world.json", "w") as f:
    f.write(text)
```

**`"w"` empties the file first.** If what you meant was "add to the end", that is `"a"`, and the
difference is a save file you still have versus one you do not.

## context-managers

`with` — borrow something, and have it put back whichever way the block ends.

```python
with open("world.json") as f:
    ...
```

The file closes even if the code inside raises. Without `with`, an error skips your `close()` and
the writing may never reach the disk.

## json-format

A text format for data, understood by nearly every language.

```json
{"planks": 4, "sticks": 2}
```

It looks like a Python dict and is not one — keys must be strings in double quotes, `True` is
`true`, `None` is `null`, and there is no trailing comma. `json.dumps` and `json.loads` handle
the translation.

## csv

Rows of values separated by commas, usually with a header line. What a spreadsheet exports.

Use the `csv` module rather than splitting on commas yourself: a real file will eventually
contain a comma inside a quoted field, and that is the day the hand-rolled version breaks.

## http

How a program asks another computer for something. You send a request naming a method and an
address; you get back a status code and a body.

`200` means it worked, `404` means there is nothing at that address, and anything starting with
`5` means their end broke rather than yours.

## requests

The library for making HTTP requests without the awkward parts.

```python
r = requests.get(url)
r.status_code
r.json()
```

Check the status before trusting the body. A `404` still gives you a response object, and
`r.json()` on an error page raises somewhere confusing.

## argparse

Lets your program take options from the command line, and writes the help text for you.

```
py -3.14 world.py --seed 7
```

Once a program has more than one setting, this beats editing the source to change a number — and
`--help` becomes something you can read instead of remember.

## dependencies

Code your project needs that you did not write, written down so somebody else can install the
same set.

Pinning exact versions is what makes "it works on my machine" reproducible on another. Every
dependency is also somebody else's code you are now responsible for, which is a reason to have
few of them.

Look at the version pinning in this repository's own `docker-compose.yml` for the same argument
made about images.
