# The Mandala

**Session 9. This is the whole session.** No new orders, no worked example. You have
everything you need and you have had it since session 8.

This is a rehearsal. Next session is Boss 1 and it is the same shape of work with
nobody helping. Tonight, somebody is helping.

---

## What a mandala is, here

Rings. Each ring is a pattern repeated all the way round a center. The rings do not
have to match; the good ones usually do not.

That is a nested loop and nothing else:

- the **outer** loop makes the rings, or the copies within a ring
- the **inner** loop draws one element
- an **accumulator** makes each ring different from the last
- an **`if` ladder** decides the colors

Every one of those is a file you already have. Open them. Copying from your own
earlier files is not cheating and it is what everybody does.

---

## The requirements

Check each one before you say you are finished.

- [ ] At least **two rings**, and the second is not identical to the first
- [ ] A **loop inside a loop**, and you can say which lines are in which
- [ ] At least one **accumulator** — something that grows, shrinks or counts across
      the whole drawing
- [ ] At least one **`if`** that changes the picture, not just what gets printed
- [ ] **Two dials at the top** of the file. Named. Changing either one changes the
      picture and does not break it
- [ ] At least one printed number that the program **worked out** — total ink, total
      lines, total turn
- [ ] It finishes. It does not hang. It draws in under about ten seconds

## The dial test, which is the real one

Change one dial. Run it. Change it again. Run it again.

**If it still looks deliberate at three different settings, you have built a
generator.** If it only looks right at the numbers you happened to be using while
you wrote it, you have built one picture and got lucky.

Boss 1 is judged on this exact test, so find out tonight rather than on the night.

---

## Ideas, if the blank page is the problem

Not a menu. Starting points. Steal one and ruin it.

- **The compass.** One ring of 12 spokes, one ring of 36 short ticks, one polygon
  round the outside.
- **The bloom.** Twelve copies of the same polygon, each turned 30 degrees from the
  last, each slightly larger than the last.
- **The web.** Rings of dots at increasing radius, with straight spokes crossing them.
- **The tile.** A grid — s7e2 — where the thing in each cell rotates a bit more as
  you go across.
- **The nested star.** A polygon, then a smaller one inside turned halfway, then a
  smaller one inside that, until the sides get below 5 pixels. That last clause is a
  `while` loop and you know why.

## Two pieces of equipment you have earned

`turtle.speed(0)` you have had since session 1.

If the drawing now takes longer than ten seconds, you have earned the next one up:

```python
turtle.tracer(0)      # near the top: stop drawing to the screen as you go
...
turtle.update()       # at the end, just before turtle.done(): show it all at once
```

It draws everything in memory and puts the finished picture up in one go. It is much
faster and you lose the animation, which by now you have watched enough of.

---

## What breaks it

Nothing. There is no failing this session.

If it hangs, that is a session-3 problem and you know the key. If it draws the wrong
thing silently, that is a session-6 problem and you know the tool: make it count, and
print the count.

Write both in the Journal. What broke tonight is your list of what to watch for next
session, and next session is the boss.
