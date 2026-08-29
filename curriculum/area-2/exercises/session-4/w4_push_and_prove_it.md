# Walkthrough 4 — Push, And Prove It

**Concepts:** `git-push` · resurfaces `git-log`, `git-commit`, `repository`
**DC:** 8
**You need:** your repository, a clean working tree, and **a remote picked before you sit
down.** The DM has chosen one of three (see `dm-guide.md` §3). Ask which, and write the
address down before you start.

---

## Before you start

Out loud:

1. What is in `git log`?
2. What is a branch, in your own words?
3. What would a commit message have to say to be useful to you in November?

And check:

```
git status
```

**Working tree clean.** If it is not, commit what is outstanding first. Push sends
commits, and a change that is not a commit does not exist as far as push is concerned.

---

## 1. Ask git where "away" is

```
git remote -v
```

Nothing comes back. There is no away yet. Everything you have made in three sessions
exists in exactly one place, on one laptop, in one folder.

**Say out loud what happens to all of it if ttheir own machine is dropped tomorrow.**

---

## 2. Name the remote

The address comes from the DM. It is one of:

- a Gitea URL, like `http://<machine>:3080/<him>/<repo>.git`
- a path on a USB stick or a share, like `/d/pyquest-remote/<repo>.git`
- a path on ttheir own machine, like `~/remotes/<repo>.git`

```
git remote add origin <the address>
git remote -v
```

Two lines now, both saying `origin`, one for fetch and one for push.

**`origin` is just a nickname.** It is not a git word with a meaning; it is what everybody
happens to call the first remote. You could have called it `dad` or `away`. Do not — but
know that you could, because half of what looks like magic in git is somebody else's
naming convention.

---

## 3. Push

```
git push -u origin main
```

Read every line that comes back. It is boring, and it is boring on purpose: counting
objects, compressing, writing, and a line saying `main -> main`.

`-u` sets `origin main` as the default, so from now on `git push` on its own is enough.
You will only ever type the long version once per repository.

---

## 4. Nothing happened

Look at your folder. Look at `git log`. Look at your files.

**Nothing changed.** Everything is exactly where it was.

That is correct, and it is why push feels like nothing the first time. The thing that
changed is somewhere you cannot see from here.

---

## 5. Go and look

This is the step that makes the session land. Do not skip it.

Go somewhere completely empty:

```
cd ~
mkdir proof
cd proof
git clone <the same address>
ls
```

**A folder appeared out of nothing, and your files are in it.**

```
cd <your repo name>
ls
cat motto.py
git log --oneline
```

Your motto. Your journal. Your commit messages. Your branch and your merge. All of it,
in a folder you did not copy anything into.

Now run it:

```
py -3.14 motto.py
```

**This is a rehearsal for Boss 2.** In four sessions somebody else does exactly these
commands on a different computer, and whether it works is the whole of Area 2.

---

## 6. Find what did not make it

Still inside `proof`, compare:

```
ls
```

against what is in your real folder. Anything missing?

There will be something. There nearly always is: a file you never `git add`ed, or
something `.gitignore` is hiding, or a folder you made and forgot about.

**Write down what is missing and why.** One of those two reasons is fine and the other one
is the single most common way Boss 2 fails.

---

## 7. Push again, on purpose

Go back to your real repository. Copy `receipt.py` in, run it, answer its questions, and
do its YOUR MOVE steps.

```
py -3.14 receipt.py
git add receipt.py
git commit -m "..."
git push
```

Just `git push` this time — `-u` did its job in step 3.

Then, in your `proof` clone:

```
git pull
ls
```

`receipt.py` arrives. You have now sent something one way and pulled it back the other,
between two folders that know nothing about each other except an address.

---

## 8. Throw the proof away

```
cd ~
rm -rf proof
```

Deliberately. You made a whole copy of everything you own and deleted it, and you have
lost nothing, and you should feel exactly how strange that is.

---

## Say it in your own words

> "Push sends ________, not ________."
>
> "If you did not push it, ________."

---

## Done when

- [ ] `git remote -v` names an `origin`
- [ ] `git push -u origin main` succeeded and you read its output
- [ ] You cloned your own repository into an empty folder and ran a file out of it
- [ ] You found at least one thing that did not make it into the clone, and know why
- [ ] You pushed a second time and pulled it into the clone
- [ ] The journal entry for tonight names which remote you used and what appeared where
