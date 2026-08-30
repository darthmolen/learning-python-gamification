# Reminders as a First-Class Surface — a VS Code Extension for `set-reminders`

**Status:** Planned
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

- [ ] A status bar item sits **immediately right of the Problems indicator**, showing the
      count of open reminders. Verified by eye in the extension host, not by reading code
- [ ] Clicking it opens a QuickPick of open reminders, grouped, fuzzy-searchable, with
      per-item actions — and **no filename appears anywhere in it**
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

```
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

```
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

**Status bar.** `createStatusBarItem('reminders.count', StatusBarAlignment.Left, 49)`.
VS Code registers Problems as `('status.problems', StatusbarAlignment.LEFT, 50)`, and higher
priority means further left — so 49 lands immediately to its right. (`status.problemsVisibility`
also claims 49, but it only appears when `status.problems` is hidden; they never both show.)
Text `$(bell) N`. `backgroundColor` is `statusBarItem.warningBackground` only when an open
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

```
**Status:** done
**Closed:** 2026-09-06 — Pushed from his laptop over the LAN; the key was never installed.
```

`Status` is rewritten in place; `Closed` is inserted directly after it. Nothing else in the
file is touched — no reflow, no reordering, unknown labels preserved. The extension prompts
with `showInputBox` and refuses to close on an empty note, because the skill is explicit that
the answer is usually the interesting part.

Dropping takes the same path with `**Status:** dropped` and the reason. **Nothing ever deletes
a file.**

### Watching

`createFileSystemWatcher(new RelativePattern(folder, '<dir>/*.md'))` — it fires for writes made
outside VS Code, which is the case that matters: an agent writes a reminder mid-session and it
appears without the user doing anything. Debounce ~150ms; Windows fires twice on a single
write. Re-parse only the changed file.

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

