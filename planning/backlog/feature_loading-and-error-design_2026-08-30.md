# The Loading And Error States Nobody Designed

**Status:** Backlog
**Track:** spa
**Date Discovered:** 2026-08-30
**Discovered During:** SPA Phase 5 — `planning/**/feature_spa_2026-08-28-v2.md`

## Context

Phase 5 turned every read into a request, and a request has three answers where a fixture had
one. Nine screens gained a loading state and a failed state, and **no artboard shows either.**

What shipped is deliberately minimal, in `apps/web/src/shell/Loading.tsx`:

- **loading** — an eyebrow reading `loading the campaign`, in the place the content will occupy.
  Nothing moves.
- **failed** — the same eyebrow in the danger colour, the reason verbatim in a panel, and one
  line saying the game lives on the other machine.

That was a choice rather than a placeholder, and the reasoning should survive whoever revisits
it: **nothing else in this app animates.** No spinner, no skeleton, no pulse anywhere in nine
screens. A spinner would be the loudest thing on a page whose entire design is quiet, and it
would be invented rather than lifted — which is the rule the artboards exist to enforce.

The failed state shows the error text on the same argument the Quest screen makes two clicks
away: he is being taught that errors are readable (§3, Area 0). A screen that hides its own
teaches the opposite.

## What a design pass would actually decide

**Whether loading is visible at all.** On a LAN these requests may land in 30ms, in which case
the honest treatment is *nothing* — a flash of `loading` that nobody can read is worse than a
blank moment. A delay before showing it is the usual answer and it is a real decision with a
real number in it.

**Whether the layout holds its shape.** The current state occupies the top-left and lets the rest
of the screen be empty, so the page rearranges when data lands. Reserving the shape costs
knowing the shape; a skeleton is one way and it is also the most animated thing anyone would
propose here.

**What the Map does**, since it is the one screen where partial data is meaningful. It draws
eight islands from one request; there is no in-between state today, but there could be.

**What a failure offers besides an explanation.** There is no retry. Adding one is easy and
raises a question this project has already answered once: the stack being unavailable was ruled
out of v1 scope on the grounds that the parent's machine is always on
(`planning/backlog/feature_offline-and-eventual-consistency_2026-08-30.md`). A retry button
implies a world where the request routinely fails, which is not the world v1 is in.

## Why it is not urgent

The current states are honest, legible and quiet, and they are correct in the case that matters
most — the stack is on, the LAN is fast, and he never sees them. What is missing is a
considered treatment for the case where he does.

**It should be looked at on his laptop rather than designed on the parent's machine.** The
whole question is how long a wait feels, and that is measured over the link this actually runs
on. It belongs with `planning/reminders/follow-up_zbook-screen-check_2026-08-30.md` — one
sitting, both questions.

## Trigger for promotion

Whichever comes first: the ZBook screen check, since somebody is already sitting in front of the
real thing on the real link — or the first time a request is slow enough to notice, which is the
evidence this plan would rather have than a guess.

## Known scope

- `apps/web/src/shell/Loading.tsx` — the whole of it today
- The nine screens only if the treatment stops being one shared component
