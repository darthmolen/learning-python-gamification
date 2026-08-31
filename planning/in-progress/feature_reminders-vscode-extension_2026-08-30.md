# Reminders as a First-Class Surface — a VS Code Extension for `set-reminders`

**Status:** In Progress
**Track:** reminders-ext
**Date:** 2026-08-30
**Author:** Claude (Opus 5)
**Lane:** Neither — tooling. It blocks nothing and nothing blocks it.

## Objective

Make `planning/reminders/` visible and actionable from inside VS Code — a count beside the
errors and warnings, a searchable list on a keystroke, and a panel beside Problems and
Terminal where a reminder can be read and closed. **The filesystem stays the persistence
layer and stops being the interface.**

Generic from day one: the extension knows the `set-reminders` contract, not PyQuest. It
ships as a standalone `.vsix` alongside the exported skill.

## Why this exists

`set-reminders` records the work no suite will ever notice was skipped. It solves the
*recording* problem completely and the *remembering* problem not at all — four open reminders
currently live in a directory nobody opens, which is the same failure mode the skill was
written to fix, moved one level up. A reminder that needs `ls planning/reminders/` to be seen
has the same half-life as a reminder that lived in a plan's prose.

The skill's own board query is a `grep` for open status. That is a command somebody has to
decide to run. The status bar is not.

Three of the four open reminders name the same afternoon on the same laptop. That grouping is
written into the prose of each file and visible nowhere — it is exactly what a list sorted by
`Subject` shows for free.

## Success Criteria

- [ ] A status bar item sits **in the left cluster, adjacent to Problems**, showing the count
      of open reminders. Verified by eye in the extension host, not by reading code. Deliberately
      not "immediately right of Problems": this ships to strangers whose status bars we do not
      control, and a criterion that fails because somebody installed an unrelated extension is
      measuring their machine rather than our work
- [ ] Clicking it opens a QuickPick of open reminders, grouped, fuzzy-searchable, with
      per-item actions — and **no filename appears anywhere in the open-reminder flow**. The
      malformed-file entry is the deliberate exception; a path is the only useful thing to say
      about a file that did not parse
- [ ] A **Reminders** view in the Panel, beside Problems / Output / Terminal, grouped by a
      configurable field, with a badge count and a welcome state when the board is clear
- [ ] Ticking a reminder's checkbox **prompts for the closing note** and writes both
      `**Status:** done` and the note back to the file. It never closes one silently
- [ ] A reminder written by an agent mid-session appears in all three surfaces **without any
      user action** — proven by writing a file from a shell while the host is running
- [ ] "Open plan" resolves the `planning/**/feature_*.md` glob and opens the plan wherever it
      currently sits. This is the manual step the glob convention was designed to make
      possible and nothing has ever automated
- [ ] **Zero PyQuest strings in the source.** Directory, group-by field, status vocabulary and
      the warn-on audience are all `contributes.configuration`
- [ ] The parser is pure and tested under vitest with `vscode` never imported — RED captured,
      GREEN, mutant seeded and caught, per `test-filter-development`
- [ ] `vsce package` produces a `.vsix` that installs clean with `code --install-extension`

## Approach

### The shape — the engine rule, applied again

```text
reminders/*.md  ──►  parse.ts (pure)  ──►  model  ──►  three surfaces
                                                 └──►  format.ts ──► write
```

`parse.ts` and `format.ts` import nothing from `vscode`. They take strings and return data,
which is the same boundary §6.7 puts around the engine and for the same reason: it is the
part that must not be wrong, so it is the part that is trivially testable. Everything that
touches VS Code is a thin shell over them and is exercised by hand in the host.

### The parse contract

Metadata is a bold-label block after the H1 — **not YAML frontmatter**, and not the filename.
The filename is a naming convention for humans and an unreliable parse target: `follow-up`
contains a hyphen, slugs contain hyphens, and only `_` separates the three parts. Parse the
body; fall back to the filename only for a missing `Raised` date.

```text
# <instruction>              → title
**Category:** …              → follow-up | decision | occasion | verify
**Audience:** …              → learner | dm | both
**Subject:** …               → free noun
**Raised:** YYYY-MM-DD
**Plan:** `planning/**/…`    → strip backticks; may be absent
**Status:** …                → open | done | dropped
## What to do                → first paragraph becomes QuickPick `detail`
```

Label match: `/^\*\*([A-Za-z][A-Za-z -]*):\*\*\s*(.*)$/`. Unknown labels are kept verbatim
rather than dropped — the skill will grow fields and the extension must not lose them on
write-back. A file that parses to no `Status` is surfaced as malformed with its path, not
silently skipped; silently skipping a reminder is the one bug that defeats the whole point.

