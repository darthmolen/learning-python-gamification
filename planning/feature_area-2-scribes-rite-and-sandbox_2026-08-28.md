# Area 2 — The Scribe's Rite, and Escape the Sandbox

**Status:** Planned
**Track:** area-2
**Date:** 2026-08-28
**Author:** Claude (Opus 5)
**Lane:** B — **the plan that argues the `concepts.ts` edit; `main` lands it**

## Objective

Author both halves of Area 2 — git in 2a, the real toolchain in 2b — plus Boss 2, so that by
week 8 he has left the browser permanently and his code has run on someone else's computer.

## Why this exists, and why it is one plan

2a and 2b share an area number and a boss. `pyquest/packages/content/src/concepts.ts` says
so in a comment, and `AREAS` is a flat `0..7` — the a/b split is prose in spec §4 and nothing
more. Splitting it into two plans would produce two documents that cannot be executed
independently, since 2b's boss is 2a's win condition.

Spec §4 on 2b: **this area is load-bearing.** §2.3 diagnoses the failure every platform
surveyed shares — graduates who "cannot ship an original project, having never left the
browser sandbox or learned where a file goes." §3 principle 8 is *leave the sandbox early and
permanently.* Three weeks, fourteen concepts, and it is the seam the whole design was built
to survive.

It is also short and it is at week 6, which means it gets written after Area 1 and before
Area 3 — and it is the smallest of the three, which is the only reason the schedule works.

## Success Criteria

- [ ] `curriculum/area-2/` complete in the Area 0 layout, covering both halves in one
      directory with sessions numbered straight through
- [ ] All fourteen Area 2 concepts covered
- [ ] **The curriculum runs with no application and no Gitea.** A reader with git, Python
      and a USB stick can deliver every session. This is verified by reading, not assumed
- [ ] Boss 2 passes the cold-clone procedure below, step by step, with the result recorded.
      Not "tests pass," and not "it worked on his machine"
- [ ] Area 0's and Area 1's Journal entries become the first real commit in his repository
- [x] `breakpoints` at area 3 exists in `concepts.ts` — **landed by `main` on 2026-08-29**
      (`c90202e`), argued here. This track is no longer gated on it
- [ ] The stripped VS Code profile ships as a `.code-profile` export **and has been imported
      on the son's laptop and confirmed working** — the activity bar, minimap, breadcrumbs,
      status bar, tabs, outline, problems, source control, testing and extensions views are
      actually gone, `ms-python.python` is present, and a `.py` file runs from the integrated
      terminal. Verified by importing it, never by reading the JSON
- [ ] `curriculum/area-2/vscode-profile/README.md` carries the **whole un-stripping ladder**,
      not just Area 2b's rung, so Areas 3, 4, 6 and 7 can find theirs without archaeology
- [ ] `cd pyquest && npm run validate:content` exits 0 with five `a2-` quests and Boss 2
- [ ] `py -3.14 verify.py` reports **N of N over the runnable `.py` exercises only**, and the
      README separately carries a completion checklist for the markdown and git walkthroughs
- [ ] Area 2 reported to the `main` track for the `curriculum/README.md` status table

## Approach

**The fourteen concepts**, verbatim from `concepts.ts`:

- **2a:** `repository` · `git-init` · `git-add` · `git-commit` · `git-log` · `git-branch` ·
  `git-push`
- **2b:** `files-on-disk` · `running-scripts` · `vscode` · `venv` · `pip` · `tracebacks` ·
  `main-guard`

Eight sessions across three weeks, numbered 1–8 in one `sessions/` directory with the 2a/2b
boundary marked in the README rather than in the filesystem. One area, one verify harness,
one DM guide.

