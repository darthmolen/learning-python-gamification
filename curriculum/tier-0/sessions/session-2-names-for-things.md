# Session 2 — Names For Things

**Concepts:** `variables` · `int` · `print`
**Files:** `exercises/session-2/`
**Chronicle:** entry 2

Variables are usually taught as "a box that holds a value". That metaphor breaks by
Tier 3 and has to be unlearned. This session teaches them as **names**, and teaches them
by first making him feel the pain of not having any.

---

## Beat 1 — Patrol (3 minutes)

Out loud, no computer, nothing looked up.

1. What does `print` do that the drawing doesn't?
2. The turtle starts facing which way?
3. What is `turtle.done()` for?

If he cannot answer one, do not tell him — ask him where he could find out, then move
on. It comes back next session.

---

## Beat 2 — The hook (10 minutes)

**Give him the problem before you give him the tool.** Ask him to type this, by hand, no
copy-paste:

```python
import turtle
turtle.forward(100)
turtle.left(90)
turtle.forward(100)
turtle.left(90)
turtle.forward(100)
turtle.left(90)
turtle.forward(100)
turtle.left(90)
turtle.done()
```

Run it. A square. Fine.

Now: **"Make it 150 instead."**

He edits four numbers. Let him. Then: **"Now 220."** He edits four more. Then, before he
finishes: **"Actually, 175."**

Somewhere in there he will miss one, and the square will not close, and it will look
stupid. That is the lesson and it cost you ninety seconds of his irritation.

Then ask the question:

> "How many places is that number written? How many places *should* it be written?"

Let him answer. Then show one line:

```python
side = 150
```

and let him work out the rest himself. He will. He has seen variables in Scratch, and
this is the same idea with better syntax.

**Say the model out loud, once, and use these words:**

> "`side` is not a box with 150 inside it. `side` is a *name*, and right now it names the
> number 150. You can point that name at something else whenever you like."

---

## Beat 3 — The work (25–30 minutes)

### `s2e1_square_by_name.py`

Four numbered tasks in the file. Task 3 — a rectangle always twice as wide as it is
tall, with only one editable number — is the one that teaches. He will want to write
`width = 240` and `height = 120` and call it done. Ask:

> "Change the height to 130. How many numbers did you have to touch? Is that the
> promise you made in the task?"

Task 4 asks him to print the perimeter without typing the answer. If he types `680`,
ask him what happens when the size changes.

### `s2e2_the_staircase.py`

This is the reassignment file, and the line that matters is:

```python
step = step + 20
```

He will read it as maths and object that it is false. **He is right that it is false as
maths.** Say so. Then ask what happens first — the left side or the right side.

The file prints `step` after every stair, so the answer is on screen the moment he runs
it. Do not narrate the answer; make him read the output.

**Task 2 in that file is a trap you are setting on purpose.** It asks him to add two
more stairs, and it costs him six lines of typing to gain two stairs. Make sure he
notices. Then say:

> "Keep that feeling. In about two weeks I'm going to show you the four lines that
> delete all of this, and you'll appreciate it much more because of tonight."

That is Tier 1 being sold in advance, and anticipation is a design goal — spec §5.2 keeps
locked nodes visible for exactly this reason.

Task 4 multiplies by 1.5 and produces numbers with decimal points in them. **Do not
explain floats tonight.** Let him see them, let him be mildly puzzled, and say session 4
is about that. A question he is already carrying is worth more than an answer he did
not ask for.

---

## Beat 4 — Choice board (in the work time)

He picks one. Not you.

- **The Ladder** — a staircase that shrinks instead of grows
- **The Frame** — a rectangle inside a rectangle inside a rectangle, each gap the same,
  all driven from one number
- **The Flag** — three stripes whose thickness is one variable and whose length is
  another
- **Something else** — anything, as long as changing exactly one number changes the
  whole picture sensibly

That last option is on every choice board in this tier, and it should be. Autonomy is
the highest-yield lever in the research (spec §2.4) and a list of three is not a choice
if none of them appeal.

---

## Beat 5 — Chronicle (5 minutes)

Entry 2. Same three prompts.

If he wrote "nothing broke", ask what happened when the square did not close during the
hook. Something did break, twenty minutes ago, and forgetting that is the habit the
Chronicle exists to fight.

---

## Where he will stall

See `parent-guide.md` §4. The predicted four:

1. `side = side + 20` read as an equation rather than an instruction.
2. Renaming a variable in some places but not all. The error tells him. Make him read it.
3. `print("side")` versus `print(side)`. Worth doing deliberately if he does not do it
   by accident.
4. Naming things `a`, `b`, `c`. **Let this one ship.** Open the file at the start of
   session 4 and ask him what `b` was.

## What you may not say

When the square does not close because he missed one of the four numbers: do not point
at the line. Ask **"how many sides did it draw, and how many did you ask for?"**
