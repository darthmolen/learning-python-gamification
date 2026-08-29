# Exercises

**This directory is mostly not Python, and that is the area.** Sessions 1–4 are git,
typed at a terminal. What you will find here is four walkthroughs, a `.gitignore` waiting
to be renamed, and four small Python files whose job is to be committed, branched, pushed
and cloned.

## The two kinds of file

**`wN_*.md` — walkthroughs.** Numbered commands with the question to answer at each step.
Type them; do not paste them. They are the actual lesson and there is nothing for a
harness to run in them, so they are audited by the completion checklist in
`../README.md` instead — each one ends with a **Done when** list, which is that
checklist's other half.

**`*.py` — the things you do it to.** Deliberately easy. Session 2 is about `add` and
`commit`, and a Python file you had to think about would compete with the thing you are
actually learning. Every one carries the same three header tags as Area 0 —
`# concepts:`, `# dc:`, `# expect:`, plus `# stdin:` where it asks a question — and
`../verify.py` runs all four and checks them against those tags.

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

Four files, and it says so, and it also says how many walkthroughs it is **not**
covering. That second number is deliberate. A harness that quietly counts zero and prints
a reassuring result is worse than one that names what it cannot check.
