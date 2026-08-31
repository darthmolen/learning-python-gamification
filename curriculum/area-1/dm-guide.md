# Area 1 — DM Guide

**Who this is for.** Whoever holds the DM seat. In Kitchen Table mode (spec §5.11) that
is a parent, who is also a player. Area 0's guide established the seat and says why the
word *parent* is used where it is; this one assumes you have read it and does not repeat
it.

**What changed since Area 0.** Two things, and both of them change how you sit beside
the learner.

1. **The failures stop announcing themselves.** Area 0's subject was reading a
   traceback. Half of Area 1's failures produce no traceback at all: a loop that runs
   four times instead of five, a loop that never ends, a loop that never starts. The
   red text was training wheels and this area takes them off.
2. **They can now build things that are genuinely theirs.** A polygon engine with a
   number at the top is a *machine*, not an exercise. By session 7 they will want to
   change numbers just to see what happens, and that is the first time in the year the
   curriculum becomes optional to enjoy. Protect it. Do not fill the space with tasks.

Read this once before session 1. Come back to §4 mid-session, on your phone, while they
are staring at a hexagon with five sides.

---

## 1. The shape of a session

Unchanged from Area 0, and it should stay unchanged — the shape is the thing that
stopped costing attention in week two.

| Beat | Minutes | What happens |
|---|---|---|
| **Invasion** | 3–5 | Three questions from the ladder in §5. Out loud, no computer. |
| **Forecast** | 1 | Read their last Journal answer to *what will break next time* back to them. Then say what actually happened. |
| **The hook** | 5–10 | You show one thing. They have the keyboard by minute ten. |
| **The work** | 25–30 | They type. You do not touch the keyboard. |
| **The choice** | included | Every session has a choice board. Give options everywhere (§3 principle 3). |
| **Journal** | 5 | Four prompts. The fourth is the forecast you will read back next time. |

The Forecast beat is new to this guide and is one minute long. §5.6 is explicit that
*a forecast nobody checks is a wish*. Area 0 wrote them; Area 1 is where you start
reading them back, out loud, before they touch anything.

**The keyboard rule still holds.** All of it. Including "just let me show you the
`while` loop", which you will want to say in session 3.

**The 90-second rule still holds**, with one Area 1 exception: **if the window has
hung, say so immediately.** A hung program is not a stall they can think their way out
of; it is a state they do not yet know the exit from. Tell them Ctrl-C, once, in session
3, and then never again.

---

## 2. Setup — three new facts, none of them an install

Nothing new to install. Same Python, same turtle, same folder. Three things to know
before session 1.

**Ctrl-C in the terminal kills a running program.** Press it in the *terminal window*,
not in the turtle window. If the turtle window is unresponsive, the terminal still
listens. They need this in session 3 and will use it for the rest of their life.

**`turtle.speed(0)` turns the animation off.** Area 1 draws hundreds of lines instead
of four, and at the default speed a mandala takes ninety seconds to appear. Introduce
it in session 1 as a piece of equipment, not as a concept: *"this is the throttle."*
`speed(1)` is slowest, `speed(10)` is fast, and `speed(0)` is no animation at all.

**`turtle.tracer(0)` with `turtle.update()` is the next level of the same idea** and
is deliberately held back to session 9, where drawing gets heavy enough to need it.
Do not spend it early. It is the reward for a mandala that is too slow.

---

## 3. Principle 6 in an area with no error messages

The Area 0 ladder still works, and §3 of that guide is still the reference. Two rungs
change shape here, because the diagnostic questions are different when nothing crashed.

**Rung 3 became a different tool.** In Area 0 the answer to "what could you print?" was
almost always a value. In Area 1 it is almost always a **counter**:

- "Put a `print` inside the loop. How many lines does it print? Is that the number you
  wanted?"
- "Print the variable at the top of the loop and at the bottom. Are they different?"
- "How many times did that run? Don't guess. Make it tell you."

That last one is the single most useful sentence in this area. Say it a lot.