```
tools/vscode/reminders/
  package.json          manifest + contributes (own package.json; NOT an npm workspace)
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

**Not** added to `pyquest/package.json` workspaces. That root is `"type": "module"` on
`NodeNext` with `verbatimModuleSyntax` and `rewriteRelativeImportExtensions`; an extension host
bundle is CommonJS on `platform: node`. Fighting the base config buys nothing — the extension
shares no code with the monorepo.

## Phases

**Phase 1 — the contract.** Settle `**Closed:**` in `SKILL.md`. Write `parse.ts` and
`format.ts` against the four real reminder files as fixtures, TDD per
`test-filter-development`: capture the RED output, go GREEN, then seed a mutant — drop the
backtick strip on `Plan`, and accept a `Status` of any word — and confirm the suite catches
both. No `vscode` import exists anywhere at the end of this phase.

**Phase 2 — the shell.** Manifest, esbuild, `launch.json`, `store.ts`, status bar. F5 and see a
count land right of Problems. Write a fifth reminder from a shell and watch it increment.

**Phase 3 — the surfaces.** QuickPick, then the Panel TreeView with checkboxes, inline buttons,
badge and welcome content. `plan.ts` resolves the glob.

**Phase 4 — closing.** The `showInputBox` note, write-back through `format.ts`, refuse on
empty. Close one real reminder and read the resulting diff by hand.

**Phase 5 — package.** `contributes.configuration` audited for PyQuest leakage, README,
`vsce package`, install the `.vsix`, restart, and confirm it works against this repo as an
installed extension rather than a dev host.

## Verification

- `npx vitest run` in `tools/vscode/reminders` — parser and formatter green, mutant caught
- F5 → extension host. Status bar sits right of Problems at a real error count; screenshot it
- With the host open, write a new reminder file from a shell and confirm all three surfaces
  update untouched. Delete it; confirm they drop back
- Tick a checkbox → prompt appears → cancel → **file unchanged** (`git diff` empty). Tick
  again → note entered → `git diff` shows exactly two changed lines
- "Open plan" on the SPA reminder opens `planning/in-progress/feature_spa_2026-08-28-v2.md`;
  then move that plan to `completed/` and confirm the same button still finds it
- Point `reminders.directory` at an empty folder → welcome content, status bar hidden, no errors
- `vsce package` then `code --install-extension`, reload, and repeat the first three checks
  against the installed build

## Risks

- **Status bar neighbours.** 49 is right of Problems today. Another extension can claim the
  same priority and land on either side of us. Acceptable — the item is still in the left
  cluster, and the exact pixel is not the point.
- **Write-back on a file being edited.** If the reminder is open and dirty in an editor, a
  filesystem write loses the edit. Check `workspace.textDocuments` for a dirty match and apply
  a `WorkspaceEdit` instead of a raw write.
- **The parse is a convention, not a schema.** A hand-written reminder that omits
  `**Status:**` must surface as malformed, never vanish. There is a test for this and it is
  the most important one in the suite.

---

## Plan Review

**Reviewed:** 2026-08-30 07:52
**Reviewer:** Claude Code (plan-review-intake)

### Strengths

- Pure `parse.ts` / `format.ts` boundary is sound and matches the repo's §6.7 "no I/O in the part that must not be wrong" pattern.
- `createQuickPick()` over `showQuickPick` is correct — item buttons only render on the former.
- `contributes.viewsContainers.panel` and `contributes.viewsWelcome` are the right contribution points for a panel-hosted tab with empty-state content.
- esbuild as CommonJS, `platform: node`, `external ['vscode']` is the standard VS Code extension bundle shape.
- Write-back settling `**Closed:**` in `SKILL.md` first before implementing is the right sequencing — avoids drift between the skill and the extension.

### Issues

#### Critical (Must Address Before Implementation)

- **Status bar priority direction and undocumented internals**
  - Section: The three surfaces — Status bar
  - What's wrong: The plan says Problems is `50` and `49` lands "immediately to its right" — VS Code orders higher priority further left, so `49` would be to the right of `50`, which is correct directionally. But the claim rests on `status.problems` having a known internal priority of `50`. That is not documented public API; it is an internal constant that can change between VS Code releases. A status bar item with `49` may land right of Problems today and somewhere else after an update.
  - Suggested fix: Remove the specific priority claim. Use a configurable `reminders.statusBarPriority` with a sensible default, or acknowledge in Risks that exact placement relative to Problems is best-effort.

- **`StatusBarAlignment` casing inconsistency — one form is wrong**
  - Section: The three surfaces — Status bar
  - What's wrong: The plan uses both `StatusBarAlignment.Left` (correct public API) and `StatusbarAlignment.LEFT` (wrong casing). Code written against the wrong form will not compile.
  - Suggested fix: Normalize to `StatusBarAlignment.Left` throughout.

- **Dirty-document write-back does not persist to disk**
  - Section: Risks — Write-back on a file being edited
  - What's wrong: "apply a `WorkspaceEdit`" applies the change to the in-memory `TextDocument` but does not save it to disk. If the watcher re-reads the file immediately, it reads the old content. The plan needs to specify: after `applyEdit`, call `document.save()` (or leave the document dirty and define the expected behavior explicitly).
  - Suggested fix: Add: "after `applyEdit`, call `document.save()` so the watcher re-reads the correct state."

#### Important (Should Address)

- **`RelativePattern` directory derivation not stated**
  - Section: Watching
  - What's wrong: `new RelativePattern(folder, '<dir>/*.md')` is valid when `<dir>` is workspace-folder-relative. The plan does not say how `reminders.directory` resolves — relative to the workspace root only, or does it accept absolute paths? An absolute path needs `Uri.file(reminders.directory)` as the base, not a workspace folder.
  - Suggested fix: State the constraint: `reminders.directory` is workspace-root-relative in v1; absolute path support deferred.

- **`engines.vscode` minimum version not pinned**
  - Section: Files Expected to Change — `package.json`
  - What's wrong: `TreeItem.checkboxState`, `TreeView.onDidChangeCheckboxState`, and `TreeView.badge` are real APIs that require VS Code ≥ 1.79 (checkboxState) and ≥ 1.75 (badge). Without a floor in `engines.vscode`, the extension installs on older hosts and fails at runtime.
  - Suggested fix: Add `"engines": { "vscode": "^1.79.0" }` to the manifest and note why.

- **"Immediately right of Problems" success criterion is not fully in the extension's control**
  - Section: Success Criteria — first item
  - What's wrong: Other extensions can claim the same or adjacent priority. The criterion "sits immediately right of the Problems indicator" may fail through no fault of this code.
  - Suggested fix: Soften to "sits in the left cluster of the status bar, adjacent to Problems" — verifiable and within the extension's control.

- **Phase 1 RED capture needs to be an artifact, not attestation**
  - Section: Phase 1 — the contract
  - What's wrong: "capture the RED output" is stated but the plan should say where it is captured (e.g., piped to a file, included in the commit message). Per `test-filter-development`, the failure output must be captured, not just asserted to have existed.
  - Suggested fix: "Pipe `npx vitest run` output to a file and commit it alongside the failing test."

- **`.vscode/launch.json` at repo root may conflict with existing configs**
  - Section: Files Expected to Change
  - What's wrong: `.vscode/launch.json` is a shared workspace file. If it already exists (check with `Test-Path .vscode/launch.json`), adding a new `configurations` entry without reading the existing file risks clobbering it.
  - Suggested fix: Note that the entry should be *appended* to any existing `configurations` array, not written as a fresh file.

#### Minor (Consider)

- `workspace.findFiles` for "Open plan" resolution: if multiple workspace folders are open, behavior is undefined. Acceptable for v1; worth noting.
- Verification step "Delete it; confirm they drop back" is testing watcher sync, not extension deletion — clarify the intent.
- "No filename appears anywhere" in Success Criteria conflicts with the malformed-file surface, which must show the path. The criterion should say "in the normal/open-reminder flow."

### Assessment

**Implementable as written?** With fixes

**Reasoning:** The architecture is sound and nearly all VS Code API choices are correct. The three criticals are all concrete and fixable (priority undocumented, casing typo, `applyEdit` doesn't save); the important items are clarifications rather than design changes.

---

## Disposition

*Appended by the author after `plan-receive-review`. Everything above is the review as received and is unaltered.*

**Not acted on.** Filed unread on 2026-08-30 at the parent's direction — the VS Code extension idea was set aside rather than evaluated. No findings were accepted, rejected or considered, and this review remains live if the idea is picked up.

---

## Disposition

*Appended by the author after `plan-receive-review`. Everything above is the review as
received and is unaltered.*

**7 accepted, 3 merged, 1 rejected, 0 outstanding** — applied to
`planning/feature_reminders-vscode-extension_2026-08-30.md`. The one flagged item was ruled by
the parent and is recorded below as accepted.

### The rejection, and the evidence

**Critical — "`StatusBarAlignment` casing inconsistency, one form is wrong."** Rejected. The
review read two different enums as one enum written two ways. The plan's line 99 is code written
against the public extension API — `StatusBarAlignment.Left`, correct. The other occurrence was a
verbatim quotation of VS Code's own workbench source, where the internal enum genuinely is
`StatusbarAlignment.LEFT`:

```
this.statusbarService.addEntry(this.getMarkersItem(), 'status.problems', StatusbarAlignment.LEFT, 50 /* Medium Priority */);
```

— `vs/workbench/contrib/markers/browser/markers.contribution.ts`, fetched from
`raw.githubusercontent.com/microsoft/vscode/main` on 2026-08-30. The internal `IStatusbarService`
enum and the public `vscode.StatusBarAlignment` are separate types with separate casing
conventions. Nothing in the plan would have failed to compile.

The ambiguity was real even though the defect was not, and the merge honours it: the quotation is
now inside a fenced `ts` block carrying a comment that names both enums explicitly, so the next
reader cannot make the same read.

### The correction that matters most

**Important — `engines.vscode` not pinned.** Accepted as a requirement, **rejected as a number.**
The review proposed `^1.79.0`, citing `checkboxState` ≥ 1.79 and badge ≥ 1.75. Both figures are
wrong. `TreeItem.checkboxState` and `TreeView.onDidChangeCheckboxState` were **finalized in 1.80**
(June 2023) after being proposed in 1.72; `TreeView` badges date to roughly 1.72. Verified against
the VS Code release notes on 2026-08-30, not assumed.

Taking the suggestion verbatim would have shipped a manifest permitting a host where the checkbox
is the core interaction and silently does nothing — a worse failure than no floor at all, because
it looks like a broken extension rather than a mis-hosted one. The plan now pins `^1.80.0` and
says why in the manifest.

### The flagged item, ruled

**Important — soften "immediately right of the Problems indicator."** The author argued for
keeping the strict wording, on the grounds that a criterion softened until it cannot fail is
decorative, and that this repository already models the honest alternative (`feature_world-shim`
carries an unmet criterion marked BLOCKED rather than reworded).

**The parent overruled it, and was right.** That argument assumed a two-user machine. The plan's
own Objective says the extension ships as a standalone `.vsix` to strangers, whose VS Code
version may move Problems and whose other extensions may claim any adjacent priority — possibly
by means nobody here has thought of. On someone else's status bar, "immediately right of Problems"
is not a criterion, it is a wish. The criterion now reads "in the left cluster, adjacent to
Problems," which is the part actually within the extension's control, and the slack is taken up
by a new `reminders.statusBarPriority` setting.

### Everything else

Accepted without argument, because the review was right each time: `applyEdit` does not reach
disk without `document.save()` (a real bug in the plan's own risk mitigation, and now the only
verification step exercising that path); `RelativePattern` needed its base stated, so
`reminders.directory` is workspace-root-relative in v1; the RED capture needed to be a committed
artifact rather than an attestation, per `test-filter-development`; `workspace.findFiles` is
undefined across multi-root workspaces; and the success criterion forbidding filenames
contradicted the parse contract requiring a path on malformed files — a contradiction inside the
author's own document.

Merged rather than taken wholesale: the status-bar priority finding (the observed `50` is kept,
relabelled *observed, not contracted*, plus a setting and a strengthened Risks entry — deleting
the observation would have left the next reader to re-derive or guess it), the `launch.json`
clobber warning (`test -f .vscode/launch.json` confirms no such file exists today, but
read-then-append is the right instruction regardless), and the wording of the watcher deletion
check, which now names `onDidDelete`.
