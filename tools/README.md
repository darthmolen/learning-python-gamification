# Tools — what each machine needs

**This answers one question: what has to be installed before a session can run.**

It exists because the answer used to be smeared across twelve files — two content briefs,
four DM guides, three area READMEs, `curriculum/lib/README.md`, the spec and
`infra/README.md` — and nobody could assemble it without reading all of them.

`infra/` is the parent's machine as a *server*: compose, Gitea, Postgres, backups. This
directory is both machines as *workstations*. The two do not overlap.

## Why this is not split by person

Most of these are needed on **both** machines and identical on both. Python, git and ursina
all are, and the ursina pin rule is explicit that `smoke.py` must pass on *both* before an
upgrade lands. A `learner/` and `dm/` split would restate three-quarters of itself and the
two copies would drift.

It is also ambiguous by now: **both people are learners.** §5.11 runs this campaign in
Kitchen Table mode, one household, the parent holding both the player and DM seats — so
"the learner's machine" names nobody. Directories are per tool; the checklists below are
per machine.

---

## His machine — the son's laptop

Everything here, in this order. Nothing needs the application, a server, or the internet
beyond the installers themselves.

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

## The parent's machine

Everything above, plus the server side.

| Tool | Where | Notes |
|---|---|---|
| Python 3.14, git, ursina | as above | Same versions. `smoke.py` must pass here too before any ursina upgrade |
| `pytest`, `ruff`, `pyright` | [python/](python/) | For `curriculum/lib/`'s suite. Not needed on his machine — the test suite is the parent's |
| VS Code | [vscode/](vscode/) | The parent's own setup is their business; only the exported profile is shared |
| Docker, compose, Gitea, Postgres | [`infra/`](../infra/) | The stack. Not covered here |

---

## Adding a tool

One directory per tool, a `README.md` in it, and one row in the table above. Say **which
machines**, **which week it is first needed**, and **what proves it works** — an install
that has not been exercised is not an install.

**This directory is written by the `main` track.** Areas 2, 3, 4, 6 and 7 each restore a
VS Code rung, and if each edited `tools/vscode/` directly they would collide the moment two
ran in parallel — the same reason `curriculum/README.md`'s status table has one owner. An
area reports what its rung needs; `main` writes it.
