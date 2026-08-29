# Roles, Modes, and Who Holds the DM Seat

**Status:** Backlog
**Date Discovered:** 2026-08-28
**Discovered During:** the UI design session for `feature_phase0-tier0-foundation_2026-08-27.md`

## Context

The parent's observation: this design screams multiplayer. He is currently both a
player and the DM, which is a perfectly good arrangement — but an unnamed one, and an
unnamed default is one nobody can vary from.

Most of the generalisation was already done, in the spec, a week before anyone said
the word "multiplayer": §5.11 declares quest YAML player-agnostic, §6.2 keys medals on
`player_id`, and §6.3 chose `peer-signoff` over `parent-signoff` on the reasoning that
sign-off runs both directions and that deletes a special case rather than adding one.
That is multiplayer thinking under another name.

**What was done immediately, because it was free:** `by: 'other-player' | 'parent' |
'son'` became `by: 'peer' | 'dm'`. The old enum baked a two-person household into the
content contract, which is the file every one of ~150 quests gets authored against.
Four references existed, so it cost nothing; after Area 3 authoring it would have been
a content migration. The current arrangement is now named **Kitchen Table** mode in
§5.11.

## What this needs to produce

**A role model.** A person holds one or more roles per campaign — `player`, `dm`.
Kitchen Table is one adult holding both. This is a roster question, not a schema one,
which is the point of doing the enum early.

**Named modes beyond Kitchen Table.** A group of players with one human DM (a
classroom, a scout troop, cousins); a group where an AI holds the DM seat. Each needs
its own name in the lexicon before it needs code.

**A DM console that is not a two-person console.** The current Console screen assumes
exactly one other player — one sign-off queue, one streak to forgive, one challenge
run. With four players the sign-off queue is the whole screen.

**A decision on the leaderboard.** *Ruled 2026-08-29.* §5.8 no longer describes a
ranking at all. It is a **completion board**: per area, who cleared what and which
medals they took, medals as the stars. The anti-runaway rationale — "reset each area so
neither player runs away with it" — is gone, because it contradicted the rest of the
design. §5.10 makes replaying a cleared quest for a medal a first-class action, lets only
Cleared unlock anything, and rules that a medal paying zero XP reads as a brag; a board
built to compress the gap between players was fighting all three. Player count no longer
bears on any of it, which is what stopped this being a multiplayer question.

**What is left is the reset, and it is a mode question.** Clearing the board is an
agreement rather than an event: the players consent, the DM performs it. An arcade
high-score table, wiped deliberately or not at all. Three things it needs before it is
built:

- **Where it lives.** A Console action. Console today binds `signoffs`, `authorStats`,
  `areaAuthoring` and `backups`; this is a fifth.
- **What consent means.** At a kitchen table with two people it is a conversation and
  then a button. In a classroom it is a flow with a record of who agreed. The mode
  decides which, which is why the question belongs to this item and not to §5.8.
- **What it does to history.** A wipe that destroys the record contradicts calling the
  thing a monument. Prefer a new epoch to a delete — the board shows the current one and
  the previous ones survive. The engine helps here by having no opinion: `standings` is a
  pure projection over the whole completion history and implements no reset
  (`planning/feature_engine-query-layer_2026-08-28.md`), so an epoch is one timestamp in
  the state it already takes and the filter is a single line, whenever this is ruled.

**A DM who also plays runs one area ahead.** *Proposed 2026-08-29; not yet in the spec.*
The reason the parent is further along is not that he is the father — it is that he holds
the DM seat, and a DM who has not cleared the material cannot author it, sign it off, or
ask the §3.6 questions about it. Stated as a rule about the seat it survives the roster
changing: whoever holds both seats runs an area ahead of the players they adjudicate.

The challenge run already makes this affordable. §5.11 has the DM beating a boss cold to
skip the area, which is how a person stays an area ahead without playing 150 quests twice.
The rule and the mechanic were built for each other; only the rule is missing.

That is the shape §5.11 should eventually take. Today it is titled "The Parent's Track" and
argues from the man rather than the seat. The rewrite strips it back to the Kitchen Table
declaration plus this rule — and leaves the dad-and-son story intact, because it is the
flavor that drove this whole design and worth keeping as history, just not as the thing the
rules are stated in.

**It does not collide with the board above, though an earlier draft of this item said it
did.** That draft assumed standings were scoped to "the current area," and worried that a
DM an area ahead would leave the phrase without a referent. Two things dissolve it. The
board is a per-area record rather than a single-area ranking, so a DM in Area 4 simply has
more rows filled in. And being ahead never erased what came before — he acted in Area 3
and left his history there, medals included. The rule and the board are independent.

This piece can land in the spec on its own. It is a rule about seats, so it does not wait
on the AI-DM decision below.

## The policy collision that has to be ruled on first

**An AI in the DM seat contradicts §5.12 as written.** That section unlocks AI for the
son at **Area 7**, on the explicit grounds that "before Tier 7, AI would rob the son of
the struggle that does the teaching." An AI asking him Socratic questions in Area 1 is
AI assistance six areas early, whatever it is called.

There is a defensible line. §3.6 already forbids the DM from giving answers at all —
Socratic questions only — so an AI constrained to questions is not doing the thing
§5.12 withholds. But that constraint is a prompt, which is soft, and it is the entire
safety surface. It is also the difference between a tool that teaches and one that
hands over answers under pressure from a frustrated 11-14-year-old at 8pm.

This is a decision, not an oversight, and it belongs to the parent. Nothing else in
this item should be built before it is made.

## What multiplayer costs, and it is not nothing

§2.4 counts relatedness as **free** in this design, because a parent in the room is the
real thing where Boot.dev has to simulate it with guilds. That advantage survives a
party of siblings, cousins or a class — people who know each other. It does not survive
a party of strangers, which reintroduces exactly the simulation this design was proud
of avoiding. Which kind of multiplayer is a design decision, not a scaling one.

## Feasibility note

The parent has already built a Claude-like extension on the copilot-sdk and copilot
CLI (`github.com/darthmolen/vscode-extension-copilot-cli`), so an AI-DM harness with
BYOK or a subscription is within reach. Worth recording that the harness is not the
hard part — the constraint is.

## Trigger for Promotion

Either a second learner appearing, or the parent ruling on the AI-DM question above.
Neither blocks the campaign as it stands: Kitchen Table is a complete, named mode and
the schema no longer assumes it.
