# First Light

Two weeks. By the end of them you will have typed a line that draws a square, given
things names, asked the computer a question, and read an error message on purpose.

Everything here runs with a text editor, a terminal, and Python. No website, no account,
no internet.

## The first line

```python
import turtle

turtle.forward(100)
turtle.done()
```

Three lines and a window opens with a line drawn across it.

`import turtle` says *go and fetch the drawing tools*. `turtle.forward(100)` is an
order: move forward one hundred steps, drawing as you go. `turtle.done()` says *stop
and leave the window open* — without it the window closes before you can look at it.

The dot matters. `turtle.forward` means "the `forward` that belongs to `turtle`". You
will see that dot everywhere in Python and it always means the same thing: the thing on
the right belongs to the thing on the left.

## A square, and why repetition is a smell

```python
turtle.forward(100)
turtle.right(90)
turtle.forward(100)
turtle.right(90)
turtle.forward(100)
turtle.right(90)
turtle.forward(100)
turtle.right(90)
```

That draws a square. It also contains the same two lines four times, and that is worth
noticing now even though you cannot fix it yet — Area 1 is largely about fixing exactly
this.

`right(90)` turns ninety degrees clockwise. Four turns of ninety is three hundred and
sixty, which is the whole way round, which is why the shape closes.

## print, and why you need it

```python
print("hello")
print(7 * 6)
```

`print` puts something in the terminal — the window with the text, not the one with the
drawing. It is how you find out what the computer actually thinks, as opposed to what
you assumed.

That sounds dull. It is the single most useful thing in this document. When a program
does something you did not expect, the fastest way to find out why is to print the
thing you are unsure about.

## Variables — giving something a name

```python
length = 100
turtle.forward(length)
turtle.forward(length)
```

`length = 100` gives the number 100 the name `length`. After that, writing `length`
means writing 100.

The `=` here is **not** the equals of mathematics. It does not claim that the two sides
are the same. It is an **order**: *make `length` mean 100 from now on.* Which is why
this is not nonsense:

```python
length = 100
length = length - 20
```

Read the second line right-to-left: work out `length - 20`, which is 80, then make
`length` mean that. In maths `length = length - 20` would be a false statement. In
Python it is a perfectly ordinary instruction.

**The right-hand side is always worked out first.** That one sentence explains most of
the surprises in this area.

## The four kinds of thing

Everything you handle has a type, and the type decides what the thing can do.

| Type | What it is | Examples |
|---|---|---|
| `int` | A whole number | `7`, `-3`, `0` |
| `float` | A number with a decimal point | `3.5`, `-0.25`, `2.0` |
| `str` | Text, in quotes | `"hello"`, `"7"` |
| `bool` | True or false, and nothing else | `True`, `False` |

You can ask:

```python
print(type(7))        # <class 'int'>
print(type(7.0))      # <class 'float'>
print(type("7"))      # <class 'str'>
```

**`7` and `"7"` are not the same thing**, and this catches everyone. The quotes make it
text. `7 + 7` is `14`. `"7" + "7"` is `"77"`, because `+` on text means *stick these
together*. And `7 + "7"` is an error, because Python will not guess which one you meant.

That error is not Python being unhelpful. It is Python refusing to silently do the wrong
thing, which is a kindness you will come to appreciate.

## Asking a question

```python
name = input("What is your name? ")
print(name)
```

`input` prints the question, waits for typing, and hands back what was typed.

**`input` always hands back a `str`.** Always — even when the person types a number.

```python
sides = input("How many sides? ")
print(sides + 1)          # error: you cannot add 1 to text
print(int(sides) + 1)     # works
```

`int(sides)` converts text into a whole number. Forgetting it is one of the two or three
most common mistakes in this whole area, and the error message says so plainly once you
know how to read it.

## f-strings — putting values inside text

```python
name = "Sam"
sides = 6
print(f"{name} drew a shape with {sides} sides")
```

The `f` before the quote turns the string into a fill-in-the-blanks template. Anything
inside `{}` gets worked out and dropped in.

Without it you would be gluing pieces together by hand and converting types as you go:

```python
print(name + " drew a shape with " + str(sides) + " sides")
```

Both work. The first one you can still read in a month.

## Reading an error

This is a skill, not a personality trait, and it is the most valuable thing in Area 0.

```
Traceback (most recent call last):
  File "shape.py", line 4, in <module>
    print(sides + 1)
TypeError: can only concatenate str (not "int") to str
```

Read it **bottom to top**.

1. **The last line is what went wrong.** `TypeError` — something was the wrong type.
   Then the detail: it tried to join text to text, and got given a number instead.
2. **The line above is where.** `line 4`, and it shows you the line.
3. Everything above that is the path Python took to get there. Early on, ignore it.

The word before the colon is the error's family name, and there are only a handful you
will meet this month:

- `SyntaxError` — Python could not read your line at all. Usually a missing bracket or
  quote, and usually on the line *above* the one it names.
- `NameError` — you used a name that does not exist. Usually a typo, or a variable used
  before it was given a value.
- `TypeError` — the right kind of operation, the wrong kind of thing. Usually text where
  a number was meant.

**An error is not a failure.** It is the program telling you exactly where it got stuck,
in a fixed format, on purpose. A program that crashes with a traceback is being far more
helpful than one that silently draws the wrong shape.

## What you should be able to do now

- Draw with the turtle, and say what each line does
- Give a value a name, and explain why `length = length - 20` is not nonsense
- Name the four types, and say why `7 + "7"` fails
- Take input, convert it, and put it in a sentence with an f-string
- Read a traceback bottom-to-top and name the file, the line and the family of error

If any of those is shaky, the fix is not to read this again — it is to open the editor
and type something small that uses it.
