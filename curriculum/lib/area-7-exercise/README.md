# The Missing Line — the Area 7 performance lesson

**Status: stub, awaiting placement.** This is authored and runnable, but it has not been
placed in an Area 7 session yet. `planning/backlog/feature_area-7-craft_2026-08-28.md` owns
that. Nothing here should be treated as final wording; the numbers and the mechanism are what
it is handing over.

> **Concepts:** `performance-intuition`, `reading-unfamiliar-code` · **DC 10**
>
> The DC is for the work, not the idea. Deleting a line and running a command twice is easy.
> Understanding why the number moved is the whole of Area 7.

## Why this exists rather than a paragraph about draw calls

It is the only place in the campaign where **a one-line deletion produces a hundredfold
difference you can watch happen.** Nobody acquires performance intuition by being told that
draw calls are expensive. You acquire it by predicting a number, being wrong, and then being
able to explain why.

It also pays off a debt. `world.py` has been fusing his world into one mesh since Area 3,
silently, in a line he could read but had no reason to care about. This is where that line
stops being scenery.

## The shape of it

**First he forecasts.** Spec §5.4's fourth Journal prompt asks for a prediction that gets
read back afterwards, and this is an unusually good subject for it: the honest guess is
"a bit slower", and the honest guess is wrong by two orders of magnitude.

1. Run it as it stands, and write down the fps.

   ```
   py -3.14 curriculum/lib/area-7-exercise/measure.py
   ```

   `the_missing_line.py` is three nested `range(20)` loops — 8,000 blocks. Deliberately
   nothing beyond Area 3 vocabulary: this is the program he could have written in week 10,
   the first time he turned a loop bound up to see how big he could go.

2. **Write down what he thinks will happen** if the world is *not* fused. A number, in the
   Journal, before he runs anything.

3. Open `world.py`, find `ground.combine()` in `start()`, and delete that one line.

4. Run `measure.py` again.

5. Put the line back. `git diff` should be empty.

## The two numbers

Measured on the **DM's machine**, 2026-08-29, ursina 8.3.0, Python 3.14.6, RTX 5090,
vsync off, 1280×720, 120 frames after 30 warm-up frames:

| `ground.combine()` | Build | FPS | Frame time |
|---|---|---|---|
| present | 3.26 s | **1,263.3** | 0.79 ms |
| deleted | 1.32 s | **6.9** | 145.69 ms |

**183× faster to draw, for two extra seconds of startup, from one line.**

The second row of that table is worth as much as the first. **Deleting the fast line made
startup faster.** Fusing 8,000 blocks costs about two seconds up front, once — and then buys
back a hundred and forty-five milliseconds on every single frame, forever. That is the actual
shape of most performance work, and it is a better thing to learn than "combining is good".

### Read these numbers with the machine attached to them

They are from an RTX 5090. **The figures for the target machine (a 2017 mobile workstation) have not been measured
yet** — Phase 3 of `planning/in-progress/feature_world-shim_2026-08-28.md` is that
measurement and it is waiting on the laptop. Both numbers will be smaller on the learner's machine and
the ratio may not survive intact. When it is run, the table above gets a second half rather
than a correction: the DM machine's row stays, because *the same program on two machines* is
itself part of the lesson.

For context, the spike recorded **14.9 fps** for the same 8,000-block world written against
raw Ursina, and **1,424 fps** through the shim (`spikes/ursina-tier3/README.md`, Phase 5).
The 6.9 above is *not* that 14.9 and should not be quoted as it: raw Ursina builds 8,017
entities flat, while the shim with `combine()` deleted builds 8,000 entities parented to one
ground node, which is slower. Three different programs, three numbers, all real.

## What he should be able to say afterwards

Not "combining is faster". That is the observation, not the lesson. The lesson is the
sentence underneath it:

> **The computer was never drawing blocks. It was doing 8,000 separate pieces of paperwork
> per frame, and the blocks were incidental.** Fusing them does not make drawing faster; it
> makes there be one thing to draw instead of eight thousand.

Follow-up question worth asking, and worth not answering: *what would happen at 800 blocks
instead of 8,000?* Change `SIDE = 20` to `SIDE = 10` and find out. The point is that the
answer is not "ten times better".

## Handing over

What the Area 7 plan needs to decide, which this stub does not:

- Which session it lands in, and whether it is a quest or an exercise
- Whether the forecast is a Journal prompt or part of the quest brief
- Whether the DC 10 survives once it is a graded quest — it may want the **Teach-back**
  modifier, because the lesson is entirely in the explanation
- Whether the header tags in `the_missing_line.py` match Area 7's `verify.py`, which does
  not exist yet
