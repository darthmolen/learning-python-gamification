# Session 6 — The Broken Loop

**Concepts:** none introduced — `reading-errors`, second pass ·
`while`, `for`, `range`, `if`, `int`, `float`, `variables` resurfacing
**Files:** `exercises/session-6/`
**Journal:** entry 12

**Six broken loops, and only three of them say anything at all.**

This is the area's hardest and most valuable session, and it is the reason the area is
laid out the way it is. **Never cut it.**

Read `reference/session-6-answers.md` before tonight. Not during.

---

## Why this session exists

Area 0 session 3 taught him that an error message is the computer helping: a name, a line
number, an arrow, and the exact characters. That was true and it was training wheels.

Half of what goes wrong in a loop produces no message of any kind. The off-by-one. The
condition that is never false. The loop that runs zero times. The shape whose turns add up
to 350. Python is perfectly happy with every one of them.

§3 principle 7 — nothing is taught once and abandoned. This is `reading-errors`, second
pass, and the second pass is the harder one.

---

## Beat 1 — Invasion (3 minutes)

1. `and`, `or`, `not` — give me a rule that needs all three.
2. In an `elif` ladder, how many branches run?
3. What is an f-string for?

## Beat 2 — Forecast (1 minute)

Entry 11's forecast, read back, then what happened.

---

## Beat 3 — The hook (5 minutes)

Short tonight. He needs the keyboard early because there are six files.

Say the framing, in these words:

> **"In Area 0 every broken file told you it was broken. Tonight, three of these six do
> not. They run, they finish, they print nothing red, and they are wrong. Your job is to
> be the detector, because nothing else is going to be."**

Then give him the one tool, once, and let him use it six times:

> **"How many times did that loop go round? Do not count the picture. Make the program
> count."**

---

## Beat 4 — The work (32 minutes)

Six files. For **each one**, in this order, no skipping:

1. **Read it.** Do not run it.
2. **Predict out loud.** "This will break, and the way I will know is ___."
3. **Run it.**
4. **Write the error's name — or the word `none` — and the line number in `error-log.md`.**
5. **Fix it.** Run again to prove the fix.

| File | Says | The thing it teaches |
|---|---|---|
| `b1_five_of_six.py` | **nothing** | An off-by-one you cannot see by looking |
| `b2_the_loop_that_never_ends.py` | **nothing** — it hangs | The body changes the wrong variable |
| `b3_the_flat_body.py` | `IndentationError` | Nothing ran at all. No window, not a flicker |
| `b4_a_number_it_cannot_count.py` | `TypeError` | The right number, the wrong kind of number |
| `b5_the_name_that_never_was.py` | `NameError` | `range(0)`, so the loop body never ran |
| `b6_the_shape_that_does_not_close.py` | **nothing** | Provable with arithmetic before you look |

### b1 is where he learns not to trust his eyes

Five sides and six sides at 60 degrees look extremely similar. He will count the picture
and get it wrong. **Let him.** Then let him discover that a `print` inside the loop settles
it in four seconds and never lies.

Then: *"Python was completely happy with that file. Whose job was it to notice?"*

### b2 is the one with a decoy

This file *does* change a variable inside the loop, every time round. It changes the wrong
one. The condition asks about `height`; the body changes `steps`.

> **"Name the two variables. Which one is the condition asking about? Which one does the
> body change?"**

**Refuse the delete-the-loop fix.** *"That works. Does it still do the job it was for?"*

### b6 is the one the session is built around

This is Area 1's `b7`. It says five sides, it draws five sides, the count is right, the
loop is right, and it exits cleanly. Five turns of 70 is 350, and a closed shape needs 360.

**He can prove it is broken on paper before he looks at the picture.** Getting him to do
that is the best thing available in this session.

**Read b1 and b6 fast, out loud, and say "looks fine to me."** Then be wrong in front of
him. §5.8 calls this the highest-value mechanic in the design and it only pays when it is
real.

---

## Beat 5 — Reversal: he breaks yours (8 minutes)

Same as Area 0 session 3, with one rule added.

He plants **three** bugs in one of his own working files — `s1e3_the_polygon_engine.py` or
`s5e2_the_ladder.py` are the best candidates — while you look away.

**At least two of the three must be silent.** No error message. That is much harder to
author than it sounds, and doing it teaches him more about tonight than finding your bugs
does.

Then you find them, out loud, narrating. **Genuinely get one wrong.** Not theatrically.

---

## Beat 6 — Journal (5 minutes)

Entry 12. *What broke* writes itself tonight, so push on **what I would do differently** —
and the honest answer is usually about how he looked rather than about code.

The sentence to end the session on, said out loud before he writes:

> **"Errors are the easy failures. They come with a name, a line number and an arrow.
> Three of those six said nothing at all. So who is the detector now?"**

---

## Where he will stall

`dm-guide.md` §4. The one that will definitely happen:

**He waits for red text that never comes.** Area 0 trained him to. *"There is no error.
There is still a bug. What did you want to happen?"*

## Success condition

Given a program that ran, produced no error, and did the wrong thing, he can **find out
how many times the loop went round** — without being told to, and without waiting for a
traceback to point at a line.

That is the skill this whole area exists to deliver.
