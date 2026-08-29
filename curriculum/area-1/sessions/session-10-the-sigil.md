# Session 10 — BOSS 1: The Sigil

**Concepts:** all nineteen — Area 0's nine and Area 1's ten
**Files:** `exercises/session-10/`
**Journal:** entry 16

**No scaffolding. No hints. A blank file, a specification, and one session** (§5.3).

Spec §4 names this one: *an art generator that takes input and produces something worth
hanging on a wall.* That is the payoff Area 0's six sessions and Area 1's nine were
buying.

---

## Before anything else — the reread (5 minutes)

§5.6 puts this here on purpose. He rereads his Journal **from the start of the area** —
entries 07 through 15 — before the fight.

Give him something to look for rather than leaving it as homework:

> "Read your own *what broke* answers. Not for the code — for the pattern. The same thing
> got you three times this area. Find it before it gets you a fourth time tonight."

There is usually exactly one such thing and he will find it.

Then the half he cannot see on his own:

> "Now read entry 07 again. Six weeks ago. Notice how easy it is."

That feeling — reading his own writing from six weeks ago and finding it obvious — is the
best evidence he will ever get that he is getting better at this, and nothing else in the
design can manufacture it.

---

## Beat 1 — Invasion (3 minutes)

1. Give me three things that can go wrong in a loop without any error appearing.
2. What is the turn for a shape with `n` sides?
3. What kind of thing does `input` hand back, and what do you do about it?

**Say out loud that question 3 was also question 1 of session 1.** He should know the
repetition is a mechanism and not you forgetting.

---

## Beat 2 — The brief (5 minutes)

Hand him `sigil-brief.md`. He reads it himself. You read the three framings out loud and
then stop talking — **the choice is his and §5.2 makes it his on purpose.**

| Framing | What it asks |
|---|---|
| **A — The Family Crest** | Who it is for, and what they are like |
| **B — The Spell Circle** | What the spell does, and how powerful |
| **C — The Star Chart** | A name and a number, and it draws that constellation |

The specification is the same underneath all three. Do not help him choose.

---

## Beat 3 — The fight (35 minutes)

He builds. You sit beside him and do not touch the keyboard.

**Socratic only.** He may be asked questions. He may not be told answers. If he is stuck,
`dm-guide.md` §3 has the ladder, and the three Area 1 questions cover most of it:

- "How many times does that run?"
- "What has to change for that to become false?"
- "Which loop is that line in?"

### The eight requirements, so you can check without reading over his shoulder

Two questions with `input`, at least one made into a number · the answers change the
picture · a loop inside a loop · an accumulator · an `if` that changes the drawing · one
bad answer refused politely · one printed number the program worked out · it finishes on
its own.

### What is different about this boss

**He can now refuse bad input**, and that is new. Every previous crash on a silly answer
went into the Journal as a thing he could not fix. Tonight the answer to *"what would you
want to happen?"* is **"and you can do that now."** Say it exactly like that when the
moment arrives.

---

## Beat 4 — The sign-off (10 minutes)

`peer-signoff` (§6.3). The other player runs it and presses the button, and all three
parts of that are the fight:

1. **They run it, on their machine, from the file, cold.** Not his, not with the window
   already open, not with him leaning over.
2. **They answer differently from the way he has been answering all evening**, including
   at least one answer designed to be awkward.
3. **They ask him to explain one line. Any line.** He wrote it, so he can say what it does.

**If it crashes on your machine, that is the best available outcome, not a failure.** It
is the real thing, it is what Boss 2 is entirely about, and it goes in the Journal as a
scar worth exactly as much as a pass (§5.3).

**Unlimited attempts.** A boss beaten on the fourth go is worth as much as one beaten on
the first, and the record of the three failures is the more interesting half.

---

## Beat 5 — Journal (5 minutes)

Entry 16. Scars included, especially scars. The forecast prompt now points into Area 2a,
which is git — worth saying that out loud, because his answer will be about code and the
next area is about something else entirely.

---

## Where he will stall

`dm-guide.md` §4. The one that matters most, and it is not a stall:

**He declares it finished in twenty minutes.** Possible, and probably true.

> **"Show me. Now change one number at the top and show me again."**

A sigil that produces one picture is a drawing. One that produces a different picture when
somebody else answers the questions differently is a generator, and a generator is what
§4 asked for.

## Success condition

Somebody who is not him answers the questions, gets a picture nobody has seen before, and
wants it.

That is the bar, it is not a test, and it is the reason this boss is signed off by a person.

---

## What comes next

Area 2a — The Scribe's Rite, week 6. Git.

His Area 0 and Area 1 Journal entries — sixteen of them — become the first real commit in
his repository, which is a considerably better first commit than an empty README, and is
the reason the Journal started as a plain folder in week 1 rather than waiting for the
tooling.
