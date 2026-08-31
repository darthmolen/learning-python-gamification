# Session 6 — The Broken Loop, answers

**Read this before session 6. Not during.** If you are reading it at the table you have
already given away the shape of the answer by looking down.

Six files. **Three of them produce no error message of any kind**, which is the whole
difference between this session and Area 0's session 3. There, every failure announced
itself. Here, half of them do not, and the session's real subject is what a learner does
when nothing is announced.

The tracebacks below were captured by `py -3.14 verify.py` on Python 3.14.6. **Editing a
docstring in any of these files shifts the line numbers.** Re-run the harness after any
edit in `session-6/` and check these still match — this exact drift happened twice while
Area 0 was being written, and reading the wrong number aloud costs you the room.

---

## The table

| File | Error | Line | What is actually wrong |
|---|---|---|---|
| `b1_five_of_six.py` | **none** | — | `range(5)` for a six-sided shape |
| `b2_the_loop_that_never_ends.py` | **none** — it hangs | — | The condition asks about `height`; the body changes `steps` |
| `b3_the_flat_body.py` | `IndentationError` | 23 | The loop body is not indented. Nothing ran at all |
| `b4_a_number_it_cannot_count.py` | `TypeError` | 30 | `360 / turn` is a `float`, and `range` insists on an `int` |
| `b5_the_name_that_never_was.py` | `NameError` | 30 | `range(0)`, so the loop body never ran and `side` was never created |
| `b6_the_shape_that_does_not_close.py` | **none** | — | Five turns of 70 is 350, and a closed shape needs 360 |

---

## b1 — The Hexagon With Five Sides

**Silent.** Exit code 0, no output but its own prints, a picture that looks nearly right.

The fix is one character: `range(5)` becomes `range(6)`.

The value is not the fix. It is the two minutes before the fix, and the question is:

> **"How many sides did it draw? Do not count the picture. Make the program count."**

They will try to count the picture and get it wrong, because five and six lines at 60
degrees look extremely similar. Let them. Then let them discover that a `print` inside the
loop settles it in four seconds and never lies. That move — instrument it rather than
squint at it — is the single most transferable thing in Area 1.

**Say out loud, when they fix it:** *"Python was completely happy with that file. Whose
job was it to notice?"*

## b2 — The Loop That Never Ends

**Silent, and it hangs.** They know the escape hatch from session 3: Ctrl-C in the
terminal.

The trap is that this file *does* change a variable inside the loop, every single time
round. It changes `steps`. The condition asks about `height`, and nothing anywhere in the
program ever touches `height` after it is set to zero.

> **"Name the two variables. Which one is the condition asking about? Which one does the
> body change?"**

The fix is one line inside the loop — `height = height + 20` — and it is worth making them
say why 20 rather than 5 or 40, because the answer is "that is how far up each step
actually goes", which means reading the drawing code rather than the loop.

**Once fixed it draws 10 steps.** Ask them to predict that number before they run it.

**Refuse the delete-the-loop fix.** It removes the symptom and the program. *"That works.
Does it still do the job it was for?"*

## b3 — The Flat Body

`IndentationError: expected an indented block after 'for' statement on line 22`, and the
caret is under `turtle.forward` on **line 23**.

Two things to draw out, both of them Area 0 material coming round on schedule:

- **No window opened.** Not for a moment. This is the `SyntaxError`-family behavior from
  Area 0 session 3: Python reads the whole file before running any of it, so it never got
  as far as line one.
- **The message names line 22 and the caret is on line 23.** Line 22 is where the promise
  was made; line 23 is where it was broken. Both numbers are correct and they are
  answering different questions.

## b4 — A Number It Cannot Count

`TypeError: 'float' object cannot be interpreted as an integer`, on **line 30**.

`sides` is 8. `turn` is 45.0. `360 / turn` is 8.0 — the right number, the wrong kind of
number, and Area 0 session 4 spent a whole evening on exactly that distinction.

There are two fixes and the second one is the lesson:

1. `range(360 // turn)` — floor division, which always gives a whole number. Correct, and
   still a strange way to say what is meant.
2. `range(sides)` — because the number wanted is already sitting in a variable, three
   lines up, with the right name on it.

> **"Which of those two would you rather read in a month?"**

The author of this file worked out a number they already had. That is not a syntax
mistake; it is the most common kind of real one.

## b5 — The Name That Never Was

`NameError: name 'side' is not defined. Did you mean: 'sides'?` on **line 30**.

The name is spelled correctly and it is right there on line 26. It does not exist because
**the loop body never ran**: `sides` is 0, `range(0)` is empty, and the name in a `for`
line is created by the loop going round — not by the loop being written.

Python's suggestion is `sides`, which is wrong, and that is worth pointing at: the
suggestion is a guess based on spelling, and Python has no idea what was intended.
Area 0 session 3 made the same point about `turtel`.

Two defensible fixes, and they should say both before picking one:

- Set `sides` to something above zero — the author meant to draw a shape.
- Move the final `print` inside the loop — the author meant to report each side.

**The quiet lesson:** a loop that runs zero times is completely normal and completely
silent. Nothing warns you. It is one of the three ways an Area 1 program goes wrong
without saying anything, and they have now met all three tonight.

## b6 — The Shape That Does Not Close

**Silent, and it is the file the session is built around.** This is Area 1's `b7`.

Everything about it is defensible on a fast read. It says five sides, it draws five
sides, the count is correct, the loop is correct, and it exits cleanly.

Five turns of 70 degrees is 350. A closed shape needs 360. **They can prove it is broken
with arithmetic before looking at the picture at all**, and getting them to do that — to
find a bug on paper — is the best thing available in this session.

The fix is `turn = 360 / sides`, which is the rule from session 1 that they have used in
every file since. Do not accept `turn = 72`. Ask what happens when `sides` changes.

**Read the whole file fast, in front of them, and say "looks fine to me."** Then let them
find it. §5.8, and it only pays when it is real.

---

## The sentence the session ends on

Area 0 ended on: *"Errors are the easy failures. They come with a name, a line number and
an arrow."*

Tonight finishes the sentence:

> **"Three of those six said nothing at all. So who is the detector now?"**

They are. And the tool, every single time tonight, was the same one: **make the program
count, and print the count.**

---

## The reversal — they break yours

Same as Area 0 session 3, with one rule added: **at least two of their three bugs must be
silent.** No error message. That is much harder to author than it sounds and doing it
teaches them more about this session than finding your bugs does.

`s1e3_the_polygon_engine.py` and `s5e2_the_ladder.py` are the best files to hand over.

**Get one wrong out loud.** Really try, really fail, really find it. If you find all
three instantly, say which was hardest and why. Never make it look free.
