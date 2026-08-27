# The Name Tag

A name tag holds one piece of information and prints it back where everyone can read it.
That is the whole of this quest, and it is also the whole of every program you will ever
write: take something in, do something to it, put something out.

## What it must do

1. Ask the player for a name.
2. Print exactly one line: `Welcome, <name>!`

So if the player types `Steve`, the program prints `Welcome, Steve!` — the exclamation mark
included, the capital W included.

## The tools you need

- `input("...")` shows a prompt and hands back whatever was typed, as a `str`.
- A variable holds it so you can use it more than once.
- An f-string puts a variable inside a line of text: `f"Welcome, {name}!"`.

## When you are stuck

Read the error message before you change anything. It names the line. Tier 0 has one rule
above all the others: **the error is a sentence, not a wall.** Read it out loud if that helps.
