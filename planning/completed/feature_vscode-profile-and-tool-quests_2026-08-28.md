# The Stripped VS Code Profile, and Tool Quests

**Status:** Completed as a planning item — the work is Area 2 Phase 3
**Date Discovered:** 2026-08-28
**Discovered During:** the UI design session for `feature_phase0-tier0-foundation_2026-08-27.md`

## Context

VS Code's defaults are hostile to an 11-14-year-old: activity bar, minimap,
breadcrumbs, problems panel, git decorations, extension prompts, notifications. The
question raised was whether to build a simple browser or Electron editor instead —
file tree left, editor above, terminal below.

**Decided: no. Strip VS Code instead, and un-strip it as he progresses.**

Three reasons a custom editor loses:

1. **It fights §6.4.** Push is the verification mechanism precisely because the API
   runs on the parent's machine and the code lives on the son's. A browser IDE served
   from the parent's PC edits the wrong filesystem; making it real needs a local agent
   on the son's laptop, so it becomes a bespoke editor *and* a sync daemon maintained for a
   year, for one user.
2. **It rebuilds the trap the spec exists to avoid.** §2.3 diagnoses graduates who
   "cannot ship an original project, having never left the browser sandbox or learned
   where a file goes," and §3.8 is *leave the sandbox early and permanently*. A
   comfortable custom editor is the sandbox with better manners.
3. **It is not needed yet.** The Quest screen (CodeMirror + Pyodide) is already the
   gentle editor for Areas 0–1, and Area 0 wants no editor at all — the parent guide
   says Notepad is sufficient and that VS Code is Area 2b vocabulary which "costs a
   session for no gain" if installed early.

This is the same shape as the decision the Ursina spike already made: scaffolding
*inside* the real thing, retired on a schedule, rather than a substitute that must be
abandoned. `world.py` comes down by Boss 5; the editor chrome comes back one setting
at a time. Per the decision log: scaffolding that never comes down is CodeCombat.

## What this needs to produce

**A VS Code Profile**, exportable as one file and installed on his laptop at Area 2b.
Visible: explorer, editor, integrated terminal. Hidden: activity bar, minimap,
breadcrumbs, status bar, editor tabs, outline, problems, source control, testing,
extensions view. Exactly one extension — `ms-python.python`, which brings `debugpy`.
Running a file needs no extension; stepping through one does.

**An un-stripping ladder**, each rung a quest rather than a settings edit done for him:

| Restored | At | Because |
|---|---|---|
| Breakpoints and the Run and Debug view | Area 3 | nested loops and dict iteration are where stepping becomes revelatory |
| Outline, breadcrumbs | Area 4 | files gain functions worth navigating between |
| Extensions view | Area 6 | `dependencies` enters the curriculum |
| Problems panel | Area 7 | ruff and pyright, and the Idiomatic medal |
| Source control view | Area 7 | branches and pull requests — deliberately after the commands are muscle memory, so the GUI is a convenience and never a crutch |

**Tool quests need no new machinery.** A quest with a `peer-signoff` verifier covers
them: the parent watches him set a breakpoint and step to the failing line, then presses
the button. Teach-back applies on top.

## Open decision

`debugger` is registered as a **Area 7** concept, so an Area 3 debugging quest is
rejected by the validator's concept-above-area rule. That rule is working as designed;
the fix is a decision, not a bypass. Preferred: add `breakpoints` at Area 3 for
stepping and the Variables panel, and keep `debugger` at Area 7 for the deep pass —
conditional breakpoints, exception breakpoints, logpoints, the call stack. Two
concepts, two passes, per §3.7.

**The best single feature for this curriculum** is the exception breakpoint: it stops
at the moment `KeyError` is raised with the whole inventory still on screen. That is
Area 0's *errors are readable* promise made interactive, four areas later, on the same
bug the Quest screen prototype already uses.

## Trigger for Promotion

**Area 2b, week 7**, when VS Code enters the curriculum and the profile has to exist.
Authoring the profile is an hour; the ladder is authored per-area alongside the quests
that unlock each rung.

---

## Status

**Final Status:** Completed
**Completed:** 2026-08-29
**Completed By:** Claude (Opus 5)

**Completed as a planning item, not as an artifact.** The `.code-profile` does not exist
yet. What is finished is the thing a backlog stub is for: the decision is made, argued, and
assigned to a track with a verification step attached.

### Outcomes

The Trigger for Promotion below reads *"Area 2b, week 7, when VS Code enters the curriculum
and the profile has to exist."* That fired on 2026-08-29 when Area 2 was planned, so this
leaves `backlog/` rather than sitting there annotated.

**Absorbed into `planning/feature_area-2-scribes-rite-and-sandbox_2026-08-28.md` rather than
promoted to its own track**, for a mechanical reason: Area 2 already claims
`curriculum/area-2/vscode-profile/` in its Files Expected to Change, so a separate plan would
have collided on the exact file it existed to produce. It is that plan's **Phase 3**.

What Area 2 now carries that this stub could not:

- The artifact is named — `pyquest-area2.code-profile`, exported with *Profiles: Export
  Profile*, imported with *Profiles: Import Profile*.
- **It must be imported on the son's laptop and confirmed working** before session 6 is
  written — every hidden view actually hidden, `ms-python.python` present, a `.py` file
  running from the integrated terminal. Verified by importing it, never by reading the JSON,
  because VS Code silently ignores settings it does not recognise and a profile can export
  cleanly and import into a UI that still shows everything.
- Phase 3 gates Phase 4, since session 6 *is* the VS Code session.
- **Area 2 is not ready to be taught until this passes**, stated as a success criterion
  rather than a phase step. Teaching session 6 against stock defaults is not a reduced
  version of the area; it is the thing this stub's decision rejected.

The open decision here — `breakpoints` at Area 3 for stepping, `debugger` at Area 7 for the
deep pass — was settled and **landed** on 2026-08-29 by
`planning/completed/feature_shared-index-and-concepts_2026-08-29.md` (`d3eb9f7`, `c90202e`).
The validator's `concept-above-area` rule no longer blocks an Area 3 debugging quest.

### Deviations

An earlier draft of Area 2 said this stub would *stay* in `backlog/` with a status note,
reasoning that four unshipped rungs meant it was not complete. That conflated the stub with
the ladder. The stub is a planning item and its planning is done; the ladder is teaching
content and belongs with the profile.

So the ladder is not left in this document. Phase 3 writes it out in full in
`curriculum/area-2/vscode-profile/README.md`, beside the profile it un-strips, where a later
area looks. It is currently spread across five plans and stubs, which is how a rung gets
missed or restored in the wrong area.

### Lessons Learned

**A backlog item whose trigger has fired is promoted, not annotated.** The trigger is the
mechanism; leaving the item in place because some part of it reaches further out is how a
board stops describing reality.

**"Ships as an export" is an authoring claim, not a verification.** The first pass at Area 2
said the profile ships as a `.code-profile` and stopped there — the same defect the world
shim plan avoids by demanding measured framerate on the son's laptop rather than a shim that exists.
An artifact that has only been authored has not been verified, and this one is an hour of
work, so there is no reason for it to be the step that slips.

### Backlog Items Created

None. The four later rungs are carried by the Area 3, 4, 6 and 7 plans and stubs, and are
now also written out in one place by Area 2's Phase 3.
