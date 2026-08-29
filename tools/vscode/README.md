# The Stripped VS Code Profile, and the Un-stripping Ladder

> ## ⚠ NOT YET VERIFIED
>
> `pyquest-area2.code-profile` in this directory is **hand-authored, not exported**, and
> **has not been imported on the son's laptop.** Until §4 has been worked through on that
> machine and this banner deleted, **Area 2 is not ready to be taught** — session 6 is the
> VS Code session and the whole argument for a profile is that stock defaults are the
> thing being rejected.
>
> An exported profile is a JSON blob and reading one proves nothing. VS Code silently
> ignores settings it does not recognise, and a profile that exports cleanly can import
> into a UI that still shows every panel the strip was meant to remove. **Import it, look
> at it, work §4, then re-export over this file.**

---

## 1. Why a profile and not a custom editor

The question that produced this directory was whether to build a simple editor instead —
file tree on the left, editor above, terminal below. The answer was no, for three
reasons, and they are worth keeping because they will be asked again.

1. **It fights §6.4.** Push is the verification mechanism precisely because the API runs
   on the parent's machine and the code lives on the son's. A browser IDE served from the
   parent's PC edits the wrong filesystem; making it real needs a local agent on the
   laptop, so it becomes a bespoke editor *and* a sync daemon, maintained for a year, for
   one user.
2. **It rebuilds the trap the spec exists to avoid.** §2.3 diagnoses graduates who
   "cannot ship an original project, having never left the browser sandbox or learned
   where a file goes," and §3 principle 8 is *leave the sandbox early and permanently.* A
   comfortable custom editor is the sandbox with better manners.
3. **It is not needed.** The Quest screen (CodeMirror plus Pyodide) is already the gentle
   editor for Areas 0–1, and Area 0 wants no editor at all — its DM guide says Notepad is
   sufficient and that VS Code is Area 2b vocabulary which "costs a session for no gain"
   if installed early.

This is the same shape as the decision the Ursina spike made: **scaffolding inside the
real thing, retired on a schedule**, rather than a substitute that must later be
abandoned. `world.py` comes down by Boss 5; the editor chrome comes back one rung at a
time. Scaffolding that never comes down is CodeCombat.

---

## 2. What the profile does

**Visible:** the explorer, the editor, the integrated terminal. Nothing else.

**Hidden:** activity bar, minimap, breadcrumbs, status bar, editor tabs, outline,
problems, source control, testing, extensions.

**Exactly one extension:** `ms-python.python`, which brings `debugpy` with it. Running a
file needs no extension at all; stepping through one does, and that rung is Area 3's.

**Git integration is off** (`git.enabled: false`). That is not chrome-trimming, it is the
last rung of the ladder being enforced: he learns git as commands at a terminal, for four
sessions, before a GUI ever offers to do it for him. Source control comes back at Area 7,
after the commands are muscle memory, so the GUI is a convenience and never a crutch.

---

## 3. Installing it

On his laptop, with VS Code already installed:

1. `Ctrl+Shift+P` → **Profiles: Import Profile**
2. Choose **Select File**, and pick `pyquest-area2.code-profile`
3. Name it `PyQuest` when asked, and switch to it

To go back to a normal VS Code at any time: `Ctrl+Shift+P` → **Profiles: Switch
Profile** → *Default*. **Say this to him out loud in session 6.** A stripped editor he
cannot escape is a cage; a stripped editor he chose and can leave is a tool with the
noise turned down, and the difference is entirely in whether he knows about that command.

---

## 4. The verification checklist — the son's laptop gate

**Work this on the son's laptop, not on the parent's machine.** An artifact that has only
been authored has not been verified. Tick every line, then delete the banner at the top
of this file and record the date.

**Chrome:**

- [ ] No activity bar down the left edge
- [ ] No minimap on the right of the editor
- [ ] No breadcrumb bar above the editor
- [ ] No status bar along the bottom
- [ ] No editor tab strip — one file showing at a time
- [ ] No Outline section in the explorer
- [ ] No Problems panel
- [ ] No Source Control view, and no git colours or badges on filenames
- [ ] No Testing view
- [ ] No Extensions view

