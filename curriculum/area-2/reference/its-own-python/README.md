# its-own-python

A program that draws a word very large. It cannot run without a package, which is the
only interesting thing about it.

**This is the DM's worked copy of the `a2-its-own-python` quest** (`curriculum/area-2` →
session 7). It is a Datamine payload, not a handout: the rules for unlocking one are in
`../README.md`.

## Run it

Four commands, in this order, from inside this directory. They are written for **Git
Bash**, which is the shell the rest of Area 2 is written for.

```
py -3.14 -m venv .venv
source .venv/Scripts/activate
pip install -r requirements.txt
python main.py
```

In **PowerShell**, line 2 is `.venv\Scripts\Activate.ps1` instead. On macOS or Linux it
is `source .venv/bin/activate`. Everything else is identical.

## What each line is actually doing

| Line | In one sentence |
|---|---|
| `py -3.14 -m venv .venv` | Make a Python that belongs to this folder. It appears as a `.venv` directory with a copy of Python inside it |
| `source .venv/Scripts/activate` | Point this terminal at that Python. Your prompt changes, and it changes back when you close the window |
| `pip install -r requirements.txt` | Install what the file says, into `.venv`, and nowhere else on the machine |
| `python main.py` | Run it |

## The line that catches everybody, including adults

**`python` is the right word here, and it is the only place in this repository where it
is.** Everywhere else the rule is `py -3.14`, because `python` on this machine is 3.12 in
PowerShell and 3.14 in Git Bash (`tools/python/README.md`).

Inside an activated environment that rule inverts, and it was measured rather than
assumed:

```
$ source .venv/Scripts/activate
$ python  -c "import sys; print(sys.executable)"
    ...\.venv\Scripts\python.exe        ← the environment
$ py      -c "import sys; print(sys.executable)"
    ...\.venv\Scripts\python.exe        ← the environment
$ py -3.14 -c "import sys; print(sys.executable)"
    ...\pythoncore-3.14-64\python.exe   ← NOT the environment
```

**`py -3.14` asks for a version, and the environment is not a version.** So the habit that
keeps him safe for six weeks is the exact habit that breaks the moment he activates a
venv, and `pip install` under the wrong one of those is the most common way session 7
goes wrong.

There is one way to be sure and it is the same one every time:
`py -3.14 exercises/session-7/which_python.py`, or the shorter version he should learn by
heart —

```
python -c "import sys; print(sys.executable)"
```

## Why `pyfiglet`

It had to be something the program genuinely cannot fake. A project that would run the
same with an empty environment has not needed one yet, and the brief refuses it.

Beyond that: it is small, it needs no network at runtime, it has been stable for years,
and its output is a foot high. A dependency whose value is invisible teaches that
dependencies are paperwork.

## What is not here, on purpose

**No `.venv` directory.** That is the point of the quest and the first thing the harness
checks. It is rebuilt from the four commands above in about ten seconds, by anybody, on
any machine, which is exactly why nobody commits one.

**No pinned version** in `requirements.txt`, and the file says why.

## Proved on

`pyfiglet` 1.0.4, Python 3.14.6, Windows 11, Git Bash. The four commands above were run
in that order and `main.py` printed the banner.
