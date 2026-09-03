# Session 5 — The Machine Asks

**Concepts:** `input` · `f-strings` · `str`, `int`, `variables`, `print` resurfacing
**Files:** `sessions/session-5/`
**Journal:** entry 5

Tonight their program stops being a drawing and starts being a **tool**, because someone
else can use it without editing it.

That is a bigger step than it sounds. Everything they have written so far only works if
you open the file and change a number. After tonight, they can hand a program to their
sister and she can use it.

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

They type `150` and press Enter. Then:

```python
answer
type(answer)
```

`'150'` with quotes round it, and `<class 'str'>`.

**Let them be annoyed about this.** They typed a number. Python stored text. That is the
single most important fact in the session and being irritated by it is the correct
response.

> "It cannot know what you meant. Somebody might type 150, and somebody might type
> 'quite big', and somebody might type their name. `input` hands you exactly what was
> typed and lets you decide what it is."

Then let them try the thing they are about to try anyway:

```python
turtle.forward(answer)
```

`TypeError: can't multiply sequence by non-int of type 'float'`. They have seen this
before, in The Wrong Kind Of Thing. Ask which quest it was. That connection is the
payoff for session
3 and it is worth waiting for them to make.

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

1. **Delete the `int()` line.** They cause b2 on purpose, in their own program, and put
   it back. Errors they caused in a toy file last week are now errors in something they
   own.
2. **Type "big" at the prompt.** `ValueError`. They met it as b6. Ask what is different:
   b6 was their own bug in their own file, and this one is a *user* doing something
   reasonable that their program cannot survive.
   **They cannot fix this tonight and should not try.** The fix needs `if` (Area 1) or
   `try` (Area 5). Say so plainly, and get it written into the Journal under *what I
   would do differently*. It becomes a real thing to come back to.
3. Ask for a color as well. Ask them first whether a color needs converting, and why
   not.
4. Ask for the number of sides and print the total turn. They cannot draw it yet — Area 1
   again. Printing it is a complete answer.

### `s5e2_the_nameplate.py`

Two questions, a framed plate, and their name written inside it in real letters.

This is the file they will want to show someone, so protect time for it.

Two things worth naming when they come up:

**`turtle.goto(-width / 2, -height / 2)`** centers the plate. Nobody has told them how
that works. Ask what would happen if it were not there, and let them delete it and
find out. Deleting a line to discover its job is a legitimate technique and worth naming
as one.

**`turtle.write(f"{name}", False, "center", ("Arial", 24, "bold"))`** has four things in
it. Go through them once: the text, whether to move afterwards, how to line it up, and
the font as a family, a size, and a style. All positional, nothing new — they have been
calling functions with several arguments since `goto`.

Task 1 is the good one: type a very long name and watch it overflow the plate. Before
they fix it, make them say **which number would have to change and what it would have to
depend on.** That sentence is design, and they cannot implement it yet, which is fine.

---

## Beat 4 — Choice board (in the work time)

- **The Banner** — ask for two colors and draw a striped banner
- **The Badge** — ask for a name and a number, draw both, with the number big
- **The Sign** — ask for a message and draw it framed, with the frame sized to the
  message as best they can manage
- **The Interrogation** — ask five questions and print one f-string that uses all five
  answers and at least one number worked out from them
- **Something else** — anything that asks a question and draws the answer

---

## Beat 5 — Journal (5 minutes)

Entry 5.

Tonight has an unusually good *what I would do differently*: the crash on bad input. If
they write it down properly — what they typed, what happened, what they wish had
happened — that is the entry worth rereading in twenty weeks, when they can finally fix
it.

---

## Where they will stall

See `dm-guide.md` §4. Three near-certainties:

1. **Typing quotes at the input prompt.** They type `"150"` because they are thinking in
   code. `int` then fails in a way that looks unfair. Get them to print the raw answer
   and count the characters.
2. **Missing the `f`.** The braces print literally: `side is {answer}`. Do not point at
   the character. Say: **"Read that line out loud and compare it to the one above."**
3. **Quotes inside the braces**, `f"{'name'}"`. Ask what is inside the braces — the name,
   or text?

## The thing to say at the end

> "Nobody has to open your file to use that. That's the difference between a drawing and
> a program."