| # | Half | Title | Introduces | Resurfaces |
|---|---|---|---|---|
| 1 | 2a | What A Repository Is | `repository`, `git-init` | — |
| 2 | 2a | The First Commit | `git-add`, `git-commit` | `repository` |
| 3 | 2a | The Log As A Story | `git-log`, `git-branch` | `git-commit` |
| 4 | 2a | Push, And It Is Somewhere Else | `git-push` | `git-log`, `git-commit` |
| 5 | 2b | Where A File Actually Goes | `files-on-disk`, `running-scripts` | `print`, `git-add` |
| 6 | 2b | A Real Editor | `vscode` | `files-on-disk`, `running-scripts` |
| 7 | 2b | Its Own Python | `venv`, `pip` | `running-scripts` |
| 8 | 2b | Read The Stack | `tracebacks`, `main-guard` | `reading-errors`, `venv` |

**The boundary sits between 4 and 5**, and it is a real one: session 4 ends with his code on
another machine, session 5 starts with the question of where a file lives. Sessions 1–4 need
no Python at all, which is why 2a survives Gitea being down.

**Session 2 is the Journal migration** — see the session beat below. **Session 8 is the boss
rehearsal**, since Boss 2 is a traceback away from failure on someone else's machine.

### DC band

Area 0 ran 5–18, Area 1 runs 8–20. **Area 2's spread is wider than either — 5 to 22 — and
the reason is worth stating rather than smoothing over.**

Individually, git commands are the easiest material in the campaign. `git add` is one word
and there is nothing to reason about; a DC above 8 for any single 2a command would be
dishonest. But **Boss 2 is the hardest thing he will have done**, harder than Boss 1, because
it is the first task whose failure mode is invisible from where he is standing — it works on
his machine and that tells him nothing. §4 calls this area load-bearing for exactly that
reason.

So Boss 2 sits at **22**, and it is the campaign's first item over 20. §5.1 renders DC ≥ 20
with a warning, and here the warning is correct and wanted: this one is genuinely hard, and
he should know before he starts. Area 1 avoided the band to keep a week-three learner from
being taught fear; by week eight, an honest warning is information rather than intimidation.

### The tension this plan has to name, and how it resolves

§4's 2a win condition is **"he pushes, and the board updates by itself. The game noticed."**
That is an application dependency, and `curriculum/README.md` states a standing constraint
that the directory has none — every area must be runnable with a text editor, a terminal and
Python.

**Resolution: the teaching and the applause are separated.**

The curriculum teaches git against a local repository and a remote, and ships whether or not
Gitea is reachable or the API exists. The "game noticed" moment is a `git-signal` quest in
`content/` that lights up when Lane A delivers Phase 1.5. If it is not there in week 6, the
sessions still run and he still pushes — he just does not get the confetti.

`planning/backlog/feature_gitea-lan-access-for-the-son_2026-08-27.md` is the blocker for the
applause half: `GITEA_DOMAIN` is still `localhost`, so the advertised clone URLs are wrong
off-host, and 3080/3022 are closed on the firewall. That stub is already due by Area 2a.
**Name it in this plan; do not absorb it.** It is infrastructure and it belongs to whoever
owns `infra/`.

### The remote, and what to do if Gitea is not ready

He needs *a* remote to learn `push`. In order of preference: Gitea on the parent's machine;
a bare repository on a USB stick or a LAN share; a second directory on his own laptop. All
three teach `git push` identically. The third is not a compromise on the teaching, only on
the drama — and it is worth writing the session so the DM can pick one on the night.

### The VS Code profile, absorbed from the promoted stub

`planning/completed/feature_vscode-profile-and-tool-quests_2026-08-28.md` is Area 2b material —
its own trigger said "Area 2b, week 7, when VS Code enters the curriculum and the profile has
to exist." Its decision is already made and argued: strip VS Code via an exportable profile
and un-strip it one rung at a time, rather than build a custom editor.

This plan delivers **the profile and the Area 2b rung only.** Later rungs (Area 3
breakpoints, Area 4 outline, Area 6 extensions, Area 7 problems and source control) are
authored by their own area plans.

