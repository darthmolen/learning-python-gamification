# Area 0 — DM Guide

**Who this is for.** Whoever holds the DM seat. In Kitchen Table mode (spec §5.11)
that is a parent, who is also a player — but the two roles want different things
from you, and this guide is written for the DM one. Where it says *parent* rather
than *DM*, it means the relationship rather than the seat, and the difference is
deliberate: §2.4 counts a parent in the room as the design's single largest
advantage, and no teacher standing in later gets that for free.

You are not a teacher delivering a lesson. You are the other player, one area ahead,
who is not allowed to say the answer. That constraint is the entire design. Spec §3
principle 6 says *answers are never given, Socratic questions only*, and this guide
exists because "ask a Socratic question" is not usable advice at seven o'clock on a
Tuesday when they are frustrated and you are tired.

Read this once before session 1. Come back to §4 mid-session, on your phone, while they
are staring at a traceback.

---

## 1. The shape of a session

45 to 60 minutes. The same five beats every time, so the shape itself stops costing
attention after week one.

| Beat | Minutes | What happens |
|---|---|---|
| **Invasion** | 3–5 | Three questions from last time. Out loud, no computer. |
| **The hook** | 5–10 | You show one thing. Short. They have the keyboard by minute ten. |
| **The work** | 25–30 | They type. You sit beside them and do not touch the keyboard. |
| **The choice** | included above | They pick which extension to chase. Every session has a choice board. |
| **Journal** | 5 | Four prompts, in their own words. The fourth is a forecast, and you read it back to them next session. |

**The keyboard rule.** You do not touch it. Not to "just show you quickly", not to fix
a typo, not while they are out of the room. If you take the keyboard you have taken the
session. Point at the screen with a finger, or better, with a question.

**The 90-second rule.** When they are stuck, silence is the intervention. Count to ninety
in your head before you say anything at all. It will feel much longer than it is. Most
stalls resolve inside it, and a stall they resolved themselves is worth more than four
you resolved for them.

**Stop on time.** Ending at 55 minutes with them wanting one more thing is a better
outcome than ending at 80 with them done. The next session then starts itself.

---

## 2. Setup, once

On the learner's machine:

```
py -3.14 --version
```

It should say 3.14.something. If `python` and `py -3.14` disagree, use `py -3.14`
everywhere, including in everything you say out loud, so they learn one command.

Copy `exercises/` somewhere they own — `Documents/code/` or similar. They need a folder
that is theirs. Area 2a turns that folder into a git repository; until then it is just a
folder, and that is fine.

Open a terminal in that folder. Any editor will do. Notepad genuinely works for Area 0.
VS Code is Area 2b vocabulary and installing it now costs a session for no gain.

### Three things that will go wrong on day one

**The turtle window opens behind the terminal.** It is not broken and they did not do
anything wrong. Alt-Tab. Mention this before it happens, once, so that the first time
it happens it is a known thing rather than a failure.

**The window stops responding after the drawing finishes.** `turtle.done()` hands
control to the window and it waits there. Closing the window with the X ends the
program. That is normal and correct.

**The window vanishes instantly.** They deleted or never reached `turtle.done()`, or the
program crashed before it. If it crashed there is red text in the terminal, which is
session 3 arriving early. Read it with them.

---

## 3. How to hold principle 6

You will know the answer within two seconds of them getting stuck. That is the problem.
Your job is to convert the answer into a question that hands them back the search.

### The ladder

Go down it one rung at a time, waiting between rungs. Do not start at rung 3 because
you are in a hurry. Starting at rung 3 is a hint wearing a question mark.

**Rung 1 — orientation.** Costs them nothing, tells you a lot.

- "What did you expect that to do?"
- "Talk me through it. What happens first?"
- "Which part of that are you sure about?"

**Rung 2 — narrowing.** Turns "it's broken" into a line number.

- "Which is the first line where it stopped doing what you expected?"
- "Show me the last version that worked. What changed between them?"
- "Is the problem in what you told it, or in what you thought you told it?"

