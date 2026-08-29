# Walkthrough 3 — The Log As A Story

**Concepts:** `git-log` · `git-branch` · resurfaces `git-commit`
**DC:** 8
**You need:** your repository, with at least three commits in it, and `streak.py`.

---

## Before you start

Out loud:

1. What are the two commands that make a save?
2. Why two and not one?
3. What does `git status` tell you that you cannot see by looking at the folder?

---

## 1. Read what you wrote

```
git log
```

It opens in a pager. **Press `q` to get out.** Nobody has ever guessed that. Now the
version you will actually use for the rest of your life:

```
git log --oneline
```

One line per commit. Read them from the bottom up — the bottom is the oldest.

**Now the uncomfortable bit.** Point at one of the middle ones and answer, without
opening any files:

> What did I change in that commit?

If you can, your session-2 messages were good. If you cannot, they were not, and this is
the bill arriving. Nobody is cross with you. **Write down, now, what that message would
have had to say for you to know.**

---

## 2. Commit messages that are worth having

A message is written for a person reading it in November. That person is you and they
have forgotten everything.

| Message | What is wrong with it |
|---|---|
| `stuff` | Every commit is stuff |
| `fixed it` | Fixed what? Which of nine things? |
| `update motto.py` | The log already knows which file. It does not know why |
| `changed the motto to something about breaking things` | Nothing. This is fine |

The test is not "is it a good sentence". The test is: **could I find this commit again
by reading only the list?**

Open `streak.py`, change `entries` to the number of journal entries you actually have,
run it, and commit it with a message that passes that test.

```
py -3.14 streak.py
git add streak.py
git commit -m "..."
git log --oneline
```

---

## 3. A branch, lightly

You want to try something and you are not sure it will be any good. That is what a
branch is for.

```
git branch
```

One line: `* main`. The star means you are on it.

```
git switch -c longer-entries
git branch
```

Two lines now, and the star has moved.

**Look at the folder.**

```
ls
```

Same files. Same number. **A branch is not a copy of the folder.** Most people believe it
is for years. What actually changed is which commit you are standing on and what your
next commit will attach to.

---

## 4. Do the work on the branch

On the branch, do steps 2 and 3 from `streak.py`'s YOUR MOVE block: raise `words_each`,
and add a line at the end that prints the average using `total` and `entries`.

```
py -3.14 streak.py
git add streak.py
git commit -m "print the average words per entry"
git log --oneline
```

Four commits, and the newest one is yours from thirty seconds ago.

---

## 5. The part that makes branches make sense

```
git switch main
```

Now open `streak.py` and look at it.

**Your change is gone.**

Before you panic: it is not gone. Say out loud where you think it went, then check:

```
git log --oneline
git switch longer-entries
```

Look at the file again. It is back.

Nothing was lost, nothing was copied, and no file was ever in two places. What moved was
*you*.

---

## 6. Bring it back

```
git switch main
git merge longer-entries
```

Git may open an editor to ask you to name what you just did. Keep the message it
suggests and close the editor. That is all a merge commit is: a note saying two lines of
history joined up here.

Now the payoff:

```
git log --oneline --graph --all
```

Read it. There is a fork and a join in there, drawn with `|` and `\` and `/` characters,
and it is a picture of a decision you made twenty minutes ago.

---

## 7. Check your session-1 guesses

In session 1 you wrote down guesses about `HEAD` and `objects`. Go and look:

```
cat .git/HEAD
ls .git/refs/heads
```

`HEAD` is a one-line file that says which branch you are on. That is the entire mechanism
behind step 5 — switching a branch rewrites that one line and then makes the folder
match.

Were you right? Write down which part you had wrong. Being wrong here is worth more than
being right, because you now know what the answer is *instead of* rather than just what
it is.

---

## A thing you may not do tonight

You will want to delete a commit whose message is embarrassing. You can, and you should
not, and the reason is worth arguing about out loud:

> Is the log a record of what you did, or a story about how good you are?

Spec §3 principle 5: **never hide failure.** Your log is the first place in this campaign
where that stops being a slogan and starts costing you something.

---

## Done when

- [ ] `git log --oneline` reads as a list you could navigate in November
- [ ] You made a branch, committed on it, switched away, and watched the file change back
- [ ] You can say what a branch actually is, without the word "copy"
- [ ] You merged it and the graph shows the fork and the join
- [ ] You checked your `HEAD` and `objects` guesses from session 1
