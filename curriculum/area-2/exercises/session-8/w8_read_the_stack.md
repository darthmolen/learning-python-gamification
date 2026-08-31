# Walkthrough 8 — Read The Stack

**Concepts:** `tracebacks` · `main-guard` · resurfaces `reading-errors`, `venv`
**DC:** 12
**You need:** your repository, a terminal, and all six `.py` files from this directory.

You have been reading errors since week two. Tonight they get taller, and the skill is
not reading more of them — it is reading **less** of them, on purpose, in the right
order.

---

## Before you start

Out loud, no looking:

1. What is a venv, in one sentence?
2. How do you find out which Python is running?
3. Why is `.venv` in `.gitignore`?

---

## 1. Somewhere to work

```
mkdir read-the-stack
cd read-the-stack
```

Copy all six files in: `bottom_frame.py`, `middle_frame.py`, `top_frame.py`,
`the_library_floor.py`, `banner.py`, `show_the_banner.py`.

Do not open them yet. Run them first.

---

## 2. One frame

```
py -3.14 bottom_frame.py
```

You have seen this exact error in week two. Read it anyway, out loud, in four pieces:

- the file;
- the line number;
- the line itself;
- **the last line**, which is the name of what went wrong and a sentence about it.

One file. You wrote it. Easy.

---

## 3. Two frames

```
py -3.14 middle_frame.py
```

Now there are two files listed.

**Which one is wrong?** Say it before you read on.

Not the first one. `middle_frame.py` contains no mistake at all — its only crime is
asking for a file that does. It is listed first because it is the *furthest away* from
the problem.

Notice something else: the only thing printed before the traceback came out of
`bottom_frame.py`, which you did not run. Importing a file runs the whole of it. Hold on
to that; it is what step 7 is about.

---

## 4. Three frames

```
py -3.14 top_frame.py
```

Three files now. You wrote all three.

Put the three tracebacks next to each other on the screen and read the **last line** of
each.

**It is identical in all three. The error never moved.** The only thing that changed is
how far away from it you were standing when you asked.

### The rule, and it is the whole session

> **Read a traceback from the bottom.**
>
> The bottom line says **what** went wrong. The frame just above it says **where**.
> Everything above that is the story of how Python got there, and most nights you can
> ignore all of it.

---

## 5. Fix it

One word, in one file. Go and do it, then:

```
py -3.14 top_frame.py
```

**Which file did you have to open?** Was it the one you ran?

That question is worth more than the fix. The file you run and the file that is wrong are
different files, most of the time, forever.

---

## 6. Four frames, and you wrote one

```
py -3.14 the_library_floor.py
```

This is the tall one, and it is the shape that makes people give up.

Count the frames. Now count the ones naming a file **you** wrote.

**One.** Line 19, `the_library_floor.py`.

The others are inside Python's own code, doing things called `raw_decode` and
`scan_once`. Do not read them. You are not supposed to understand them and understanding
them would not help — they are Python explaining itself to itself.

The only question is the one you just answered: *which of these files did I write?*

Then fix the settings line so it runs. The error message already told you what was
missing.

*(You have never been taught `json` and you do not need it. It is a way of writing
settings in a text file — Minecraft mods are full of it. It is here because it is
**somebody else's code**, and somebody else's code is what makes a stack tall.)*

---

## 7. The four words at the bottom of a file

```
py -3.14 banner.py
```

A banner. Now:

```
py -3.14 show_the_banner.py
```

`show_the_banner.py` imports `banner.py` and uses its title — **and the banner does not
print.**

Open `banner.py` and read the line that did that:

```python
if __name__ == "__main__":
```

It is a comparison you can already read. `__name__` is a word Python fills in for you,
like `__file__` in session 5, and it holds one of exactly two things and never anything
else:

- the text `"__main__"`, when this is the file you ran;
- the file's own name, when somebody else imported it.

So the line says: **only do this when I am the one being run.**

### Now break it, because the rule is worthless without this

1. Delete the `if` line in `banner.py` and un-indent the four prints under it.
2. Run `show_the_banner.py` again.

**The banner prints when nobody asked for it.** You imported one file to borrow one word
out of it and it took over your program.

3. Put the line back. Run it again. Quiet.

That is `main-guard`, and you now have a reason for it instead of a rule about it.

---

## 8. Write these down

In a `NOTES.md` in `read-the-stack/`:

1. How many frames in `top_frame.py`'s traceback? How many of those files did you write?
2. How many in `the_library_floor.py`'s? How many did you write?
3. Which line of a traceback says **what** went wrong?
4. Which line says **where**?
5. Which file did you fix, and which one did you run?
6. What are the two things `__name__` can hold?

---

## 9. Commit it, and look at what is coming

```
git add read-the-stack
git commit -m "..."
git push
```

**Next session is the boss.** Both halves of tonight are in it:

- when the cold clone fails on somebody else's machine, a traceback is what you will be
  reading, at speed, with somebody watching;
- and the boss brief asks for `if __name__ == "__main__"` in your project, by name.

Go and read `dm-guide.md` §7 before next session. It is the checklist you are going to be
judged against and **it is not a secret.**

---

## Say it in your own words

> "Read a traceback from the ________."
>
> "A frame that names a file is not saying ________, it is saying ________."
>
> "`if __name__ == "__main__":` means ________."

---

## Done when

- [ ] You ran the three frame files in order and saw one, two and three frames
- [ ] You can say why the last line of all three tracebacks is identical
- [ ] You fixed the chain, and know which file you had to open
- [ ] You found your own single line in a four-frame traceback
- [ ] You took the main-guard out, saw the banner print uninvited, and put it back
- [ ] `read-the-stack/NOTES.md` answers all six questions
- [ ] Committed and pushed
- [ ] You have read `dm-guide.md` §7, which is how the boss is judged
