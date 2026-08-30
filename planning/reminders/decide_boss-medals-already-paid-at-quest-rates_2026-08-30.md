# Decide what to do about any boss medal already written at quest rates

**Category:** decide
**Audience:** dm
**Subject:** progress data
**Raised:** 2026-08-30
**Plan:** `planning/completed/feature_boss-pays-boss-rates_2026-08-30.md`
**Status:** open

## What to do

Run this against the progress database on the parent's machine, before the API next serves a
real session:

```sql
SELECT player_id, quest_id, medal, xp_awarded, earned_at
FROM quest_medals
WHERE quest_id IN (SELECT id FROM ...)   -- the boss ids: a0-first-light, and any later boss
ORDER BY earned_at;
```

The boss ids are in `content/quests/*.yml` under `kind: boss` — today that is `a0-first-light`
alone. If the query returns nothing, close this reminder: the fix landed before anybody was
underpaid, which is the good outcome and worth recording as such.

If it returns rows, each one was paid a tenth of §5.1's rate, and somebody has to decide what
happens to them.

## Why it cannot be a test, and cannot be a migration

A test can prove `medalDelta` now prices a boss correctly — that is done, and the suite catches a
mutant in both directions. It cannot decide what a child's existing XP total should say.

A migration is worse, not better. §5.10's rule is that a medal pays **once**, and the row is the
record of what was paid. Silently multiplying a past row by ten changes a number the player has
already seen on his own screen, with no event that explains it. The XP total is his; an
adjustment he did not watch happen is indistinguishable from the game being arbitrary, which is
the one thing §5 is built to avoid.

## What it changes

**No rows:** nothing to do. Close it, and note the date, because "we caught it before it paid"
is a fact worth having written down.

**Rows exist, and the decision is to correct them:** it is a top-up paid *visibly* — an event
with a sentence attached, at a session, not an `UPDATE` run between sessions.

**Rows exist, and the decision is to leave them:** equally legitimate, and it needs saying out
loud rather than being the default that happens because nobody chose. Write the ruling into the
plan's Status so the next person to notice the discrepancy finds the reason instead of the bug.
