---
audience: learner
---

# Boss 1 — The Sigil

**No scaffolding, no starter, no hints, and Socratic questions only** (§5.3). A blank
file, this specification, and one session.

Spec §4 names this one: **an art generator that takes input and produces something worth
hanging on a wall.**

Pick one of the framings below. They differ in the words and in nothing else; the program
underneath is the same, and choosing which words to work in is yours.

## The framings

- **The Family Crest** — a shield that belongs to somebody, built from what they tell you
  about themselves.
- **The Spell Circle** — a ring of marks whose shape comes from the spell being cast.
- **The Star Chart** — a sky, and where its lines fall depends on where you say you are
  standing.

## The two halves, and both are load-bearing

**A generator, not a drawing.** In Area 0 a sigil was a symbol you drew, and the seven
broken ones you fixed there each drew exactly the same shape every time. That was true then
and it is half the story. Here the word gets sharper: **a Sigil is the machine that makes
them.** Somebody else answers the questions and gets a picture you have never seen. If it
makes the same picture every time, it is a drawing — which is what you built in Area 0 and
in Practice 1, and it is not this.

**Worth hanging on a wall.** Somebody looks at it and wants it. No test can check that,
which is why this boss is signed off by a person.

## The specification

The same under all three framings.

1. It asks **at least two questions** with `input`, and at least one answer becomes a
   number.
2. The answers **change the picture**, not only the words printed.
3. It uses a **loop inside a loop**.
4. It uses an **accumulator** — something totalled, counted or grown across the drawing.
5. It uses an **`if`** that changes the picture.
6. It **refuses politely** at least one bad answer instead of crashing or drawing
   nonsense.
7. It prints at least one number it **worked out**, not one it was told.
8. It finishes on its own. No hang, no Ctrl-C.

## How it is judged

`peer-signoff` (§6.3). The other player runs it and presses the button. Three things
happen and all three are part of the fight:

1. **They run it, on their machine, from the file, cold.** Not yours, not with the window
   already open, not with you leaning over.
2. **They answer differently from the way you have been answering all evening**, including
   at least one answer designed to be awkward.
3. **They ask you to explain one line. Any line.** That is the bar: you wrote it, so you
   can say what it does.

## What counts as done

- [ ] It runs from a fresh terminal
- [ ] Two different sets of answers produce two different pictures
- [ ] One bad answer is refused politely and the program keeps its dignity
- [ ] You can point at any line and say what it does
- [ ] Somebody who is not you looks at it and says it is good

## Scars

Unlimited attempts. Every failed one is recorded and displayed with pride (§5.3). A boss
beaten on the fourth go is worth exactly as much as one beaten on the first, and the
record of the three failures is the more interesting half.

## Before you start

Reread your Journal from the beginning of this area. §5.6 puts that here on purpose: the
things you wrote down as *what will break next time* are, quite often, the things about to
break tonight.