**Function:**

- [ ] `ms-python.python` is installed, and it is the only extension in this profile
- [ ] A `.py` file opens and shows syntax colours and line numbers
- [ ] `Ctrl+`` opens an integrated terminal, in the folder that is open
- [ ] `py -3.14 motto.py` runs in that terminal and prints
- [ ] Editing without saving leaves a visible dot, and running picks up the **old**
      file — the session 6 stall, confirmed as real rather than assumed
- [ ] **Profiles: Switch Profile** returns a normal VS Code, and switching back restores
      the strip

**Then:**

- [ ] Re-export with **Profiles: Export Profile → Save to file**, and overwrite
      `pyquest-area2.code-profile` with the result
- [ ] Copy the settings back into §5 below if the export changed any of them
- [ ] Delete the banner at the top of this file and write the date it was verified

### The thing that makes the re-export non-optional

**Half of the strip is not settings.** These are settings and they travel in the JSON:

> activity bar · minimap · breadcrumbs · status bar · editor tabs · sticky scroll ·
> git integration

These are **view visibility**, which VS Code stores as UI state rather than in
`settings.json`:

> Outline · Problems · Source Control view · Testing · Extensions view

Hiding a view means right-clicking it and unticking it in the running editor. It is
captured in the profile's `globalState` when you export, and the `globalState` in the
hand-authored file is empty because there was no editor to capture it from.

**So the hand-authored file gets you most of the way and cannot get you all the way.**
Import it, hide the remaining five views by hand, verify the whole checklist, and
re-export. That single re-export is what turns this directory from a plan into an
artifact — and it is the reason the plan made "imported and confirmed on his laptop" a
success criterion rather than a nicety.

*(Hiding the activity bar removes the icons for Source Control, Testing and Extensions,
so most of the second list stops being reachable by mouse the moment the profile
imports. That is not the same as those views being hidden, and it is why the checklist
asks you to look rather than to reason.)*

---

## 5. The settings, and why each group is there

Reproduced here in readable form. This is the review surface — nobody should have to
read escaped JSON to find out what was done to his editor — and it is the fallback if
the import does not work: paste it into `settings.json` on the `PyQuest` profile.

```jsonc
{
    // The chrome the strip removes.
    "workbench.activityBar.location": "hidden",
    "workbench.statusBar.visible": false,
    "workbench.editor.showTabs": "single",
    "workbench.editor.empty.hint": "hidden",
    "workbench.startupEditor": "none",
    "editor.minimap.enabled": false,
    "breadcrumbs.enabled": false,
    "editor.stickyScroll.enabled": false,
    "editor.lightbulb.enabled": "off",

    // Noise. Tips, experiments, release notes, telemetry, extension nagging.
    "workbench.tips.enabled": false,
    "workbench.enableExperiments": false,
    "workbench.welcomePage.walkthroughs.openOnInstall": false,
    "extensions.ignoreRecommendations": true,
    "update.showReleaseNotes": false,
    "telemetry.telemetryLevel": "off",

    // Git, deliberately off until Area 7. He learns the commands first.
    "git.enabled": false,
    "git.decorations.enabled": false,
    "git.openRepositoryInParentFolders": "never",

    // Kept on purpose, and each one is a decision.
    "editor.fontSize": 15,
    "editor.lineNumbers": "on",
    "editor.renderWhitespace": "none",
    "editor.inlineSuggest.enabled": false,
    "editor.formatOnSave": false,
    "explorer.compactFolders": false,
    "workbench.editor.enablePreview": false,
    "files.autoSave": "off",
    "terminal.integrated.fontSize": 14,
    "python.terminal.activateEnvironment": false
}
```

Four of those are arguments rather than preferences:

- **`editor.inlineSuggest.enabled: false`.** §5.12 makes AI a named, costed move with a
  medal attached — Conjured, at −5 DC. Ambient autocomplete finishing his lines is that
  move happening constantly, invisibly, and for free. It comes back when he asks for it,
  and asking for it is the point.
- **`files.autoSave: "off"`.** Running a stale file because he did not save is session
  6's named stall, and it is a two-minute lesson about what the dot on the tab means. Auto
  save would remove the stall and the lesson with it.
- **`python.terminal.activateEnvironment: false`.** Session 7 is entirely about which
  Python is running. An editor that silently activates the venv for him teaches that
  environments are something that happens to you. **Area 3 may flip this once the lesson
  has landed**, and flipping it is a fine thing to do deliberately.
- **`editor.formatOnSave: false`.** §7 reason 3: no hooks, no CI, no linter on his
  repository. A first commit rejected by a tool he did not install and cannot read is a
  bad first day, and a formatter silently rewriting his file is the same idea wearing a
  friendlier hat. Formatting arrives at Area 7 with the Idiomatic medal.

**No `python.defaultInterpreterPath` and no `terminal.integrated.defaultProfile`.** Both
are machine-specific, and a profile that hard-codes one machine's paths is a profile that
breaks silently on the next machine. Set them locally on the son's laptop if needed; do not
commit them here.

---

## 6. The un-stripping ladder

The whole ladder, all five rungs, written here rather than scattered across five plans —
so that the Area 3, 4, 6 and 7 authors can find their rung without opening an archived
backlog stub.

| Rung | Restored | At | Because |
|---|---|---|---|
| 1 | Breakpoints, the Run and Debug view | **Area 3** | nested loops and dict iteration are where stepping becomes revelatory |
| 2 | Outline, breadcrumbs | **Area 4** | files gain functions worth navigating between |
| 3 | Extensions view | **Area 6** | `dependencies` enters the curriculum |
| 4 | Problems panel | **Area 7** | ruff and pyright, and the Idiomatic medal |
| 5 | Source control view | **Area 7** | after the git commands are muscle memory, so the GUI is a convenience and never a crutch |

**Area 2b restores nothing.** It ships the strip. The ladder starts at Area 3.

### The rule for how a rung ships

This is the part a later area needs and the part it cannot infer from the table:

> Each rung is a **quest, not a settings edit done for him.** It needs no new machinery: a
> `peer-signoff` verifier covers it — the dm watches him use the restored view for its
> actual purpose and presses the button. Teach-back applies on top, the same as any
> quest. A rung is not "turn the setting back on"; it is "show me you need it."

So an area author restoring a rung writes **one quest**, with `verifier: {type:
peer-signoff, by: dm}`, and edits this file. Nothing in `packages/` changes. There is no
tool-quest verifier to build and there never was.

### What an area does when its rung ships

1. Author the quest, `peer-signoff: dm`, with the concept tag its area owns.
2. Turn the setting back on in `pyquest-area2.code-profile` **on his laptop**, by using
   the editor, and re-export over the file — the same loop as §4. The profile is the one
   artifact; it is not per-area and it is not copied.
3. Add a line to the table below.

| Rung | Shipped | By | Date |
|---|---|---|---|
| — | *(the strip itself)* | Area 2b | *pending laptop verification* |

### The concept ids, settled

`breakpoints` is registered at **area 3** — stepping and the Variables panel. `debugger`
stays at **area 7** for the deep pass: conditional breakpoints, exception breakpoints,
logpoints, the call stack. Two concepts, two passes, per §3 principle 7.

Without that split the validator's concept-above-area rule correctly rejects an Area 3
debugging quest, and the rule is right — the fix was a decision, not a bypass. It landed
on `main` on 2026-08-29 (`c90202e`).

**The best single feature for this curriculum is the exception breakpoint**: it stops at
the moment `KeyError` is raised with the whole inventory still on screen. That is Area 0's
*errors are readable* promise made interactive, four areas later, on the same bug the
Quest screen prototype already uses. It belongs to `debugger` at Area 7, not to
`breakpoints` at Area 3, and Area 7's author should be told so.
