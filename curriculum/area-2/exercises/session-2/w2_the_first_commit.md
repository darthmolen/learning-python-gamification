# Walkthrough 2 — The First Commit

**Concepts:** `git-add` · `git-commit` · resurfaces `repository`
**DC:** 5
**You need:** the repository you made in session 1, and your journal entries.

This is the walkthrough where your own writing goes under version control.

---

## Before you start

Out loud, no looking:

1. What did `git init` actually create?
2. What did `git status` say before you ran it, and what does it say now?

---

## 1. Look at the mess

```
git status
```

It lists everything in the folder under a heading that says **untracked**. That word is
exact and worth pausing on: git can *see* these files. It is not looking after any of
them.

Nothing here is a save yet. Not one byte.

---

## 2. Move your journal in

Your journal entries have been plain markdown in a plain folder since week one. Tonight
they stop being that.

Make a place for them inside your repository:

```
mkdir journal
```

Then copy your entries in — all of them, however many you have. Copy, do not move; leave
the originals where they are.

```
ls journal
```

Read the list. **You wrote every one of those.**

---

## 3. Stage them

```
git add journal
git status
```

Read it again. The heading changed. They are no longer *untracked*; they are now under
**Changes to be committed**.

They are still not saved. `add` does not save anything.

**Here is the question worth getting right tonight, and it is the only genuinely
non-obvious idea in Area 2a:**

> Why are `add` and `commit` two different commands, when every other program on this
> laptop has one Save button?

Try to answer it before reading on.

---

Because you almost never finish everything at the same time. Tonight you touched four
files: two are finished and two are half-done and embarrassing. One Save button saves
all four. `add` is you saying *these ones, not those ones*, and `commit` is you sealing
the box.

The pile you have `add`ed is called the **staging area**. It is a box you are filling.
`commit` closes the lid and writes your name on it.

---

## 4. Seal the box

```
git commit -m "my journal so far"
```

Read what comes back. It tells you the branch, a short code, how many files, and how
many lines. Then:

```
git status
```

**Nothing to commit, working tree clean.** That sentence is the goal state, and it is the
one sentence in git worth memorising.

That is the first commit in your repository, and it is a hundred per cent your own
writing.

---

## 5. Add the motto, on purpose, separately

Copy `motto.py` into your repository, edit it so it says something of yours, and run it:

```
py -3.14 motto.py
```

Now do these five commands **in this order**, and read the output of every single one.
Do not type the next one until you have read the last one.

```
git status
git add motto.py
git status
git commit -m "a motto"
git status
```

Three `git status` runs. All three say something different, and the difference between
them is the entire mechanism.

---

## 6. The one that catches everybody

Change the motto in the file. Save it. Then:

```
git status
```

It noticed. You did not ask it to look.

**Where is it comparing your file to?** Not to the file — the file is what it is looking
at. It is comparing your file to the commit you made ninety seconds ago. That comparison
is what a repository is *for*.

Now commit the change:

```
git add motto.py
git commit -m "changed the motto"
```

Two commits of the same file. Both still exist. Neither overwrote the other.

---

## 7. Stop committing rubbish

Copy `gitignore.txt` into your repository and rename it:

```
mv gitignore.txt .gitignore
```

Open it and read the comments. Then:

```
git status
git add .gitignore
git commit -m "ignore things I did not write"
```

**A `.gitignore` is itself committed.** Read that sentence twice — the list of things git
should ignore is a thing git remembers. It has to be, or it would only work on your
laptop.

---

## Say it in your own words

Finish these out loud:

> "`add` means ________."
>
> "`commit` means ________."

If `add` came out as "save" you have the two of them merged into one, which is the
mistake this whole walkthrough exists to prevent. Try again: one of them chooses, the
other one seals.

---

## Done when

- [ ] Your journal entries are in a commit
- [ ] `motto.py` is in a *different* commit
- [ ] You changed a file after committing it and watched `git status` notice
- [ ] `.gitignore` exists in your repository and is itself committed
- [ ] `git status` says **working tree clean**