**Rung 3 — instrument.** Hands them a tool rather than a fact. In Area 0 the answer to
this is almost always `print`, which is exactly why `print` is the first thing in the
area.

- "What could you print, right now, that would tell you whether that is true?"
- "You are guessing what that value is. How could you stop guessing?"
- "Can you make it smaller? Delete everything that isn't the broken part."

**Rung 4 — the smallest legal shove.** Only after the first three, only after real
struggle, and phrased as territory rather than as an answer:

- "The problem is on line 14. I'm not saying what it is."
- "It's in how the number gets into the function, not in the drawing."
- "One of those two lines is fine. The other one isn't."

You have named where. You have not named what. That is the line, and it holds because
they still have to do the finding.

### Sentences you may not say, and their replacements

| Do not say | Say instead |
|---|---|
| "You need to convert it with int()." | "What kind of thing did input hand back? How could you check?" |
| "You forgot the f." | "Read me that line out loud, exactly as it is written." |
| "It's turtle dot forward, not turtel." | "Read the last line of the error out loud. All of it." |
| "Just do it like this." | "Show me what you tried." |
| "No, that's wrong." | "Run it. Let's see what it does." |
| "Here, let me." | *(nothing — count to ninety)* |

"Run it and see" is the most useful sentence in this guide. It is not a dodge. It is
what actually happens in the job, and it moves authority from you to the machine, which
is where it belongs and where it will still be when you are not in the room.

### When it is genuinely too hard

Struggle teaches; suffering does not, and the difference is whether they are still
generating ideas. When they have stopped generating ideas, the design has a named move
for it. Spec §5.5: **Datamine.** After two real attempts and one written sentence about what
they tried, they may see the answer. It is a legal move with a name and a cost, not a
failure and not cheating.

Area 0 has no app to press the button in, so you are the button:

> "Alright. That's two goes. Tell me in one sentence what you tried, write it in the
> Journal, and I'll show you. It costs you difficulty, not honor."

Then show them properly — the whole thing, no drip-feed — and ask them to explain it
back.
Come back to that concept in the next session's invasion. Deliberately. That is the point
of the cost.

### They are right and you are wrong

It will happen inside three sessions. Say so, out loud, clearly, immediately. Spec §5.8
identifies you being visibly stuck and visibly wrong as the highest-value mechanic in
the whole design: *a child who has never seen a competent adult get stuck concludes
that being stuck means being stupid.*

Session 3 has an exercise where they plant bugs for you to find. **Actually get one
wrong.** Not theatrically. Really try, in front of them, really fail, and then really
find it. Twenty years of professional experience is worth nothing to them as a claim and
everything as a demonstration.

---

## 4. Stalls, by session

Written in the order you will hit them. Each is a real prediction, not a completeness
exercise.

### Session 1 — First Light

| Stall | What is actually wrong | What to ask |
|---|---|---|
| Types `forward(100)`, gets NameError | The module name is part of the order | "Read the error. What word did it not recognize? Where does that word come from?" |
| Types shell commands at the Python prompt, or Python at the shell | Two prompts, two languages, both black rectangles | "Which prompt are you at? What does that one speak?" |
| The drawing runs off the edge | The window is about 950 by 700 and they started in the middle | "How big is the window? Where did the turtle start? Where would it be now?" |
| "Did it work?" on a blank-looking window | They drew in white, drew a zero-length line, or the window is behind | "What did you order it to do? What would that look like if it worked perfectly?" |
| Wants to draw a circle immediately | Nothing is wrong. This is good | "Try it. `turtle.circle(50)`. What do you think the 50 is?" |

**Let them get wrong:** the direction of `left` and `right`. They will assume `left` and
`right` are from their own point of view rather than the turtle's. Do not pre-empt this.
The confusion is a one-run fix and the moment it lands they own it.

### Session 2 — Names For Things

