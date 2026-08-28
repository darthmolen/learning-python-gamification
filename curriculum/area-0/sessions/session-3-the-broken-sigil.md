# Session 3 — The Broken Sigil

**Concepts:** `reading-errors` · `print`, `variables`, `int`, `str` resurfacing
**Files:** `exercises/session-3/`
**Journal:** entry 3

Tonight he breaks things on purpose, seven times, and reads what falls out.

This is the session the area is built around. Spec §3 principle 5 is *never hide
failure*, and the Ursina spike found the same thing from the other end: it recommended a
shim over the raw engine largely because raw Ursina's failures are illegible, and
illegible failure quietly destroys a learner's belief that the machine is knowable. An
error message is not the machine telling him off. It is the machine telling him where to
look, in more detail than any human would bother with.

**The framing, said out loud at the start, in these words:**

> "Every error you will ever get is the computer trying to help you. It is not angry and
> it is not broken. It has told you the name of the problem, the file, the line number,
> and often the exact characters. Most people never read past the first red word. We are
> going to read all of it, seven times, tonight."

---

## Beat 1 — Invasion (3 minutes)

1. What does `side = side + 20` do, in two steps?
2. Why use a name instead of just typing the number?
3. What does `print` show you that the picture can't?

---

## Beat 2 — The hook: anatomy of a traceback (7 minutes)

Run `b1_the_typo.py` yourself, on screen, and read it together:

```
Traceback (most recent call last):
  File "...\b1_the_typo.py", line 17, in <module>
    turtel.left(90)
    ^^^^^^
NameError: name 'turtel' is not defined. Did you mean: 'turtle'?
```

Four things to name, and only four:

| Part | What it is |
|---|---|
| The **last line** | The name of the problem, and a description. **Read this first.** |
| `File "...", line 17` | Where. There may be several; the one you care about is the one in *your* file. |
| The repeated line under it | Your actual code, quoted back. |
| `^^^^^^` | The exact characters. Python is pointing. |

**"Most recent call last"** is the sentence to explain, because it is why everyone reads
tracebacks wrong. It means the bottom is the newest and the most specific. **Read from
the bottom up.**

That is the entire teaching for this session. Everything else is him doing it.

---

## Beat 3 — The work (30 minutes)

Seven files. For **each one**, in this order, no skipping:

1. **Read it.** Do not run it.
2. **Predict out loud.** "This will break, and the error will be about ___."
3. **Run it.**
4. **Read the last line out loud. All of it.**
5. **Write the error's name and its line number in `error-log.md`.**
6. **Fix it.** Run again to prove the fix.

| File | Error | The thing it teaches |
|---|---|---|
| `b1_the_typo.py` | `NameError` | A name Python has never heard of. Python even guesses. |
| `b2_wrong_kind.py` | `TypeError` | **The deep one.** See below. |
| `b3_never_closed.py` | `SyntaxError` | A different *kind* of error: nothing ran at all. |
| `b4_out_of_line.py` | `IndentationError` | Blank space is not decoration. Also never ran. |
| `b5_no_such_order.py` | `AttributeError` | So close to b1, and not the same at all. |
| `b6_not_a_number.py` | `ValueError` | The right kind of thing, the wrong value in it. |
| `b7_no_error_at_all.py` | *none* | **The important one.** See below. |

### b2 is the one that matters most

It produces a five-frame traceback, four frames of which are inside Python's own
`turtle.py`, ending in a sentence about multiplying sequences that has nothing to do
with anything he wrote. It looks terrifying. It is the shape of ninety percent of real
tracebacks he will meet for the rest of his life.

The skill is one question, and it is the whole reason this file exists:

> **"Which of those files did you write?"**

One. Start there. The rest is Python narrating its own insides. Make him say that
sentence back to you.

### b1 versus b5

These look identical and are not. `turtel.left(90)` is a name Python has never heard of
— NameError. `turtle.forwrd(100)` is a name it knows perfectly well, being asked for
something that name does not have — AttributeError.

Ask: **"In which one does Python know what `turtle` is?"** Do not accept "they're
basically the same". They are the difference between a wrong noun and a wrong verb.

Both suggest the fix. Point out that the suggestion is a guess, that Python is often
wrong about it, and that it has no idea what he was trying to do.

### b3 and b4 are a different kind of error, and that is the lesson

Run `b1` and `b3` back to back and ask him to spot two differences.

**The window.** b1 opens a turtle window and draws a line before it dies. b3 opens
nothing. Not a flicker.

**The word "Traceback".** b1, b2, b5 and b6 all start with `Traceback (most recent call
last)`. b3 and b4 do not.

Both differences have the same cause, and it is worth him arriving at it himself:

> "b1 got as far as line 17 before it died. How far did b3 get?"

The answer is **nowhere**. Python reads the whole file and turns it into instructions
*before* it runs a single one. A `SyntaxError` means it could not finish reading, so
nothing ever ran — which is why there are no frames to trace and no window to open.
`NameError` and `TypeError` are things that go wrong *during* the run; `SyntaxError` and
`IndentationError` are things that go wrong *before* it.

Two more things worth noticing on b3, once that has landed:

- The caret points at the **opening** bracket, not at the end of the line. Python is
  showing him the thing that was never finished, not the place it noticed.
- It says `line 20` and line 20 really is the wrong line. Python 3.14 is genuinely good
  at this. Older Pythons — and most other languages — blame the line *after*, so if he
  ever sees a syntax error pointing at a line that looks perfectly fine, the answer is
  to look up.

### b7 is the point of the whole session

It runs. It exits cleanly. It prints "Square finished." There is no error of any kind.

It is also completely broken — the turns are 80 degrees, not 90 — and it draws a lopsided
mess.

Do not tell him. Let him run it, see no error, and say it works.

Then:

> "Python is happy. Are you happy? Look at the picture."

And then the sentence to end the session on:

> **"Errors are the easy failures. They come with a name, a line number and an arrow.
> The ones that don't tell you anything are the ones that cost real money."**

He has now met the failure mode that every platform in spec §2.3 fails to teach, in week
two, drawing a square.

---

## Beat 4 — Reversal: he breaks yours (10 minutes)

Hand him a working file — `s2e1_square_by_name.py` is ideal. He plants **three** bugs
in it while you look away. At least one must be silent, b7-style.

Then you find them, out loud, narrating.

**Genuinely get one wrong.** Guess a line, be wrong, say "huh, no, that's fine",
backtrack. Do not perform being stuck; actually be stuck for thirty seconds. Spec §5.8
calls this the highest-value mechanic in the whole design, and it only works if it is
real: *a child who has never seen a competent adult get stuck concludes that being stuck
means being stupid.*

If you find all three instantly, say which one was hardest and why. Never make it look
free.

---

## Beat 5 — Journal (5 minutes)

Entry 3. Tonight *what broke* writes itself, so push on **what I would do differently**
instead — and the honest answer for tonight is usually about reading rather than about
code.

---

## Where he will stall

See `parent-guide.md` §4. The main one, and it will happen on file one:

**He will start fixing before he finishes reading.** Every time, the same sentence:
**"Not yet. Read me the last line first. What is it called?"**

## Success condition

By the end of tonight he can, unprompted:

- read the last line of a traceback first
- say the error's name
- find the frame that names a file he wrote
- say that a program with no error may still be wrong

That is the whole of Area 0's `reading-errors` concept, and everything after this
session gets easier because of it.