### Three questions that unlock most of Area 1

These are worth memorising, because between them they cover perhaps two-thirds of
everything that goes wrong for the next four weeks.

1. **"How many times does that run?"** — for every off-by-one, every `range` confusion,
   every loop that did too much or too little.
2. **"What has to change for that to become false?"** — for every `while` loop that
   does not stop. If the answer is "nothing in the loop changes it", they have found it
   themselves, which is the whole point.
3. **"Which loop is that line in?"** — for every nesting problem in sessions 7 and 9.
   Point at the indentation with a finger. Do not read it out for them.

### Sentences you may not say, and their replacements

| Do not say | Say instead |
|---|---|
| "`range(6)` gives you 0 to 5, not 1 to 6." | "Print every number it gives you. All of them. What is the first and what is the last?" |
| "You need `side = side - 20` inside the loop." | "What has to change for that condition to become false? Where does that change happen?" |
| "The turn should be 360 divided by the sides." | "You have drawn all the sides and you are not back where you started. How far round did you actually turn?" |
| "That line is in the wrong loop." | "Which loop is that line in? Show me with your finger." |
| "It's an infinite loop." | "Is it stuck, or is it slow? How could you tell the difference?" |
| "Just press Ctrl-C." | *(Say this one. Exactly once, in session 3, and then it is theirs.)* |

### Datamine in this area

Same rules as Area 0 (§5.5): two genuine attempts, one written sentence, then the whole
answer and an explain-back. `reference/` holds the payloads. The one addition for Area 1:
**after a Datamine on a loop, make them change a number in it.** A loop they have read
and a loop they have steered are different amounts of understanding, and the second one
costs fifteen seconds.

### They are right and you are wrong

Session 6 is built for this, exactly as Area 0's session 3 was. Six broken loops, and
**two of them are broken in ways that will genuinely catch you** if you read them fast —
`b1` and `b6` both run, exit cleanly, and draw a plausible-looking picture. Read them
fast on purpose. Be wrong out loud. §5.8 calls this the highest-value mechanic in the
design and it only pays when it is real.

---

## 4. Stalls, by session

Written in the order you will hit them. Predictions, not a completeness exercise.

### Session 1 — The Loop That Draws

| Stall | What is actually wrong | What to ask |
|---|---|---|
| `range(4)` draws four sides, so they read it as "1 to 4" | It is 0, 1, 2, 3. They are right about the count and wrong about the numbers, and it will cost them in session 8 | "Print every number it gives you. What is the first one?" |
| Forgets the colon, gets `SyntaxError` | Area 0 material, arriving on schedule | "You have seen this error before. Which broken sigil was it? What was missing there?" |
| Indents the body with a mix of tabs and spaces | The editor, not the learner | "Delete the whole indent and put it back with spaces. All of it." |
| Puts `turtle.done()` inside the loop | Indentation is meaning now, and this is the first time it bites | "Which lines are inside the loop? Read me only those." |
| Draws a square with `range(4)` and `left(90)`, then wants a pentagon and uses `left(90)` again | Good instinct, wrong number, and it is a better lesson than the square was | "Draw it and look. You went round once and a bit. How far round should you have gone in total?" |

**Let them get wrong:** the pentagon turn. They will try 90, then 100, then guess. Let
them guess for a full minute before asking what all the turns have to add up to. The moment
360 arrives it never leaves.

### Session 2 — Any Shape You Like

| Stall | What is actually wrong | What to ask |
|---|---|---|
| `range(2, 10)` gives 8 numbers and they expected 9 | The stop is not included. The most common off-by-one in the language | "Write down what you think it gives. Then print it. Which end did you get wrong?" |
| `range(10, 0)` gives nothing at all, silently | Counting down needs the third number | "Nothing happened, and nothing broke. What did the loop have to count through?" |
| Wants a shape with 2.5 sides | Reasonable, and it will raise `TypeError` | "Read the error. What kind of thing did `range` want? What did you hand it?" |
| Changes `sides` at the top and the turn does not follow | They typed the turn as a number instead of computing it | "You changed one number and the shape broke. Which other number secretly depended on it?" |
| Copies the loop three times to draw three shapes | They have not seen a reason not to yet | Nothing. Say nothing. Session 7 is coming and it lands much harder if they have felt this. |

