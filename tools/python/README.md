# Python 3.14

**Both machines. Needed week 1, before anything else.**

Everything in this campaign is Python 3.14. Area 0 session 1 opens a terminal and types
into the REPL, so this is the one install that cannot be deferred.

## Install

Get it from [python.org](https://www.python.org/downloads/). On Windows, take the option
that installs the **`py` launcher** — it is what makes the next section survivable.

Verify:

```
py -3.14 --version
```

## The trap this repository keeps tripping over

**On one of the machines this was tested on, `python` resolves to 3.12 in PowerShell and
3.14 in Git Bash.** Two shells, two answers, and neither is wrong.

So: **always `py -3.14`, never `python`.** Every command in this repository is written that
way, and where one is not, it is a bug. It matters more than it looks — a `pip install`
under the wrong interpreter installs a package the other interpreter cannot see, and the
failure surfaces later as a missing module rather than as a wrong shell.

A machine with only 3.14 installed will not hit this. The habit is still the one to teach,
because Area 2b's session 7 is about exactly this: a program gets its own Python.

### The one exception, and it is the one that bites

**Inside an activated venv, `py -3.14` is wrong.** Measured on this machine, 2026-08-31, in an
activated environment:

```
python    -> <venv>\Scripts\python.exe        the venv
py        -> <venv>\Scripts\python.exe        the venv
py -3.14  -> ...\pythoncore-3.14-64\python.exe  the GLOBAL interpreter
```

The launcher honours an active venv **only when no version is asked for**. Naming `-3.14` is a
request for that version, and the global install is what answers.

So the rule above, followed literally, produces the exact failure it exists to prevent:
`py -3.14 -m pip install -r requirements.txt` inside an activated venv installs into the global
interpreter, and the venv it was meant for cannot see the package.

**Inside an activated venv, use `python`.** That is what activation is for, and it is the only
place in this repository where `python` is the right answer. Everywhere else, `py -3.14`.

Area 2b session 7 teaches this directly — it is the session about which Python is running, so
the exception is content rather than an inconvenience.

## The DM's machine also needs

For `curriculum/lib/`'s test suite, which is the DM's and is never run by another learner:

```
py -3.14 -m pip install pytest ruff pyright
```

**`pyright` needs to be told which interpreter to use** or it reports phantom missing
imports:

```
py -3.14 -m pyright --pythonpath "$(py -3.14 -c 'import sys;print(sys.executable)')" curriculum/lib
```

Without `--pythonpath` it resolves against a different Python and reports errors that are
not there. Discovered the hard way while verifying the shim.

## What proves it works

```
py -3.14 --version          → Python 3.14.x
py -3.14 -c "print('ok')"   → ok
```

On the DM's machine, additionally: `py -3.14 -m pytest curriculum/lib/tests -q` passes.
