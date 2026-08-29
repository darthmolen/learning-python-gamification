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
- [ ] Boss 2 passes its real win condition: the parent clones his repository **cold**, on a
      different machine, and it runs. Not "tests pass"
- [ ] Area 0's and Area 1's Journal entries become the first real commit in his repository
- [ ] `breakpoints` at area 3 exists in `concepts.ts` **before this track starts** — the
      one Lane A/B crossing, argued here and landed by `main`
- [ ] The stripped VS Code profile exists as one exportable file, installed in session 2b-1
- [ ] `npm run validate:content` exits 0 with five `a2-` quests and Boss 2
- [ ] `py -3.14 verify.py` reports N of N
- [ ] Area 2 reported to the `main` track for the `curriculum/README.md` status table

## Approach

**The fourteen concepts**, verbatim from `concepts.ts`:

- **2a:** `repository` · `git-init` · `git-add` · `git-commit` · `git-log` · `git-branch` ·
  `git-push`
- **2b:** `files-on-disk` · `running-scripts` · `vscode` · `venv` · `pip` · `tracebacks` ·
  `main-guard`

Roughly eight sessions across three weeks, numbered 1–8 in one `sessions/` directory with the
2a/2b boundary marked in the README rather than in the filesystem. One area, one verify
harness, one DM guide.

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

### Promote the VS Code backlog item into this plan

`planning/backlog/feature_vscode-profile-and-tool-quests_2026-08-28.md` is Area 2b material —
its own trigger says "Area 2b, week 7, when VS Code enters the curriculum and the profile has
to exist." Its decision is already made and argued: strip VS Code via an exportable profile
and un-strip it one rung at a time, rather than build a custom editor.

This plan delivers **the profile and the Area 2b rung only.** Later rungs (Area 3
breakpoints, Area 4 outline, Area 6 extensions, Area 7 problems and source control) are
authored by their own area plans. Move the stub to `in-progress/` alongside this plan or
leave it in backlog with a note that its first rung shipped — the plan should say which.

**The `concepts.ts` edit — argued here, landed by `main`.** The stub's open decision is
settled here: register **`breakpoints` at area 3** for stepping and the Variables panel,
keeping **`debugger` at area 7** for the deep pass — conditional breakpoints, exception
breakpoints, logpoints, the call stack. Two concepts, two passes, per §3 principle 7. Without
this edit the validator's `concept-above-area` rule correctly rejects an Area 3 debugging
quest, and the rule is right — the fix is a decision, not a bypass.

This is **the only file Lane B and Lane A share**, and it is read by every area track through
`validate:content` — an id moving under a running track breaks it. So this plan makes the
decision and `main` makes the edit, before any area track starts, as its own commit:
`planning/feature_shared-index-and-concepts_2026-08-29.md`. If that has not landed, this
track and Area 3 are both blocked and neither adds the id itself.

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
`verify.py` still runs what Python there is.

The Journal migration lands here.

### Phase 3 — the VS Code profile [ASYNC with Phase 2]

One exportable profile file. Visible: explorer, editor, integrated terminal. Hidden: activity
bar, minimap, breadcrumbs, status bar, editor tabs, outline, problems, source control,
testing, extensions. Exactly one extension — `ms-python.python`, which brings `debugpy`.
Running a file needs no extension; stepping through one does, and that rung is Area 3's.

### Phase 4 — 2b sessions and exercises

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
- The son's laptop needs VS Code installed before session 2b-1.

## Files Expected to Change

- `curriculum/area-2/**` — new, both halves
- `curriculum/area-2/vscode-profile/` — the exportable profile and its install note
- `content/areas/area-2.yml` — new
- `content/quests/a2-*.yml` + briefs, tests — new, six items
- `planning/backlog/feature_vscode-profile-and-tool-quests_2026-08-28.md` — status note.
  **This track owns the stub**; Area 3 ships its own rung but does not edit this file

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

---

## Plan Review

