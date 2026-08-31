# Finish the VS Code profile: work §4's checklist and re-export over the file

**Category:** follow-up
**Audience:** dm
**Subject:** hardware
**Raised:** 2026-08-31
**Plan:** `planning/**/feature_area-2-scribes-rite-and-sandbox_2026-08-28.md`
**Status:** open

## What to do

On the learner's machine, in the `PyQuest` profile that is already imported and already works:

1. **Work `tools/vscode/README.md` §4's checklist line by line.** What came back from the first
   sitting was an impression — *"no widgets on the side but a terminal bottom and files were
   showing"* — which is encouraging and is not the twenty-odd assertions the checklist asks for.
2. **Hide the five views that are not settings**, by hand, in the running editor: Outline,
   Problems, Source Control, Testing, Extensions. Hiding the activity bar removes their *icons*,
   which is not the same as the views being hidden — §4 asks you to look rather than to reason.
3. **Re-export over `tools/vscode/pyquest-area2.code-profile`** — Profiles: Export Profile... →
   name it → **Save Profile** → overwrite the file.
4. **Delete the ⚠ banner** at the top of `tools/vscode/README.md` and record the date.

## Why it cannot be a test

The five views live in VS Code's `globalState`, not in `settings.json`. The hand-authored file's
`globalState` is empty because there was no editor to capture it from, and **only an export
captures them.** This repository can validate that JSON all day and never learn whether those
five panels are gone on the machine it is for.

## What it changes

**Done:** the profile in the repository becomes the artifact rather than the draft, and the next
machine gets the whole strip instead of most of it. Area 2b is ready to be *taught*.

**Not done:** every future import gets a partial strip and nobody finds out until a session.

## What this deliberately does not block

**Authoring.** The DM overruled the Phase 3 → Phase 4 gate on 2026-08-31:

> *"There's no reason the content can't be authored because I haven't performed an action on a
> machine that isn't even started any of the training yet."*

That is the plan's own principle, applied to a gate that contradicted it — its Dependencies
section already says **"authoring order and delivery order are different things, and only the
first one gates this plan."** Sessions 5–8 describe what the editor does; they do not depend on
one export having happened on one laptop, and the machine in question has not begun training.

So this reminder holds **delivery**, not writing. Area 2b is not taught until it is done.
