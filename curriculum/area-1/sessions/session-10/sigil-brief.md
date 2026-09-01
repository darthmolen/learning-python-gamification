# BOSS 1 — The Sigil

**No scaffolding. No hints. A blank file, this specification, and one session.**

Spec §5.3, and it holds for every boss for the rest of the year: nobody gives you the
answer. You may be asked questions. You may not be told.

Pick **one** of the three framings below. They differ in the words and in nothing else;
the program underneath is the same, and choosing which words to work in is yours.

---

## What a Sigil is

**An art generator that takes input and produces something worth hanging on a wall.**

Two halves, and both of them are load-bearing.

**A generator, not a drawing.** Somebody else answers the questions and gets a picture
you have never seen. If it makes the same picture every time, it is a drawing, and a
drawing is session 1's work.

**Worth hanging on a wall.** Somebody looks at it and wants it. No test can check that,
which is why this boss is signed off by a person and not by a test.

---

## The three framings

**A — The Family Crest.** It asks who it is for and what they are like, and draws them
a crest. Two people answering differently get different crests.

**B — The Spell Circle.** It asks what the spell does and how powerful it is, and draws
the circle you would chalk on the floor to cast it. A stronger spell gets a busier
circle.

**C — The Star Chart.** It asks for a name and a number and draws that person's
constellation: rings of stars, spokes, an outer boundary.

---

## The specification

The same for all three framings.

1. It asks **at least two questions** with `input`, and at least one answer is turned
   into a number.
2. The answers **change the picture**, not only the words printed. A different answer
   must produce a visibly different drawing.
3. It uses a **loop inside a loop**.
4. It uses an **accumulator** — something totalled, counted or grown across the whole
   drawing.
5. It uses an **`if`** that changes the picture.
6. It **refuses politely** at least one bad answer instead of crashing or drawing
   nonsense. A number too small, too big, or a word you do not offer.
7. It prints at least one number it **worked out**, not one it was told.
8. It finishes on its own. No hang, no Ctrl-C.

## How it is judged

`peer-signoff` (§6.3). The other player runs it and presses the button. Three things
happen and all three are part of the fight:

1. **They run it, on their machine, from the file, cold.** Not yours, not with the
   window already open, not with you leaning over.
2. **They answer the questions differently from the way you have been answering them
   all evening.** Including at least one answer designed to be awkward.
3. **They ask you to explain one line. Any line.** That is the bar: you wrote it, so
   you can say what it does.

## What counts as done

- [ ] It runs from a fresh terminal with `py -3.14 <yourfile>.py`
- [ ] Two different sets of answers produce two different pictures
- [ ] One bad answer is refused politely and the program keeps its dignity
- [ ] You can point at any line and say what it does
- [ ] Somebody who is not you looks at the picture and says it is good

## Scars

Unlimited attempts. Every failed one is recorded and shown, with pride (§5.3). A boss
beaten on the fourth go is worth exactly as much as one beaten on the first, and the
record of the three failures is the more interesting half.

## Before you start

Reread your Journal, from entry 07 to now. All ten. §5.6 puts that here on purpose: the
things you wrote down as *what will break next time* are, quite often, the things about
to break tonight.

You will also notice that entry 07 is easy to read now. That feeling is the point of the
whole Journal and it is the best evidence you are going to get that everything since
did something.
