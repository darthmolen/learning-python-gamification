# Walkthrough 5 — Where A File Actually Goes

**Concepts:** `files-on-disk` · `running-scripts` · resurfaces `print`, `git-add`
**DC:** 10
**You need:** your repository, a terminal, and `where_am_i.py` from this directory.

This is the first session of the second half. Everything from here is a file on a disk,
in a folder, run by a command you typed. Nothing in it is hard. All of it is the thing
most people never get taught.

---

## Before you start

Out loud, no looking:

1. What does `push` send — files, or something else?
2. Where does it send them?
3. What happens if you push without committing first?

---

## 1. Two questions you have never had to answer

Every program you have written so far ran because something else decided where it was.
The browser had it. The REPL had it. You never chose.

```
pwd
```

That is where you are. Say it out loud — the whole path, from the drive letter down.

```
ls
```

That is what is here. **You are standing somewhere.** That has always been true and it
has never mattered until tonight.

---

## 2. The REPL forgets, and a file does not

Open the REPL:

```
py -3.14
```

Type two lines into it:

```
name = "the forge"
print(name)
```

It works. Now close it:

```
exit()
```

Open it again and type `print(name)`.

**Gone.** Everything you typed into a REPL exists until you close the window and then it
has never existed. That is fine for trying something out and it is useless for building
anything, and it is why the rest of this campaign is files.

> A REPL is a conversation. A file is a thing.

---

## 3. Make somewhere for it to live

Inside your repository, at the top of it:

```
mkdir where-the-file-lives
cd where-the-file-lives
pwd
```

Read the last line. You have moved. You are in a different folder from the one you were
in ninety seconds ago, and nothing on the screen would have told you if you had not
asked.

Copy `where_am_i.py` from `sessions/session-5/` into this new folder.

---

## 4. Run it, standing in the right place

```
ls
py -3.14 where_am_i.py
```

It prints two paths. **They are not the same fact and they are not always the same
answer:**

- where the *file* is;
- where *you* were when you ran it.

Write both down. You are about to change one of them.

---

## 5. Run it, standing somewhere else

Go up one directory and run it by naming the path:

```
cd ..
py -3.14 where-the-file-lives/where_am_i.py
```

Look at the two lines again.

**One changed and one did not.** Which one, and why? Answer before you read on.

The file did not move. You did. `where_am_i.py` is in exactly the same place it was
thirty seconds ago; what changed is where you were standing when you asked for it.

---

## 6. Now break it on purpose

Still one directory up, try it without the path:

```
py -3.14 where_am_i.py
```

Read the whole error. Not the first word — all of it. It names a file it could not open
and it prints the path it looked for.

**That path is where the file is not.**

Nothing is broken and nothing needs fixing. Python looked exactly where you told it to
look, which was where you happen to be standing.

> "Which of us is in the wrong place — me, or the file?"

That question, asked calmly, solves about a third of everything that will go wrong for
you this year.

---

## 7. Double-click it, and watch it disappear

Find `where_am_i.py` in the file explorer and double-click it.

A black window appears and vanishes, too fast to read. It **ran**. It printed both lines
and then the window closed, because nothing was there to keep it open.

Do not try to fix it. The point is the comparison: the terminal is not a harder way to
run the file. **It is the way you get to read what the file said.**

---

## 8. Build the quest

This is `a2-where-the-file-lives`, and you have already done the hard part. In
`where-the-file-lives/`:

1. **`run_me.py`**, written by you, printing this line exactly:

   ```
   I am running from a file.
   ```

   It may print anything else you like as well.

2. Run it from inside the directory. It works.

3. Run it from one directory up, without the path. It fails. **Leave that true** — do not
   put a second copy in the repository root to make the error go away. Making the lesson
   disappear is not the same as learning it.

4. **`NOTES.md`**, three real sentences in your own words: where the file is, where you
   ran it from, and what happened when you ran it from the wrong place.

---

## 9. Commit it

```
git status
git add where-the-file-lives
git commit -m "..."
git push
```

`git status` first, and read it. There is a whole directory in the untracked list that
was not there an hour ago.

**This is the first thing you have committed that you wrote from nothing.** The journal
was already written and the earlier files were copied. This one is yours.

---

## Say it in your own words

> "A program is a ________ that is ________."
>
> "`py -3.14 thing.py` only works if ________."

---

## Done when

- [ ] You can say what `pwd` answers, without looking it up
- [ ] You ran `where_am_i.py` from its own directory and from one directory up
- [ ] You made it fail on purpose, and read the whole error
- [ ] You double-clicked it and watched the window vanish
- [ ] `where-the-file-lives/run_me.py` prints `I am running from a file.`
- [ ] `where-the-file-lives/NOTES.md` says three real sentences
- [ ] All of it is committed and pushed
