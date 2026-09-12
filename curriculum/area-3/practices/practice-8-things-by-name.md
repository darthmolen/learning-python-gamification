---
audience: dm
---

# Practice 8 — Things By Name

**Concepts:** `dict`, `breakpoints` · `list`, `in`, `len`, `iteration`, `vscode`,
`reading-errors` resurfacing
**Files:** `practices/practice-8/`
**Journal:** entry 32

The second half of the area starts here, and the vehicle changes shape. Practices 1–7 were
about a row of things. From tonight the data has **names** in it.

**This is the heaviest session in the area and that is a known cost.** Two new concepts, and
one of them is a tool rather than a language feature. The argument for doing it in one
evening is that the tool needs a bug worth stopping on, and `KeyError` on a dict is that
bug — it arrives naturally the moment dicts do, and it is unusually unhelpful when it
arrives.

The rung is elective depth rather than one of the five quests, which is what buys the room.
If the evening is full, `p8e3` and the walkthrough can move to practice 9 without damage.

**Before tonight:** the Run and Debug view has to be restorable in their editor. See
"What has to be true" below — this is the one session in the area with a hardware
dependency.

---

## Beat 1 — Invasion (3 minutes)

1. What does `sorted()` hand back, and what does `.sort()` hand back?
2. Why does `[0:9]` give nine things?
3. What does a list answer that a variable cannot?

Question 3 is the hook, asked before the hook.

---

## Beat 2 — Forecast (1 minute)

Entry 31's forecast, read back, then what happened. Seven sessions of lists are behind
them; tonight is worth marking as a turn.

---

## Beat 3 — The hook (8 minutes)

Put an inventory on paper as a list:

```python
inventory = ["stick", "stick", "coal"]
```

Then ask the question the list is bad at:

> **"How much coal have you got?"**

They have to count. Make them describe the loop. Then:

> **"And now how much of everything, for twenty kinds?"**

Twenty loops, or one loop and a lot of bookkeeping. Let that sit.

Then write the other shape:

```python
recipe = {"stick": 2, "coal": 1}
recipe["coal"]
```

The sentence worth landing: **a list answers "what is in slot 2", a dict answers "how much
coal", and the second one is the question you actually have.**

Do not explain `.get`, `.items` or anything else. One idea: a key, and the value it points
at.

---

## Beat 4 — The work (30 minutes)

### `p8e1_things_by_name.py` — a key, and the value it points at

Making one, reading one, changing one, adding to one. Task 3 asks what shape would hold two
recipes at once — they are describing practice 12 and should be told so, because knowing the
road continues is worth more than the answer.

### `p8e2_the_key_that_is_not_there.py` — the bug the rest of the session hunts

`KeyError`, on purpose. **The point is how little the message tells them.** `IndexError`
said the index was out of range; `ValueError` named what `remove` was looking for. This one
names the key and stops — and the thing they actually want to know is *what was in the dict*,
which it does not say.

That is the argument for a breakpoint, and it should be felt before the tool arrives.

### `p8e3_stop_and_look.py` — `breakpoint()`, the built-in

The language's own version, before the editor's. Put `breakpoint()` on a line, run it, and a
prompt appears; `p name` prints anything, `n` steps, `c` continues.

**Note the `# stdin:` tag.** The file feeds pdb its own answers so the harness can check it.
Tell them that, and tell them that when *they* run it nothing is fed in and they should poke
around before typing `c`.

### `w8_the_variables_panel.md` — the same thing in the editor

Six steps, ending in the third loop pass where `thing` becomes `"diamond"` and they can see
the crash coming before it lands. Step 6 is a conversation rather than a click and should not
be skipped: *what did that do that `print` could not, and what does `print` still do better?*

### The quest

`a3-set-a-breakpoint`, DC 12, `peer-signoff: dm`. The DM watches them set a breakpoint and
step to the failing line, then signs off. There is nothing to test and that is correct —
this is a thing done in an editor.

---

## Beat 5 — Choice board (in the work time)

- **Count them.** Turn a list of pickups into a dict of counts. Four lines, and they will
  need it again in practice 11.
- **The whole inventory.** A dict of every block kind and how many you hold.
- **Break something on purpose.** Put a breakpoint somewhere useless, and somewhere useful.
  What makes the difference?
- **Two recipes.** Two separate dicts, and a sentence about what is annoying about that.
- **Something else**, with a prediction first.

---

## Beat 6 — Journal (5 minutes)

Tonight's addition: **what does a dict answer that a list cannot?** One sentence. If it
mentions looking things up by name rather than by position, that is the session.

---

## Where they will stall

See `dm-guide.md` §4. The predicted four:

1. **`KeyError` on a typo.** *"Read the error. What does it tell you, and what do you
   actually need to know? Where could you find that?"*
2. **Looping a dict and getting only the keys.** Expected, and next session's material.
   *"What did you get? What did you want?"*
3. **The Run and Debug panel is not there.** See "What has to be true" — this is a setup
   problem, not a learner problem, and it is yours to fix quickly.
4. **`breakpoint()` runs and they do not know what to type.** *"It is waiting for you. Type
   `p` and the name of anything in the program."*

---

## What you may not say

When they hit the `KeyError`: **do not tell them what is in the dict.** That is the exact
information the breakpoint is about to give them, and handing it over now spends the
session's whole motivation to save forty seconds.

---

## What has to be true before tonight

**The Run and Debug view must be restorable in their editor.** The Area 2 profile strips VS
Code down, and Area 3's rung is where this view comes back — Ctrl+Shift+P, `View: Show Run
and Debug`.

`tools/vscode/README.md` records the strip as **pending verification on the target
machine**, and `planning/reminders/follow-up_re-export-the-vscode-profile_2026-09-01.md` is
still open. So confirm on their laptop, before the session:

- the Command Palette restores the view, and
- the Python extension is installed, so **Run and Debug → Python File** works.

If the strip was never applied, the view is already visible and step 1 of the walkthrough is
a no-op. **Say so rather than pretending** — "this was already on for you" costs nothing,
and a learner told to reveal something that was never hidden learns to distrust the
instructions.

---

## Success condition

They can say what a dict is for, and they have watched a variable change while a program sat
still.
