# Area 6 — Data and the Outside World

**Status:** Backlog
**Track:** area-6
**Date Discovered:** 2026-08-28
**Discovered During:** the Lane B planning session that produced
`planning/feature_area-1-control_2026-08-28.md` and its three siblings

## Context

Weeks 29–36, eight concepts, Boss 6 The Archive — a tool with real persistence and a real
command-line interface **that the parent installs and uses.** Vehicle: save and load his
world, share a seed, call a live API.

Concepts: file read and write · context managers · JSON · CSV · `pathlib` · HTTP and
`requests` · `argparse` · dependencies.

By this point his world has been in memory for twenty weeks and vanishes every time the window
closes. That is the pain this area resolves, and it is the same shape as every other area's
motivation: the previous vehicle makes the next concept necessary.

§5.7 — rewards are capabilities — puts the `requests` unlock on Boss 6. Until then his
programs do not reach the network, which is a curriculum decision and also a supervision one.

## Known Scope

The Area 1–3 template.

Two things worth deciding early:

**The live API.** Calling one is in the spec and it is the moment the machine stops being a
closed box. It also introduces a dependency on somebody else's uptime, a rate limit, and a
network he does not control — inside a session with a fixed 45–60 minutes. Pick an API that
needs no key, has a stable free tier, and returns something he actually wants; and write the
session so a cached local response can stand in when it is down, without the substitution
being a lie about what happened.

**The CLI is the boss, and the parent is the user.** Boss 6's win condition is that the
parent *installs and uses* it. That means `argparse` with real `--help`, an entry point that
works from a clean clone, and a README a person who did not write it can follow. It is the
first time his software has a user, and the plan should treat that as the subject rather than
as packaging.

Also here: the VS Code rung restoring the **extensions view**, per
`feature_vscode-profile-and-tool-quests_2026-08-28.md`, because `dependencies` enters the
curriculum in this area and that is when the view means something.

## Trigger for Promotion

**Boss 5 cleared**, or week 27.
