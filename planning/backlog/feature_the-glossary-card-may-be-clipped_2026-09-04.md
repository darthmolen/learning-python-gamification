# The Glossary Card May Be Clipped, And No Test Can See It

**Status:** Backlog
**Date Discovered:** 2026-09-04
**Discovered During:** planning/completed/feature_the-lesson-defines-its-own-words_2026-09-04.md

## Context

`GlossaryTerm` positions its card `position: absolute; bottom: 100%` inside the term. The plan it
shipped under specified a **portal** with fixed positioning instead, and gave the reason:

> The Tome's content pane is `overflow: auto`, so a card positioned above a term inside it is
> clipped — a term on the first line loses the top of its card, one near the right edge loses the
> right.

That reasoning was not withdrawn. The simpler version was built, every test passed, and **the
tests cannot see the problem**: jsdom has no layout engine, so `overflow`, clipping and viewport
edges do not exist in the suite. A card that is half cut off in a browser is indistinguishable,
to every check this repository has, from one that is perfect.

So this is filed rather than closed. The feature works; one of its stated failure modes is
untested and probably real.

## Known Scope

Three things, in order of how likely they are to bite:

1. **A term on the first line of a lesson.** Its card opens upward into the pane's top edge.
2. **A term near the right edge**, whose card is `left: 12px` from the term and runs past the
   pane. Nothing clamps it.
3. **A term low in a long lesson**, where opening upward is right but there may be no room —
   nothing flips it downward.

The plan's own answer was a portal to `document.body` with fixed positioning computed from the
term's rect, closing on scroll rather than following. That is still the answer; it was deferred,
not rejected.

**Verifying it needs a real browser.** This would be the repository's first test that does, which
is a decision in itself rather than a detail — the SPA suite is jsdom throughout and deliberately
hermetic. A cheaper first step is to look at it: open the Tome, open a term on the first line of
Area 4's lesson, and see.

## Trigger for Promotion

Whichever comes first:

- The DM or the learner sees a card cut off. One report settles it.
- Any decision to add browser-based tests to the SPA, which would make this cheap to check
  properly rather than by eye.
- The card grows past a couple of lines — a family card carrying three definitions is already the
  tallest thing here, and height is what makes clipping likely.
