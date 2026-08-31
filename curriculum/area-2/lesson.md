# Escape the sandbox with the scribe role

No drawings or turtles in this lesson.

This area is about the difference between *writing code* and *shipping code* — knowing
where a file actually lives, keeping a history of what you changed, and getting your
work off the machine you wrote it on. Most people who learn to program never learn this
part, and it is the reason they cannot finish anything.

It is two halves. The first is git. The second is the toolchain.

---

## Part one — the history

### What a repository is

A repository is a folder that remembers.

Every other folder on your computer only knows what its files look like *right now*.
Change a file and yesterday's version is gone. A repository keeps every version you
chose to record, forever, along with a note about why.

```bash
cd my-project
git init
```

That makes the current folder a repository. It creates a hidden folder called `.git`
which is the memory itself. Delete `.git` and it goes back to being an ordinary folder
with no past.

### The three places a file can be

This is the part everyone finds confusing, and it is confusing because there are three
places rather than two.

```
working tree  ──git add──►  staging area  ──git commit──►  history
(what you see)              (what you have               (what is
                             chosen to record)            remembered)
```

- **Working tree** — the files as they are on disk. Editing a file changes only this.
- **Staging area** — the changes you have selected to go into the next recording.
- **History** — the recordings themselves. Permanent.

The staging area exists so that "what I changed" and "what I am recording" can be
different things. You might fix two unrelated problems in one afternoon and want them
remembered separately.

```bash
git status              # which files changed, and which are staged
git add shape.py        # stage one file
git add .               # stage everything changed
git commit -m "Draw the spiral inward instead of outward"
```

`git status` is the one to run constantly. It tells you where everything is.

### The message is the point

```bash
git commit -m "Fix bug"
```

That is a wasted opportunity, and you will find out why the first time you go looking for
when something broke.

The message answers **why**, because the *what* is already in the change itself. Anyone
can see that a line changed; nobody can see what you were trying to do.

```bash
git commit -m "Turn 91 degrees rather than 90 so the square spirals"
```

Write it for the person who reads it later. That person is you, and they will have
forgotten.

### The log as a story

```bash
git log --oneline
```

Every recording, newest first, one per line. If you have been writing real messages
this reads as the story of the project — what you tried, in what order, and why. If you
have been writing "fix bug" it reads as nothing at all.

This is the payoff for the discipline, and it is the first moment git stops feeling like
paperwork.

### Branches

A branch is a name for a line of history, so you can try something without disturbing
what works.

```bash
git branch experiment      # make one
git switch experiment      # move onto it
```

Commits now go onto `experiment`. `git switch main` puts everything back exactly as it
was. Nothing is lost either way — which is the whole point. **A branch makes an
experiment cheap**, and cheap experiments are how you learn anything.

### Push

```bash
git push
```

Sends your commits to another copy of the repository, somewhere else.

This is the moment the work stops living on one machine. Until you push, everything you
have made depends on one hard drive continuing to work.

---

## Part two — escaping the sandbox

### Where the file actually lives

A file has a **path** — the list of folders you go through to reach it.

```
C:\Users\you\projects\shapes\spiral.py
/home/you/projects/shapes/spiral.py
```

Windows uses `\` and everything else uses `/`. Python accepts `/` everywhere, so use it.

Two words that will not stop mattering:

- **Absolute path** — from the very top. `C:\Users\you\projects\spiral.py`
- **Relative path** — from where you currently are. `shapes/spiral.py`, or `../spiral.py`
  where `..` means the folder above.

The terminal is always *somewhere*, and that somewhere is the working directory.

```bash
pwd            # where am I
ls             # what is here
cd shapes      # go into shapes
cd ..          # go up one
```

**"It says the file doesn't exist" almost always means you are not where you think you
are.** Run `pwd` and `ls` before you believe anything else.

### Running a script

```bash
py -3.14 spiral.py
```

That starts Python, runs the file top to bottom, and stops. There is no button and no
website. This is what running a program has always been.

If it says the file cannot be found, you are in the wrong directory. See above.

### A virtual environment

Different projects need different libraries, and sometimes different versions of the
same one. A virtual environment gives each project its own private set so they cannot
break each other.

```bash
py -3.14 -m venv .venv          # create it, once
.venv\Scripts\activate          # Windows
source .venv/bin/activate       # everything else
```

Once activated, your prompt changes to show `(.venv)`. Now `pip` installs into this
project only:

```bash
pip install ursina
pip list
```

`.venv` should never go into git. It is large, it is machine-specific, and it can be
rebuilt from a list of names in seconds. That is what `requirements.txt` is for.

### Reading a traceback again

Area 0 taught the shape of a traceback. Now that files import other files, the middle
section starts to matter:

```
Traceback (most recent call last):
  File "main.py", line 12, in <module>
    draw_all()
  File "shapes.py", line 30, in draw_all
    spiral(sides)
  File "shapes.py", line 8, in spiral
    turtle.right(360 / sides)
ZeroDivisionError: division by zero
```

Still read the last line first: division by zero. But now read *upward* as well, because
that middle part is the trail of who called whom. The error happened in `spiral`, which
was called by `draw_all`, which was called from line 12 of `main.py`.

**The bug is often not where the error is.** `spiral` divided by zero, but the zero came
from somewhere further up. The traceback shows you the whole path so you can find where
the bad value was born.

### The main guard

```python
def main() -> None:
    turtle.forward(100)


if __name__ == "__main__":
    main()
```

That last pair of lines means: *only do this when this file is the one being run
directly.*

When you `import` a file, Python executes it. Without the guard, importing a drawing
program would open a window as a side effect of asking to borrow one function from it.
The guard is the difference between a file that can be **used** and a file that can only
be **run**.

You will not feel the need for it until the first time you import your own code. Write
it anyway; it costs two lines.

## What you should be able to do now

- Say what `.git` is and what deleting it would cost you
- Name the three places a change can be, and the command that moves it between them
- Write a commit message that says why
- Read `git log --oneline` as a story
- Make a branch, switch to it, and switch back without fear
- Say what `pwd` will print before you press enter
- Run a script from a terminal, in the right directory, in a virtual environment
- Read a traceback with three frames and say which one holds the bug
- Explain what `if __name__ == "__main__":` protects against

None of this draws anything. All of it is the difference between code that exists on
your machine only and code that exists and runs elsewhere.
