# 0002 — Area weeks are road markers, not a schedule to be judged against

**Status:** Accepted
**Date:** 2026-08-29

## Context

Every area carries a week range in the spec's §3 headings — Area 0 is weeks 1–2, Area 3 is
weeks 9–14, Area 7 is weeks 37–48 — against a stated horizon of roughly 48 weeks. The Area
artboard renders it as prose:

> Weeks 9–14 · Minecraft data. Inventories are lists. Recipes are dicts.

and the Map and crumb bar both show `week 10 of 48`.

That string is two different things glued together: a schedule and a blurb. Nothing in
`content/areas/*.yml` holds either — the manifest is four fields, none of them a week range.
So the SPA had no source for a line the artboard requires, and the first thing built there was
a hardcoded table of area names, which also invented titles for five areas nobody has authored.

The question behind the field is what weeks are *for*. Two readings:

- **A schedule**, against which progress can be measured. Store it, compute a current week,
  and the app can say he is two weeks behind.
- **A road marker.** It tells you roughly where you are on a long road. It measures nothing.

## Decision

**Store the weeks as integers. Render the plan. Treat any pace judgement as a separate
decision that has not been made.**

The manifest gains a range and a blurb, splitting the artboard's single string into the two
things it was:

```yaml
area: 3
title: Collections
weeks: { from: 9, to: 14 }
blurb: Minecraft data. Inventories are lists. Recipes are dicts.
```

The only rule over the range is `to >= from`. See *Consequences* for why that is the only one.

The wire carries the integers; formatting `Weeks 9–14` is the UI's, consistent with the
standing split where the engine returns numbers and presentation decisions live in the UI.

Weeks are authored **only for areas that have a manifest** — 0, 1 and 2 today. Areas 3–7 have
week ranges in the spec and no content file, and inventing manifests for unauthored areas is
the same mistake as inventing their titles.

## Why not a schedule

Nothing in the design is time-gated. Every unlock is earned:

- §359 — "Each area offers five quests; **any three unlock the boss.** He chooses which three."
- §483 — "**Only Cleared unlocks anything.**"
- The Scrollcraft elective unlocks after Boss 7.

And §361 is actively hostile to calendar gating:

> **Challenge run:** he may attempt any boss early. Beating it skips the area's remaining
> quests and pays a bonus. This directly answers the criticism that locked linear progression
> frustrates learners who already know the material.

A learner who reaches Area 3 in week 5 is doing the thing the design wants. A schedule that
called that "ahead" would also, on a different week, call him "behind" — and the rest of the
design refuses that move deliberately. §5.8 makes the completion board "a record, not a race",
does not rank, and does not reset. §5.10 makes medals elective depth so autonomy stays intact.

The learner is 11-14. `week 10` sitting beside `Area 3 · weeks 9–14` is a quiet, reassuring
signal that he is where he expected to be. A **behind schedule** badge is a different product,
and it is three lines of arithmetic away from the data this decision stores — which is exactly
why the ruling is written down rather than left to whoever writes those three lines.

That the weeks gate nothing is what makes them safe to store honestly, and what makes
re-pacing the curriculum a two-integer edit rather than a migration.

## Consequences

- **Re-pacing is a content edit.** Two integers per area, guarded by `validate:content`, with
  no code change and no unlock rule touched.
- **The 48 stops being a constant.** `week 10 of 48` derives its denominator from
  `max(area.weeks.to)`, so it stays true after a re-pace instead of quietly disagreeing with
  the spec.
- **A validator must not require the ranges to be disjoint.** They overlap in the real
  curriculum: Area 1 is weeks 3–6, Area 2a is 6–7, Area 2b is 7–8. An obvious-looking
  "ranges must not overlap" rule rejects the actual content on the day it is written. Note also
  that `area-2.yml` is one manifest covering both halves, so its range is 6–8.
- **A current week needs a campaign start date**, which is household state and therefore
  Postgres, not content. The engine reads no clock — `now` arrives as a parameter (§6.7) — so
  the start date is a row the `db` track owes, and `planning/feature_progress-schema_2026-08-28.md`
  does not currently name it.

## What this does not decide

Whether the app ever derives a pace judgement from these numbers — ahead, behind, on track.
This decision deliberately leaves that unmade and unbuilt. Reopening it means arguing against
§361 and §5.8, which is a real argument someone may win; it is not one to have by accident
while wiring up a Map screen.
