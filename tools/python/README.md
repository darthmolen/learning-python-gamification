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

**On the parent's machine, `python` is 3.12 in PowerShell and 3.14 in Git Bash.** Two
shells, two answers, and neither is wrong.

So: **always `py -3.14`, never `python`.** Every command in this repository is written that
way, and where one is not, it is a bug. It matters more than it looks — a `pip install`
under the wrong interpreter installs a package the other interpreter cannot see, and the
failure surfaces later as a missing module rather than as a wrong shell.

His machine is 3.14 only, so he will not hit this. The habit is still the one to teach,
because Area 2b's session 7 is about exactly this: a program gets its own Python.

## The parent's machine also needs

For `curriculum/lib/`'s test suite, which is the parent's and never his:

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

For the parent, additionally: `py -3.14 -m pytest curriculum/lib/tests -q` passes.