**Let them get wrong:** the hard-coded turn. It is the setup for the whole session and
the fix — `turn = 360 / sides` — is a line they should write themselves out of irritation.

### Session 3 — The Loop That Does Not Stop

This is the session where a program hangs on purpose. Read the whole session plan
before you run it.

| Stall | What is actually wrong | What to ask |
|---|---|---|
| The window freezes and they panic | Nothing is broken. Nothing is damaged. Say so first, and quickly | "Nothing is broken. Go to the terminal — the black window, not the drawing — and press Ctrl and C." |
| Writes `while side < 200:` and never changes `side` | **The defining Area 1 bug.** They will write it more than once | "What has to change for that to become false? Show me the line that changes it." |
| Uses `=` where `==` was meant | It is a `SyntaxError` in a condition, which is a mercy | "Read the error. What is the difference between saying something *is* and asking whether it *is*?" |
| Cannot see why anyone would use `while` over `for` | Fair. They have no example yet where the count is unknown | "How many times does the spiral go round before the line gets shorter than 5? Don't work it out — could the computer?" |
| Loop runs one time too many | Off-by-one at the boundary. `>` and `>=` are not the same | "At the very last go round, what was the value? Was the condition true or false then? Print it." |

**Let them get wrong:** the hang. Genuinely let it hang. They need the seven seconds of
*this is not responding* to convert Ctrl-C from a fact into a reflex.

### Session 4 — Two Roads

| Stall | What is actually wrong | What to ask |
|---|---|---|
| Uses `=` instead of `==` inside `if` | Same confusion as session 3, new location | "Which one is a question and which one is an order? Say both lines out loud in English." |
| `if` body not indented, or indented under the wrong loop | Nesting arrives before it has a name | "Which lines belong to the `if`? Read me only those, and then read me the next line after them." |
| Writes `if i == 0 or 1 or 2:` | It runs. It is always true. It is a **silent** bug | "That ran and it did the wrong thing. What is `or 1` asking? Print `1 == 0 or 1` on its own." |
| Wants `else if` | Every other language they have seen | "Try it. What does Python call it? Read the error — it is telling you the word." |
| The color changes and never changes back | `color` is a setting, not a one-off order | "When did you tell it red? When did you tell it anything else? What is it still holding?" |

**Let them get wrong:** the `or 1 or 2` one, if they write it. It is Area 1's `b7` — no
error, wrong answer — and it is worth more than anything you could tell them.

### Session 5 — And, Or, Not

| Stall | What is actually wrong | What to ask |
|---|---|---|
| `and` and `or` swapped | They are reading them as English, where "and" often means "or" | "Say the rule out loud as a sentence. Now say it again with 'both' or 'either' in it. Which word did you use?" |
| `elif` chain where all branches fire | They wrote three separate `if`s | "How many of those can be true at once? How many did you want to be?" |
| Orders the `elif` chain widest-first, so nothing after the first ever runs | The chain stops at the first true one | "Put a `print` in every branch. Which one fires? Why is it always that one?" |
| `not` in front of a comparison is hard to read | It usually can be written without `not` | "Can you say that rule without the word 'not'? Which version would you rather read in a month?" |
| Deep chain of five `elif`s they cannot follow | They are holding it all in their head | "Draw the branches on paper. One line each. Which line does size 50 take?" |

**Let them get wrong:** the ordering of an `elif` chain. Getting one branch that can
never fire is the lesson, and it is invisible until they instrument it.

### Session 6 — The Broken Loop

The area's hardest and most valuable session. Six broken files, and only two of them
crash.