### The three surfaces

**Status bar.** `createStatusBarItem('reminders.count', StatusBarAlignment.Left, priority)`,
where `priority` comes from `reminders.statusBarPriority`, **default 49**.

Where 49 comes from, and why it is a default rather than a constant: VS Code's own workbench
source registers the Problems indicator as

```ts
// vs/workbench/contrib/markers/browser/markers.contribution.ts — quoted verbatim.
// This is VS Code's INTERNAL enum (`StatusbarAlignment.LEFT`), not the public
// extension API enum (`StatusBarAlignment.Left`) used in the call above.
this.statusbarService.addEntry(this.getMarkersItem(), 'status.problems', StatusbarAlignment.LEFT, 50 /* Medium Priority */);
```

Higher priority means further left, so 49 sits just right of it today. **This is observed, not
contracted** — it is an internal constant with no compatibility promise, and on a stranger's
machine any other extension may claim an adjacent number. Hence the setting: a host change or a
crowded status bar becomes a one-line edit rather than a rebuild.

Text is `$(bell) N`. `backgroundColor` is `statusBarItem.warningBackground` only when an open
reminder matches `reminders.warnOnAudience` — those cost session time, which is the one
distinction the skill calls load-bearing. Tooltip is a `MarkdownString` listing them.
Hidden entirely at zero, so a clean board costs no pixels.

**QuickPick.** `createQuickPick()`, not `showQuickPick` — item buttons render only on the
former. `QuickPickItemKind.Separator` for group headers. `label` = title, `description` =
audience · raised, `detail` = first line of *What to do*. Item buttons: open · open plan ·
close. `onDidTriggerItemButton` leaves the pick open, so several can be closed in one pass.

**Panel TreeView.** `contributes.viewsContainers.panel` — a Reminders tab beside Problems and
Terminal, which is the placement the whole idea is reaching for. `TreeItem.checkboxState` plus
`TreeView.onDidChangeCheckboxState` to close. `contextValue` gates inline buttons via
`view/item/context` with `"group": "inline"`. `TreeView.badge` for the count.
`contributes.viewsWelcome` for the empty board. `resourceUri` is deliberately **not** set on
items — it would restore the file icon and the filename tooltip.

### Write-back, and a change the skill needs

Closing is the only mutation, and it must match what the skill tells an agent to write, or the
two will drift and the directory will end up holding two conventions. `SKILL.md` says *"Set
`Status: done` and add a line saying what happened"* without saying where the line goes, and
all four existing files are open, so there is no example to copy.

**Proposal — settle it in `SKILL.md` first, then implement it:** append to the metadata block,
in the same bold-label style the file already uses.

```text
**Status:** done
**Closed:** 2026-09-06 — Pushed from his laptop over the LAN; the key was never installed.
```

`Status` is rewritten in place; `Closed` is inserted directly after it. Nothing else in the
file is touched — no reflow, no reordering, unknown labels preserved. The extension prompts
with `showInputBox` and refuses to close on an empty note, because the skill is explicit that
the answer is usually the interesting part.

**The write must reach disk.** If the reminder is open in an editor, the edit goes through a
`WorkspaceEdit` so an unsaved buffer is not clobbered — but `applyEdit` only mutates the
in-memory document. No disk write means the watcher never fires and every surface keeps showing
`open` after a successful close. So: `applyEdit`, then `await document.save()`. One consequence
to state rather than discover — saving also flushes any *user* edits sitting unsaved in that
same file. That is acceptable for a file this extension owns, and it is the reason closing
prompts first rather than acting on a checkbox tick alone.

Dropping takes the same path with `**Status:** dropped` and the reason. **Nothing ever deletes
a file.**

### Watching

`reminders.directory` is **workspace-root-relative in v1**, and the setting description says so.
That constraint is what lets the base be a `WorkspaceFolder`; an absolute path would need
`Uri.file()` as the base instead, and supporting both is deferred rather than half-done.

`createFileSystemWatcher(new RelativePattern(folder, '<dir>/*.md'))` — it fires for writes made
outside VS Code, which is the case that matters: an agent writes a reminder mid-session and it
appears without the user doing anything. Debounce ~150ms; Windows fires twice on a single
write. Re-parse only the changed file.

### The settings surface

Portability is a success criterion, so the settings are the whole of it — every PyQuest-shaped
value the extension could have hardcoded lives here instead. Six settings, no more: this is a
list a stranger reads once, not a configuration language.

