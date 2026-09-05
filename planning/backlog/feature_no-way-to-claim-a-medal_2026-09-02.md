# Five Medals Are Priced And None Can Be Claimed

**Status:** Backlog
**Date Discovered:** 2026-09-02
**Discovered During:** the Quest and Area screen legibility pass

## Context

§5.10 gives every quest six medal slots and calls them "elective depth, which is what keeps
autonomy intact". The scoring model prices all six. The database stores all six. The wire
carries all six, correctly priced, on every quest view. The Quest screen draws all six.

**Nothing in the repository can award any of them but `cleared`.**

- `SubmitRequestSchema` (`pyquest/packages/contract/src/endpoints.ts`) is `.strict()` and has no
  field for a medal claim, on any of its four verifier variants.
- `SignoffRequestSchema` is `{ by, granted, note? }` — no medal named — while
  `SignoffAwardSchema` returns one, and the endpoint index describes the route as returning
  "the medal awarded".
- All three `awardMedal` call sites hardcode it: `apps/api/src/dispatcher.ts:291`,
  `apps/api/src/server.ts:336`, `apps/api/src/server.ts:1104`.
- `ironman`, `idiomatic`, `teach-back` and `conjured` appear as literals only in
  `apps/web/src/fixtures/index.ts` and `packages/db/src/seed.ts`. Neither is a production path.

So four fifths of §5.10 — and with it the whole "replaying a cleared quest to take a medal is a
first-class action" thesis — is display-only. The Quest screen now says so out loud rather than
quoting prices for a purchase nobody can make, which is a stopgap and not the fix.

## The spec question this has to settle first

**Is a medal declared before an attempt, or claimed after it?** The spec contradicts itself, and
neither reading is marked as the intended one:

- §5.12 says "**Conjured** marks a quest completed with AI assistance" — past tense, a label
  applied to work already done.
- §5.10's Ironman is "from memory. No documentation, no autocomplete, no AI." A constraint on
  *how the work is done* means nothing claimed afterwards; the honour system it runs on
  (§5.10: "his binding constraint is working from memory... the parent's is abstaining from AI")
  only bites if the player commits to it before starting.
- Teach-back already has a route — §6.3 lists `peer-signoff` as the verification for "Bosses,
  and every Teach-back medal" — so it is claimed after, by somebody else.

These may be three different mechanics rather than one. Deciding that is a spec change, and this
plan should not start before it is written down.

## What already exists and must be reused

- `effectiveDC(baseDC, modifiers)` and `medalDelta(kind, baseDC, alreadyEarned, newMedal)` in
  `packages/engine/src/scoring.ts` — the pricing is finished and correct, including the
  telescoping property that makes order irrelevant.
- `modifierConflict(modifiers)` in the same file already implements §5.12's Conjured/Ironman
  rule and **is never called from production code.** It exists for this.
- `medalSlots(item, held)` in `apps/api/src/views.ts` already omits an illegal slot rather than
  pricing it at zero, so the offer list is correct the day a claim can be made against it.
- `quest_medals`' primary key `(player_id, quest_id, medal)` already makes "a medal pays once"
  true in the data rather than in a code path.

## Edges

- **A medal can price negatively.** Conjured is −5 DC, so claiming it *after* Cleared on a DC 12
  quest is `xp(7) − xp(12)` = −10, and `MedalSlotSchema.xp` is a `CountSchema` that refuses it.
  Whatever the mechanic, this case has to be answered rather than discovered in a parse error.
- **The web fixture's medal numbers do not match the engine.** `apps/web/src/fixtures/index.ts`
  prices every modifier at `dc + 2` and offers a `cleared` slot on a quest that already holds
  `cleared` — where the API excludes held medals and uses §5.1's +5/+3/+3/−5. Offline, the SPA
  shows numbers the engine would never produce. `fixtures-agree.test.ts` compares campaign and
  area views only, so nothing catches it.
- `time-attack` is a legal `Medal` that `DEFAULT_MEDALS` does not offer. It must not become
  reachable by accident.

## Files this would touch

`packages/contract/src/endpoints.ts`, `apps/api/src/dispatcher.ts`, `apps/api/src/server.ts`,
`apps/api/src/store.ts`, `apps/web/src/quest/useSubmit.ts`, `apps/web/src/screens/QuestScreen.tsx`
(the `Medals` block, which is where the chooser would live), and both fixture files.
