# Session 5 — And, Or, Not

**Concepts:** `boolean-operators`, `elif` · `if`, `else`, `bool`,
`comparison-operators`, `input`, `f-strings` resurfacing
**Files:** `exercises/session-5/`
**Journal:** entry 11

Tonight one question becomes several, and he fixes a bug he wrote down in week two.

---

## Beat 1 — Invasion (3 minutes)

1. What is the difference between `=` and `==`?
2. When does the `else` part run, and when does it not?
3. What kind of thing does a comparison hand back? Name both possible values.

## Beat 2 — Forecast (1 minute)

Entry 10's forecast, read back, then what happened.

---

## Beat 3 — The hook (7 minutes)

Three words, and they mean what they mean in English about eighty percent of the time.
The other twenty percent is where the bugs live.

```python
A and B     # True only when BOTH are true
A or  B     # True when EITHER is true, or both
not A       # flips it
```

Then `elif`, presented as a ladder rather than as a keyword:

> **"Python tries the rungs from the top, stops at the first one that is true, runs that
> block, and skips every rung below it. Exactly one block runs. Always."**

Do not demonstrate the trap. He meets it in the file, which is much better.

---

## Beat 4 — The work (30 minutes)

### `s5e1_and_or_not.py` — predictions on paper first

Twelve lines of True and False, written down before running. He will score better on
`and` than on `or` or the other way round, and which one is his weakness is worth knowing.

**The trap is in the file and it is the point of it.** `size == 60 or 70` looks like it
asks whether size is 60 or 70. It does not. Python reads `(size == 60) or (70)`, and 70 on
its own is truthy, so the whole thing is always true. It runs. It is wrong. Nothing
complains.

Task 3 is the rewrite: express "in the middle" as `not (too small or too big)`. That swap
has a name, mathematicians are proud of it, and he does not need the name — he needs to
have done it once.

Task 4 asks him to write his own trap, run it, watch it be true for 900 sides, and then
write it properly. **Do this one.**

### `s5e2_the_ladder.py` — order decides everything

Four colour bands round a sixteen-sided shape, then a deliberately broken ladder with a
wide rung above a narrow one, so the narrow rung can never be reached.

It prints, plainly, `THIS CAN NEVER HAPPEN` next to nothing at all — because it never
happened. No error. No warning. The picture would simply be quietly wrong.

Task 3 is the sharpest question in the session: change every `elif` into an `if` and run
it. The picture changes. **"What is different about four separate questions compared with
one ladder?"**

### `s5e3_the_gatekeeper.py` — the promise from Area 0, kept

Open his Area 0 Journal first, at the entry where he wrote that the program crashed when
he typed something silly and he could not fix it. **Read it back to him.** Then say that
tonight is the night.

The file gates a size: refuse below 20 or above 300, thin pen up to 100, thick pen above.
Everything from this week is in it.

Task 4 is the actual work and it is a refactor, not a feature: two blocks draw the same
square with different settings, and that repetition is ugly enough for him to feel. The
move is that **the ladder decides and the drawing happens after it**. Payload in
`reference/r5_the_gatekeeper.py` if two real attempts are not enough.

Task 3 is the honest half. Answering `"sixty"` still crashes, on the first line, before
the gate. He cannot fix that tonight — it is `try`/`except`, Area 5, week 21. **Write it
in the Journal properly.** Finding his own note from week 5 on the night he finally fixes
it is worth planning for.

---

## Beat 5 — Journal (5 minutes)

Entry 11. Two things: the Area 0 crash he finally fixed, and the one he still cannot. Both
are the same kind of entry and it is worth him noticing that.

---

## Where he will stall

`dm-guide.md` §4. The two that matter:

**`and` and `or` swapped**, because English uses "and" where logic wants "or". *"Say the
rule out loud with 'both' or 'either' in it. Which word did you use?"*

**A ladder ordered widest-first**, so branches below the first can never fire. *"Put a
`print` in every branch. Which one fires? Why is it always that one?"*

## Success condition

He can combine two comparisons with `and` or `or` and say which he needs; he can write an
`elif` ladder and say why the order matters; and he has a program that refuses bad input
instead of crashing on it.

That last one is a genuine step up in what he can build, and it is worth saying so out
loud.
