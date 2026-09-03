# Area 2 glossary

One entry per concept this area teaches — 2a is git, 2b is the real toolchain. The heading is the
concept's id from `pyquest/packages/content/src/concepts.ts`.

## repository

A folder git is watching. Inside it, git keeps every version of every file you have ever saved a
snapshot of, in a hidden `.git` directory beside your work.

Nothing leaves the folder until you say so. A repository on your own machine is a complete
history on its own — the server comes later, and is a copy rather than the original.

## git-init

Turns a folder into a repository. Run once, in the folder you want watched.

```
git init
```

Nothing is tracked yet. It only means git is now paying attention.

## git-add

Chooses what goes into the next snapshot. Adding a file does not save it — it puts it on the
list.

```
git add solution.py
```

The step exists so you can commit three of the five files you changed, and say why those three
belong together.

## git-commit

Saves a snapshot of everything you added, with a message saying what it is.

```
git commit -m "Draw the square with a loop"
```

The message is for the person reading it later, who is usually you. "fix" tells that person
nothing; "Draw the square with a loop" tells them what changed and why they might care.

## git-log

Every commit, newest first. Read together, the messages are the story of how the thing got built.

That is why the message is worth the twenty seconds. A log of "fix", "fix2", "asdf" is a history
that technically exists and answers no question anybody will actually ask.

## git-branch

A second line of history, so you can try something without disturbing what already works.

Make a branch, make a mess on it, and `main` is untouched the whole time. If the mess turns out
well you fold it back in; if it does not, you delete the branch and nothing was lost.

## git-push

Sends your commits to the copy on the server, so they exist somewhere other than your laptop.

**Pushing is how work travels.** Until you push, a commit lives on one machine — and one machine
is a single point of failure for everything you have made.

## files-on-disk

Your program is a file with a name, sitting in a folder, like everything else on the computer.

A path says where it is: `area-0/solution.py` means the file `solution.py` inside the folder
`area-0`. Most of the confusion in this half of the area is really about which folder you are
standing in when you type a command.

## running-scripts

Handing your file to Python from a terminal.

```
py -3.14 solution.py
```

The terminal has a folder it is standing in, and the filename is read from there. "It says the
file does not exist" almost always means you are standing somewhere else.

## vscode

The editor. It colors the code, marks mistakes before you run anything, and has a terminal built
into the same window.

It is a tool, not a requirement. Everything you write in it is an ordinary text file, and it runs
exactly the same from any other editor.

## venv

A private box of installed packages, belonging to one project.

Without it, everything you install goes into one shared pile and two projects that want different
versions of the same thing cannot both work. The box is a folder you can delete and rebuild,
which makes it cheap to get wrong.

## pip

Installs packages other people wrote.

```
pip install requests
```

It installs into whichever venv is active, which is the thing to check first when an import fails
right after an install that said it worked.

## tracebacks

The report Python prints when it stops. Read it from the **bottom** — the last line names the
error, and the lines above it are the path it took to get there.

The frames are your program's own steps, and in a longer program most of them will be yours. The
skill is finding the deepest line that is *your* file.

## main-guard

```python
if __name__ == "__main__":
    main()
```

"Only do this when I was the file that was run." When another file imports yours, `__name__` is
your module's name instead of `"__main__"`, so the block is skipped.

It is what lets a file be both a program you can run and a toolbox somebody else can import
without setting it off.
