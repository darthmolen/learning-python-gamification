# Session 9 — The Mandala

**Concepts:** none introduced — `nesting` and `accumulator-pattern` under load,
plus everything else in the area
**Files:** `exercises/session-9/`
**Journal:** entry 15

**This is the whole session.** No teaching, no worked example, no new orders. Somebody
builds something.

It is the rehearsal for Boss 1, exactly as Area 0's session 6 was for Boss 0, and it is
the only rehearsal Boss 1 gets. **Never cut it.**

---

## Beat 1 — Invasion (3 minutes)

1. Where does the total go — before the loop, or inside it? Why?
2. What happens if you set it to zero inside the loop instead?
3. `range(10, 0, -1)` — what does it give you?

## Beat 2 — Forecast (1 minute)

Entry 14's forecast, read back, then what happened.

---

## Beat 3 — The hook (4 minutes)

Shortest hook in the area. Hand him `mandala-brief.md` and read the requirements list
together, out loud, once. Seven checkboxes.

Then the one thing that is not on the list and matters more than the list:

> **"Change one dial. Run it. Change it again. Run it again. If it still looks deliberate
> at three different settings, you have built a generator. If it only looks right at the
> numbers you were using while you wrote it, you have built one picture and got lucky.
> Boss 1 is judged on exactly that, so find out tonight."**

Then get out of the way.

---

## Beat 4 — The work (35 minutes)

`s9_mandala_lab.py` runs, draws one plain ring, prints one number, and has two dials at
the top. Everything else is his.

**Say nothing for the first five minutes.** He has enough to start with and the first
thing he builds is more useful than the first thing you suggest.

### The equipment he has now earned

`turtle.speed(0)` he has had since session 1. If the drawing passes about ten seconds,
give him the next one up — and give it as equipment, not as a concept:

```python
turtle.tracer(0)     # near the top: stop drawing to the screen as you go
...
turtle.update()      # at the end, just before turtle.done()
```

**Do not spend this early.** It is the reward for having built something slow enough to
need it, and it lands much better as a reward than as a fact.

### Copying his own files is not cheating

Say so explicitly if he hesitates. `s1e3`, `s7e3` and `s8e2` are the three worth opening,
and opening your own earlier work is what everybody does.

### The Datamine

`reference/r9_mandala.py` is a complete mandala using nothing above Area 1 vocabulary. Two
real attempts and one written sentence first (§5.5). **Show it whole or not at all** — the
half he gets from a drip-feed is always the half he already had.

---

## Beat 5 — Journal (5 minutes)

Entry 15, and **this is the most important entry in the area.**

Push hardest on *what I would do differently*, because tonight's answer is next week's boss
plan, written a week early by the person who has to carry it out.

The prompt to give him:

> "What did you run out of time to build? Write it down properly — what you wanted, and
> how far you got. Next Thursday you get another go at it with nobody helping."

---

## Where he will stall

`dm-guide.md` §4. The two that matter:

**Blank page.** Scope, exactly as in Area 0 session 6. *"One ring. Just one. Don't design
the rest yet."*

**Something enormous and unfinishable.** Good instinct, wrong session. *"Which single ring
of that would you be most annoyed to lose? Build that one."*

**Wants to keep going past time.** Stop anyway. *"Write down the next thing you were going
to do. It'll still be there on Thursday."* — and this time that is literally true.

## Success condition

There is a picture, it survives having a dial turned, and there is a Journal entry naming
the thing he did not get to.

All three matter, and the third one is the one that makes session 10 work.
