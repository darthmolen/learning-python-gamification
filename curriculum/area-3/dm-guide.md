# Area 3 — DM Guide

**Weeks 9–14. Thirteen sessions of 45–60 minutes.**
Spec: `docs/specs/2026-08-26-gamified-python-curriculum-design.md`, §4 Area 3.

Read this before session 1. §2 has to be done before session 1 and takes an evening on its
own. §3 is the one section worth rereading mid-area, because it is the section that stops
you designing something the shim cannot do.

This guide covers **sessions 1–7**, which are lists through tuples. Sessions 8–13 — dicts,
sets, nested structures and the breakpoints rung — arrive with the second half of the
authoring and this guide grows a second stall section then. What is here is complete for
the half it covers; nothing in sessions 1–7 waits on it.

---

## 1. What is different about the shape of a session

Three things change in this area, and all three change on session 1.

**The picture is no longer the point, and it is still on screen.** Areas 0 and 1 drew with
turtle, and the drawing *was* the answer — a hexagon with five sides was visibly wrong.
Here a program builds a world out of a list, and **the world can look perfectly fine while
the list is wrong**. A row of ten blocks and a row of nine are the same picture to a glance.
So the questions in this area move from *look at it* to *what does the list say*, and the
sessions ask for the list to be printed at least as often as they ask for the world to be
built.

**Startup is slow enough to notice, and that is a teaching fact rather than a complaint.**
`start()` fuses every placed block into one mesh before the window appears. On the learner's
laptop that is about 2.2 seconds for a thousand blocks and 5.3 for five thousand. A learner
who writes three nested loops will wait, and the wait is the honest consequence of the
number they chose. Do not apologize for it. Ask what they think it is doing.

**They import something they did not write, for the first time.** `import world` is the
first line of most files in this area. It is one line, it is Area 2b vocabulary, and it is
the beginning of a thread that runs to Boss 5: this file comes down on a schedule, half of
it is readable to them today, and the schedule is written in `curriculum/lib/README.md`.
Say that once, in session 1, and then leave it alone.

---

## 2. Setup, once, before session 1

**Install ursina on both machines, pinned.**

```console
py -3.14 -m pip install -r curriculum/lib/requirements.txt
```

The pin is `ursina==8.3.0` and it is identical on both machines on purpose. Push is the
verification mechanism — they push, the other machine clones and runs the code cold — and
two machines on different engine versions break that verification quietly. **Never upgrade
mid-area.** An upgrade may land between areas, only when something is actually broken, and
only after `smoke.py` passes on both machines against the new version.

**Prove it works before the session, not during it.**

```console
py -3.14 curriculum/lib/smoke.py
```

Seven checks, and it opens a window. If that window does not appear on their laptop, you
have found it on a Tuesday afternoon instead of in front of them on a Tuesday night.

**Copy the shim into their repository.**

```console
cp curriculum/lib/world.py <their-repo>/world.py
```

This is a copy, not a dependency, and the reason is worth knowing because they will ask.
`import world` needs `world.py` sitting beside their own files. More than that: **a file
they own is a file they can delete**, and deleting it at Area 4 and Area 5 has to be their
action rather than yours. A shim installed as a package is a shim that never comes down.

Copy it again whenever it changes. `curriculum/lib/README.md` is the canonical copy and
says so.

---

## 3. The three names, and the six things that are not there

The whole surface is:

```text
BLOCKS                  a dict of kind -> color, seven kinds
place(x, y, z, kind)    remember one block; nothing is drawn yet
start()                 build everything, frame the camera, open the window
```

Seven kinds: `grass`, `dirt`, `stone`, `sand`, `water`, `wood`, `glass`.

Every call is positional, which is the entire argument for the shim. Calling a positional
function is Area 0 vocabulary — they have been calling `print()` since week one — so this
teaches them no syntax they have not earned. Raw Ursina would: measured, 9 of 9
engine-touching lines are keyword arguments (Area 4) or attribute access (Area 5).

**The negative space is as load-bearing as the surface, and you need it in your head
because it is where a good idea goes to die mid-session.** There is:

- **no block removal.** Nothing deletes or replaces a placed block.
- **no rotation and no scale.** Every block is axis-aligned and one unit.
- **no color outside `BLOCKS`.** `place(0, 0, 0, "lime")` is a `ValueError`, by design, and
  the error names the seven kinds it knows.
- **no camera control.** `start()` frames whatever was placed. That is the whole camera
  story.
- **no animation, no per-frame update, no input handling, no collision, no physics.**
- **no persistence.** Nothing saves or loads a world. That is Area 6.

So when they say "can I make it fall" or "can I mine that block" or "can I make this one
red" — and they will, because those are the natural Minecraft beats — the answer is **not
yet, and here is what it needs**. Falling is Area 4's game loop. Mining is state, which is
Area 5. Saving is Area 6. That answer is better than a shrug because it is true and because
it is a map.