| Setting | Default | Why it exists |
|---|---|---|
| `reminders.directory` | `planning/reminders` | Workspace-root-relative. Absolute paths deferred |
| `reminders.groupBy` | `subject` | `subject` · `audience` · `category` · `flat` |
| `reminders.openStatus` | `open` | The status vocabulary is the skill's, not ours |
| `reminders.warnOnAudience` | `["learner"]` | Which audiences turn the status bar amber |
| `reminders.statusBarPriority` | `49` | The escape hatch for a crowded status bar |
| `reminders.closedLabel` | `Closed` | Must match whatever `SKILL.md` settles on |

`reminders.closedLabel` exists because the skill is the contract and the extension is the
client. If the label changes there, this changes here — and nobody has to ship a new `.vsix`.

### What is deliberately not in v1

- **No webview.** Everything wanted is native. A webview would buy rendered markdown, which
  opening the `.md` already gives.
- **No `revealInExplorer`.** It works — it reveals *and* selects — but revealing in the
  Explorer is filesystem navigation performed on the user's behalf. `TreeView.reveal(item,
  {select, focus})` selects within our own model instead.
- **No `DiagnosticCollection`.** Entries at `DiagnosticSeverity.Information` would appear in
  the Problems panel without inflating the error and warning counts, which is genuinely
  appealing. But diagnostics anchor to a file and a range, so the Problems tree renders
  `follow-up_laptop-screen-check_2026-08-30.md` — putting the filename back on screen, which is
  the thing being removed. Revisit behind a setting, default off, once the panel view has been
  lived with.

## Files Expected to Change

New, all under one directory:

```text
tools/vscode/reminders/
  package.json          manifest + contributes; engines.vscode ^1.80.0 (see below)
                        own package.json; NOT an npm workspace
  tsconfig.json         own; does not extend pyquest/tsconfig.base.json
  esbuild.js            cjs · platform node · external ['vscode'] · dist/extension.js
  .vscodeignore
  src/parse.ts          pure — no vscode import
  src/format.ts         pure — status and note write-back as string → string
  src/model.ts          Reminder type, grouping, sorting, counts (pure)
  src/store.ts          workspace scan + FileSystemWatcher + change event
  src/statusBar.ts
  src/quickPick.ts
  src/tree.ts
  src/plan.ts           resolve the planning/**/ glob via workspace.findFiles
  src/extension.ts      activate/deactivate, command registration
  src/*.test.ts         vitest — parser and formatter only
  README.md
.vscode/launch.json     repo root — --extensionDevelopmentPath at the subfolder
.claude/skills/set-reminders/SKILL.md   the **Closed:** convention, settled before code
```

**`engines.vscode` is `^1.80.0`, and the number is load-bearing.** `TreeItem.checkboxState` and
`TreeView.onDidChangeCheckboxState` were finalized in **1.80** (June 2023) after being proposed
in 1.72; `TreeView` badges landed earlier, around 1.72. Closing a reminder by ticking a checkbox
is the core interaction, so 1.80 is the floor. Anything lower installs happily and then does
nothing when the user clicks the box — the worst failure shape available, since it looks like
the extension is merely broken rather than mis-hosted. (Verified against the release notes, not
assumed; this machine runs 1.135.0, so nothing here is near the edge.)

**`.vscode/launch.json` is read-then-appended, never written fresh.** It does not exist at the
repo root today — `test -f .vscode/launch.json` confirms it — but it is a shared workspace file
and may exist by Phase 2. Append to any existing `configurations` array.

**Not** added to `pyquest/package.json` workspaces. That root is `"type": "module"` on
`NodeNext` with `verbatimModuleSyntax` and `rewriteRelativeImportExtensions`; an extension host
bundle is CommonJS on `platform: node`. Fighting the base config buys nothing — the extension
shares no code with the monorepo.

## Phases

**Phase 1 — the contract.** Settle `**Closed:**` in `SKILL.md`. Write `parse.ts` and
`format.ts` against the four real reminder files as fixtures, TDD per
`test-filter-development`: **pipe `npx vitest run` to a file and commit that output alongside
the failing test** — the filter is only load-bearing if the failure was seen, and "we captured
RED" without an artifact is attestation. Then GREEN, then seed a mutant — drop the backtick
strip on `Plan`, and accept a `Status` of any word — and confirm the suite catches both. No
`vscode` import exists anywhere at the end of this phase.

**Phase 2 — the shell.** Manifest with the `^1.80.0` floor, esbuild, `launch.json`, `store.ts`,
status bar. F5 and see a count land in the left cluster next to Problems. Write a fifth reminder
from a shell and watch it increment.

**Phase 3 — the surfaces.** QuickPick, then the Panel TreeView with checkboxes, inline buttons,
badge and welcome content. `plan.ts` resolves the glob.

**Phase 4 — closing.** The `showInputBox` note, write-back through `format.ts`, refuse on
empty. Close one real reminder and read the resulting diff by hand.

**Phase 5 — package.** `contributes.configuration` audited for PyQuest leakage, README,
`vsce package`, install the `.vsix`, restart, and confirm it works against this repo as an
installed extension rather than a dev host.

## Verification

- `npx vitest run` in `tools/vscode/reminders` — parser and formatter green, mutant caught
- F5 → extension host. Status bar sits in the left cluster adjacent to Problems at a real error
  count; screenshot it. Then set `reminders.statusBarPriority` to 51 and confirm it moves to the
  other side — that proves the setting is the escape hatch it claims to be
- With the host open, write a new reminder file from a shell and confirm `onDidCreate` updates
  all three surfaces untouched. `rm` the same file and confirm `onDidDelete` removes it from all
  three — this exercises the watcher, not any deletion path in the extension, which has none
- Tick a checkbox → prompt appears → cancel → **file unchanged** (`git diff` empty). Tick
  again → note entered → `git diff` shows exactly two changed lines
- Same tick with the reminder **open and dirty** in an editor: the unsaved edit survives and the
  file lands on disk saved — `git diff` shows both the closure and the pending edit, and the
  tree updates. This is the `applyEdit` + `document.save()` path and it has no other test
- "Open plan" on the SPA reminder opens `planning/in-progress/feature_spa_2026-08-28-v2.md`;
  then move that plan to `completed/` and confirm the same button still finds it
- Point `reminders.directory` at an empty folder → welcome content, status bar hidden, no errors
- `vsce package` then `code --install-extension`, reload, and repeat the first three checks
  against the installed build

## Risks

- **Status bar neighbours are not ours to control.** 49 sits right of Problems on this machine
  today, against an internal constant with no compatibility promise. This ships to strangers:
  their VS Code version may move Problems, and their other extensions may claim 48, 49 or 50.
  Mitigated rather than solved — `reminders.statusBarPriority` makes it a setting, the success
  criterion says "left cluster" rather than a pixel, and the item is legible wherever it lands.
- **Write-back on a file being edited.** If the reminder is open and dirty in an editor, a raw
  filesystem write loses the edit. Check `workspace.textDocuments` for a dirty match, apply a
  `WorkspaceEdit`, then `await document.save()` — the edit alone never reaches disk, so the
  watcher would not fire and the surfaces would silently keep showing `open`.
- **Multi-root workspaces.** `workspace.findFiles` searches every folder, so plan-glob
  resolution is undefined when several are open — two folders could each hold a matching
  `feature_*.md`. v1 resolves against the folder containing the reminder and documents the
  limit; it does not pretend to handle the general case.
- **The parse is a convention, not a schema.** A hand-written reminder that omits
  `**Status:**` must surface as malformed, never vanish. There is a test for this and it is
  the most important one in the suite.

## Review History

**v1 reviewed 2026-08-30 — "Implementable as written? With fixes."** Ten of eleven findings
taken: `document.save()` after `applyEdit` so a close actually reaches disk, an `engines.vscode`
floor, `reminders.directory` declared workspace-root-relative, the RED capture made a committed
artifact, multi-root `findFiles` noted as a limit, the filename criterion scoped so it stops
contradicting the parse contract, and three merges — the status-bar priority kept but relabelled
and backed by a setting, `launch.json` read-then-appended, the watcher deletion check named after
`onDidDelete`.

One finding was rejected. The review called it Critical that the plan used both
`StatusBarAlignment.Left` and `StatusbarAlignment.LEFT`, and said the second would not compile.
They are two different enums, not one written twice: the first is the public extension API, the
second is a verbatim quotation of VS Code's internal `IStatusbarService` enum in
`markers.contribution.ts`, which is where the number 50 comes from. Nothing would have failed to
compile. The quotation now carries a comment naming both enums, so the misread is not available
to the next reader.

One finding was accepted in principle and corrected in fact. The review asked for
`engines.vscode`, which was right, and proposed `^1.79.0`, which was wrong — `checkboxState` was
finalized in **1.80**, not 1.79. Shipping the suggested floor would have permitted a host where
ticking a checkbox silently does nothing, which reads as a broken extension rather than a
mis-hosted one. Pinned `^1.80.0`.

**Flagged, and ruled by the parent:** the criterion "immediately right of the Problems indicator"
was softened to "in the left cluster, adjacent to Problems." The author argued for keeping it
strict; the parent overruled, on the grounds that this ships to strangers whose status bars and
installed extensions we do not control and cannot anticipate. That is the stronger argument, and
it is consistent with this plan's own Objective — the author's counterargument had quietly
assumed a two-user machine. The lost precision is recovered as a setting rather than a promise:
`reminders.statusBarPriority`, default 49.
