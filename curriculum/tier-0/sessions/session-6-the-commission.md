# Session 6 — The Commission

**Concepts:** all nine — `print`, `variables`, `int`, `float`, `str`, `bool`, `input`,
`f-strings`, `reading-errors`
**Files:** `exercises/session-6/` — `commission-brief.md` and `s6_starter.py`
**Chronicle:** entry 6, plus the Tier 0 closing entry

No teaching tonight. Nothing new. He builds one thing, of his choosing, to a
specification, and then it has to run on your machine.

This is not a boss fight — Tier 0 has none, the first is The Sigil at the end of Tier 1.
It is a **rehearsal for one**, and specifically a rehearsal for Boss 2, whose entire win
condition is that his code ran on somebody else's computer. Spec §2.3 diagnoses that seam
as the one every learn-to-code platform in the field fails at. He gets a look at it in
week two, when the stakes are a picture of a nameplate.

---

## Beat 1 — Patrol (4 minutes)

1. What kind of thing does `input` always hand back?
2. What does the `f` in front of a string do?
3. Why did the program crash when you typed "big"?

Then one wider question, because the tier is ending: **name the four kinds of thing, and
tell me one place each of them showed up in something you wrote.**

---

## Beat 2 — The brief (5 minutes, and no longer)

Hand him `commission-brief.md`. He reads it himself. Three commissions — a nameplate, a
banner, a blueprint — and he picks one.

**Do not steer the choice.** They are the same difficulty on purpose and the whole point
is that it is his. If he asks which is best, the answer is "which one do you want to have
made?"

Then get out of the way.

The checklist at the bottom of the brief is the specification. Read it with him once so
he knows what "finished" means, then leave it to him to check.

---

## Beat 3 — The build (30 minutes)

He works. You sit there. You do not touch the keyboard, and tonight you also do not
teach — he has everything he needs and the session is about finding that out.

`s6_starter.py` is deliberately almost empty. It runs, and it lists every order he owns
in one comment block. That block is the only reference material he gets.

**The blank-page stall is the one to expect**, and it is a scope problem, not a knowledge
problem. He is trying to hold the whole finished thing in his head at once. One question:

> "What is the very first thing that appears on screen? Just that. Don't design the rest
> yet."

Then, ten minutes later, when the first thing is on screen, he will not need you again.

If he wants to copy chunks out of session 5's files, let him. That is what everybody
does and it is not cheating. Follow up with: **"which lines in there are doing nothing
for this? Delete those first."** Reading code to decide what to remove is a real skill
and this is a good cheap place to practise it.

---

## Beat 4 — The handover (10 minutes)

**This is the part that matters and it must not get squeezed.** Budget for it.

He puts the file on a USB stick, or emails it, or hands you the laptop — however it
travels is his problem to solve, and letting him solve it is part of the point.

Then, on **your** machine:

- You open a terminal.
- You type `py -3.14 hisfile.py`.
- You answer the questions.
- He watches.

He is not allowed to touch anything. If it fails, he tells you what to type; he does not
type it.

### If it works

Say clearly what just happened. Not "well done" — that is about him. Say what is true
about the artifact:

> "That ran on a machine you have never touched, with no changes. That is what shipping
> is. Most people who have done a year of online courses have never once done that."

### If it breaks

**This is the better outcome and you should say so immediately, before anything else**,
because his face will fall and the next ten seconds decide what he learns tonight.

> "Good. This is the real thing. Something is different between our two machines and now
> we get to find out what."

Then debug it together, with him reading the error and you asking questions. Likely
causes, in order:

1. He hard-coded a path, or ran it from a different folder.
2. A different Python. Check `py -3.14 --version` on both.
3. He was relying on something still loaded in an interpreter he never closed.
4. Encoding: a character in a name or a comment that his editor saved one way and mine
   reads another.

Every one of those is a genuine first taste of Tier 2b. **Write down which one it was.**
That note is worth more than the drawing.

---

## Beat 5 — Chronicle, and closing the tier (10 minutes)

Two things tonight.

**Entry 6**, as usual, three prompts. If it failed on your machine, that is the best
*what broke* he has written all fortnight, and you should say so.

**The Tier 0 closing entry.** A fourth prompt, once per tier, and only at the end:

> **What can I do now that I could not do two weeks ago?**

Make him answer it in specifics, not feelings. Not "I know Python now". Things like *"I
can read an error and say what kind it is"* or *"I can write a program that asks
somebody a question"*.

Spec §5.6 has him reread his Chronicle from the start of the tier before every boss
fight, on the grounds that reading something you wrote six weeks ago and finding it easy
is the strongest evidence a learner will ever get that he is not stupid. Tonight is the
first deposit into that account. Tell him that is what it is for.

---

## Tier 0 is complete when

- He has drawn something with turtle from a file he wrote.
- He can read a traceback: name the error, find his own line, and say whether it broke
  before or during the run.
- He knows a program can be wrong without raising anything at all.
- He has used `input`, converted it, and understood why the conversion was necessary.
- He has written an f-string with something worked out inside the braces.
- **A program of his has run on a machine that is not his.**
- Six Chronicle entries exist and you have replied to all six.

None of those is a test and none of them needs marking. If four of the seven are true,
move on to Tier 1 — Control opens with loops, which is what he has been wanting since
the staircase in session 2, and the concepts he is shaky on come back as patrols anyway.
Spec §3 principle 7 is that nothing is taught once and abandoned. Do not hold him here.