**Reviewed:** 2026-08-29 10:26
**Reviewer:** Claude Code (plan-review-intake)

### Strengths

- **Objective / Why this exists:** Strong case for keeping 2a+2b in one plan; matches spec §4's shared Area 2/boss structure.
- **Tension / resolution:** "Teaching vs. applause" split is clear and correctly keeps Lane B independent of Gitea.
- **Files ownership:** Correctly keeps `curriculum/README.md` and `concepts.ts` on `main`. Journal ownership framing is correct.

### Issues

#### Critical (Must Address Before Implementation)

- **Prerequisite plan reference (Approach / Success Criteria)**
  - What's wrong: `planning/feature_shared-index-and-concepts_2026-08-29.md` was not found at that exact path during review grounding.
  - Why it matters: The plan treats it as a gating prerequisite for `breakpoints`; a nonexistent reference means the gate cannot be checked.
  - Suggested fix: Verify the path and file name match the actual `main`-track plan once it is created. (Note: the shared-index plan is in `planning/in-progress/` and may have a different filename.)

- **File set / stub ownership ambiguity (Files Expected to Change)**
  - What's wrong: This plan claims ownership of `planning/backlog/feature_vscode-profile-and-tool-quests_2026-08-28.md`, and Area 3 also references that stub as area-2-owned. `planning/in-progress/` is currently empty, so no live collision now, but the canonical plan path and ownership need to be unambiguous before either track starts.
  - Suggested fix: Name exactly where the stub will be moved and by whom, once.

- **Boss 2 cold-clone win condition under-specified (Success Criteria / Verifiers)**
  - "Parent clones cold on a different machine and it runs" stated but not procedurally defined.
  - Why it matters: Cannot write the session, quest verifier notes, or README acceptance proof consistently without concrete steps.
  - Suggested fix: Add required evidence: fresh directory, no reused venv, exact run command, what "runs" means, and what artifact records pass/fail.

#### Important (Should Address)

- **Quest/Boss specification missing (Phase 5)**
  - Five quests + Boss 2 with no concept/verifier/DC matrix.
  - Suggested fix: Add a quest matrix with id, title, concepts, verifier type (`git-signal`/`local-repo`/`peer-signoff`), and DC target.

- **`verify.py` scope for git-heavy area (Phase 2 / Phase 6)**
  - Most 2a exercises are markdown/git workflows, not `.py` files. "N of N" is undefined for non-Python artifacts.
  - Suggested fix: Specify whether `verify.py` covers only runnable `.py` exercises, with README separately auditing markdown/git walkthrough completeness.

- **Phase 2/3/4 dependency partially wrong (Phases)**
  - Phase 2 and 3 marked async, but Phase 4 (sessions 5–8) depends on the Phase 3 VS Code profile for session 2b-1.
  - Suggested fix: State Phase 3 can run parallel with 2a authoring but must finish before finalizing sessions 5–8.

- **DC band missing (Phase 6)**
  - Plan promises README "DC choices" but never states Area 2's target band.
  - Suggested fix: Add an explicit DC range and where Boss 2 sits within it.

#### Minor (Consider)

- **VS Code profile format:** "One exportable file" is vague. Name the VS Code profile export/import flow and artifact type.
- **Session table missing:** Eight sessions numbered 1–8 is stated; a session title table in the plan would reduce authoring ambiguity about the 2a/2b boundary.
- **Area 0 is the only existing area yml exemplar** in `content/areas/` — worth stating explicitly as the model.

### Recommendations

Fix the prerequisite path reference first. Add the Boss 2 cold-clone acceptance procedure and a quest/concept/DC matrix. Clarify `verify.py`'s contract for non-Python exercises. State the DC band explicitly.

### Assessment

**Implementable as written?** With fixes

**Reasoning:** The instructional direction is strong and spec-consistent, but the missing prerequisite file reference, ownership ambiguity on the VS Code stub, and under-specified Boss 2 win condition and quest details would create execution drift.
