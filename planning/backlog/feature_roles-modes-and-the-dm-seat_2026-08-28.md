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

**A decision on the leaderboard.** §5.8 specifies "a leaderboard of two, reset each
area, so neither player runs away with it." Reset-each-area exists to stop a runaway;
with six players, whether that still holds is an open question.

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
