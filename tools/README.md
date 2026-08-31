# Tools — what each machine needs

**This answers one question: what has to be installed before a session can run.**

It exists because the answer used to be smeared across a dozen files — content briefs, DM
guides, area READMEs, `curriculum/lib/README.md`, the spec and `infra/README.md` — and
nobody could assemble it without reading all of them.

## Two machines, described by role

A campaign has **players** and a **DM** (§5.11 — roles, not people). Two machines matter:

| | What it is | Who holds it |
|---|---|---|
| **The DM's machine** | Also the **host**: it runs `infra/` — the stack, the git remote, the backups | Whoever holds the DM seat |
| **A learner's machine** | A workstation. Editor, Python, git, and the learner's own repository | Every player, including the DM |

**The DM is also a learner**, so "the learner's machine" is not a single machine. Where this
directory needs to distinguish them it says *the DM's machine* and *another learner's
machine*. `infra/` runs on the first and **must be reachable from the second** — §6.4 makes
`git push` the verification mechanism, so a learner who cannot reach the remote cannot
complete Area 2a.

### What this project has actually been tested on

Stated as evidence, not as a requirement. Nothing here needs this hardware.

- **A learner's machine:** a 2017 mobile workstation — Windows 11 Pro 22H2, i7-7820HQ, 16GB RAM,
  DirectX 12. This is the weaker of the two and the one the ursina hardware gate was run
  against.
- **The DM's machine:** a Windows desktop on the same home network, hosting the compose
  stack, with an RTX 5090. **Where a number came off that GPU it says so**, because those
  figures do not transfer to a laptop.
- **Roster:** one household, two people, one holding both the DM and player seats. A
  classroom, a troop, or two siblings changes the roster and nothing else.

## Why this is not split by person

Most of these are needed on **every** machine and identical on all of them. Python, git and
ursina all are, and the ursina pin rule is explicit that `smoke.py` must pass on *both*
before an upgrade lands. A `learner/` and `dm/` split would restate three-quarters of itself
and the two copies would drift.

Directories are per tool. The checklists below are per role.

**Putting a new machine into service:** [`learner-setup/`](learner-setup/) carries this
directory and the files each install is verified against onto that machine, on a branch of
its own repository, and carries the results back the same way. It is packaging rather than a
tool, so it has no row below — nothing in it gets installed on anything.

---

## Every learner's machine

In this order. Nothing here needs the application, the host, or the internet beyond the
installers themselves.

| # | Tool | Needed by | Notes |
|---|---|---|---|
| 1 | [Python 3.14](python/) | **week 1**, Area 0 session 1 | The first thing. Nothing else works without it |
| 2 | A text editor | week 1 | Notepad is genuinely sufficient until week 7 — see below |
| 3 | [git](git/) | week 6, Area 2a | Client only. The remote is a separate decision |
| 4 | [VS Code](vscode/) | **week 7**, Area 2b session 6 | Install stock, then import the profile. Do not install it early |
| 5 | [ursina](ursina/) | week 9, Area 3 | Pinned. Verify with `curriculum/lib/smoke.py`, which needs a real display |

**Do not install VS Code before week 7.** Area 0's DM guide says so directly: it is Area 2b
vocabulary and costs a session for no gain if it arrives early. The Quest screen is the
gentle editor for Areas 0–1, and Area 0 wants no editor at all.

## The DM's machine

Everything above, because the DM is a player too — plus the host side and the authoring
toolchain.

| Tool | Where | Notes |
|---|---|---|
| Python 3.14, git, ursina | as above | Same versions everywhere. `smoke.py` must pass here too before any ursina upgrade |
| `pytest`, `ruff`, `pyright` | [python/](python/) | For `curriculum/lib/`'s suite. Not needed on a non-DM machine — the test suite is the DM's |
| Docker, compose, Gitea, Postgres | [`infra/`](../infra/) | The stack. Not covered here |
| Reachable on the LAN | [git/local-lan-learner.md](git/local-lan-learner.md) | Other learners must be able to clone and push. A host bound to `localhost` fails Area 2a |
| The learner's remote repository | [git/local-lan-learner.md](git/local-lan-learner.md) | Ports 3080/3022, and the four steps from empty to pushed. Needed week 6 |

---

## Adding a tool

One directory per tool, a `README.md` in it, and one row in the table above. Say **which
roles need it**, **which week it is first needed**, and **what proves it works** — an install
that has not been exercised is not an install.

**This directory is written by the `main` track.** Areas 2, 3, 4, 6 and 7 each restore a
VS Code rung, and if each edited `tools/vscode/` directly they would collide the moment two
ran in parallel — the same reason `curriculum/README.md`'s status table has one owner. An
area reports what its rung needs; `main` writes it.
