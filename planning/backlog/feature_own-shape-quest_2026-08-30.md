# A Quest Where He Makes His Own Shape

**Status:** Backlog
**Track:** unassigned — Area 1 or Area 3, see below
**Date Discovered:** 2026-08-30
**Discovered During:** SPA Phase 4, the turtle shim — `planning/**/feature_spa_2026-08-28-v2.md`

## Context

The shim ships `classic`, `turtle` and a hidden `dragon`. The dragon exists because
`register_shape()` is a **real** turtle API rather than a PyQuest invention:

```python
turtle.register_shape("mine", ((0, 16), (-8, -8), (8, -8)))
turtle.shape("mine")
```

Which makes the obvious next move a quest: **he makes his own.**

It is a good quest for reasons that have nothing to do with novelty:

- **The output is his.** Every other Area 0–1 exercise draws something the brief described. This
  one draws something only he has. That is the difference between finishing an exercise and
  making a thing, and §3's whole argument for turtle as the first vehicle is that the first line
  of code draws something.
- **A polygon is a sequence of pairs**, so the data structure is the lesson rather than
  decoration around it.
- **It debugs itself visually.** A wrong coordinate is not a failed assertion, it is a wonky
  wing. He can see which point is wrong and fix that one — which is the tightest feedback loop
  in the whole curriculum.
- **It is body-syntonic in Papert's sense**, the same reason turtle earns its place: he can draw
  the shape on paper, read the coordinates off, and type them in.

## Which area it belongs to

Genuinely open, and the two versions are different quests.

**Area 1 — Control.** Build the shape *with a loop*: an N-pointed star, a polygon with a
parameter. The concepts are `for`, `range` and arithmetic, and the payoff is that changing one
number changes the whole creature. Turtle is already Area 1's vehicle, so nothing new is
introduced.

**Area 3 — Collections.** Build the shape as **data**: a list of tuples, edited, extended,
maybe read from a dict of named shapes. §3 gives Area 3 "the four shapes Python gives you for
holding many things at once — list, dict, set, tuple — and the rule for choosing between them",
and a polygon is the most obvious tuple in the curriculum. The risk is that Area 3's vehicle is
Minecraft data and turtle has been gone for four weeks.

**A leaning, not a decision:** Area 1 for the loop version, and let Area 3 reference it when
tuples arrive — "you already made one of these". A concept met twice, five weeks apart, is
§5.4's spaced repetition happening on its own.

## Verifier

`hidden-tests`, and the shape of the test is already settled by §6.3 and by
`content/tests/a1-the-polygon-engine_test.py`: **assert on a computed value, never on a
picture.** `TurtleSpy` records the orders, so the test can check that `register_shape` was
called, that the polygon has the expected number of points, that they are pairs of numbers, and
that `shape()` was then set to the registered name. It must **not** check what it looks like —
the whole point is that it looks like whatever he wanted.

That constraint is a feature: it makes the quest un-gradeable on taste, which is the only way a
creative exercise can be fair.

**Teach-back or Conjured are the natural medals** — §5.10's elective depth fits a quest whose
best outcome is that he shows somebody.

## Trigger for promotion

Whenever Area 1's content is authored — it is the natural fifth quest — or sooner if the
`shape("dragon")` easter egg lands well and he starts trying names of his own. That reaction is
the signal, and it is recorded in
`planning/reminders/follow-up_turtle-and-dragon-easter-egg_2026-08-30.md`.

## Known scope

- The shim's `register_shape` is currently a **recorded no-op**. It keeps the call legal but
  builds nothing, so this quest needs the shim to actually register and render a custom polygon
  before it can be taught. Small — the renderer already draws an arbitrary point list.
- The quest, its brief and its hidden tests, per §6.2.
