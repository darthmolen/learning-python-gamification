# Session 8 — Read The Stack

**Concepts:** `tracebacks` · `main-guard` · resurfaces `reading-errors`, `venv`
**Files:** `sessions/session-8/`, and `reference/session-8-answers.md` — **yours, read
before the session**
**Journal:** the entry that goes in front of the boss

**This is the last session before Boss 2 and it is a rehearsal for it.** Both halves of
tonight are in the boss: a traceback is what he will be reading when the cold clone fails
on your machine, and `if __name__ == "__main__"` is item 3 on the boss brief by name.

**Read `reference/session-8-answers.md` before he sits down**, and do not have it open in
front of him. It has every traceback in this session captured verbatim, so that you can
stay quiet while he finds them.

---

## The third pass, and why it is a new concept id

Worth knowing before you teach it, because he may say "we did errors already" and he is
half right.

- **Area 0 session 3** was `reading-errors`: one or two frames, in tiny files.
- **Area 1 session 6** was the same skill against loop errors.
- **Tonight** the object is genuinely different. The code is in files with names, the
  files import each other, and **a stack has more than one frame that matters for the
  first time.**

That is why this tags `tracebacks` rather than resurfacing `reading-errors`, and it is
the clearest example of §3 principle 7 in the campaign. If he says "we did this", say:
"you did. Run `top_frame.py` and tell me if it looks like week two."

---

## Beat 1 — Invasion (3 minutes)

1. What is a venv, in one sentence?
2. How do you find out which Python is running?
3. Why is `.venv` in `.gitignore`?

---

## Beat 2 — The hook (6 minutes)

Short tonight. There is a lot of running to do.

Show him a genuinely tall traceback — `the_library_floor.py`'s, or one from real work of
yours — and let the reaction happen. It looks like a wall of red and it is designed to be
skipped.

Then:

> "How much of that do you think you have to read?"

He will guess most of it. The answer is **two lines**, and the session is him proving that
to himself six times.

If you have a real one of your own from work, use it. A tall traceback that made a grown
adult swear this week is worth more than a manufactured one.

---

## Beat 3 — The work (30 minutes)

### `sessions/session-8/w8_read_the_stack.md`

Six files. Do not let him open them before running them.

- **Steps 2–4, the chain.** `bottom_frame`, then `middle_frame`, then `top_frame`. One
  frame, two, three, **and the last line is identical every time.** The way to make that
  land is to have all three on the screen at once rather than to say it.

  The question at step 3, before he reads on: **"which of these two files is wrong?"** He
  will say the first one, because it is first. It is first because it is furthest from
  the problem.

- **Step 5 — the fix, and the question after it.** One word in one file. Then: *which file
  did you have to open? Was it the one you ran?* That question is worth more than the fix
  and it is the reason the chain has three files instead of one.

- **Step 6 — `the_library_floor.py`**, four frames, one of them his. This is the panic
  shape and it is the one from `dm-guide.md` §4.

  **Ask one question and no others:** *"which of those files did you write?"*

  **Do not explain `raw_decode` or `scan_once`.** You could, it would cost ten minutes,
  and it would teach him that tracebacks need an adult to interpret. Area 0's guide made
  the same ruling about the turtle traceback and it is the same ruling for the same
  reason.

- **Step 7 — the main-guard, and it must be done in the given order.** Run `banner.py`,
  run `show_the_banner.py`, notice the banner does not print. *Then* read the line that
  did it. Then **take the line out and run it again** — the banner prints when nobody
  asked for it. Then put it back.

  That break-it step is eleven seconds long and skipping it converts the whole thing into
  a rule he obeys without understanding, which is the thing this curriculum exists to
  avoid.

  `__name__` is the second word Python fills in for him after `__file__` in session 5, and
  it holds one of exactly two things. That is the whole explanation and there is no need
  for more of one tonight.

- **Step 8 — the six written questions.** Answers in `reference/session-8-answers.md`.
  Question 5 — *which file did you fix, and which did you run* — is the one to make him
  write out in full.

### If he asks why anyone would import his file

Fair question, and the honest answer is short: "you will, in about six weeks, and the boss
asks you to have the line in place before you need it." Do not oversell it. `main-guard`
is a habit installed one area before it pays, deliberately.

---

## Beat 4 — Choice board (in the work time)

- **The Fourth Floor** — add a `deeper_frame.py` to the chain and predict the traceback
  before running it.
- **The Own Goal** — break one of his session 5 or 7 files on purpose, in a way that
  produces at least two frames, and hand it to the DM to read.
- **The Library Dive** — open the actual Python file named in `the_library_floor.py`'s
  traceback and look at the line. Understanding it is explicitly not required. Knowing it
  is a real file on this disk, written by a person, is the point.
- **The Boss Prep** — read `dm-guide.md` §7 and start the project. Fully legal and
  encouraged; the checklist is not a secret.
- **Something else** — anything, as long as he says what he expects first.

---

## Beat 5 — Journal (5 minutes)

Same four prompts, and this entry sits directly in front of the boss. Two additions:

- **What is the rule for reading a traceback?** In his own words, written down, tonight —
  he is going to want it next week under pressure.
- **What is he going to rebuild for Boss 2?** The three framings are on the card and all
  three are programs he already made in Areas 0–1. Getting the choice made tonight means
  next session starts with building instead of deciding.

Then say the true thing plainly: **next session is the boss, it is DC 22, it is the
hardest thing he will have done, and the checklist he is judged against is written down
and he is allowed to read it.**

---

## Where he will stall

See `dm-guide.md` §4. The predicted four:

1. **Reads the top of the traceback.** The bottom is the answer, third pass. "Read it from
   the bottom. Which of those files did you write?"
2. **Panics at a tall stack.** Four of the frames are inside Python's own code. "Which
   lines name *your* file? Start there."
3. **`if __name__ == "__main__"` reads as noise.** It is, right up until step 7 breaks it.
   "Import it and watch. Now put the line back and import it again."
4. **Cannot see why anyone would import his file.** Fair until Area 4. "Tonight, just
   watch what it does when I import it."

## What you may not say

**Do not read the traceback for him.** Not once, not "just this one to show you how". The
skill is entirely in doing it and takes about six repetitions, and you have six files.

**Do not translate `json.decoder.JSONDecodeError`.** "Which of those files did you write"
is the whole intervention.

**Do not explain the main-guard before step 7's break.** The explanation after the
demonstration takes one sentence. Before it, it takes five minutes and does not land.