| Stall | What is actually wrong | What to ask |
|---|---|---|
| Waits for red text that never comes | Area 0 trained them to expect it | "There is no error. There is still a bug. What did you *want* to happen?" |
| Counts the sides of the picture by eye and gets it wrong | Six is hard to count at a glance | "Don't count the picture. Make the program count. Where would the `print` go?" |
| Fixes `b2` by deleting the loop | It removes the symptom and the program | "That works. Does it still do the job it was for? Put the loop back and change one line instead." |
| `b5` NameError baffles them — the name is right there | The loop never ran, so it was never created | "How many times did that loop go round? What is `range(0)`?" |
| Says `b6` looks fine | It does look fine. That is the whole file | "Fine is not the test. Does it close? Add up every turn it made and tell me the total." |

**Let them get wrong:** all of it, as in Area 0 session 3. Two minutes of no rescue per
file, minimum. And **you should get `b1` or `b6` wrong yourself, in front of them.**

### Session 7 — A Loop Inside A Loop

| Stall | What is actually wrong | What to ask |
|---|---|---|
| Inner loop's turn is outside it, or vice versa | Indentation, and this is where indentation becomes hard | "Which loop is that line in? Point at it with your finger, then count the spaces." |
| Expects 3 + 4 shapes and gets 12 | Multiplication is not obvious from the shape of the code | "How many times does the outer one go round? For each of those, how many times does the inner one? So how many in total?" |
| Reuses `i` for both loops | It runs and misbehaves silently | "You have two counters with one name. What is `i` at the moment the inner loop finishes?" |
| It is unbearably slow | It genuinely is. Twelve polygons at default speed | "How fast is it drawing? Do you remember the throttle?" — then `turtle.speed(0)` |
| Nested loop draws every shape on top of the last | They never moved or turned the turtle between shapes | "What is different about the turtle between shape one and shape two? Is anything?" |

**Let them get wrong:** the multiplication. Ask them to predict the number of shapes
before running. They will add. Everyone adds.

### Session 8 — Carrying A Number

| Stall | What is actually wrong | What to ask |
|---|---|---|
| Resets the total inside the loop | The single defining accumulator bug | "Which line sets the total to zero? How many times does that line run? How many times did you want it to?" |
| Forgets to set the total before the loop | `NameError`, and a good one | "Read the error. When does that name first get created? Has that happened yet at the moment the loop needs it?" |
| `total = length` instead of `total = total + length` | They are storing rather than adding | "Say that line out loud in English. Now say the one you meant. What is different?" |
| Prints the total inside the loop and gets twenty lines | Nearly right, and the fix is one indent | "How many totals did you want? Which loop is that print in?" |
| Cannot see the point | It is the most abstract thing in the area | Point at the spiral. "How long is that line? Not the last one — all of it. Could you measure it with a ruler?" |

**Let them get wrong:** `total = length`. The picture still looks right, so this one is
silent, and it is the reason session 8 sits after session 6 rather than before it.

### Session 9 — The Mandala

| Stall | What is actually wrong | What to ask |
|---|---|---|
| Blank page | Scope, exactly as in Area 0 session 6 | "One ring. Just one. Don't design the rest yet." |
| Something enormous and unfinishable | Good instinct, wrong session | "Which single ring of that would you be most annoyed to lose? Build that." |
| It takes ninety seconds to draw | Real, and the fix is now earned | "You have a throttle. Want the next one up?" — then `tracer(0)` and `update()` |
| Colors all come out the same | The color is being set outside the loop that changes it | "Which loop is the color line in? Which one did you want it in?" |
| Wants to keep going past time | Stop anyway | "Write down the next thing you were going to do. It will still be there on Thursday." |

**Let them get wrong:** nothing in particular. This session is a rehearsal, and the
things that go wrong in it are the list of what to watch for in session 10.

### Session 10 — The Sigil

