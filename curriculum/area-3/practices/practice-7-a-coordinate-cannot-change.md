---
audience: dm
---

# Practice 7 — A Coordinate Cannot Change

**Concepts:** `tuple` · `list`, `mutation`, `indexing`, `len`, `iteration`,
`reading-errors` resurfacing
**Files:** `practices/practice-7/`
**Journal:** entry 31

**This is the designed slack in the area and it is allowed to be thin.**

One idea: round brackets make a thing that cannot be changed. No quest, one new concept, and
the least visually rewarding hour in the six weeks. `README.md` says in writing that `tuple`
is the thinnest concept here and that this is a decision rather than an oversight — the same
call Area 0 made about `bool`.

So: if the evening is short, or the week has been long, **this is the session to cut short**,
and cutting it short costs nothing. If the evening has room, the fourth task in `p7e1` is
one of the better arguments in the area.

The half-area ends here. Practices 8 onward are dicts, and the vehicle stops being a row of
things and starts being a thing with names.

---

## Beat 1 — Invasion (3 minutes)

1. Why does `[0:9]` give nine things?
2. What does `sorted()` hand back, and what does `.sort()` hand back?
3. Two names for one list — what happens when you change one?

Question 3 is Area 3's own material at the seven-day rung, and it is the one tonight builds
on directly.

---

## Beat 2 — Forecast (1 minute)

Entry 30's forecast, read back, then what happened.

---

## Beat 3 — The hook (8 minutes)

**Do not open with "a tuple is an immutable list".** That is a definition of a thing by what
has been taken away from it, and it makes the obvious question — *why would I want that* —
sound like a complaint rather than the actual subject.

Open with the problem instead:

> **"A coordinate is three numbers. What would it mean for a coordinate to grow a fourth?"**

Nothing good. It would mean something has gone wrong somewhere, and you would rather find
out now than three files later.

Then:

```python
spawn = (128, 64, 128)
```

Round brackets. Indexes exactly like a list. `len` works. The one difference is that it
cannot be changed, and that is not a limitation — **it is a promise to whoever reads the
code next**, which by next year is them.

Point out that they have been handling coordinates since practice 1: `place(x, y, z, kind)`
takes three, every single time.

---

## Beat 4 — The work (30 minutes)

### `p7e1_a_coordinate.py` — tuples, and a list of them

A tuple on its own, then a list of four tuples that become the corners of a square. That
combination — **a mutable list holding immutable things** — is the shape most real data
takes, and it is worth naming.

Task 2 is the one that separates the two ideas properly: *can you append a fifth corner to
the list? Can you change the numbers inside a corner already in it?* Two different questions
with two different answers, and getting both right is the session.

**Task 4 is the best thing in this session and should not be cut.** Rewrite `corners` as a
list of lists. It works. The picture is identical. So *what did the tuple buy you?* There is
no crash to point at and no output to read — the answer is entirely about intent, and it is
the first time this year the right answer has been about communication rather than
correctness.

**Note the `# noqa` on the `type((5))` lines.** The parentheses are the demonstration, and
ruff would remove them. Same call as `area-0/exercises/the-type-lab`.

### `p7e2_it_will_not_change.py` — the refusal, on purpose

`spawn[0] = 99` and a `TypeError` whose message is unusually well written: it names the kind
of thing and the thing that kind will not do.

The line above the crash reassigns `spawn` entirely and works perfectly. **Task 2 is to
explain the difference between those two lines**, which look similar and are not remotely
the same. Making a new tuple and putting it back under the old name is exactly what
`total = total + 1` does to a number — practice 3's idea, arriving for the third time and
finally being the obvious one.

Task 4 is a genuine oddity: a tuple holding a list, where `odd[1].append(4)` works. Offer it
only if the evening has room. It is a good puzzle and a bad thing to be confused by at the
end of a thin session.

---

## Beat 5 — Choice board (in the work time)

- **A cube.** Eight corners as tuples, one loop, no repetition.
- **Swap two coordinates.** Without changing either tuple.
- **A palette.** A list of `(kind, height)` tuples, used to build towers.
- **Argue the other side.** Find a case where a list really is better than a tuple, and say
  why.
- **Something else**, or finish early. This session is allowed to finish early.

---

## Beat 6 — Journal (5 minutes)

Tonight's addition, and it is task 4 restated: **what did the tuple buy you, when the list
of lists drew exactly the same picture?**

If the answer is about a promise, or about finding a bug early, or about telling the next
reader something — that is it. If the answer is "I don't know", that is an honest entry and
worth full marks; the question is genuinely hard and it is the right one to be sitting with.

---

## Where they will stall

See `dm-guide.md` §4. The predicted three:

1. **Assigning into a tuple.** *"Read the error. It is telling you something a tuple cannot
   do. Why would anybody want a thing that cannot be changed?"*
2. **The single-element tuple.** `(5)` is five; `(5,)` is a tuple. *"Print the type of each
   of those."*
3. **"So why not just use a list for everything?"** This is the right question and it
   deserves a real answer rather than a rule. See Beat 4, task 4.

---

## What you may not say

**Do not pad this session.** If it runs twenty minutes short, it runs twenty minutes short.
Filling a thin session with invented material teaches that every session must feel the same
size, and the next genuinely thin one gets padded too.

---

## Success condition

They can say why a coordinate is a tuple in terms of what it promises, not in terms of what
it forbids.
