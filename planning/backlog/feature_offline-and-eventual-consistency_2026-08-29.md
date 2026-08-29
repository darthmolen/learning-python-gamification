# Offline Behaviour, Which Is Really Eventual Consistency

**Status:** Backlog
**Date:** 2026-08-29
**Promoted from:** `planning/feature_spa_2026-08-28.md`, Anticipated Backlog

## Why this surfaced

The SPA plan's review argued that offline behaviour shapes the Quest screen and therefore
belonged in Phase 2 rather than the backlog. Working through it moved the item rather than
scheduling it: what the plan had written down as a copy question is a distributed-systems
question wearing a copy question's clothes.

The plan's original wording was *"he can still write code; he cannot Submit."* That sentence
quietly assumes the app is on screen. It is not. §6.1 puts `web` and `api` on the parent's
machine and spec line 24 gives the son's laptop *"only Python, VS Code, git, Ursina, and a
browser."* If the host machine is off there is no app to show a message — the browser fails to
connect and PyQuest never loads. Nothing the SPA can say, because the SPA is what is missing.

## The v1 decision, and it is deliberate

**The stack is always available.** The parent's machine stays on, locked-screen, by
arrangement. v1 builds no degraded path, no reachability flag, no disabled-Submit state, and
no retry affordance. A failure mode that is designed for is a failure mode that must be
tested, maintained, and explained to an 11-14-year-old; the household arrangement removes it
more cheaply than code does.

This is a **v1 scope decision, not an oversight**, and it should be cited that way if it comes
back. The version that reopens it is not a bad Saturday — it is a second machine.

## What actually reopens this

If PyQuest ever leaves the house — a hosted product, a second household, a son who codes
somewhere the parent's machine cannot be reached — then the problem is not what a button says.
It is that progress becomes writable in two places that cannot see each other, and the design
currently forbids that on purpose:

- **Content lives in git, progress lives in Postgres, and the two never mix** (`CLAUDE.md`).
  Content already has an eventual-consistency story, because git is one. Progress does not.
- **§6.4 makes push the verification mechanism.** *"If you did not push it, it did not
  happen"* is already an eventual-consistency contract, and a good one — the game cannot see
  him until he pushes. It covers his **code** completely and his **progress** not at all.
- Medals are `(player_id, quest_id, medal, earned_at, xp_awarded)` rows (§6.2). XP sums across
  them. A queued-then-replayed award needs to be idempotent per that tuple or a replay pays
  twice.

So the shape of the real work is: decide whether progress is authoritative on the server
(and the client merely queues intent) or genuinely replicated. The first is much smaller and
almost certainly right — Submit already posts intent to a server that owns the verdict, so
queuing an unsent Submit is closer to an outbox than to a merge.

## What this needs to produce, if it is ever taken up

- Whether progress is server-authoritative with a client outbox, or replicated
- Idempotency on medal awards keyed to the §6.2 tuple, so replay cannot double-pay XP
- What the queue is allowed to hold, given hidden tests never ship to the client (§6.3) —
  a queued Submit is unverified by construction, so it cannot show a provisional medal
- Only then, the copy — which by that point describes a real mechanic instead of guessing at one

## Why it is not urgent

Kitchen Table mode is one household and one machine (§5.11). Every argument above starts with
a second one existing.

## Depends on

- The API, which does not exist yet
- A decision that PyQuest is leaving the house, which has not been made