| Stall | What is actually wrong | What to ask |
|---|---|---|
| Rebuilds session 9's mandala exactly | Safe, and it is not the brief | "That one already exists. What does the person who asked for this get to choose?" |
| No `input` anywhere | The brief requires it and they forgot, not refused | "Read the specification back to me. Which line have you not done?" |
| Crashes on an input they did not expect | Correct behavior, correctly discovered | "Is that your bug, or the person's? What would you *want* to happen? Can you do that now?" — **they can. This is the first boss where the answer is yes.** |
| It runs on the learner's machine and not on yours | **The best outcome available** | "Excellent. This is the real thing. What is different between our two machines?" |
| Declares it finished in twenty minutes | Possible, and probably true | "Show me. Now change one number at the top and show me again." |

**The last one is the boss's real test.** A sigil generator that produces one picture is
a drawing. One that produces a different picture when someone else answers the questions
differently is a *generator*, which is what §4 asked for.

---

## 5. Invasions

Spec §5.4 queues these automatically once the engine exists. It does not exist yet, so
you run them by hand: three questions at the start of each session, out loud, no
computer, nothing looked up. Two minutes.

**The ladder is 1, 3, 7, 16, 35 days.** A concept sits on a rung, and the rung says how
long it may go untouched before it comes back. Repel it — they answer cleanly — and it
climbs one rung, so it stays away longer. Miss it and it steps back **exactly one rung,
never to the beginning.** That last clause is the entire design: resetting a well-known
concept to day one punishes one bad evening by flooding the next three sessions with
material they already had.

You will not track nineteen concepts on paper and you do not have to. The drills below
already spread the ladder across the ten sessions: the Area 1 concepts arrive on the
short rungs and repeat often, and Area 0's nine sit at 16 and 35 days, coming round less
and worth more when they do. Running the list as written is close enough to correct, and
correct enough to work.

**Do not let `reading-errors` slide.** Session 6 depends on it, and Area 1 gives far
fewer chances to practice it by accident than Area 0 did.

### The drills

Three per session. **Retrieval, not recognition** — "what does `range(4)` give you?" is
retrieval; "does `range(4)` give you four numbers?" is a coin flip they can win by
guessing.

**Session 1** (Area 0 only — nothing of Area 1 exists yet)

1. What kind of thing does `input` always hand back?
2. Which line of a traceback do you read first?
3. What did `0.1 + 0.2` print, and why was that not a bug?

**Session 2**

1. `range(4)` — say every number it gives you, in order.
2. What does the colon at the end of a `for` line do?
3. Why give something a name instead of typing the number?

**Session 3**

1. `range(2, 6)` — every number, in order.
2. You want ten sides. What is the turn? How did you work it out?
3. What error do you get from `range(2.5)`, and what does the message say?

**Session 4**

1. What has to happen inside a `while` loop for it ever to stop?
2. `10 >= 10` and `10 > 10` — say both answers.
3. `print("5" + "5")` — what comes out?

**Session 5**

1. What is the difference between `=` and `==`?
2. When does the `else` part run, and when does it not?
3. What kind of thing does a comparison hand back? Name both possible values.

**Session 6**

1. `and`, `or`, `not` — give me a rule that needs all three.
2. In an `elif` ladder, how many branches run?
3. What is an f-string for?

**Session 7**

1. Name a bug that produces no error message at all.
2. What is the first question to ask a loop that did the wrong number of things?
3. What was wrong with `b6`?

**Session 8**

1. Outer loop three times, inner loop four times — how many times does the inner body run?
2. Where does the counter in a `for` line come from, and when does it get created?
3. Say an `if` out loud that makes every side after the sixth black.

**Session 9**

1. Where does the total go — before the loop, or inside it? Why?
2. What happens if you set it to zero inside the loop instead?
3. `range(10, 0, -1)` — what does it give you?

**Session 10**

1. Give me three things that can go wrong in a loop without any error appearing.
2. What is the turn for a shape with `n` sides?
3. What kind of thing does `input` hand back, and what do you do about it?

### Coverage

Area 0 drilled nine concepts across six sessions and could stay pure prose. This area
carries **nineteen** — its own ten plus Area 0's nine — across ten sessions, so it is
worth proving rather than assuming that none of them quietly fell off the list.

