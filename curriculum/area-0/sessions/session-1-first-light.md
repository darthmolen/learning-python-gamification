# Session 1 — First Light

**Concepts:** `print` · first contact with `reading-errors`
**Files:** `exercises/session-1/`
**Journal:** entry 1, prompt in `journal/entry-01-prompt.md`

The whole session earns one sentence: **the first line he types draws something.**
Everything else is arranged around protecting that.

No invasion — there is nothing yet to retrieve.

---

## Beat 1 — The hook (8 minutes)

Do not open an editor. Open a terminal, and type this yourself, once, slowly, while he
watches:

```
py -3.14
```

The prompt changes to `>>>`. Say what that means: *this is Python itself, listening. It
does one line at a time and answers immediately.*

Now hand him the keyboard. Do not take it back for the rest of the session.

Tell him to type exactly this, one line at a time, pressing Enter after each:

```
import turtle
turtle.forward(200)
```

A window opens. A line appears. That is the entire hook and it took him eleven seconds.

Then let him loose for four or five minutes, with only these:

```
turtle.left(90)
turtle.forward(200)
turtle.color("red")
turtle.circle(60)
turtle.pensize(10)
```

He will start combining them without being asked. Let him. Say almost nothing.

**Coming from Scratch, this is the point to name out loud:** in Scratch he dragged a
block that said *move 10 steps*. Here he typed one. Same idea, and now he can type any
number he wants, including 2000, including −40.

---

## Beat 2 — The other half (7 minutes)

Ask him: *the turtle has a position and a direction right now. What are they?*

He will guess. Let him guess, then:

```
turtle.position()
turtle.heading()
```

Then, and this is the part that matters:

```
print(turtle.position())
```

Ask what the difference is between the two. At the `>>>` prompt there barely is one,
which is a fair observation and worth agreeing with. Then say the thing that makes
`print` matter:

> "When you put this in a file instead of typing it here, the answers stop appearing.
> `print` is how you make the program tell you things. It is the only way you will ever
> see inside a running program until Area 7, and honestly it's the way I still do it
> most days."

That is true, and it is worth him hearing that the professional does not have a better
technique hidden away.

Then quit: `exit()` or Ctrl-Z Enter.

---

## Beat 3 — The work (25–30 minutes)

Three files, in order. He runs each with `py -3.14 <name>.py`.

### `s1e1_first_light.py`

Runs as shipped, draws two sides of a triangle. His job: close the triangle, then pick
one from the choice board inside the file.

The moment he runs it, the difference from the REPL lands by itself: nothing printed
except what `print` printed.

### `s1e2_where_am_i.py`

**He must write four predictions on paper before running it.** Enforce this. It takes
ninety seconds and it is the reason the file exists.

The four questions at the bottom are the real content. Question 3 — is
`turtle.forward(-50)` legal — is worth making him commit to an answer out loud before
he tries it.

### `s1e3_pen_and_colour.py`

Pen up, pen down, thickness, colour. This is the file he will want to keep playing
with, so leave time for the choice board rather than rushing him to the end.

The last line of its comment block asks him to use a colour name Python does not know,
on purpose, and read the error. That is the seed for session 3. If time is short, cut
anything else before you cut that.

---

## Beat 4 — Journal (5 minutes)

Copy `journal/TEMPLATE.md` to `journal/entries/session-01.md`. Read him
`journal/entry-01-prompt.md`.

Before he writes a word, say the scoring rule once: **ten XP, paid for substance, not
for existence.** "Did turtle, was fine" is worth zero and you will say zero.

Then write your reply underneath, in the file, before he goes to bed.

---

## Where he will stall

See `dm-guide.md` §4 for the question phrasings. The four to expect:

1. `forward(100)` without `turtle.`, giving NameError. This is good and it is on time.
2. Typing `py -3.14` at the `>>>` prompt, or `turtle.forward(100)` at the shell prompt.
   Two black rectangles, two different languages.
3. Drawing off the edge of the window.
4. `left` and `right` being from the turtle's point of view, not his. Let this one run.

## What you may not say

He will typo `turtle` at some point in the first ten minutes. You will see it
instantly. Do not say it. Say: **"Read the last line of the error out loud."**

That exchange, in session 1, minute 12, is the single most load-bearing thing in Area 0.

---

## If you have 45 minutes and not 60

Cut `s1e3` and set it as something to play with on his own. Do not cut the REPL hook and
do not cut the Journal.

## If it goes fast

He can have `turtle.circle(60)`, `turtle.goto(0, 0)`, `turtle.speed(0)` and
`turtle.bgcolor("black")`. All positional, all Area 0 legal. Let him find out what
`speed(0)` does on his own; the answer is funnier than the explanation.
