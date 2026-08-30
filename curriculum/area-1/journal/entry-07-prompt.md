# Journal — entry 07, and the beat that is new

Read the first section out loud at the end of session 1. Thirty seconds. It never needs
reading again. The rest of this file is for you.

---

## What to say

> "Same Journal, same ten XP, one change.
>
> From tonight, the last question — what will break next time — gets read out at the
> start of the next session. Out loud, before we touch anything. So write something you
> actually think is going to happen, not something that sounds good.
>
> If you call it right, I will say so."

That is all. Do not oversell it and do not explain the mechanism. Then leave them alone
to write it, exactly as in Area 0: no hovering, no suggesting, no reading over a
shoulder.

---

## What stays the same

Everything else. One entry per session, four prompts, ten XP paid for **substance rather
than existence** (§5.6), your reply written underneath the same evening. The template is
`TEMPLATE.md`, copied to `entries/session-07.md` and so on, and the scoring rubric is
`../../area-0/dm-guide.md` §6.

**The numbering continues rather than restarting.** There is one Journal, it runs for the
whole year, and session 07 is session 07.

**Still plain markdown, still not in git.** That arrives at Area 2a on schedule, week 6.
Area 0's six entries plus these ten become the first real commit in their repository,
which is a considerably better first commit than an empty README.

---

## The forecast beat, in detail

Area 0's fourth prompt was written and then filed. From entry 07 it is read back, as its
own one-minute beat at the top of the next session, before the hook and before anybody
touches the keyboard.

§5.6 is blunt about why: *a forecast nobody checks is a wish.*

Two sentences is the whole beat.

> "Last time you wrote that the loop-inside-a-loop indentation would get you. Here is
> what actually happened tonight: it did. Twice, in the first ten minutes."

Then move on. Do not turn it into a lesson.

**When they are right, say so clearly.** In this area they will be right often, because
the failures repeat — the hang, the off-by-one, the reset accumulator. Being able to predict
your own mistakes is a real professional skill and almost nobody ever tells a child they
have it.

**When they are wrong, that is also worth a sentence.** *"You thought `while` would be the
hard part and it was fine. What was actually hard?"* That question is usually worth more
than the forecast was.

---

## What each entry is likely to be about

Not a script. A list of what would be a shame to lose, for the evening when they ask
"what do I even write?"

| Entry | Session | Worth capturing |
|---|---|---|
| 07 | 1 — The Loop That Draws | The number of lines the loop deleted. They counted them in Area 0 |
| 08 | 2 — Any Shape You Like | Their score out of five on the `range` predictions |
| 09 | 3 — The Loop That Does Not Stop | What a hang felt like, and what Ctrl-C did |
| 10 | 4 — Two Roads | The first program of theirs that does different things on different runs |
| 11 | 5 — And, Or, Not | The Area 0 crash they finally fixed, and the one they still cannot |
| 12 | 6 — The Broken Loop | Which of the six was hardest, and whether Dad got one wrong |
| 13 | 7 — A Loop Inside A Loop | Whether they predicted 12 or 7, honestly |
| 14 | 8 — Carrying A Number | The number the program worked out that they never typed |
| 15 | 9 — The Mandala | What they ran out of time to build. This becomes the boss plan |
| 16 | 10 — The Sigil | The boss. Scars included, especially scars |

**Push hardest on entry 15.** A rehearsal's *what I would do differently* is next week's
boss plan, written a week early by the person who has to carry it out.

---

## Before the boss

§5.6: they reread the Journal **from the start of the area** before every boss fight. That
is entries 07 through 15, at the top of session 10, and it takes about five minutes.

This is the moment the mechanic earns its keep, so tell them what to look for rather than
leaving it as homework:

> "Read your own *what broke* answers. Not for the code — for the pattern. The same thing
> got you three times this area. Find it before it gets you a fourth time tonight."

There is usually exactly one such thing and they will find it: reset accumulators, or
indentation, or an off-by-one at a boundary.

**Then say the other half**, because it is the part they cannot see on their own:

> "Now read entry 07 again. Six weeks ago. Notice how easy it is."

That feeling — reading your own writing from six weeks ago and finding it obvious — is
the best evidence they will ever get that they are getting better at this. No score, no
badge, and no adult telling them so can produce it.

---

## Scoring, with Area 1 examples

Ten XP, paid for substance. Empty prompts pay nothing and they were told so in week one.

| Prompt | Pays nothing | Pays |
|---|---|---|
| What I built | "a spiral" | "a spiral of 20 lines, each 5 longer than the last, printed 1150 ink at the end" |
| What broke | "nothing" | "my hexagon had five sides and there was no error — I had to print the count to see it" |
| What I'd do differently | "nothing" | "work the turn out from the number of sides instead of typing 60" |
| What will break next time | "dunno" | "the loop inside a loop — I still can't tell which lines belong to which" |

**"What broke: nothing" is harder to challenge this area and more often false**, because
half of what goes wrong in a loop produces no message. The honest push, once:

> "The hexagon had five sides for a while. What did the computer say about that?"

Nothing. It said nothing. That is the entry.

Push once, gently, then let it go. Pushing twice turns the Journal into homework and it
will die.

---

## Your reply

Same evening, under the line, in the same file. Non-negotiable — a Journal nobody answers
becomes a diary, and a diary becomes an unfilled form.

Reply to the **content**. Ask one real question about something they wrote. Tell them
something true about your own week that connects to it; this area, "I wrote a loop that
did not stop today" is almost always available and almost always true.

From Area 2a this becomes a comment on a commit in Gitea, and from there it is code
review. Never correct their spelling.
