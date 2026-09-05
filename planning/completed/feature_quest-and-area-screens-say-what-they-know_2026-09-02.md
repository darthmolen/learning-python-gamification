# The Quest And Area Screens Say What They Know

**Status:** Completed
**Track:** main
**Date:** 2026-09-02
**Author:** Claude (Opus 5)
**Lane:** A

## Objective

Five findings from reading the Quest and Area screens in a browser. Four are the same fault
wearing different clothes — **the screen holds the information and declines to show it** — and
the fifth is a hole through every layer that this plan records rather than fills.

## What was wrong

- The Tome sat at the bottom of the Quest screen, below the editor, the canvas and the console.
  §6.8 put it on this screen so that looking something up costs nothing; fifty lines of scrolling
  past his own work is that cost by another route.
- Opening it showed a hard-coded paragraph *about* the Tome, while `curriculum/area-N/lesson.md`
  — 210 lines of real teaching for Area 0 alone — was readable only by the static Field Manual.
- The concept list and the medal price list were both 11px `--muted` mono joined with ` · `.
  One of them is the vocabulary the area teaches.
- On the Area screen only the quest *title* was a link. The row's padding, concepts, DC and five
  medal pips were dead to the click.
- The unearned medal pips were 8px `--crumb-rule` on `--panel` — about 1.3:1. Drawn, and
  invisible.

## What was done

**The lesson reaches the SPA.** `TomeAreaSchema` gained `lesson?: string` and
`lessonIsDraft: boolean`; `tomeAreas()` takes the `ContentRoot` and reads `area-<n>/lesson.md`,
falling back to `lesson.draft.md` — the same precedence `apps/field-manual/src/build.ts` already
states, mirrored rather than reinvented so the two publishers of the same prose cannot disagree
about which file is the real one. Both `TomeScreen` and the in-place Tome render it; an area with
neither file says the teaching is unwritten.

**A markdown renderer, in the SPA, without a dependency or an injection surface.**
`apps/web/src/tome/Markdown.tsx` renders a documented subset — headings, paragraphs, lists,
fenced code, pipe tables, inline code, bold and italic — straight to React elements. The contract
had already ruled on where this work belongs ("Rendering is the UI's", at `QuestView.brief`).

**The Tome moved above the editor**, and the Quest screen now loads quest and tome in parallel,
copying `TomeScreen`'s two-request shape.

**Concepts became chips** (`ConceptList` in `shell/ui.tsx`, shared by both screens), the medal row
became a priced block with an `Eyebrow`, `Mono`'s default went 11px → 12px, and unearned medal
pips became 10px outlines instead of near-invisible fills.

**The whole Area row is an anchor.** `QuestRow` renders a `Link` for an enterable quest and an
identically-shaped `div` for a locked one, with `aria-label` keeping the link's accessible name
the quest's title. An anchor rather than an `onClick`, because middle-click, ctrl-click, Tab and
Enter are not click events. Its hover and focus are the first two rules in `index.css` that are
not the theme — inline styles have no `:hover`.

**The medal block says what is true.** Only `cleared` can be awarded; see the backlog item.

## Two bugs the tests found, neither of them the one being looked for

- **The parser could hang the tab.** Seeding the planned fenced-code mutant did not redden a
  test — it exhausted the heap. The paragraph branch tested its break conditions *before*
  consuming a line, so any line the earlier cases declined and the break conditions rejected left
  `i` where it was and spun forever. A pipe row with no `|---|` under it does exactly that in
  production. Fixed by taking the first line unconditionally; a regression test names the case.
- **Emphasis did not recurse into code.** Found by rendering the real `curriculum/area-0/lesson.md`
  rather than a fixture: the lessons write ``**`7` and `"7"` are not the same thing**`` and
  ``*make `length` mean 100 from now on.*``, and flat matching printed those backticks as
  punctuation — so the one sentence whose entire job is distinguishing `7` from `"7"` set both in
  the prose face.

All eight authored lessons were then rendered and checked for surviving markup and for swallowed
words. That check was deliberately not kept: it would couple a Lane A unit test to Lane B content,
and the API test that reads the curriculum root already owns that edge.

## Verification

`npm test` — 961 passing, 59 files. `npm run typecheck` clean across all seven workspaces.
`npm run validate:content` clean, 23 items across 8 areas. `npm run build --workspace @pyquest/web`
succeeds.

Every new assertion was reddened before it was greened, four of them against the real prior code
rather than against a seeded mutant. Three mutants were seeded and all three were caught: the
draft-flag inversion in `areaLesson`, the removal of the row link's `aria-label`, and the medal
pip reverting to a fill.

## Backlog Items Created

- `planning/backlog/feature_no-way-to-claim-a-medal_2026-09-02.md` — §5.10's five elective medals
  are priced, stored, sent and drawn, and no code path can award any of them. The spec has no
  declaration mechanic to implement either, and contradicts itself about whether a medal is
  declared before an attempt or claimed after one. That contradiction is the first thing the
  plan has to settle, so this is filed rather than started. It also records the web fixture's
  medal prices disagreeing with the engine's, which nothing currently catches.
