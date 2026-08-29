# Walkthrough 1 — The Folder That Remembers

**Concepts:** `repository` · `git-init`
**DC:** 5
**You need:** a terminal, and the folder your Area 0 and Area 1 exercises are in.

There is no Python in this walkthrough. Type every command yourself; do not paste.

---

## Before you start

Answer these out loud. You will check both answers in a minute.

1. How many files on ttheir own machine are a copy of another file, saved because you were
   about to change something and did not want to lose the old one?
2. Which of them is the newest? How do you know?

---

## 1. Where am I?

Open a terminal. Before anything else, find out where it thinks you are.

```
pwd
```

On Windows in PowerShell, `pwd` works too. Whatever it prints, read it. That path is
where every command you type next is going to happen.

Now list what is in it:

```
ls
```

Write down, on paper, the number of things it printed. You will compare it in step 3.

---

## 2. Get to the folder that is yours

Your exercises live somewhere like `Documents/code/`. Get there:

```
cd Documents/code
pwd
ls
```

**This folder is about to become the only folder on the laptop that remembers its own
past.** Make sure it is the right one before you go on. If `ls` does not show your
turtle files, you are in the wrong place.

Run the Python file that is sitting here with this walkthrough:

```
py -3.14 still_works.py
```

It works. Of course it does. Remember that it did.

---

## 3. Ask git what it thinks

```
git status
```

It refuses, and it refuses with a whole sentence:

```
fatal: not a git repository (or any of the parent directories): .git
```

**Read every word of that.** Two things in it are worth having:

- it is looking for something called `.git`
- it looked in this folder *and in every folder above it*

So a repository is a thing that is either here or it isn't, and git can tell instantly.

---

## 4. Make it a repository

```
git init
```

One line back. Something like:

```
Initialized empty Git repository in .../code/.git/
```

Now:

```
ls
```

**Count again.** Compare with the number you wrote down in step 1. It is the same. None
of your files moved, none of them changed, none of them are gone.

Now look properly:

```
ls -a
```

`-a` means *all*, including the hidden things. There is one new entry: `.git`. That
directory is the entire difference between a folder and a repository.

---

## 5. Look inside `.git`

You are allowed. Go and look.

```
ls .git
```

You will see names like `HEAD`, `config`, `objects`, `refs`, `hooks`.

**Do not change anything in there.** You do not need to; nothing this year requires it.
But look, because the most useful thing you can believe about git is that it is a
program that writes files in a folder, and the least useful thing you can believe is
that it is magic.

Two of those names are worth guessing at now and checking in session 3:

- `HEAD` — one small file. What do you think is in it?
- `objects` — currently almost empty. What do you think goes in there?

Write your guesses down. Session 3 checks them.

---

## 6. Prove nothing broke

```
py -3.14 still_works.py
git status
```

The Python file runs exactly as it did in step 2. `git status` no longer refuses — it
now has an opinion, and the opinion is that there are a lot of files here it has never
been told about. That is session 2.

---

## Say it in your own words

Before you close the terminal, finish this sentence out loud, without using the word
"backup":

> "A repository is a folder that ________."

If the sentence you produce is *"a folder that keeps every version of itself that I told
it to keep"*, you have it. If it is *"a folder that saves automatically"*, that is the
one wrong answer worth catching now: **git never saves anything you did not tell it to.**
That is session 2 as well, and it is the source of most of the trouble people have with
git for the rest of their lives.

---

## Done when

- [ ] `git status` runs in your folder without refusing
- [ ] You can say which single directory made the difference
- [ ] You looked inside `.git` and wrote down two guesses
- [ ] `still_works.py` runs, still, unchanged
