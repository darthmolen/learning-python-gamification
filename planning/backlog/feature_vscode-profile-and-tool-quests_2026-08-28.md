# The Stripped VS Code Profile, and Tool Quests

**Status:** Backlog — fully specified by Area 2 Phase 3; closes when that ships
**Date Discovered:** 2026-08-28
**Discovered During:** the UI design session for `feature_phase0-tier0-foundation_2026-08-27.md`

## Context

VS Code's defaults are hostile to an 11–14-year-old: activity bar, minimap,
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

## The open decision — settled, and landed

`debugger` was registered as an **Area 7** concept, so an Area 3 debugging quest was
rejected by the validator's concept-above-area rule. That rule was working as designed;
the fix was a decision, not a bypass. The decision: add `breakpoints` at Area 3 for
stepping and the Variables panel, and keep `debugger` at Area 7 for the deep pass —
conditional breakpoints, exception breakpoints, logpoints, the call stack. Two
concepts, two passes, per §3.7.

**Landed by `main` on 2026-08-29**, on a track no area holds, because `concepts.ts` is
the one file Lane A and Lane B share and an id moving under a running area track breaks
it: `d3eb9f7` added `breakpoints` to spec §4's Area 3 vocabulary line, and `c90202e`
registered `{ id: 'breakpoints', label: 'breakpoints', area: 3 }`. Nothing here is
waiting on it.

**The best single feature for this curriculum** is the exception breakpoint: it stops
at the moment `KeyError` is raised with the whole inventory still on screen. That is
Area 0's *errors are readable* promise made interactive, four areas later, on the same
bug the Quest screen prototype already uses.

## Where the work lives now

**Fully specified by `planning/feature_area-2-scribes-rite-and-sandbox_2026-08-28.md`,
Phase 3.** That plan names the artifact (`pyquest-area2.code-profile`, exported with
*Profiles: Export Profile*), requires it to be **imported on the son's laptop and confirmed
working** rather than merely authored, gates its Phase 4 on it, and makes it a success
criterion — Area 2 is not ready to be taught until the profile passes. Phase 3 also writes
the full un-stripping ladder into `tools/vscode/README.md`.

Nothing here needs its own planning session any more. **Do not re-plan this item**, and do
not open a separate track for it: Area 2 already claims
`tools/vscode/`, so a second plan would collide on the exact file it
existed to produce.

## Trigger for Promotion

**None — this item does not get promoted. It closes.**

It moves straight to `planning/completed/` when Area 2's Phase 3 ships the profile and the
ladder, and not before.

**Status as of 2026-08-29, evening.** Area 2's Phase 3 has shipped its authoring half and
is stopped at its verification half:

- `tools/vscode/README.md` — **done.** Install steps, the son's laptop
  verification checklist, the whole five-rung ladder, and the rule for how a rung ships.
  Areas 3, 4, 6 and 7 can author their rung from that file alone and no longer need to
  open this stub.
- `tools/vscode/pyquest-area2.code-profile` — **exists, and is not
  verified.** It is hand-authored in VS Code's export shape, not produced by *Profiles:
  Export Profile*, because the son's laptop was not available. It carries a NOT YET
  VERIFIED banner.

**So this item stays open, and the reason is sharper than "not finished yet."** Half the
strip is not settings: activity bar, minimap, breadcrumbs, status bar, tabs and git
integration are `settings.json` keys and travel in the JSON, but Outline, Problems, Source
Control, Testing and Extensions are *view visibility* — UI state, captured in the
profile's `globalState` on export, and empty in a hand-authored file because there was no
running editor to capture it from. A hand-written profile therefore **cannot** get all the
way there, whoever writes it.

The remaining work is one sitting at the son's laptop: import, hide the five views by hand, work
the checklist, re-export over the file, delete the banner. Then this closes.

*This was briefly moved to `completed/` on 2026-08-29 on the reasoning that the stub's
planning was finished even though its artifact was not. That was wrong, and it is recorded
here rather than quietly undone.* `plan-workflow` defines `completed/` as "moved here
**after execution**", and the directory's other entries all represent shipped work — so a
zero-artifact entry beside them makes the board assert something false. The distinction
between "the planning is done" and "the thing exists" is real, but it is not a distinction
this board encodes, and inventing a category for it misleads the two people who read it.
