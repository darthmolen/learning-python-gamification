# Correct ADR 0004's two references to `journal.md`, or rule that the curriculum changes instead

**Category:** decision
**Audience:** dm
**Subject:** curriculum
**Raised:** 2026-08-31
**Plan:** `planning/**/feature_journal-reads-from-git_2026-08-31.md`
**Status:** open

## What to do

Three documents describe where the Journal lives, and they name two different layouts.

**`journal.md`, one accumulating file** — `docs/decisions/0004-ceremony-earns-its-place-by-outliving-the-game.md`
says it twice: *"He commits `journal.md` anyway"* under *Why not columns*, and the survivability
table's Journal row reads "`journal.md`, his repo". `apps/api/src/gitea.ts:29` agrees:
`DEFAULT_JOURNAL_PATH = 'journal.md'`, and `gitsignal.ts` filters commits by it.

**`journal/entries/session-NN.md`, one file per session** —
`curriculum/area-0/journal/entry-01-prompt.md` says so under *Where the entries live*, and
`curriculum/area-0/journal/TEMPLATE.md` is written to be copied into one. `area-1` matches.

**Rule which is right.** The plan above assumes the curriculum's layout and changes the API's
string to `journal/entries`, on three grounds:

- §5.6 has him re-read his Journal from the start of an area before every boss fight. Six files
  named for their sessions are re-readable; one long file scrolled to an offset is not
- The Area 0 prompt sheet puts the DM reply *under the line in the same file*, which needs a file
  per entry to be a place rather than an append
- `TEMPLATE.md` exists to be copied, and copying it into one accumulating file is not what the
  instruction describes

**If that is right, ADR 0004 needs a factual correction in two places — not a reversal.** Its
decision is markdown-in-his-repository versus columns-in-Postgres, and every line of that
argument holds identically for a directory of session files. `journal.md` reads as shorthand for
the artifact rather than as a ruling on file count.

**If it is wrong**, the curriculum's two prompt sheets and both `TEMPLATE.md` files change
instead, and the plan's Phase 1 is deleted rather than implemented.

## Why it cannot be a test

**A test would have to know which document is the authority, and that is the question.** A check
comparing `DEFAULT_JOURNAL_PATH` against the curriculum's documented layout can tell you the two
disagree — and it should exist, which is that plan's Anticipated Backlog item. It cannot tell you
which one to move. Both are internally consistent, both were written deliberately, and only the
DM can say whether the ADR was ruling on the layout or reaching for a name.

Amending an Accepted architecture decision record is also not a thing an agent should do
unasked, however small the edit looks.

## What it changes

**Ruled for the curriculum:** the plan's Phase 1 proceeds as written — one string in `gitea.ts`,
plus the RED test that proves the signal was dead. The ADR gets two words corrected, and a line
noting the correction was factual rather than a change of decision.

**Ruled for `journal.md`:** the curriculum changes instead — two prompt sheets, two templates —
and Phase 1 is deleted. Everything downstream of it in that plan is unaffected, because the read
path does not care how many files it reads.

**Either way the live bug closes.** Today the API watches `journal.md` and the curriculum teaches
`journal/entries/session-NN.md`, so **no commit he ever makes can fire `git-signal:
journal-entry`, and §5.6's 10 XP per entry can never be paid.** That is true right now, on `main`,
and it stays true until this is ruled. It is the same shape as `PLAYER_ID = 'peer'`: two halves,
each internally consistent, disagreeing at a seam no test spans.
