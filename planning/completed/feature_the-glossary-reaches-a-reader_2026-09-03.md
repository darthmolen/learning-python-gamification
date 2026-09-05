# The Glossary Reaches A Reader

**Status:** Completed 2026-09-03
**Track:** `main`
**Date:** 2026-09-03
**Author:** Claude (Opus 5)
**Lane:** A, serving Lane B — the content exists and no code displays it
**Promoted from:** `planning/backlog/feature_the-glossary-reaches-a-reader_2026-09-03.md`
**Reviewed:** 2026-09-03, `planning/needs-review/completed/2026-09-03-the-glossary-reaches-a-reader.md`
— 5 findings accepted, 4 merged, 1 rejected, 1 flagged and decided below

## Objective

Put the 95 concept definitions and the six medal descriptions in front of a reader. They are
written, they are validated, and today the only way to read one is to open the repository.

## What the review changed

| Finding | Outcome |
|---|---|
| `QuestView.concepts` is bare ids, so the Tome schema change reaches nothing | Accepted — `QuestView.concepts` becomes `TomeConcept[]` |
| `ConceptList`'s signature change is unscoped | Accepted — `AreaScreen.tsx` is in the file set |
| No delivery path for `game/medals.md` | Accepted — `GET /api/medals`, and `ContentRoot` gains a game-rooted reader |
| No RED-then-mutant protocol | Accepted — every check below names its evidence file |
| No API-level test | Accepted — the wire assertions are listed |
| The design fork sits unresolved | Merged — resolved at promotion, which is where a stub's fork belongs |
| `Track:` and `Files Expected to Change` missing | Merged — required here, not of a backlog stub; the stub was missing `Trigger for Promotion` instead |
| Fence-aware parsing changes validator behavior silently | Merged — the delta is measured, not promised: zero today |
| Field Manual output unspecified | Merged — `<dl>`, named below |
| "Correct Status to match `in-progress/`" | Rejected — the plan was in `backlog/` and `Status: Backlog` was correct |
| The Tome has no concept list to hang definitions on (mine, not the reviewer's) | Flagged, decided — cut, and filed as its own backlog item |

## The decisions this plan is making

**Definitions reach the Quest screen and the Field Manual. Not the Area screen, not the Tome.**

The Area row is one `<a>` so the whole row is a target, and a `<button>` inside an `<a>` is
nested interactive content — a real behavior difference across browsers and screen readers, not a
validator complaint. The row stays an anchor and its chips stay inert. The Area screen is for
choosing a quest.

The Tome renders concept counts and no concept labels, so definitions there need a list designed
first. `planning/backlog/feature_the-tome-lists-the-words-it-counts_2026-09-03.md`.

## Phase 1 — one parser, in the package that owns concepts

`glossaryIssues` splits `## <id>` sections with an inline `/^## ([^\n]+?)\s*$/gm`. The API and the
Field Manual both need the same split; three copies of that regex is three chances to disagree
about what a heading is.

`parseGlossary(markdown): Map<string, string>` in `packages/content/src/glossary.ts`, fence-aware,
with `validate.ts` consuming it. Both readers already depend on that package.

**Measured delta, not a promise.** All eight glossaries were swept for a line-start `## ` inside a
fenced block: zero hits. The parser changes no validator verdict today. `validate:content` runs
before and after and the output goes to evidence.

## Phase 2 — the contract

- `TomeConceptSchema` gains `definition: z.string().min(1).optional()`. Optional for the reason
  `lesson` is: an area authored later has none, and the screen says so rather than pretending.
- `QuestViewSchema.concepts` becomes `z.array(TomeConceptSchema).min(1)`. The API holds the
  concept table; a screen should not have to fetch the whole Tome to label one chip.
- `MedalsSchema` — `{ medals: [{ medal, description }] }` for the new route.
- `.strict()` everywhere it already is, and the tests assert it still bites.

## Phase 3 — the API

`tomeAreas` already reads `area-<n>/lesson.md` per request; the glossary is the same shape and
the same file-per-area, read the same way. Per request, not at boot, which is what keeps a
definition editable without a rebuild.

`questView` joins each concept id against the area's glossary and `CONCEPTS`.

`GET /api/medals` returns the six descriptions. A route rather than a field on `MedalSlot`,
because a description is identical for every quest and every player while `MedalSlot` is
per-quest pricing — hanging static text off a priced offer ships the same six paragraphs on
every quest view.

`ContentRoot.read` and `.exists` are rooted at `curriculum/` deliberately and cannot open
`game/`. One game-rooted reader is added for this. **Absent `game/` yields an empty list, not a
404** — `loadContentRoot` already treats a missing overlay as supported, and the Quest screen
draws medal cards without descriptions rather than failing.

## Phase 4 — the SPA

A concept chip expands its definition **underneath, in place** — CLAUDE.md's no-pop-over rule,
and the Tome's own argument: nothing is covered and nothing is lost. `Markdown` already renders
the subset these definitions use.

`ConceptList` takes `readonly TomeConcept[]` and an optional `onSelect`. Without it — the Area
screen — chips render as today's inert `<li>`. With it, each chip is a `<button>` carrying
`aria-expanded`, and the expanded definition sits after the list rather than inside the row.

The medal block gets the same treatment from `/api/medals`.

## Phase 5 — the Field Manual

`renderArea` prints each concept as `<dl>`/`<dt>`/`<dd>` in place of today's
`<ul class="tags">`. It has `marked` and `briefBody`, so nothing new is needed to render one.

**The hazard that will actually bite.** `curriculum/area-5/glossary.md` teaches inheritance with
`class Boss(Enemy)`, and `no-game.test.ts` fails any page carrying `boss` outside
`<div class="brief">`. The test's own rule settles it: "the rule is that **the generator** adds no
scoring vocabulary — not that the curriculum may never use a word." A glossary definition is
author prose by exactly the same argument as a brief, so the sweep's exclusion widens to cover the
definition container and keeps its teeth on everything the generator itself emits. Rewriting the
author's example to satisfy a test would be the site editing the curriculum.

## Files Expected to Change

| File | Change | Covered by |
|---|---|---|
| `pyquest/packages/content/src/glossary.ts` | new — `parseGlossary`, fence-aware | `tests/glossary.test.ts` |
| `pyquest/packages/content/src/validate.ts` | `glossaryIssues` consumes the parser | `tests/validate.test.ts` |
| `pyquest/packages/content/src/index.ts` | export `parseGlossary` | — |
| `pyquest/packages/contract/src/endpoints.ts` | `TomeConceptSchema.definition`, `QuestView.concepts`, `MedalsSchema` | `apps/api/tests/server.test.ts` |
| `pyquest/apps/api/src/content.ts` | game-rooted reader | `tests/content.test.ts` |
| `pyquest/apps/api/src/views.ts` | `questView`, `tomeAreas`, `medalsView` | `tests/server.test.ts` |
| `pyquest/apps/api/src/server.ts` | `GET /api/medals` | `tests/server.test.ts` |
| `pyquest/apps/web/src/shell/ui.tsx` | `ConceptList` takes concepts and an optional `onSelect` | `apps/web/src/screens/*.test.tsx` |
| `pyquest/apps/web/src/screens/QuestScreen.tsx` | chip expander, medal descriptions | `quest/quest-screen.test.tsx` |
| `pyquest/apps/web/src/screens/AreaScreen.tsx` | call-site shape only; chips stay inert | `screens/area-screen.test.tsx` |
| `pyquest/apps/web/src/fixtures/index.ts` | the new shapes | `gateway/fixtures-agree` |
| `pyquest/apps/field-manual/src/build.ts` | read `glossary.md` per area | `tests/no-game.test.ts` |
| `pyquest/apps/field-manual/src/render.ts` | `<dl>` per concept | `tests/published.test.ts` |
| `pyquest/apps/field-manual/tests/no-game.test.ts` | widen the author-prose exclusion, and say why | — |

## Verification

RED with captured output, GREEN, then a seeded mutant the suite must catch. Evidence to
`planning/evidence/`:

| Check | Evidence |
|---|---|
| `parseGlossary` — headings, prose, fenced code, `##` inside a fence | `glossary-parse-{RED,GREEN,MUTANT}.txt` |
| `validate:content` unchanged across the parser swap | `glossary-validate-{BEFORE,AFTER}.txt` — identical |
| `/api/tome` and `/api/quests/:id` emit definitions; `.strict()` still bites | `glossary-wire-{RED,GREEN}.txt` |
| `/api/medals` with `game/` present and absent | `glossary-wire-{RED,GREEN}.txt`, `medals-route-MUTANT.txt` |
| The chip expander: accessible name, `aria-expanded`, no dialog, in flow | `glossary-spa-{RED,GREEN}.txt` |
| The Field Manual publishing `boss` from an author's example | `glossary-fieldmanual-RED.txt` |
| `game/` deleted — curriculum still validates and still publishes | existing `no-game.test.ts` |
| An area with no `glossary.md`, a concept with no entry | `glossary-parse-GREEN.txt` |

The medals route's RED and GREEN are inside `glossary-wire-*` rather than in files of their own —
it is asserted by the same suite, and inventing a second pair of files to match a table would be
the table shaping the evidence rather than recording it.

**Mutants seeded and caught:** fence-awareness removed from `parseGlossary`; the absent-`game/`
branch made to throw; a chip that never closes; the unwritten-definition branch removed; every
medal card made a control; the Field Manual publishing empty `<dd>`s. One mutant **survived** —
the `open === undefined` guard in `ConceptList` — and that is recorded in the test rather than
hidden, because with contract-shaped data the guard is a no-op.

---

## Status

**Final Status:** Completed
**Track:** `main`
**Completed:** 2026-09-03
**Completed By:** Claude (Opus 5)

### Outcomes

- `parseGlossary` in `packages/content/src/glossary.ts`, fence-aware, consumed by `validate.ts`.
  `validate:content` output is byte-identical before and after — the predicted zero delta,
  measured rather than asserted.
- `ConceptViewSchema` replaces `TomeConceptSchema` and now serves **both** routes.
  `QuestView.concepts` carries `{ id, label, definition? }` instead of bare ids, which was the
  review's first critical finding and the one that made the rest of the plan work.
- `GET /api/medals` — the twenty-second route. `ContentRoot.readGame` is the only way into
  `game/` and returns `undefined` rather than throwing, so an absent overlay yields an empty list.
- The Quest screen expands a concept chip in place, and a medal card the same way. Area rows keep
  inert chips, as decided at promotion.
- The Field Manual publishes `<dl class="glossary">` with the definition in `<dd class="brief">`.
- Full suite: 1013 passed, 1 skipped, across two consecutive runs. Typecheck clean.

### Deviations

- **The Tome was cut**, and filed as its own backlog item. It renders concept *counts* and no
  labels, so definitions there needed a screen designed first — not the "add a field" the plan
  assumed.
- `medalsView` reads all six `MEDALS`; the Quest screen draws the five in `DEFAULT_MEDALS`. Left
  as is — the route serves what the file describes, and which cards a screen draws is the screen's.

### Lessons Learned

- **The `no-game.test.ts` widening was predicted and still worth the care.** Area 5 teaches
  inheritance with `class Boss(Enemy)`, so publishing definitions failed the scoring-vocabulary
  sweep on an author's Python. The exclusion widened to `<dd class="brief">` on the test's own
  stated rule, and `glossary-published.test.ts` was added to prove the smaller gate still bites —
  a weakened check needs a new one beside it, not a comment.
- **A mutant caught a vacuous test of mine.** The "undescribed medal is not a control" assertion
  named `datamine`, which is not a medal but §5.5's review mechanic, so it queried a card that
  never renders and passed against a component where every card was a control. It now asserts the
  card is present *and* not a control. This is the third time in this repository the check was
  wrong rather than the code.
- **A stale mocked payload opened a chip nobody clicked.** `quest-refresh.test.tsx` still carried
  `concepts: ['list']`, so every `id` was `undefined`, and `undefined === undefined` matched on
  first render. Fixed at the payload; the guard in `ConceptList` stays as defensive depth, and the
  test comment records that a mutant removing it *survives* — with contract-shaped data it is a
  no-op, and saying so is more useful than implying it is load-bearing.
- **The flake that was not mine, until it was.** `quest-refresh.test.tsx` failed twice in full-suite
  runs and passed in isolation. Rather than filing it with the known flakes, the payload above
  turned out to explain it; five subsequent runs are clean. Causation is not proved, but the
  correlation was strong enough that dismissing it would have been wrong.

### Backlog Items Created

- `planning/backlog/feature_the-tome-lists-the-words-it-counts_2026-09-03.md` — the Tome shows
  concept counts and no concept list; putting definitions there is a screen design decision first.
