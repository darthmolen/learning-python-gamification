# Area 0 glossary

One entry per concept this area teaches. The heading is the concept's id from
`pyquest/packages/content/src/concepts.ts`; what a reader sees is the label in that registry, so
renaming a heading here without renaming it there breaks the link between them.

Write for somebody meeting the word for the first time. Two or three sentences, one example, and
no promises about how long anything takes.

## print

Puts something in the terminal — the window with the text in it, not the one with the drawing.
It is how you find out what the computer actually thinks, as opposed to what you assumed.

```python
print("hello")
print(7 * 6)
```

## variables

A name for a value, so you can write the name instead of the value. Give one thing a name at the
top and you can change it in one place instead of hunting for every copy.

```python
length = 100
turtle.forward(length)
```

The `=` is not the equals of mathematics. It does not claim the two sides are the same; it is an
order — *make `length` mean 100 from now on.*

## int

A whole number. No decimal point, no fraction: `7`, `-3`, `0`.

Counting things gives you an `int`, and so does `len()`. Dividing with `/` does not — `8 / 2` is
`4.0`, a float, even though it came out even.

## float

A number with a decimal point: `3.5`, `-0.25`, `2.0`.

`2.0` and `2` are the same quantity and different types, which matters more than it looks.
Floats are also slightly inexact by design — `0.1 + 0.2` is not quite `0.3` — so they are the
right tool for measuring and the wrong one for counting.

## str

Text, in quotation marks: `"hello"`, `"7"`.

The quotation marks are the whole difference. `7` is a number you can do arithmetic with; `"7"`
is two characters that happen to look like one. `input()` always hands back a `str`, which is the
mistake Area 0 is built around.

## bool

True or false, and nothing else. Written `True` and `False`, with capital letters.

Every comparison produces one, which is what `if` reads to decide.

```python
7 > 3      # True
"a" == "b" # False
```

## input

Prints your message, stops the program until somebody types something and presses Enter, then
hands back what they typed.

**What it hands back is always a `str`.** Always — even when they typed `150`. If you want a
number, say so with `int()`.

```python
answer = input("How long should each side be? ")
side = int(answer)
```

## f-strings

A string that can hold values. Put an `f` before the quotation mark and anything inside `{ }`
gets worked out and dropped in.

```python
side = 150
print(f"side length: {side}")
```

The point is that the sentence follows the value. Type the number into the text instead and it
tells the truth once and lies every time after.

## reading-errors

When Python stops, it tells you what went wrong and where. Both halves matter: the **name** of
the error says what kind of mistake it was, and the **line number** says where to look.

The last line is the summary; the lines above it are the path Python took to get there, most
recent at the bottom. Reading one on purpose — rather than scrolling past it to try something
else — is the single habit that makes everything after this area cheaper.