**The stub has left `planning/backlog/`, because its trigger fired.** It read *"Area 2b, week
7, when VS Code enters the curriculum and the profile has to exist"* — and that is this plan.
A backlog item whose trigger has fired is promoted, not annotated. It now sits at
`planning/completed/feature_vscode-profile-and-tool-quests_2026-08-28.md`, completed **as a
planning item**: the decision is made and assigned, and the artifact is this plan's to build.

It is **absorbed here rather than promoted to its own track**, and the reason is mechanical:
this plan already claims `curriculum/area-2/vscode-profile/` in Files Expected to Change, so
a separate plan would collide on the exact file it exists to produce. It becomes Phase 3.

**The profile is a prerequisite for teaching this area, not a nice-to-have.** Session 6 is
`vscode`, and the stub's whole argument is that VS Code's defaults are hostile to a
11-14-year-old — activity bar, minimap, problems panel, extension prompts. Teaching session
6 against stock defaults is not a reduced version of this area; it is the thing the decision
rejected. **Area 2 is not ready to be taught until the profile has been imported on his
laptop and confirmed working**, which is why that is a success criterion above and not a
line in a phase.

Its four later rungs — Area 3 breakpoints, Area 4 outline, Area 6 extensions, Area 7 problems
and source control — are already carried by those areas' own plans and stubs. To stop the
ladder living only in scattered references, Phase 3 writes it out in full in
`curriculum/area-2/vscode-profile/README.md`, next to the profile it un-strips.

**The `concepts.ts` edit — argued here, landed by `main`.** The stub's open decision is
settled here: register **`breakpoints` at area 3** for stepping and the Variables panel,
keeping **`debugger` at area 7** for the deep pass — conditional breakpoints, exception
breakpoints, logpoints, the call stack. Two concepts, two passes, per §3 principle 7. Without
this edit the validator's `concept-above-area` rule correctly rejects an Area 3 debugging
quest, and the rule is right — the fix is a decision, not a bypass.

This is **the only file Lane B and Lane A share**, and it is read by every area track through
`validate:content` — an id moving under a running track breaks it. So this plan made the
decision and `main` made the edit, on a track no area holds.

**That has happened.** `planning/completed/feature_shared-index-and-concepts_2026-08-29.md`
landed it on 2026-08-29: `d3eb9f7` added `breakpoints` to spec §4's Area 3 vocabulary line,
`c90202e` registered `{ id: 'breakpoints', label: 'breakpoints', area: 3 }`. It was proved in
both directions before closing — an area 3 quest tagged `breakpoints` scaffolds and validates,
and the same tag at area 2 is still refused with *"breakpoints is first taught in area 3."*

So this section is now the **argument of record** for a decision already in the tree, not a
gate. Neither this track nor Area 3 waits on it, and neither adds the id itself — it is
already there.

### Verifiers, and where they change

This is the area where the verifier story turns over:

- **`git-signal`** arrives for 2a — `signal: commit | push | journal-entry | tag`. It is also
  what finally makes the Journal's committed-and-pushed half real (§5.6).
- **`local-repo`** arrives for 2b and never leaves. `scaffold.ts` already defaults to it for
  any area above 1, so the tooling is ahead of the curriculum here.
- **Boss 2 is `local-repo`.** Rebuild an in-app program as a real project, push it, and the
  parent clones it cold and runs it. §5.3: *it must run from a clean clone on the other
  person's machine.* The win condition is not passing tests. The win condition is that his
  code ran on someone else's computer, and the plan should refuse any softer phrasing.

### The cold clone, defined

"Clones it cold and it runs" is the win condition of the campaign's load-bearing area, and
asserting it three times is not the same as being able to check it. This is the procedure.
The **dm** runs it, on the dm's machine, with the learner watching and not touching.

1. **A directory that has never seen his code.** A fresh path outside every existing tree —
   not next to his repo, not a directory that once held it. Anything with a stale `.venv`,
   `__pycache__` or `.env` invalidates the run.
