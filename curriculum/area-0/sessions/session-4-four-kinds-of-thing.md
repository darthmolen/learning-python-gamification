# Session 4 — Four Kinds Of Thing

**Concepts:** `int` · `float` · `str` · `bool` · `variables`, `print` resurfacing
**Files:** `exercises/session-4/`
**Journal:** entry 4

This is the least visual session in the area, and the one most likely to lose him. It is
also the one that makes session 5 possible, because `input` hands back a `str` and
nothing in session 5 works until he knows what that means.

**Design note, and the reason for the shape below:** types are taught here as *an
answer to a question he already has*. He has already met three of the four by accident —
the string in `color("red")`, the decimals from the 1.5 staircase in session 2, and the
`TypeError` from b2 last session. Tonight names them. Do not open with a definition.

---

## Beat 1 — Invasion (3 minutes)

1. Name three errors you caused on purpose last session.
2. Which line of a traceback do you read first?
3. What was wrong with b7?

Then, if he shipped variables called `a` and `b` in session 2: open that file and ask
him what `b` was. Say nothing else. The silence does the teaching.

---

## Beat 2 — The hook (10 minutes)

Start with his own bug, from last session. At the `>>>` prompt:

```python
turtle.forward("100")
```

He knows this one. Ask him why it fails, and he will say something like *"because it's
in quotes"*. Push once: **"What difference do the quotes make? It's still 100."**

Then hand him the instrument:

```python
type(100)
type("100")
```

`<class 'int'>` and `<class 'str'>`. Warn him in advance that the angle brackets look
like an error and are not. Then:

```python
100 + 100
"100" + "100"
```

`200` and `100100`.

That pair is the whole session. **The same `+` did two different jobs, and the only
thing that decided which was the kind of thing on either side of it.**

Then, briefly, the other two:

```python
100 / 4          # 25.0 -- a float, even though it is a whole number
50 > 100         # False -- a bool, and there are only two of them
```

Four kinds. Whole numbers, numbers with a fractional part, text, and yes-or-no.

**Do not explain why `100 / 4` is `25.0`.** It is a question in the exercise file. Let
him carry it for ten minutes.

---

## Beat 3 — The work (25–30 minutes)

### `s4e1_type_lab.py`

**He writes thirteen predictions on paper before running it.** This is not optional and it
is not busywork — a written wrong prediction is the entire mechanism. Do not correct a
single one in advance. Do not react while he writes them.

Then run it once, and go down the list together comparing. Ask about the ones he got
wrong; skip the ones he got right.

The four questions at the bottom, in order of value:

1. **What decides which job `+` does?** The one that matters. He should get there.
2. **Find the other division operator.** `//`. He will find it by guessing or by asking
   what the opposite of `/` is. `100 // 3` gives `33`. Ask him where the third went.
3. **`int("12.5")`** — predict, then run. It raises `ValueError`, which he met as b6.
   The lesson: `int` converts *text that spells a whole number*, and "12.5" does not.
   This is the exact bug that will bite him in session 5.
4. **`True + True`** is `2`. Let him be appalled. Do not defend Python. Agreeing that it
   is a bit odd costs nothing and buys credibility.

### `s4e2_the_dashed_orbit.py`

The drawing half, and the reason floats exist rather than a lecture about them.

Twelve dashes round a circle means turning `360 / 12` between them. Change it to seven
and the answer stops being a whole number. Ask:

> "You cannot turn 51 degrees seven times and get back to where you started. Which kind
> of number can answer this question and which cannot?"

That file also prints `0.1 + 0.2`. The answer is `0.30000000000000004`. Do not skip
this. Say plainly that it is not a bug in his code, not a bug in Python, that every
language on earth does it, and that you have been bitten by it at work with real money.
Then move on — the mechanism is not Area 0 material, but the fact that it exists is, and
the day he meets it in anger he will remember he saw it before.

Task 4 asks him to keep adding dashes until the ring closes, and to write down how many
blocks of four lines he pasted. That number goes in the Journal. It is the single best
argument for Area 1 and it is better made by his own hands than by you.

---

## Beat 4 — Choice board (in the work time)

- **The Colour Wheel** — dashes round a circle, each one a different colour
- **The Sundial** — twelve marks round a circle, longer at 12, 3, 6 and 9
- **The Ruler** — a straight line with a tick every 20 pixels and a longer tick every 100
- **Something else** — anything where a number gets divided and the answer is not whole

---

## Beat 5 — Journal (5 minutes)

Entry 4. Good prompt for tonight if he is stuck for *what broke*: **which prediction were
you most confident about and most wrong about?**

---

## Where he will stall

See `dm-guide.md` §4. The likeliest failure tonight is **boredom, not confusion.**
Types are abstract and there is less to look at.

Mitigation, in order:

1. Get to `s4e2` early. If the type lab is dragging, cut its last two questions and
   draw something.
2. Let him do the choice board before finishing the lab if he wants to. The lab's
   questions survive being answered in the wrong order.
3. If it is really flat, stop after `s4e1` and split the session. Types get their real
   lesson next session anyway, under pressure, when `input` breaks his program.

**It is fine for this session to be the weak one.** Sessions 3, 5 and 6 carry the area.
Do not fight to make tonight great at the cost of him arriving at session 5 sour.
