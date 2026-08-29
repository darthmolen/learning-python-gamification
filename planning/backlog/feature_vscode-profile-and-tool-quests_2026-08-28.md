# The Stripped VS Code Profile, and Tool Quests

**Status:** Backlog
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