2. **Clone by URL, not by copy.** `git clone <remote-url>`. Copying a folder proves the code
   works; cloning proves *he pushed it*, which is the half that fails.
3. **A venv created from scratch**, inside the clone, on the dm's Python. Never a reused or
   activated-from-elsewhere environment. If the project needs dependencies, they come from a
   file in the repository — that is what makes `pip` Area 2b vocabulary rather than trivia.
4. **The exact command comes from his README**, typed as written. If the dm has to guess the
   entry point, improvise a flag, or ask him what to run, **the boss has not been beaten** —
   §5.3's "no hints" applies to the run, not only to the writing.
5. **"Runs" means:** it exits 0, and it produces the output his own specification says it
   produces. Not "no traceback." A program that starts, prints nothing and exits cleanly has
   not run in any sense he should be paid for.

**Recorded either way.** A pass goes in the Journal entry for that session with the dm's
machine named. A failure is a **scar** under §5.3 — unlimited attempts, failures displayed
with pride — and the scar records *which step* failed, because the step is the lesson. Most
first attempts fail at 1, 3 or 4, and each of those is a different missing idea: what a repo
contains, what an environment is, and who your code is actually for.

The three failures worth predicting in the DM guide, since every one of them is a real thing
an 11-14-year-old does: a file that was never `git add`ed and so is not in the clone; an
absolute path to `C:\Users\<his name>\...`; and a dependency he installed months ago
globally and has never thought about again.

### The quest matrix

Five quests plus the boss, per §5.2. The verifier column is the reason this matrix belongs in
the plan rather than being left to the author — Area 2 is where the verifier story turns over
mid-area, so *which* type each quest gets is a decision, not a default.

| id | Title | Session | Concepts | Verifier | DC |
|---|---|---|---|---|---|
| `a2-the-first-commit` | The First Commit | 2 | `repository`, `git-init`, `git-add`, `git-commit` | `git-signal: commit` | 5 |
| `a2-the-log-as-a-story` | The Log As A Story | 3 | `git-log`, `git-commit` | `peer-signoff: dm` | 8 |
| `a2-it-is-somewhere-else` | It Is Somewhere Else | 4 | `git-push`, `repository` | `git-signal: push` | 8 |
| `a2-where-the-file-lives` | Where The File Lives | 5 | `files-on-disk`, `running-scripts` | `local-repo` | 10 |
| `a2-its-own-python` | Its Own Python | 7 | `venv`, `pip`, `running-scripts` | `local-repo` | 12 |
| `a2-escape-the-sandbox` | **Boss 2 — Escape the Sandbox** | 8 | all fourteen | `local-repo` + `peer-signoff: dm` | **22** |

Boss 2 carries `requires: []`, for the reason Area 1's plan sets out: the 3-of-5 rule lives
in the engine as `bossUnlocked(clearedQuestCount)` and nothing reads `requires`. Three theme
framings per §5.2.

**`a2-the-log-as-a-story` is deliberately not a `git-signal`.** A signal can prove commits
exist; it cannot prove the log reads as a story, which is the entire concept. That one needs
a person, and the dm reads it back to him.

### The session beat worth planning around

**Area 0's six Journal entries and Area 1's ten become the first real commit in his
repository.** Sixteen entries of his own writing is a considerably better first commit than an
empty README, it gives session 2a-2 something real to put under version control, and §5.6's
commit-and-push half then arrives exactly on schedule rather than as a retrofit.

§7 is firm that **he owns a separate repository**, one repo for all his projects rather than
one per project, because his git log becomes a progress bar and diluting it into another
history breaks that. Reason 3 in §7 also constrains this session directly: *a first `git
commit` rejected by a linter he did not install and cannot read is a bad first day.* No hooks,
no CI, no ruff on his repository in week 6.

### `tracebacks`, third pass

