---
kind: stub
status: open
date: 2026-09-10
---

# A learner cannot put a machine into service alone

**Status:** Backlog
**Date Discovered:** 2026-09-10
**Discovered During:** the workflow audit behind `wave-4_the-workflow-and-the-bootstrap_2026-09-10`

## Context

`feature_practice-zero_2026-09-10` makes the bootstrap a DM-led lesson: git becomes install #1,
and Practice 0 of Area 0 is *create your first repository*, with the DM creating the Gitea account
and the learner naming and cloning the repository.

**That is the right answer for run 1, which is DM-led, and it is the only answer that currently
exists.** A learner alone at a new machine has no route at all.

The circularity is the reason. `tools/learner-setup/` delivers the payload as a branch of the
learner's own repository, and the payload contains `tools/git/README.md` — the instructions for
installing git. Receiving the instructions requires git, a clone, and an account on a Gitea that
someone else has to have made reachable. **The transport cannot deliver its own prerequisite.**

`tools/learner-setup/README.md` argues the branch over a zip on good grounds — §6.4 makes `git
push` the verification mechanism, and *"a machine that pulls its own setup has already done the
thing the campaign is about before it has installed anything."* That argument is sound for every
delivery except the first one, and it does not notice the exception.

## What this needs to produce

**A first-touch path with no prior machine state**, and a decision about what it may assume.
Three shapes, none obviously right:

- **A single printed or dictated page.** Install Python, install git, then one `git clone` and
  everything else follows. Smallest, and it puts the one unavoidable manual step where it belongs
  — but it is a second copy of instructions that live elsewhere, which is the drift `SETUP.md`
  opens by refusing.
- **`pack.sh --zip`** for the first delivery only. Honest about the exception, and it needs
  `tools/learner-setup/README.md`'s "why a branch, and not a zip" section amended rather than
  ignored.
- **The DM's machine serves it over HTTP** — the stack is already there and already reachable on
  the LAN once `feature_gitea-lan-access-for-the-son_2026-08-27` lands. Gitea can serve a public
  repository without an account, which would make `git clone <url>` the only step.

**An account still has to be created by somebody.** `DISABLE_REGISTRATION: "true"`
(`infra/docker-compose.yml:118`) is deliberate, and `tools/git/seed-gitea-users.sh` runs the admin
CLI on the host. Any solo path either keeps that DM step or argues for opening registration on a
home network, which is a different decision.

## Why it is not urgent

Run 1 is DM-led and the roster is one household. This becomes real when a second learner appears,
when a machine is rebuilt while the DM is not in the room, or when anyone else runs this
curriculum — which is the same trigger as
`planning/backlog/feature_roles-modes-and-the-dm-seat_2026-08-28.md`, and the two should probably
be read together when either is promoted.

## Trigger for Promotion

A second learner, a machine rebuild the DM is not present for, or a decision to let anyone outside
the household run the campaign.
