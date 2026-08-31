# Session 3 — The Loop That Does Not Stop

**Concepts:** `while`, `comparison-operators` · `for`, `variables`, `bool`,
`reading-errors` resurfacing
**Files:** `sessions/session-3/`
**Journal:** entry 09

**Tonight a program hangs on purpose, and they learn the way out.**

This is the session that mirrors Area 0's session 3. There, the lesson was reading a
traceback, taught at the moment they already had a grievance. Here, the lesson is what to do
when there is no traceback and the window has simply stopped answering — and it is
scheduled rather than stumbled into, because they *will* write `while True:` this month
whether or not anybody plans for it.

**Never cut this session.**

---

## Beat 1 — Invasion (3 minutes)

1. `range(2, 6)` — every number, in order.
2. You want ten sides. What is the turn? How did you work it out?
3. What error do you get from `range(2.5)`, and what does the message say?

## Beat 2 — Forecast (1 minute)

Entry 08's *what will break next time*, read back. Then what actually happened.

---

## Beat 3 — The hook (8 minutes)

Two things, in this order, and the second one is the important one.

**First, the difference.** A `for` loop knows how many times it will run before it starts.
A `while` loop does not — it asks a question at the top of every go round and keeps going
while the answer is True.

**Second, the three rules.** Write them where they stay visible for the rest of the
evening, because every stuck program written for the next four weeks is missing one:

> 1. the variable exists **before** the loop
> 2. the condition **can** be False
> 3. something **inside the body** changes the variable the condition asks about

Then, before they type anything:

> **"If rule three is missing, the program never stops. It does not crash. There is no
> error message. The window just stops answering. That is going to happen tonight, on
> purpose, and here is the way out: click the terminal — the one with the text, not the
> drawing — and press Ctrl and C."**

Say Ctrl-C once, now, clearly. Then do not say it again for the rest of the year.

---

## Beat 4 — The work (30 minutes)

Four files, in order. **`s3e4` is last and it is not optional.**

### `s3e1_the_first_while.py` — the six comparisons, and a loop that asks

It prints all six comparison operators against the same pair of numbers, then runs a
`while` loop that reports its own condition every go round.

Task 2 — swapping `> 20` for `>= 20` — is exactly one extra go round, and knowing *which*
one is the entire skill. Make them predict before running.

Task 4 asks them to delete the line that changes the variable and **not run it**. Just look
at it and name which rule broke. That is the rehearsal for what happens in twenty minutes.

### `s3e2_the_shrinking_line.py` — the loop whose count nobody knows

Each line is 0.8 times the one before, stopping below 4 pixels. **How many lines is that?**
Neither of you knows without working it out, and working it out is harder than asking.

That is the whole justification for `while` and it is worth stating plainly:

> "You know when to stop. You do not know how many times to go. That is the one job a
> `for` loop cannot do honestly."

Task 4 quietly introduces a counter — `drawn = drawn + 1`, set to 0 *before* the loop —
and asks them to move it inside and see what happens. They have now written an
accumulator twice without the word. Session 8 names it.

### `s3e3_while_versus_for.py` — the same hexagon, twice

Both loops draw an identical shape. The `for` version is three lines; the `while` version
is five, and two of them are bookkeeping they have to get right.

The point is not that `while` is worse. It is that using `while` where `for` would do
means taking on all three rules for no reason, which is how an infinite loop gets written
by accident.

Task 4 is the question worth a Journal sentence: *"draw lines until the turtle has
traveled more than 1000 pixels"* — which loop, and why can the other one not do it
cleanly?

### `s3e4_the_hang.py` — the one the session is named after

They read it first and say which rule is broken. **Then they run it anyway.**

Let it hang. Actually let it — seven or eight seconds of *this is not responding* is what
converts Ctrl-C from a fact they were told into a reflex they own. Do not rescue it at
three seconds.

When they press Ctrl-C, red text appears with the word `Traceback` in it. **Read it
together.** The last line says `KeyboardInterrupt`. That is them, in the traceback, by
name, and it is the one error in the area they caused deliberately.

Task 4 is the second failure and it is the sneakier one: with the fix in, change `< 200`
to `> 200`. Now the loop body never runs at all. Nothing hangs, nothing crashes, nothing
draws. **Ask which of the two failures is harder to notice.**

---

## Beat 5 — Journal (5 minutes)

Entry 09. Both of tonight's failures go under *what broke*: one hung and one did nothing,
and **neither printed an error message**.

That sentence is the thesis of the whole area and this is the night they write it in
their own words.

---

## Where they will stall

`dm-guide.md` §4. The two that matter:

**The window freezes and they panic.** Say "nothing is broken" first, and quickly, before
anything else. Then the terminal, then Ctrl-C.

**They write `while side < 200:` and never change `side`.** The defining Area 1 bug, and
they will write it more than once. *"What has to change for that to become false? Show me the
line that changes it."*

## Success condition

By the end of tonight they can:

- write a `while` loop that stops
- name the three rules without looking
- say which of `for` and `while` a problem wants, and why
- get out of a hung program without asking anyone

The last one is the deliverable. Everything else in the session is a vehicle for it.