`reading-errors` was Area 0 session 3 in the REPL. Loop errors were Area 1 session 6. Area 2b
tags `tracebacks` because the traceback changes shape once the code is in a file with a name
and a line number and an import — and because this is the first time a stack has more than
one frame in it. Say that in the README; it is the clearest example of §3 principle 7 in the
campaign.

## Phases

### Phase 1 — the DM guide, and the remote decision

Write `dm-guide.md` first. Predict the stalls by name: the merge he did not ask for, the
detached HEAD, the file he edited in the wrong directory, the venv he forgot to activate,
`pip install` into the wrong interpreter. Give the exact question, not "ask a Socratic
question."

Settle the remote (Gitea, USB bare repo, or local second directory) and write the session so
the DM can substitute on the night.

### Phase 2 — 2a sessions and exercises [ASYNC with Phase 3]

Sessions 1–4. Git is not `.py`, so most of this area's exercise directory is markdown
walk-throughs, a `.gitignore`, and a small number of Python files that exist to be committed.

**`verify.py`'s contract, stated because "N of N" is meaningless otherwise.** The harness
covers **runnable `.py` exercises only**, and N is the count of those — likely three or four
in this area, against Area 0's nineteen. That is honest, not a shortfall: there is nothing to
execute in "make a commit, then read the log." The markdown and git walkthroughs are audited
by a **completion checklist in the README** — one line per walkthrough, checked by the author
having followed it — and the README states both numbers so nobody reads a small N as thin
coverage. A harness that silently counts zero files is worse than one that says what it does
not cover.

The Journal migration lands here.

### Phase 3 — the VS Code profile [ASYNC with Phase 2, but must finish before Phase 4]

A **`.code-profile`** file, produced by VS Code's own *Profiles: Export Profile* command and
installed with *Profiles: Import Profile*. One artifact, checked into
`curriculum/area-2/vscode-profile/`, so his laptop is set up by importing a file rather than
by twenty minutes of settings-toggling on a school night.

Visible: explorer, editor, integrated terminal. Hidden: activity bar, minimap, breadcrumbs,
status bar, editor tabs, outline, problems, source control, testing, extensions. Exactly one
extension — `ms-python.python`, which brings `debugpy`. Running a file needs no extension;
stepping through one does, and that rung is Area 3's.

**Import it on his laptop and confirm it, before session 6 is written.** An exported profile
is a JSON blob and reading one proves nothing — VS Code silently ignores settings it does not
recognise, and a profile that exports cleanly can import into a UI that still shows every
panel the strip was meant to remove. So: import, look, and check the list. Every hidden view
actually hidden, `ms-python.python` present, and a `.py` file running from the integrated
terminal. **This is the step that makes Area 2 teachable**, and it is an hour of work
according to the stub, so there is no reason for it to be the thing that slips.

Then `curriculum/area-2/vscode-profile/README.md`, carrying **the full ladder**, not just
this area's rung:

| Restored | At | Because |
|---|---|---|
| Breakpoints, Run and Debug | Area 3 | nested loops and dict iteration are where stepping becomes revelatory |
| Outline, breadcrumbs | Area 4 | files gain functions worth navigating between |
| Extensions view | Area 6 | `dependencies` enters the curriculum |
| Problems panel | Area 7 | ruff and pyright, and the Idiomatic medal |
| Source control view | Area 7 | after the git commands are muscle memory, so the GUI is a convenience and never a crutch |

The ladder is currently spread across five plans and stubs. Writing it once, beside the
profile it modifies, is what stops a later area restoring the wrong rung or missing one.

**This phase gates Phase 4.** It can be authored in parallel with the 2a sessions, but
session 6 *is* the VS Code session and sessions 5–8 cannot be finalised against a profile
that does not exist yet.

### Phase 4 — 2b sessions and exercises [needs Phase 3]

