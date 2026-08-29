# Exercises

Copy this whole directory into the same folder he has been using since Area 0 — the one
that is his. Area 2a turns it into a git repository; until then it is still just a
folder, and that is still fine.

Nothing new to install. Same Python, same turtle, same editor.

## Running one

```text
py -3.14 s1e1_the_repeated_line.py
```

Use `py -3.14`, not `python`. On the DM's machine `python` is 3.12 in PowerShell and
3.14 in Git Bash, and using the one command everywhere avoids a whole category of
confusing evening.

## Three things that are new this area

**`turtle.speed(0)` is at the top of nearly every file.** It turns the animation off.
Area 1 draws hundreds of lines instead of four, and at the default speed a mandala takes
a minute and a half to appear. Think of it as a throttle, not a concept.

**Ctrl-C kills a running program.** Press it in the **terminal** window — the one with
the text — not in the drawing. Session 3 makes him use it on purpose. It is the most
useful key combination in this area and one of the most useful of the year.

**Two files never finish, and that is correct.** `session-3/s3e4_the_hang.py` and
`session-6/b2_the_loop_that_never_ends.py` are supposed to run forever. Their headers say
`# expect: hangs`. Do not fix them before the session.

## What is in each file

Every file has:

- **a docstring at the top** — what it is for, and what to do before running it
- **a header of tags** — `# concepts:`, `# dc:`, `# expect:`, and sometimes `# strokes:`
  and `# stdin:`. These are for the game engine and the verification harness, not for
  him. He can ignore them.
- **a `YOUR MOVE` block near the bottom** — the actual work, ending in a choice board

**The shipped code always runs and always draws.** It is a starting point, never a
finished answer. Nothing in this directory contains the solution to its own tasks; the
few reference solutions that exist live in `../reference/` and are the DM's.

## Predictions

Five files ask for written predictions **before** running: `s1e2`, `s2e1`, `s4e1`,
`s5e1`, and every file in `session-6`.

This is not a ritual. A wrong prediction he wrote down is the entire mechanism, and a
wrong prediction he kept in his head teaches nobody anything. Enforce it. It costs ninety
seconds and it is the difference between this area landing and not.

## Session 6 is different, and differently from Area 0

Those six files are **broken on purpose** and most of them do not crash.

Area 0's session 3 was seven files that all announced their failure. Here, three of the
six say nothing at all: one draws too few sides, one never stops, one draws a shape that
does not close. There is no red text, no line number and no arrow.

That is the point of the session and it is the hardest evening in the area. Do not fix
any of them beforehand.

## Checking they all still work

From the area directory:

```text
py -3.14 verify.py
```

Runs every file with the window suppressed and checks each against its own header tags,
including the two that are supposed to hang and the ones whose stroke count is pinned.
Worth running after any edit — including his, if he ever asks whether he has broken
something.
