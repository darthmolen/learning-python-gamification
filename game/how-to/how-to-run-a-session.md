# How to run a session

This page is for whoever holds the DM seat, and it is the half that does not change from area to
area. Each area's `dm-guide.md` carries what is different about *that* area — its stalls, its
setup, its invasion questions. This is the shape underneath all of them.

Read it once. Come back to *The ladder* mid-session, on your phone, while they stare at a
traceback.

## You are not a teacher delivering a lesson

You are the other player, one area ahead, who is not allowed to say the answer.

That constraint is the whole design. The spec puts it as *answers are never given, Socratic
questions only* — and this page exists because "ask a Socratic question" is not usable advice at
seven o'clock on a Tuesday when they are frustrated and you are tired.

## The shape of an evening

Forty-five to sixty minutes. The same five beats every time, so that the shape itself stops
costing attention after the first week.

| Beat | Minutes | What happens |
|---|---|---|
| **Invasion** | 3–5 | Three questions on old material. Out loud, no computer |
| **Forecast** | 1 | Read back their last journal answer to *what will break next time*. Then say what actually happened |
| **The hook** | 5–10 | You show one thing. Short. They have the keyboard by minute ten |
| **The work** | 25–30 | They type. You sit beside them and do not touch the keyboard |
| **The choice** | included | They pick which extension to chase. Every practice has a choice board |
| **Journal** | 5 | Four prompts, in their own words. The fourth is a forecast, and you read it back next time |

**One practice per evening, and let it run to two when it needs to.** A practice is an amount of
work, not a length of time. A learner who takes two evenings over Practice 3 is not behind — that
is why it is not called Session 3.

## Three rules that do the heavy lifting

**The keyboard rule.** You do not touch it. Not to "just show you quickly", not to fix a typo,
not while they are out of the room. If you take the keyboard you have taken the session. Point at
the screen with a finger, or better, with a question.

**The 90-second rule.** When they are stuck, silence is the intervention. Count to ninety in your
head before you say anything at all. It will feel much longer than it is. Most stalls resolve
inside it, and a stall they resolved themselves is worth more than four you resolved for them.

**Stop on time.** Ending at fifty-five minutes with them wanting one more thing is a better
outcome than ending at eighty with them done. The next evening then starts itself.

## The ladder

You will know the answer within two seconds of them getting stuck. That is the problem. Your job
is to convert the answer into a question that hands them back the search.

Go down one rung at a time, waiting between rungs. **Do not start at rung 3 because you are in a
hurry** — starting at rung 3 is a hint wearing a question mark.

**Rung 1 — orientation.** Costs them nothing, tells you a lot.

- "What did you expect that to do?"
- "Talk me through it. What happens first?"
- "Which part of that are you sure about?"

**Rung 2 — narrowing.** Turns "it's broken" into a line number.

- "Which is the first line where it stopped doing what you expected?"
- "Show me the last version that worked. What changed between them?"
- "Is the problem in what you told it, or in what you thought you told it?"

**Rung 3 — instrument.** Hands them a tool rather than a fact.

- "What could you print, right now, that would tell you whether that is true?"
- "You are guessing what that value is. How could you stop guessing?"
- "Can you make it smaller? Delete everything that isn't the broken part."

**Rung 4 — the smallest legal shove.** Only after the first three, only after real struggle, and
phrased as territory rather than as an answer.

- "The problem is on line 14. I'm not saying what it is."
- "It's in how the number gets into the function, not in the drawing."
- "One of those two lines is fine. The other one isn't."

You have named *where*. You have not named *what*. That is the line, and it holds because they
still have to do the finding.

## Sentences you may not say

| Do not say | Say instead |
|---|---|
| "You need to convert it with int()." | "What kind of thing did that hand back? How could you check?" |
| "You forgot the f." | "Read me that line out loud, exactly as it is written." |
| "It's turtle dot forward, not turtel." | "Read the last line of the error out loud. All of it." |
| "Just do it like this." | "Show me what you tried." |
| "No, that's wrong." | "Run it. Let's see what it does." |
| "Here, let me." | *(nothing — count to ninety)* |

**"Run it and see" is the most useful sentence in this guide.** It is not a dodge. It is what
actually happens in the job, and it moves authority from you to the machine — which is where it
belongs, and where it will still be when you are not in the room.

## When they are right and you are wrong

It will happen, and how you take it the first time decides whether they ever argue with you
again. Say so plainly, say they were right, and carry on. A learner who has watched an adult be
wrong out loud and survive it has learned something no exercise teaches.

## Where the game fits, and where it does not

The game keeps score on part of the work. It does not keep score on the evening.

**What the software does without you:** runs hidden tests, clones a pushed repository and runs
its specification, reads a git log for commits and journal entries, prices XP from a DC, and
schedules the next invasion. None of that needs a person, and none of it happens faster because
you are in the room.

**What it cannot do at all:** the five beats above. Roughly a fifth of the authored practices
carry no exercise, no brief and no test, because the work in them is a conversation. Those are
not lesser practices and they are not optional.

**The one place the game waits for you** is a sign-off. Bosses use it, and so does every
Teach-back medal. Somebody other than the submitter has to press the button, which is why the
learner can sign off *your* work and can tell you the explanation was not good enough.

The queue is household-wide and deliberately unfiltered: your own pending teach-back appears on
the same screen, which is the screen's whole job. Refusing a sign-off is a normal move — the
attempt stays recorded as not passed, which is honest rather than harsh.

**You do not have to be in the room to grant one.** The attempt waits. If they finish a boss on a
Wednesday and you get to it on Thursday, nothing is lost and nothing expired.

## Invasions, in three minutes with no computer

Every concept sits on a rung: **1, 3, 7, 16, 35 days**. Repel one and it climbs a rung, so it
stays away longer. Miss one and it steps back **exactly one rung, never to the beginning**.

That last clause is the whole design. Resetting a well-known concept to day one punishes a single
bad evening and then floods the next several sessions with material they already had — which is
the flaw the mechanic exists to prevent, reintroduced by its own scoring.

Three to five per evening, out loud, before anything is switched on. Each area's guide carries
its own questions.

## If a session goes badly

**Cut the hook, never the work.** The hook is yours and the work is theirs, and an evening where
they typed for twenty minutes and you demonstrated nothing is a better evening than the reverse.

If the machine fights you — a network problem, an install that will not take — stop trying to
teach and just fix it, and say out loud that you are doing so. *"This is my problem, not yours,
give me five minutes."* The alternative is a learner who thinks the evening was their fault.

If it cannot be fixed, run something that needs nothing. Areas 0 and 1 need a terminal and Python
and that is all, by design. **Do not cancel an evening over infrastructure.**

## What you are actually being graded on

Not whether they finished the practice.

Whether they typed more than you did. Whether the wrong answer they wrote down got taken as
seriously as the right one. Whether they asked a question you had not planned for. And whether,
at the end, they wanted one more thing.
