# Session 11 — What Am I Missing

**Concepts:** — none introduced · `set`, `dict`, `list`, `in`, `iteration`, `sorted`, `len`
resurfacing
**Files:** `sessions/session-11/`
**Journal:** entry 35

**This session introduces nothing, and that is its whole design.**

Set subtraction does in one character what a six-line loop did in session 5. The two are put
side by side and shown to give the same answer, because a shortcut you cannot see the long
version of is a magic word, and magic words do not survive being forgotten.

Then the second half, which is the real content of the back end of this area: **three
collections, and choosing between them.** By now they have all three. The skill is no longer
using one — it is knowing which question you have.

**This session carries `a3-what-am-i-missing`, DC 18.**

---

## Beat 1 — Invasion (3 minutes)

1. What does a set promise?
2. In session 5, how did you find what was missing from a list?
3. What does `.get(name, 0)` hand back for a key that is not there?

Question 2 is tonight's whole hook, and they wrote the answer six sessions ago.

---

## Beat 2 — Forecast (1 minute)

Entry 34's forecast, read back, then what happened.

---

## Beat 3 — The hook (6 minutes)

Do not write any new syntax yet. Ask them to write session 5's loop again, from memory, on
paper:

```python
missing = []
for thing in need:
    if thing not in have:
        missing.append(thing)
```

Let them finish it. Then, underneath:

```python
need - have
```

> **"Same answer. What did the six lines buy you that the one character did not?"**

The honest answer is *nothing, here*. Which is the point. Then the follow-up that stops it
being a trick:

> **"And what does the loop do that the subtraction cannot?"**

It can act on each missing thing as it finds it — print it, count it, stop early. The
subtraction hands you a set and nothing else. **Knowing what you gave up is the difference
between a tool and a spell.**

Then, quickly, the other two and their questions:

| | Asks |
|---|---|
| `need - have` | what am I missing |
| `need & have` | what can I already use |
| `need \| have` | everything involved |

---

## Beat 4 — The work (30 minutes)

### `s11e1_what_am_i_missing.py` — both versions, proven equal

The long way and the short way, printed side by side, and then a line that checks they
agree. Then all three operators.

**The direction trap is task 1** and it is worth catching them on: `need - have` and
`have - need` are different questions, and only one of them is "what am I missing".
Subtraction on sets is not symmetrical and this is the file that proves it.

Task 4 asks what sets lost: the **amounts**. `need` says you want flint but not how much.
That is the limit of a set stated by the learner rather than by you, and it points straight
back at the dict.

### `s11e2_pick_the_right_one.py` — three questions, three shapes

The session's real content. Three questions asked of the same pickup data, each answered
correctly by one collection and *incorrectly but without crashing* by another.

**Every wrong answer in this file runs perfectly.** That is stated in the docstring and
should be said out loud: a wrong collection is not a broken program, it is a program that
confidently answers a slightly different question. That is the hardest class of bug in the
area and it is the one Boss 3 will punish.

The counting loop — `counts[thing] = counts.get(thing, 0) + 1` — is four lines and worth
knowing by heart. Task 1 asks what it does the first time a thing is seen, which is the
whole trick.

### The quest

`a3-what-am-i-missing`, DC 18, `local-repo`. Brief lands in
`exercises/what-am-i-missing/BRIEF.md` with the content items.

---

## Beat 5 — Choice board (in the work time)

- **The crafting check.** One line, True or False: can this recipe be built?
- **Shopping list with amounts.** Sets say what is missing; dicts say how much. Use both.
- **Two worlds.** Which block kinds does world A have that world B does not?
- **Name the shape.** Take five situations and say which collection each needs, and why the
  other two are wrong.
- **Something else**, with a prediction first.

---

## Beat 6 — Journal (5 minutes)

Tonight's addition: **list, dict or set — how do you decide?** One line each. This is the
entry to reread before Boss 3, and the DM guide says to point at it then.

---

## Where they will stall

See `dm-guide.md` §4. The predicted four:

1. **`have - need` when they wanted `need - have`.** *"Read your line out loud as a
   sentence. Which one is the thing you are looking for?"*
2. **Expecting a list back from a subtraction.** *"What type did you get? Does it have an
   order? Should you rely on it?"*
3. **Reaching for a set when amounts matter.** *"Your set says you need flint. How much
   flint?"*
4. **The counting loop's first pass.** *"What is `counts.get(thing, 0)` when the thing has
   never been seen? Now add one."*

---

## What you may not say

**Do not let the one-liner replace the loop without the comparison.** If they skip straight
to `need - have` and it works, ask for session 5's loop anyway. The pairing is the entire
lesson and it takes four minutes.

---

## Success condition

They can name the collection for a problem they have not seen before, and say why the other
two are worse. That is the sentence §8 of the DM guide says the whole area is graded on.