Every one of the nineteen is drilled at least once above:

| Concept | Drilled in |
|---|---|
| `print` | 4 |
| `variables` | 2 |
| `int` | 3 |
| `float` | 1 |
| `str` | 4, 10 |
| `bool` | 5 |
| `input` | 1, 10 |
| `f-strings` | 6 |
| `reading-errors` | 1, 3, 7 |
| `if` | 5, 8 |
| `elif` | 6 |
| `else` | 5 |
| `comparison-operators` | 4, 5 |
| `boolean-operators` | 6 |
| `while` | 4 |
| `for` | 2, 8 |
| `range` | 2, 3, 9 |
| `nesting` | 8 |
| `accumulator-pattern` | 9, 9 |

**The three drilled most are `range`, `reading-errors` and `input`, and that is
deliberate.** `range` because every off-by-one in the area comes back to which end is
included. `reading-errors` because session 6 leans on it and this area otherwise starves
it — Area 0's failures announced themselves and Area 1's mostly do not. `input` because
it is the one Area 0 concept Boss 1 hard-requires, and it goes untouched from session 2
to session 10 if nobody schedules it.

`accumulator-pattern` appears twice in one session rather than across two, because it
arrives in session 8 and the boss is session 10; there is not room for it to climb the
ladder, so it gets drilled hard on the way past.

**Say out loud, at least twice this area, that the repetition is deliberate.** They
should know retrieval is a mechanism and not a quiz, and that the questions coming back is the
system working rather than you forgetting.

---

## 6. Scoring the Journal

Unchanged: ten XP per entry, paid for **substance rather than existence** (§5.6). Area 0's
rubric still applies and `../area-0/dm-guide.md` §6 still holds it. Two Area 1 notes.

**The fourth prompt is now load-bearing.** §5.6: *a forecast nobody checks is a wish.*
Entries 07 onward are read back at the start of the following session, out loud, before
anything else happens. Two sentences: what they predicted, and what actually happened.
When they are right — and in this area they will be, about loops that do not stop — say
so clearly. Being right about your own future failures is a real skill and almost nobody
tells a child they have it.

**"What broke" gets harder to answer honestly this area, and that is worth naming.** In
Area 0 things crashed and the answer was in the terminal. Here, half of what breaks
produces a wrong picture and no message. If they write "nothing broke" after a session
where a shape did not close, one push:

> "The hexagon had five sides for a while. What did the computer say about that?"

Nothing. It said nothing. That is the entry.

| Prompt | Pays nothing | Pays |
|---|---|---|
| What I built | "a spiral" | "a spiral of 20 lines, each 5 longer than the last, and it printed the total ink at the end — 1150" |
| What broke | "nothing" | "my hexagon had five sides and there was no error, I had to print the count to see it" |
| What I'd do differently | "nothing" | "work out the turn from the number of sides instead of typing 60, so changing one number changes the shape" |
| What will break next time | "dunno" | "the loop inside a loop — I still don't know which lines belong to which" |

---

## 7. If a session goes badly

Area 0's §7 holds. One addition for this area.

**If they are fed up in sessions 3, 6 or 8**, the recovery is the same and it is a
picture. Stop the exercise, open `s1e3_the_polygon_engine.py`, and let them change the
number at the top four or five times. It takes three minutes, it produces five different shapes,
and it ends the evening on something that works.

That file exists partly for this. Do not tell them that.

---

## 8. What you are actually being graded on

Not whether they finish ten sessions. Not whether the mandala is beautiful.

By the end of Area 1 they should be able to look at a program that ran, produced no
error, and did the wrong thing — and **find out how many times the loop went round**,
without you in the room and without waiting for red text to tell them where to look.

That is the skill. Everything else in this area — the spirals, the mandalas, the sigil —
is a vehicle for it. Area 0 taught them that failure has a name and a line number. Area 1
teaches them that most failure has neither, and that they can still find it.
