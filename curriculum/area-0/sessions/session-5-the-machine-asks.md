# Session 5 — The Machine Asks

**Concepts:** `input` · `f-strings` · `str`, `int`, `variables`, `print` resurfacing
**Files:** `exercises/session-5/`
**Journal:** entry 5

Tonight his program stops being a drawing and starts being a **tool**, because someone
else can use it without editing it.

That is a bigger step than it sounds. Everything he has written so far only works if you
open the file and change a number. After tonight, he can hand a program to his sister
and she can use it.

---

## Beat 1 — Invasion (3 minutes)

1. Four kinds of thing — name them.
2. What does `100 / 4` give, and what kind of thing is it?
3. What does `"5" + "5"` give?

---

## Beat 2 — The hook (10 minutes)

At the `>>>` prompt:

```python
answer = input("How big? ")
```

The prompt appears. Python stops. **Point out that it has stopped** — this is the first
time in the area that a program has waited for anything, and it is worth one sentence.

He types `150` and presses Enter. Then:

```python
answer
type(answer)
```

`'150'` with quotes round it, and `<class 'str'>`.

**Let him be annoyed about this.** He typed a number. Python stored text. That is the
single most important fact in the session and being irritated by it is the correct
response.

> "It cannot know what you meant. Somebody might type 150, and somebody might type
> 'quite big', and somebody might type their name. `input` hands you exactly what was
> typed and lets you decide what it is."

Then let him try the thing he is about to try anyway:

```python
turtle.forward(answer)
```

`TypeError: can't multiply sequence by non-int of type 'float'`. He has seen this
before, as b2. Ask which broken sigil it was. That connection is the payoff for session
3 and it is worth waiting for him to make.

Then:

```python
int(answer)
```

Second half of the hook: f-strings. Show the old way and the new way side by side:

```python
print("side is", answer)
print(f"side is {answer}")
```

Same output. Then show what the comma cannot do:

```python
print(f"a square of side {answer} has a perimeter of {int(answer) * 4}")
```

**Braces hold a question, not just a name.** Python works out whatever is inside them,
turns the answer into text, and glues it in.

---

## Beat 3 — The work (25–30 minutes)

### `s5e1_ask_and_draw.py`

Runs as shipped. Asks for a size, converts it, draws a square, prints a receipt.

The four tasks in it are all deliberate re-breakings:

1. **Delete the `int()` line.** He causes b2 on purpose, in his own program, and puts it
   back. Errors he caused in a toy file last week are now errors in something he owns.
2. **Type "big" at the prompt.** `ValueError`. He met it as b6. Ask what is different:
   b6 was his own bug in his own file, and this one is a *user* doing something
   reasonable that his program cannot survive.
   **He cannot fix this tonight and should not try.** The fix needs `if` (Area 1) or
   `try` (Area 5). Say so plainly, and get it written into the Journal under *what I
   would do differently*. It becomes a real thing to come back to.
3. Ask for a colour as well. Ask him first whether a colour needs converting, and why
   not.
4. Ask for the number of sides and print the total turn. He cannot draw it yet — Area 1
   again. Printing it is a complete answer.

### `s5e2_the_nameplate.py`

Two questions, a framed plate, and his name written inside it in real letters.

This is the file he will want to show someone, so protect time for it.

Two things worth naming when they come up:

**`turtle.goto(-width / 2, -height / 2)`** centres the plate. He has not been told how
that works. Ask him what would happen if it were not there, and let him delete it and
find out. Deleting a line to discover its job is a legitimate technique and worth naming
as one.

**`turtle.write(f"{name}", False, "center", ("Arial", 24, "bold"))`** has four things in
it. Go through them once: the text, whether to move afterwards, how to line it up, and
the font as a family, a size, and a style. All positional, nothing new — he has been
calling functions with several arguments since `goto`.

Task 1 is the good one: type a very long name and watch it overflow the plate. Before
he fixes it, make him say **which number would have to change and what it would have to
depend on.** That sentence is design, and he cannot implement it yet, which is fine.

---

## Beat 4 — Choice board (in the work time)

- **The Banner** — ask for two colours and draw a striped banner
- **The Badge** — ask for a name and a number, draw both, with the number big
- **The Sign** — ask for a message and draw it framed, with the frame sized to the
  message as best he can manage
- **The Interrogation** — ask five questions and print one f-string that uses all five
  answers and at least one number worked out from them
- **Something else** — anything that asks a question and draws the answer

---

## Beat 5 — Journal (5 minutes)

Entry 5.

Tonight has an unusually good *what I would do differently*: the crash on bad input. If
he writes it down properly — what he typed, what happened, what he wishes had happened —
that is the entry that will be worth rereading in twenty weeks when he can finally fix
it.

---

## Where he will stall

See `parent-guide.md` §4. Three near-certainties:

1. **Typing quotes at the input prompt.** He types `"150"` because he is thinking in
   code. `int` then fails in a way that looks unfair. Get him to print the raw answer
   and count the characters.
2. **Missing the `f`.** The braces print literally: `side is {answer}`. Do not point at
   the character. Say: **"Read that line out loud and compare it to the one above."**
3. **Quotes inside the braces**, `f"{'name'}"`. Ask what is inside the braces — the name,
   or text?

## The thing to say at the end

> "Nobody has to open your file to use that. That's the difference between a drawing and
> a program."