| Stall | What is actually wrong | What to ask |
|---|---|---|
| `side = side + 20` reads as false | They are reading it as maths. It is an order | "Is that a claim about the world, or an instruction? What happens first, the left or the right?" |
| Renames a variable in three places out of five | Nothing conceptual. Just editing | "Run it. What did it say? What is it telling you that name means?" |
| Uses `side` inside quotes and gets the literal word | The difference between a name and text | "Print both. `print(side)` and `print(\"side\")`. What's the difference, and why?" |
| Wants one name to update itself when another changes | They have invented spreadsheets, and Python does not work that way | "When does that line get worked out — once, or every time? How could you find out?" |
| Names everything `a`, `b`, `c` | Speed, and it is about to cost them | "In two weeks, opening this file cold — will you know what `b` was?" |

**Let them get wrong:** the last one. Let them ship a file full of `a` and `b`, then
open it at the start of session 4 and ask them what `b` was. They will not know. That is worth
more than any amount of being told.

### Session 3 — The Broken Sigil

| Stall | What is actually wrong | What to ask |
|---|---|---|
| Starts fixing before reading | The error is noise to them, not information | "Not yet. Read me the last line first. What is it called?" |
| Reads the top of the traceback | The top is the outermost frame; the bottom is the answer | "Read it from the bottom up. Which line is about a file you wrote?" |
| b2's five-frame traceback panics them | Four of those frames are inside Python's own turtle.py | "Which of those files did you write? Start there. The rest is Python explaining itself." |
| b3 looks nothing like the others | It isn't one. Nothing ran, so there are no frames | "b1 got to line 17 before it died. How far did b3 get? Did a window even open?" |
| b7: "there's no error, so it works" | **The most important moment in the area** | "Right. Python is happy. Are *you* happy? Look at the picture. Is that a square?" |

**Let them get wrong:** all of it. This is the one session where being wrong is the
deliverable. Do not rescue anything for the first two minutes of any of the seven.

### Session 4 — Four Kinds Of Thing

| Stall | What is actually wrong | What to ask |
|---|---|---|
| `<class 'int'>` looks like an error | Angle brackets look like trouble | "Is that red? Where does red text appear? So what is this?" |
| `"100" + "100"` giving `100100` feels wrong | Plus is not one operation | "What does + do to two pieces of text? What would 'glue them together' produce?" |
| `100 / 4` giving `25.0` feels wrong | True division always produces a float | "Is 25.0 the same number as 25? Is it the same *kind* of thing? Which of those questions matters here?" |
| `int("12.5")` crashing feels unfair | It genuinely is a little unfair | "Read the error. It says base 10. What did you hand it? Is that a whole number written down?" |
| Bored by types | Reasonable. Types are the least visual thing in Area 0 | Skip ahead to the drawing half. Types land in session 5 under pressure. |

**Let them get wrong:** every prediction on the type lab. The file asks for thirteen
written predictions before running. Do not correct a single one before they run it. A
prediction they wrote down and got wrong is the whole mechanism; a prediction you fixed in
advance taught nobody anything.

### Session 5 — The Machine Asks

| Stall | What is actually wrong | What to ask |
|---|---|---|
| Types quotes at the input prompt | They are thinking in code at a moment that is not code | "What did it store? Print it and look at every character." |
| `forward(answer)` raises TypeError | input always returns str. Always | "You have met this exact error before. Which broken sigil was it? What was wrong there?" |
| Missing the `f`, so the braces print literally | One character | "Read that line out loud, character by character, and compare it to the one above." |
| Puts quotes inside the braces | A reasonable guess about what braces hold | "What's inside the braces — the name, or text? What is Python being asked to work out?" |
| Crashes when they type "big" | Correct behavior, and they cannot fix it yet | "Is that your bug or the user's? What would you *want* to happen? Hold that thought until Area 1." |

**Let them get wrong:** the crash on bad input. They cannot fix it — the fix needs `if`
and `try`, which are Areas 1 and 5. Let it stand as an open wound. Write it into the
Journal under *what I would do differently*. Coming back in week 22 to fix a bug they
logged in week 2 is worth planning for.

### Session 6 — The Commission

