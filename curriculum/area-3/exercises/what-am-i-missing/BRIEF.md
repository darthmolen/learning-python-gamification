# What Am I Missing

You wrote this in Practice 5, in six lines, with a loop. Write it again in one character —
and then write the two questions next to it, which are the same character pointed
differently.

## What it must do

Build this at the top of your repository:

```
what-am-i-missing/
    missing.py
    NOTES.md
```

**`missing.py` holds two sets** — what the job needs, and what you are carrying — and prints
five lines:

```
need: stick, coal, flint, string
have: stick, coal, plank
missing: flint, string
spare: plank
both: coal, stick
```

1. **`need:`** and **`have:`** — the two sets, comma-separated.
2. **`missing:`** — in `need`, not in `have`. What you still have to find.
3. **`spare:`** — in `have`, not in `need`. Carrying it for nothing.
4. **`both:`** — in both. What you can already use.

Order does not matter on any line; a set has none. An empty answer prints its label and
nothing after it.

## The rule this quest is actually about

**Subtraction does not work both ways round.**

`need - have` and `have - need` are different questions with different answers, and only one
of them is "what am I missing". Reading your own line out loud as a sentence is the check —
*"what the job needs, minus what I am carrying"* — and it takes two seconds.

Get it backwards and nothing crashes. You get a confident, well-formatted, wrong answer,
which is the hardest kind of bug in this area and the reason this quest exists.

## The setup has to make it a real question

- **At least one thing must be missing**, or `missing:` is empty and you never find out
  whether you got the direction right.
- **At least one thing must be spare**, or `missing:` and `have - need` look identical and
  the quest proves nothing.

## When you are done

Swap the two sets over — `need` becomes `have`, `have` becomes `need` — and run it again.
`missing:` and `spare:` should trade places exactly. If they do not, one of them was not
doing what its name says.

## `NOTES.md`

Three real sentences, in your own words:

- what `need - have` asks, said as a sentence rather than as symbols
- what the six-line loop from Practice 5 could do that the subtraction cannot
- what a set lost that a dict would have kept, and when you would want it back

## The tools you need

- `set`
- `in`
- `list`
- `iteration`

## Anything clever will fail this

All five lines have to come out of the two sets. Five lines typed out agree with each other
perfectly and stop being true the moment anything changes — which is exactly what will be
done to them.

## When you are stuck

Print `need - have` and `have - need` on two lines next to each other and look at them. One
of the two is the answer to the question you were asked, and seeing both is faster than
reasoning about either.
