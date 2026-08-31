# Walkthrough 7 — Its Own Python

**Concepts:** `venv` · `pip` · resurfaces `running-scripts`
**DC:** 12
**You need:** your repository, a terminal, `which_python.py` from this directory, and
about ten minutes of internet for one `pip install`.

There is more than one Python on this computer. Tonight your project stops caring which
one you happen to be standing in.

---

## Before you start

Out loud, no looking:

1. What did the editor take away that a normal VS Code has?
2. What is the dot on the tab?
3. How do you open a terminal in the folder you are editing?

---

## 1. Find out which Python you have been using

Make somewhere for tonight, at the top of your repository, and copy `which_python.py`
into it:

```
mkdir its-own-python
cd its-own-python
py -3.14 which_python.py
```

Read the path it printed. **That is a real file on this disk.** Go and look at it in the
explorer if you want; it is a program called `python.exe` in a folder like every other
folder.

Now the same file, the other command:

```
python which_python.py
```

**On this machine you may get a different path and a different version number** — from
the same folder, in the same second, with the same file.

That is not a bug and nobody did it to you. There is more than one Python installed here,
and the bare word `python` picks one of them depending on which shell you are standing
in. In Git Bash it is one; in PowerShell it is another. `tools/python/README.md` has the
details, and this is why every command in this whole curriculum says `py -3.14`.

**Write both paths down.** You are about to make a third one.

---

## 2. Make a Python that belongs to this folder

```
py -3.14 -m venv .venv
```

Wait a couple of seconds. Then:

```
ls .venv
ls .venv/Scripts
```

Thousands of files. **You wrote none of them and you can rebuild all of them with the one
command you just typed.** Remember that; it is the whole reason for step 8.

Nothing has changed yet. The environment exists and nothing is using it.

---

## 3. Activate it

```
source .venv/Scripts/activate
```

*(PowerShell: `.venv\Scripts\Activate.ps1`. macOS or Linux:
`source .venv/bin/activate`.)*

**Your prompt changed.** There is a `(.venv)` on the front of it now. That is the only
thing on the screen that tells you which Python you are talking to, and it is why it is
there.

---

## 4. Ask the same question again

```
python which_python.py
```

A third path — inside your own folder, inside `.venv`. The version is the one you asked
for. It also now says a virtual environment is active, because it can tell.

Then try this, and this is the part that catches adults:

```
py -3.14 which_python.py
```

**That one is NOT the environment.** It goes back to the machine's Python, because
`py -3.14` asks for a *version* and an environment is not a version.

So the rule that has kept you safe for six weeks inverts, in exactly one place:

> **Inside an activated environment, `python` is the right word.** It is the only place
> in this whole curriculum where it is.

`pip install` under the wrong one of those is the single most common way this session
goes wrong, and the way to be sure is never to guess:

```
python -c "import sys; print(sys.executable)"
```

Learn that line by heart. You will use it for the rest of your life.

---

## 5. Install something, and watch where it goes

Pick something that does something you can see. `pyfiglet` draws enormous letters and is
a good first one:

```
pip install pyfiglet
pip list
```

Read the list. It is short, and everything on it is in your `.venv` and nowhere else on
this machine.

Write a `main.py` next to `which_python.py` that actually uses it:

```python
import pyfiglet

print(pyfiglet.figlet_format("your name here"))
print("If there is a giant word above this line, the environment worked.")
```

```
python main.py
```

---

## 6. Prove it is really in there, by leaving

```
deactivate
```

The `(.venv)` disappears from your prompt. Now run it again:

```
py -3.14 main.py
```

**`ModuleNotFoundError`.** Read it. It names the thing you installed four minutes ago.

Nothing was uninstalled and nothing broke. You are asking a different Python, and that
Python has never heard of it. **This is what "its own Python" means**, and it is the
whole session in one error message.

Then go back in:

```
source .venv/Scripts/activate
python main.py
```

---

## 7. Write down what you installed

Nobody else can see inside your `.venv`, and it is never going in the repository. So the
project has to carry a *list* instead.

Look at what a machine would write:

```
pip freeze
```

Now write the file yourself, by hand, one line:

```
pyfiglet
```

Save it as `requirements.txt`. One line is enough — a name is enough, and pinning exact
versions is real and is a problem for Area 6.

Then check the other half:

```
git status
```

**`.venv` is not in the list.** You did that in session 2, three weeks ago, when you
copied in a `.gitignore` with a line in it about something you had not met yet. This is
that line paying out.

---

## 8. Write the README, then destroy the environment

`README.md`, in `its-own-python/`, with the exact commands in order that turn a fresh
copy of this project into a running program:

```
py -3.14 -m venv .venv
source .venv/Scripts/activate
pip install -r requirements.txt
python main.py
```

Then prove it, and this is the step that matters:

```
deactivate
rm -rf .venv
```

**Gone.** Thousands of files, deleted on purpose. Now rebuild it by typing only what is
written in your own README — nothing you remember, nothing you improvise — and run the
program again.

**If you had to remember anything that was not written down, your README is not
finished.** That is exactly how Boss 2 fails, one session from now, on somebody else's
computer, where remembering is not available to you.

---

## 9. Commit it

```
git status
git add its-own-python
git commit -m "..."
git push
```

Read `git status` before you add. `main.py`, `requirements.txt`, `README.md`,
`which_python.py`. Four small files, and not one of the thousands.

---

## Say it in your own words

> "A virtual environment is ________."
>
> "`requirements.txt` exists because ________."
>
> "The command that tells me which Python is really running is ________."

---

## Done when

- [ ] You know the path of the Python that runs when you type `py -3.14`
- [ ] You have seen `python` and `py -3.14` give different answers on the same machine
- [ ] `.venv` exists, is activated, and your prompt says so
- [ ] You installed something with `pip` and used it in `main.py`
- [ ] You deactivated and got `ModuleNotFoundError`, and can say why
- [ ] `requirements.txt` names it, in one line, written by you
- [ ] `git status` does not mention `.venv`
- [ ] You deleted `.venv` and rebuilt it from your own README, typing only what was
      written there
- [ ] Committed and pushed