Sessions 5–8: files on disk and where a file actually goes; `python thing.py`; VS Code; venv
and `pip` and the two-interpreter trap this machine actually has; tracebacks with real
frames; `if __name__ == "__main__"` at the end, once he has a module he wants to import.

### Phase 5 — the content items

Confirm `breakpoints` is already in `concepts.ts` from `main`'s prerequisite commit — if it
is not, stop, because adding it here is the collision this split exists to prevent. Then five
`a2-` quests and Boss 2, scaffolded and filled, hidden tests written, `validate:content`
exiting 0.

### Phase 6 — verify, README, board

`py -3.14 verify.py` to a recorded count. README with the session table, the 2a/2b boundary,
the ordering argument, DC choices, and the concept coverage table — `curriculum/area-2/README.md`,
this track's own file. Report the status line to `main` for `curriculum/README.md` rather than
editing the index.

## Dependencies / Prerequisites

**Authoring order and delivery order are different things, and only the first one gates
this plan.** Area 2 is delivered to the learner after Area 1, because weeks 6–8 follow
weeks 3–6. It is *authored* independently of Area 1 and can be written in parallel with it:
nothing in these sessions reads an Area 1 exercise, quest or journal entry.

The one place that looked like a dependency is the Journal migration in session 2a-2, and
it is not one. The beat is "put your journal under version control," and it works with
whatever entries exist on the night — six if Area 1 has not run, sixteen if it has. The
session is written to say *his entries*, never a count, so it does not go stale either way.

- **Nothing blocking the curriculum.** Git and Python are enough.
- **`feature_gitea-lan-access-for-the-son_2026-08-27.md`** blocks the *game* half — the
  `git-signal` quest and the "board updates by itself" moment. Named, not absorbed.
- **Lane A Phase 1.5** (Gitea, `git-signal`, Journal) is what makes the `git-signal` quests
  actually fire. The `content/` YAML can be authored ahead of it and simply sits inert.
- **The son's laptop, with VS Code installed, is needed during Phase 3 — not at session
  2b-1.** The profile has to be imported and confirmed on the machine it is for, and that
  cannot be done from the parent's desk. This is the same shape as the world shim's
  requirement to measure framerate on the son's laptop rather than the RTX 5090: an artifact that
  has only been authored has not been verified.

## Files Expected to Change

- `curriculum/area-2/**` — new, both halves
- `curriculum/area-2/vscode-profile/pyquest-area2.code-profile` — the artifact, exported from
  VS Code and confirmed by importing it on the son's laptop
- `curriculum/area-2/vscode-profile/README.md` — the install and import steps, and the full
  un-stripping ladder for Areas 3, 4, 6 and 7
- `content/areas/area-2.yml` — new
- `content/quests/a2-*.yml` + briefs, tests — new, six items
The VS Code stub is **not** in this list. It was promoted out of `backlog/` to
`planning/completed/feature_vscode-profile-and-tool-quests_2026-08-28.md` on 2026-08-29, when
its trigger fired, and its Status block records that its Area 2b rung is this plan's Phase 3.
This track inherits the work, not the file.

**Owned by `main`, not this track:** `curriculum/README.md`, and
`pyquest/packages/content/src/concepts.ts` — the `breakpoints` line this plan argues for is
a prerequisite `main` lands before the track starts.

**Owned by the `area-1` track:** `curriculum/area-1/**`, including the journal entries this
area's session 2a-2 puts under version control. An earlier draft listed those entries here
as "read only," which was wrong twice over — this plan does not write them, and a file it
does not write does not belong in a list of files expected to change. The learner's entries
are copied into **his** repository during the session; nothing in this repository moves.

## Out of Scope

The Gitea configuration itself, the firewall, and anything under `infra/`. This plan names
that dependency and works without it.

The later VS Code un-stripping rungs. Area 2b restores nothing; it ships the stripped profile
and the ladder is authored per-area from Area 3 onward.

Any hook, linter or CI on **his** repository. §7 reason 3 is explicit and this is week 6.
