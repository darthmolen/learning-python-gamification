# Exercises

**The first half of this directory is mostly not Python, and that is the area.** Sessions
1–4 are git, typed at a terminal: four walkthroughs, a `.gitignore` waiting to be renamed,
and four small Python files whose job is to be committed, branched, pushed and cloned.

**Sessions 5–8 turn that round.** The toolchain half is Python files in real directories,
and there the `.py` files stop being props and become the lesson.

## The two kinds of file

**`wN_*.md` — walkthroughs.** Numbered commands with the question to answer at each step.
Type them; do not paste them. They are the actual lesson and there is nothing for a
harness to run in them, so they are audited by the completion checklist in
`../README.md` instead — each one ends with a **Done when** list, which is that
checklist's other half.

**`*.py` — in 2a, the things you do it to.** Deliberately easy. Session 2 is about `add`
and `commit`, and a Python file you had to think about would compete with the thing you
are actually learning.

**`*.py` — in 2b, the lesson itself.** These carry Area 2 concept tags rather than Area
0's, and that difference is real rather than clerical: **`git-add` is not something a
Python file can demonstrate, and `files-on-disk` is.** A file can print where it is, a
file can tell you which Python is running it, a file can import another file and produce a
traceback with three frames in it. Sessions 5–8's files do exactly those things.

Every one of them, in both halves, carries the same header tags as Area 0 —
`# concepts:`, `# dc:`, `# expect:`, plus `# stdin:` where it asks a question — and
`../verify.py` runs them and checks them against those tags.

Four of session 8's files are **supposed to fail**, and their tags say which error. An
exercise that was meant to break and did not is as wrong as one that crashed (§3 principle
5), and the harness fails either way round.

## Where these files go

**Copy them into your own repository, one session at a time, when the walkthrough says
to.** That is different from Area 0, where you copied the whole directory at the start.
Here the copying *is* part of the work: an untracked file arriving in a repository is
what `git status` is for, and a directory that was already complete would have nothing to
notice.

The exception is session 1: copy `still_works.py` in before you run `git init`, so you
have something in the folder to prove nothing broke.

## Running one

```
py -3.14 motto.py
```

Use `py -3.14`, not `python`. On this machine `python` is 3.12 in PowerShell and 3.14 in
Git Bash, and session 7 is entirely about why that matters. Until then, one command
everywhere.

**Session 7 is where that rule gets its exception**, and it is the only one: inside an
activated virtual environment, `python` is the right word and `py -3.14` is not the
environment. `../reference/its-own-python/README.md` has the measured proof.

## `gitignore.txt`

It ships with a `.txt` on the end and you rename it. The reason is written at the top of
the file and is worth reading: a file actually named `.gitignore`, sitting inside the
curriculum's own repository, would quietly change what *that* repository ignores — which
is a confusing bug to ship with a lesson about not committing things by accident.

## Checking they all still work

From the area directory:

```
py -3.14 verify.py
```

Thirteen files, and it says so, and it also says what it is **not** running: one worked
reference project that has an environment of its own, and eight walkthroughs there is
nothing to execute in. Those two numbers are deliberate. A harness that quietly counts
zero and prints a reassuring result is worse than one that names what it cannot check.
