# Pick It Up

An inventory that cannot gain and lose things is not an inventory. This one keeps a running
account of itself, and the account has to be true after every move.

## What it must do

Build this at the top of your repository:

```
pick-it-up/
    backpack.py
    NOTES.md
```

**`backpack.py` starts with a list of at least three things** and then makes **at least four
moves**, printing the backpack after every one.

```
start: torch, bread
+ rope
now: torch, bread, rope
- bread
now: torch, rope
+ flint
now: torch, rope, flint
pop: flint
now: torch, rope
```

The four line shapes, and nothing else counts as a move:

| Line | Means | Prints after |
|---|---|---|
| `+ thing` | add it to the end | the new backpack |
| `- thing` | take that one out **by name** | the new backpack |
| `pop: thing` | take the **last** one out, and name what came back | the new backpack |
| `now: a, b, c` | the whole backpack, comma-separated, in order | — |

An empty backpack prints `now:` and nothing after it.

## The rule this quest is actually about

**Every `now:` line must be the backpack, not a description of it.**

A machine is going to take your `start:` line, replay your moves in order, and check that
each `now:` says what it should. If your program prints a list that has drifted from the
one it is holding — even by one item, even in the right order — that is the bug.

Two that catch people, and both are the same mistake wearing different clothes:

- **`- thing` takes a value; `pop` takes a position.** Reach for the wrong one and the
  backpack is still a backpack, just not yours.
- **`pop` hands the thing back.** That is why you can name it. `remove` does not, and a
  program that claims otherwise is printing something it did not receive.

## When you are done

Change your starting list. Change nothing else. Every `now:` should still follow, because
every `now:` came from the backpack rather than from you.

## `NOTES.md`

Three real sentences, in your own words:

- what `remove` and `pop` each take, and which one hands something back
- what happened when you removed something that was not there
- one line where you expected the backpack to change and it did not, or the other way round

## The tools you need

- `list-methods`
- `mutation`
- `list`
- `iteration`

## Anything clever will fail this

Printing the four states you already know is not this quest. The backpack has to be the
thing being printed, which you can check yourself in ten seconds: change the start line and
see whether everything after it still tells the truth.

## When you are stuck

Print the backpack on the line *before* each move as well as after. Two prints around one
move will tell you what that move actually did, which is usually not what you thought.

If `- thing` is failing: is that thing in the backpack at the moment you ask? How would you
find out before asking?
