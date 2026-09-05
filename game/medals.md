# The medals

One entry per medal, from spec §5.10. The heading is the medal's id from
`pyquest/packages/content/src/schema.ts`.

**This file is game, not curriculum.** Medals price work; they do not teach Python. Deleting
`game/` has to leave a curriculum that still validates and still publishes, so nothing here may
be referenced by anything under `curriculum/`.

Each medal is a difficulty modifier: it raises the quest's effective DC and pays the difference,
once. That is why there is no per-medal XP table — §5.1 prices everything from a DC, and a medal
is a change to the DC rather than a special case beside it.

## cleared

**The tests pass.** The only medal progression cares about: three cleared quests unlock the
area's boss, and nothing else in this list unlocks anything.

No change to the DC. It is what the quest's own difficulty already prices.

## ironman

**From memory.** No documentation, no autocomplete, no AI — you and what you already know.

**+5 DC**, the largest step in the list, because working without a safety net is genuinely harder
than working with one.

Nobody checks. It is the honor system on purpose, and it costs each player something real: for
one of you the constraint is working from memory at all, and for the other it is abstaining from
AI.

## idiomatic

**`ruff` and `pyright` clean, plus one written line on why this solution is idiomatic.**

**+3 DC.**

Two halves, and the second is the one that does the teaching. A linter going quiet can happen by
accident; being made to say *why* a Python programmer would write it this way is what turns the
difference between two working solutions into something you own.

It is also the standard this repository holds itself to, which you can check.

## teach-back

**The other player signs it off after hearing you explain it.**

**+3 DC.**

Verified by a person rather than a program — §6.3 routes it through peer sign-off. Explaining
something is where you find out which parts you only thought you understood, which is the entire
point and is not something a test can ask.

## conjured

**Completed with AI assistance.** Legal, named and logged — plus a statement of what the AI did
and why the result works.

**−5 DC**, so it pays less. Not a punishment: the work genuinely was easier, and the scoring says
so rather than pretending otherwise.

Conjured and Ironman cannot both sit on one quest, for reasons that should be obvious. The quest
can be replayed later for Ironman.

## time-attack

**Roadmap, not implemented.** A legal medal name that no quest currently offers.

**+5 DC** when it arrives.
