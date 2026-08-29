# Where The File Lives

Every program you have written so far ran because something else decided where it was.
This one runs because you know where it is.

## What it must do

Build this exactly, at the top of your repository. The names matter, because a machine is
going to look for them.

```
where-the-file-lives/
    run_me.py
    NOTES.md
```

1. **`run_me.py`** prints, on a line of its own, exactly:

   ```
   I am running from a file.
   ```

   It may print anything else you like as well. It has to exit cleanly.

2. **It runs from inside its own directory** — `cd where-the-file-lives`, then
   `py -3.14 run_me.py`.

3. **The same command, one directory up, fails.** Try it. Read the error. That failure is
   the entire point of this quest, so do not go and fix it by putting a copy in the root —
   that would be making the lesson go away rather than learning it.

4. **`NOTES.md`** says three things in your own words: where the file is, where you ran it
   from, and what happened when you ran it from the wrong place. Three real sentences.

## When you are done

Two identical commands, two different directories, two different outcomes, and you can say
why.

## The tools you need

- `files-on-disk`
- `running-scripts`

## Anything clever will fail this

Two lines of `print` pass. That is deliberate. Session 5's subject is not the program, it
is the fact that a program is a file and a file is somewhere.

## When you are stuck

The error when you run it from the wrong directory names the file it could not open. Read
the whole path. Then ask which two of you are in the wrong place — you, or the file.
