# The Scoring Model Needs One Authoritative Source

**Status:** Backlog
**Date Discovered:** 2026-08-27
**Discovered During:** `planning/in-progress/feature_phase0-tier0-foundation_2026-08-27.md`, Wave 1

## Context

Building the engine's scoring arithmetic surfaced three unresolved edges in the difficulty
model. None blocked the build — each was decided and pinned with a test — but all three are
decisions the engine made on the spec's behalf, and that is the wrong place for them to live.

### 1. The modifier table is published twice, and now implemented a third time

Spec §5.1 lists the difficulty modifiers with their DC deltas. Spec §5.10 lists the medals with
the same deltas. They are the same table. Only §5.10 marks `time-attack` as roadmap. Edit either
one alone and they disagree silently, and `packages/engine/src/scoring.ts` now carries the
numbers a third time.

This is the same failure the spec itself diagnoses in its decision log — *"a boolean beside the
number that implies it can only ever disagree with it"* — applied to a table rather than a flag.

### 2. Datamine is a modifier with no home

§5.5 calls Datamine a −5 difficulty modifier and §5.1 lists it in the modifier table, but it is
not a medal. So `medalsFor()` in the content contract will never return it, and no progress row
shape has been specified for it — unlike medals, which §6.2 pins exactly as
`(player_id, quest_id, medal, earned_at, xp_awarded)`.

The engine currently types `medalDelta`'s `alreadyEarned` as `DifficultyModifier[]` rather than
`Medal[]` so a standing Datamine can participate in re-pricing. If Datamine ends up stored
somewhere else, that signature needs revisiting.

The same question applies to the challenge-run modifier, which is also not a medal.

### 3. The challenge-run bonus amount is genuinely unspecified

§5.2 says beating a boss early "pays a bonus" and names no number. The Phase 0 plan chose +5 DC
(decision DC-5) on the grounds that expressing it as a modifier reuses machinery §5.1 already
built. That reasoning holds; the *magnitude* is unvalidated. It is one line to retune.

## Known Scope

- Decide where the modifier table lives once — most likely content, since the engine already
  imports `@pyquest/content` and the spec should then quote it rather than restate it
- Decide Datamine's and challenge-run's storage shape alongside `quest_medals`
- Settle the challenge-run magnitude, or record that +5 is deliberate

## Trigger for Promotion

The DB schema work in Wave 3, which is the first moment Datamine needs a real table. Doing it
earlier is cheap; doing it after progress rows exist means a migration.
