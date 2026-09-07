# 0008 — The rail admits what belongs to no place

**Status:** Accepted
**Date:** 2026-09-06

## Context

Nothing in the campaign explained the campaign.

Every orientation document is DM-voiced by convention — `curriculum/README.md` fixes it in a
table: `dm-guide.md`, `practices/`, `reference/` and the area READMEs address the DM, and the
learner's entire document set is drills, briefs, `lesson.md`, `glossary.md` and `journal.md`.
None of those says what an area is, what a practice is, or what order to do things in.
`game/medals.md` is the only player-facing systems document in the repository and it covers
medals.

A search of the spec, all six ADRs and CLAUDE.md for *onboarding*, *how to*, *tutorial*,
*orientation*, *getting started* returns nothing substantive. The design's established pattern
is that rules are explained where they bite — Defend's spacing ladder, the Map's tilde, the
Area screen's challenge-run panel — which works well for a rule and not at all for the shape of
the whole thing.

The parent's own framing, recorded as given: **a tool is only as good as a person's ability to
understand it.**

## The obstacle

§6.8 closes the screen list with an argument rather than a list. The rail carries what is
"true wherever you are standing, so they are always one click away and never nested", and
`apps/web/src/shell/Rail.tsx` states the consequence in a comment:

> A seventh entry would mean something was promoted out of the place it belongs to; a fifth
> would mean something became unreachable.

`Rail.test.tsx` asserted "exactly the six overland destinations, in artboard order". The count
was load-bearing and defended.

## Decision

**HOW-TO is the seventh rail destination, and it is admitted rather than excepted.**

The rule the original six were counted against is that **nothing belonging to a place may be
promoted out of it.** That is why Quests is a section of the Area screen and not a rail item —
§6.8 says so directly: "putting them in the rail implied you could be in Quests without being
anywhere."

HOW-TO belongs to no place. It has no parent area and no parent screen. There is nothing for it
to be promoted out of, so the objection does not reach it.

And it satisfies §6.8's actual test more strongly than most of what is already there:
**confusion is the one thing in this product that is genuinely location-independent.** A
learner needs the Map when he is choosing; he needs the Journal at the end; he needs this at
the moment something stops making sense, which is any moment at all.

It sits last. A learner reaches for it when something has gone wrong, and the end of a list is
where people look for help.

## Why not a page of the Tome

This was the first proposal and it is the cheaper one — no seventh item, and the Tome already
opens *over* the Quest screen without costing the learner his editor, which is exactly the
ergonomics a confused learner wants.

It loses on scope. §6.8 defines the Tome as "the field manual and the whole syllabus", and the
syllabus is Python: areas, concepts, traps, boss preparation, one page per idea. How the
campaign is organised is not a concept with a page. Filing it there makes it findable only by
someone already browsing the syllabus — and the learner who needs it is the one who does not
yet know what the syllabus is.

Putting it at the root, replacing `App.tsx`'s `index` redirect to `/map`, was also rejected: it
is one line, and it puts a page he has read in front of him on every visit forever.

## Consequences

- **`RailKey` gains `'how-to'` and `Rail.test.tsx` asserts seven.** The test's comment now
  carries the rule rather than the count, so the next person to propose an eighth argues
  against a sentence instead of a number.
- **The page renders from content, not from JSX.** Sections are markdown files under
  `curriculum/how-to/` and `game/how-to/`, read curriculum-first. The next thing that turns out
  to confuse him is an authored file, which is the property the page exists to have — a
  hardcoded page would be out of date by Area 2.
- **The split is the lane split, and the deletion test governs it.** The curriculum half is
  learner-voiced and survives `game/` being deleted; `validate:content` refuses the game's
  vocabulary in it. The overlay half explains scoring. With no overlay the page is shorter and
  still correct, because there is no game to explain.
- **The published Field Manual gets the same page**, and the DM build gets both halves —
  whoever runs a session needs the vocabulary to explain the second to a child who has just
  asked what a quest is. `apps/field-manual/tests/no-game.test.ts` now performs the deletion
  and asserts the site still *publishes*, not merely that the content still validates.
- **The nine design artboards each carry the rail inline** and now disagree with the app until
  they are updated. Named here so that it is a known debt rather than a discovery.

## What this does not decide

**Whether an eighth is ever admitted.** The test above is not "is it useful" — everything in
the product is useful. It is "does it belong to a place." Anything that does goes in that
place, and the argument in §6.8 stands unchanged for it.