**If a session genuinely needs a fourth name, that is a change to the shim plan, argued
there.** Not a workaround here. Every addition costs vocabulary they have not earned, which
is the only reason the shim exists.

### The block cap, and why it is about seconds

**Keep a world under about 5,000 blocks.** `verify.py` enforces it, so an exercise cannot
quietly exceed it, but you want the reason rather than the rule.

It is **not about framerate.** Measured on their laptop: 8,000 blocks still renders at 178
fps. What degrades is **startup** — `combine()` costs roughly a millisecond per block, paid
once, before anything appears at all. Five thousand blocks is 5.3 seconds of black window.

So when a learner writes three nested `range(20)` loops and gets 8,000 blocks, the question
is not "is it smooth". It is **"how long are you willing to wait, and what did you think
that number was going to be?"** That is an arithmetic conversation, and it is one they can
win.

---

## 4. Stalls, by session

Each one is a thing that will actually happen, with the question to ask. Ask the question.
Do not give the answer — §3 principle 6, and it is the whole job.

### Session 1 — The Row Of Blocks

**Nothing appears, and there is no error.** They called `place()` in a loop and never
called `start()`. This is the signature Area 3 bug and it arrives in the first fifteen
minutes.

> "Your program finished without complaining. So it did everything you asked. What did you
> ask it to do?"

Then, if that is not enough: *"`place` and `start` are different words. What do you think
the difference is?"*

**The window opens and there is nothing in it.** They called `start()` before the loop, so
nothing had been placed yet.

> "Read your program from the top, out loud, one line at a time. Where does the building
> happen, and where does the window open?"

**A missing comma between two strings.** `["dirt" "stone"]` is one string, `"dirtstone"`,
and it is not an error. The row is one block long.

> "How many things are in that list? Ask Python — don't count them yourself."

`print(len(inventory))` answers it, and this is the first time `len` earns its place.

**They want a second row and write the whole thing again.** Let them, once. The nested loop
is session 7 in Area 1 and they have it; what they do not yet have is a reason to want it
here. Copy-paste is the reason.

### Session 2 — The Inventory

**`inventory[3]` on a three-item list.** `IndexError`, and it is the good kind of error:
loud, immediate, and correct.

> "Read the error out loud. Now count the slots on your fingers, starting at zero. Which
> number is the last one?"

**`len()` used as the last index.** `inventory[len(inventory)]` is always wrong and always
`IndexError`.

> "If there are three things and the first is at zero, where is the third?"

The sentence they need is *the last position is always `len(x) - 1`*, and it lands far
better when they say it than when you do.

**Negative indexing looks like a trick.** It is not, and the way to sell it is a problem
rather than a rule: *"give me the last block, without knowing how long the list is."*

### Session 3 — It Changes

**`x = inventory.sort()` and now `x` is `None`.** This costs everybody an evening once.

> "What did `sort` hand back to you? Print it. Now print the inventory. Which one changed?"

The rule underneath is worth naming out loud once they have seen it: **most list methods
change the list and hand back nothing.**

**Two names for one list.** `backpack = inventory`, then `backpack.append("rope")`, and
`inventory` grew too. This is the session's whole subject and they should be allowed to be
properly startled by it.

> "How many lists are there? Not how many names — how many lists."

Do not reach for `copy()` in this session unless they get there themselves. The point is
that there was only ever one list.

**They expect `append` to hand back a new list.** Same family as the `sort` stall, and the
same question works.

### Session 4 — Pick It Up

**`remove()` on something that is not there.** `ValueError`, and the message is good.

> "What does the error say it was looking for? Is it in the list? How would you check
> before asking?"

That is the first natural reason to want `in`, which is session 5's material arriving one
session early because they asked for it. Let it.

**`pop()` and `remove()` get mixed up.** One takes a position, one takes a value.

> "Say what each of those two lines does, in English, before you run either."

**Mutating a list while iterating over it.** They remove items in a `for` loop and items get
skipped. Nothing crashes. The list is just quietly wrong.

> "Print the list at the top of every go round. Watch where the loop thinks it is."

This is the second silent failure of the area and it is worth ten minutes.

### Session 5 — Do I Have Enough

**`sorted(x)` versus `x.sort()`.** They use one and expect the other's behavior.

> "One of those hands you a new list and leaves yours alone. The other rearranges yours and
> hands back nothing. Which did you just use, and which did you want?"

**`min` and `max` on a mixed list.** `min(["torch", 3])` is a `TypeError`, and the message
is about `str` and `int` not being comparable.

> "What would it even mean for a word to be smaller than a number?"

