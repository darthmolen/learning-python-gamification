# Exercises

Copy this whole directory somewhere you own — `Documents/code/` or similar. You need a
folder that is yours. Area 2a turns it into a git repository; until then it is just a
folder.

## Running one

```
py -3.14 s1e1_first_light.py
```

Use `py -3.14`, not `python`. On the DM's machine `python` is 3.12 in PowerShell and
3.14 in Git Bash, and using the one command everywhere avoids a whole category of
confusing evening.

A turtle window opens. **It may open behind the terminal — Alt-Tab.** When the drawing
finishes, `turtle.done()` hands control to the window and it waits there; closing it with
the X ends the program.

If the window vanishes instantly, the program crashed. There is red text in the
terminal. Read it — that is session 3, and it is a good day for it to arrive early.

## What is in each file

Every file has:

- **a docstring at the top** — what it is for, and what to do before running it
- **a header of tags** — `# concepts:`, `# dc:`, `# expect:`. These are for the game
  engine and the verification harness, not for you. You can ignore them.
- **a `YOUR MOVE` block near the bottom** — the actual work

**The shipped code always runs and always draws.** It is a starting point, never a
finished answer. Nothing in this directory contains the solution to its own tasks; the
few reference solutions that exist live in `../reference/` and are the DM's.

## Predictions

Three files ask you to write predictions on paper **before** running: `s1e2`, `s4e1`,
and every file in `session-3`.

This is not a ritual. A wrong prediction you wrote down is the entire mechanism, and a
wrong prediction you kept in your head teaches nobody anything. Do not skip it. It costs
ninety seconds.

## Session 3 is different

Those files are **broken on purpose** and are supposed to crash. That is what
`# expect: NameError` in the header means. Do not fix them before the session.

`b7_no_error_at_all.py` is the exception and the point: it does not crash, and it is
still wrong.

## Checking they all still work

From the area directory:

```
py -3.14 verify.py
```

Runs every file with the window suppressed, and checks each against its own header tags.
Worth running after any edit — including yours, whenever you want to know whether you
have broken something.