| Stall | What is actually wrong | What to ask |
|---|---|---|
| Blank page, no start | Scope. They are holding the finished thing in their head | "What's the very first thing on screen? Just that. Don't design the rest yet." |
| Builds something four times too ambitious | Good instinct, wrong session | "Which one piece of that would you be most annoyed to lose? Build that one." |
| Copies a previous file wholesale | Fine, actually | "Sure. Which lines in it are doing nothing for this? Delete those first." |
| It crashes on your machine at the end | **The best outcome available** | "Excellent. This is the real thing. What is different between our two machines?" |
| Wants to keep going past time | Stop anyway | "Write it down. It'll still be there on Thursday." |

---

## 5. Invasions

Spec §5.4 queues retrieval automatically. The engine does not exist yet, so you do it by
hand: three questions at the start of each session, out loud, no computer, nothing
looked up. Two minutes.

They must be *retrieval*, not recognition. "What does `int` do?" is retrieval. "Does
`int` convert text to a number?" is a yes-or-no they can guess.

**Session 2:** What does `print` do that the drawing doesn't? · The turtle starts facing
which way? · What is `turtle.done()` for?

**Session 3:** What does `side = side + 20` do, in two steps? · Why use a name instead of
the number? · What does `print` show you that the picture can't?

**Session 4:** Name three errors you caused on purpose. · Which line of a traceback do you
read first? · What was wrong with b7?

**Session 5:** Four kinds of thing — name them. · What does `100 / 4` give, and what kind
is it? · What does `"5" + "5"` give?

**Session 6:** What kind of thing does `input` always hand back? · What does the `f` in
front of a string do? · Why did the program crash when you typed "big"?

**Week 3, opening Area 1:** three of the above at random. Say out loud that you are doing
it on purpose and why. They should know retrieval is a mechanism, not a quiz.

---

## 6. Scoring the Journal

Ten XP per entry, and spec §5.6 is explicit that it is **paid for substance rather than
existence**. An entry that says "did turtle, it was fine" pays nothing. Say so once, in
session 1, before the first entry, so a zero is never a surprise.

Substance means specific. One test: could a stranger reading the entry tell which
session it was, without the date?

| Prompt | Pays nothing | Pays |
|---|---|---|
| What I built | "a square" | "a staircase that grows by 20 each step, five steps, from one variable" |
| What broke | "nothing" | "I wrote turtel instead of turtle and got a NameError on line 17" |
| What I'd do differently | "nothing" | "name the variables properly — I had to reread my own file to work out what b was" |

**"What broke: nothing" is almost always false**, and the honest version of it is
*"nothing broke, which surprised me"* or *"the only thing that broke was..."*. Push back
on it once, gently, then let it go. Pushing twice turns the Journal into homework and
it will die.

You reply to each entry. In Area 0 that is a line written underneath, in the file, in
their folder. From Area 2a it becomes a comment in Gitea and turns into code-review
culture, which is why the habit is worth starting before the tooling exists.

Reply to what they wrote, not to how they wrote it. Never correct their spelling.

---

## 7. If a session goes badly

It will, once, in the first six. The usual cause is that the hook ran long and they did
not get the keyboard until minute 25.

- **Cut the hook, never the work.** Short on time means dropping the teaching, not the
  typing.
- **Cut the choice board, never the choice.** One choice is enough. Zero is not.
- **Never cut the Journal.** It takes four minutes and it is the artifact that
  survives the year. Take it out of the work time instead.

If they are genuinely fed up, stop early and end on something that works. Ending on a
working picture, even a small one, beats finishing the plan.

---

## 8. What you are actually being graded on

Not whether they finish six sessions. Not whether the drawings are good.

By the end of Area 0 they should be able to read an error message out loud, say what kind
of error it is, and say which line to look at — without you in the room, and without
flinching. Everything else in this area is a vehicle for that.

The spec's diagnosis of every platform in the field (§2.3) is that they teach syntax and
not building, and the seam they all fail at is the moment the learner leaves the sandbox
and meets a real error on a real machine. They meet one in session 1 and seven more in
session 3, on purpose, at a point where the stakes are a drawing of a square. That is
the plan.