**`in` feels too easy.** It is. Let it be. The payoff is session 4's `remove()` crash never
happening again, and they should notice that themselves.

### Session 6 — The Hotbar

**`[0:9]` gives nine things and they expected ten.** Same stopping rule as `range`, third
time of asking.

> "How many numbers does `range(0, 9)` give you? Same rule. Why do you think it is the same
> rule?"

**A slice past the end does not crash.** `inventory[0:99]` on a three-item list gives three
items and no error — which is genuinely surprising after session 2's `IndexError`.

> "Indexing past the end exploded. Slicing past the end did not. What is different about
> what you asked for?"

The answer worth reaching: an index asks for *a thing that must exist*; a slice asks for
*whatever is in this range*, and an empty range is a fine answer.

**They slice and then wonder why the original is unchanged.** Good — that is the lesson.
Ask what they expected and why.

### Session 7 — A Coordinate Cannot Change

**Assigning into a tuple.** `spawn[0] = 5` is a `TypeError`, and the message says `'tuple'
object does not support item assignment`.

> "Read the error. It is telling you something a tuple cannot do. Why would anybody want a
> thing that cannot be changed?"

**The single-element tuple.** `(5)` is the number five. `(5,)` is a tuple. This will bite
somebody.

> "Print the type of each of those."

**"So why not just use a list for everything?"** This is the right question and it deserves
a real answer rather than a rule. The honest one: a coordinate is always exactly three
numbers, and a coordinate that could grow a fourth would be a bug rather than a feature.
The immovability is a promise to whoever reads it later — which by Area 7 is them.

**`tuple` is the thinnest concept in this area and it is allowed to be.** One session, one
idea, and no quest of its own. Do not pad it. If the session runs short, that is what the
choice board is for.

---

## 5. Invasions

Three questions at the start of every session, out loud, no computer, nothing looked up,
two to three minutes. Retrieval, not recognition: *"What does `len` give you?"* is
retrieval; *"Does `len` count the items?"* is a yes-or-no they can guess.

By this area the ladder spans **thirty-nine concepts** across Areas 0–3, on the 1/3/7/16/35
day rungs, hand-run until the engine ships. That is more than you can hold in your head, so
this is a rule rather than an instruction to prioritize:

1. **One from last session's material.** The one-day rung, always due.
2. **One from the lowest rung anywhere across the thirty-nine** — whatever has gone longest
   untouched. Ties broken by area, oldest first: Area 0's vocabulary is the most at risk of
   quiet decay and the least likely to be missed.
3. **One from something this session is about to need.** Retrieval immediately before use is
   the cheapest kind there is, and it doubles as the warm-up.

Three per session across thirteen sessions is thirty-nine slots against thirty-nine
concepts, so rule 2 alone will not cover everything and is not meant to. The concepts
deliberately drilled most are Area 0's four types and Area 1's `range` stopping rule,
because Area 3 leans on both constantly and neither announces itself when it decays.

---

## 6. Scoring the Journal

Unchanged: one entry per session, four prompts, ten XP for substance rather than existence.
The fourth prompt — *what will break next time* — is read back at the start of the next
session, which is Beat 2.

Their `journal.md` already lives in their own repository and is committed and pushed, since
Area 2a session 2. Nothing about that changes here and there is no `journal/` directory in
this area; Area 0's template is still the only copy.

Two additions worth asking for in this area specifically:

- **The session-3 entry names the two-names-one-list moment**, in their own words. It is the
  first time this year that a thing was true and invisible at the same time.
- **The session-6 entry states the slicing stopping rule**, written out. Third encounter with
  that rule, and writing it is what makes the third one the last.

Your reply goes in two places, as it has since Area 2: a line under their entry, and a
comment in Gitea when Gitea exists.

---

## 7. The two places you will be tempted to take the keyboard

**When nothing appears and they cannot see why.** The missing `start()` is so obvious from
where you are standing that pointing at it costs nothing and teaches nothing. It is the
single most valuable stall in the area, because it is the first time a program has run
perfectly and done nothing. Ask the question in §4 and wait.

**When they are one character from a working world.** A missing comma, a `9` that should be
a `10`. Reading their own list back to themselves is the skill; you reading it to them is
not. `print(len(...))` is always available and it is theirs to type.

---

## 8. What you are actually being graded on

Not whether they finish thirteen sessions. Whether, by session 13, they reach for a list
when a problem has an order in it and a dict when a problem has names in it, and can say
why the other one would have been worse.

Everything else in this area — the blocks, the shim, the crafting table — is a vehicle for
that one judgment. A learner who ships Boss 3 and cannot say why a recipe is a dict has
been carried. A learner who says *"that's a dict, because I want to look things up by
name"* about a problem you did not set has arrived, and the boss is a formality.
