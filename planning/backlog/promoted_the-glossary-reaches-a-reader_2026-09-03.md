# The Glossary Reaches A Reader

**Status:** Promoted 2026-09-03 to planning/completed/feature_the-glossary-reaches-a-reader_2026-09-03.md
**Date Discovered:** 2026-09-03
**Discovered During:** drafting the glossary — the content landed and nothing displays it
**Reviewed:** 2026-09-03, `planning/needs-review/completed/2026-09-03-the-glossary-reaches-a-reader.md`

## Context

`curriculum/area-<n>/glossary.md` now defines all 95 concepts, `game/medals.md` defines the six
medals, and `validate:content` refuses a definition that drifts from `concepts.ts`. **Nothing
reads any of it.** The words are on disk and the screens still show bare labels.

Two publishers need them, and they are not the same publisher:

- **The Field Manual** (`pyquest/apps/field-manual`) — the curriculum published as static HTML,
  without the game. `AreaView.concepts` is `{ id, label }`, so it lists 95 words and defines
  none.
- **The SPA** — concept chips on the Quest screen.

**Medals go to the SPA only.** The Field Manual is the curriculum without the game, and deleting
`game/` has to leave a site that still publishes. A build that read `game/medals.md` would break
that test, which is exactly the deletion the suite performs.

## The parser belongs in one place, and currently has none

`glossaryIssues` in `packages/content/src/validate.ts` splits `## <id>` sections inline. The API
and the Field Manual both need the same split, and a `## ` regex written three times is three
chances to disagree about what a heading is.

Extract `parseGlossary(markdown): Map<string, string>` into `packages/content`, and have the
validator use it too — so the thing that checks the file and the things that read it cannot
part company. Both consumers already depend on that package.

**The fence-aware delta is zero today, and that is a measurement rather than a hope.** All eight
glossaries were swept for a line-start `## ` inside a fenced block: no hits. So the new parser
changes no validator verdict now, and closes a trap that first bites whoever writes a Markdown
example into a definition. `validate:content` stays green across the change, and the plan checks
it before and after rather than asserting it.

## What the reader gets, and where

**The Quest screen, not the Area screen.** The design fork below is decided: the Area row stays a
single anchor and its chips stay inert. A row that both navigates and expands definitions is two
controls wearing one shape, and the Area screen is for choosing a quest.

**The Tome is not in this plan.** `TomeScreen.tsx` renders concept *counts* — `${entry.concepts}
concepts` — and no concept labels at all. Putting definitions there is not "add definitions to a
list", it is "design a 95-item list for the Tome and then define its entries", which is a screen
design decision this plan never made. Filed separately as
`planning/backlog/feature_the-tome-lists-the-words-it-counts_2026-09-03.md`.

## The contract carries two shapes, and only one of them was going to change

`QuestView.concepts` is `z.array(ConceptIdSchema)` — bare id strings. `TomeConceptSchema` is
`{ id, label }`. Adding `definition` to the second does nothing for the Quest screen, which reads
the first. The original plan changed one schema and expected both screens to benefit.

`QuestView.concepts` becomes `z.array(ConceptViewSchema)` — the shape is renamed because it now
serves both routes. The join happens in the API, where the
concept table already lives, rather than in a screen that would have to hold the whole Tome
response to render one chip.

## The one that will bite

Two of them, and both were found by reading the code rather than the plan:

**`ConceptList` takes `readonly string[]` and has two call sites** — `AreaScreen.tsx:183` and
`QuestScreen.tsx:292`. The parameter type changes for both even though only one grows an
interaction, so `AreaScreen.tsx` is in the file set whatever the Area row decides.

**`curriculum/area-5/glossary.md` teaches inheritance with `class Boss(Enemy)`.** The Field
Manual's `no-game.test.ts` fails any page carrying the word `boss` outside `<div class="brief">`,
and glossary definitions would land outside it. The test's own rule settles this: "the rule is
that **the generator** adds no scoring vocabulary — not that the curriculum may never use a
word." Author prose is excluded from the sweep; a glossary definition is author prose by exactly
the same argument as a brief. So the exclusion widens to cover the definition container, and the
sweep keeps its teeth everywhere the generator speaks.

## The medals need a delivery path, and `ContentRoot` cannot read `game/`

`loadContentRoot` roots `read` and `exists` at `curriculum/` — deliberately, and the comment says
so. Nothing in the API can open `game/medals.md` today.

`GET /api/medals`, returning `{ medals: [{ medal, description }] }`. A new route rather than a
field on `MedalSlot`, because a medal's description is the same for every quest and every player
while `MedalSlot` is per-quest pricing, and hanging static game text off a priced offer would ship
the same six paragraphs on every quest view. `ContentRoot` gains one game-rooted reader for it.

**`game/` absent returns an empty list, not a 404.** A curriculum with no overlay is a supported
state — `loadContentRoot` already says missing `game/` is not a misconfiguration — and the Quest
screen renders medal cards with no description rather than failing.

## Files Expected to Change

- `pyquest/packages/content/src/glossary.ts` (new — `parseGlossary`)
- `pyquest/packages/content/src/validate.ts` (consume it)
- `pyquest/packages/content/src/index.ts` (export it)
- `pyquest/packages/contract/src/endpoints.ts` (`TomeConceptSchema.definition`, `QuestView.concepts`, `MedalsSchema`)
- `pyquest/apps/api/src/content.ts` (game-rooted reader)
- `pyquest/apps/api/src/views.ts` (`questView`, `tomeAreas`, `medalsView`)
- `pyquest/apps/api/src/server.ts` (`GET /api/medals`)
- `pyquest/apps/web/src/shell/ui.tsx` (`ConceptList`)
- `pyquest/apps/web/src/screens/QuestScreen.tsx`, `AreaScreen.tsx`
- `pyquest/apps/web/src/gateway/index.ts` (the medals resource)
- `pyquest/apps/field-manual/src/build.ts`, `render.ts`
- `pyquest/apps/field-manual/tests/no-game.test.ts` (widen the author-prose exclusion)

## Tests

Every check below is written RED first with its failure output captured to `planning/evidence/`,
then GREEN, then a seeded mutant that the suite must catch — CLAUDE.md's rule, and the reason
three of this repository's checks turned out to be wrong rather than the code.

- `parseGlossary` against a real glossary file — headings, prose, fenced code inside a
  definition, and a `##` inside a code block, which must not start a new entry.
- `validate:content` green before and after the parser swap, with the zero-delta measurement
  recorded rather than assumed.
- The wire: `/api/tome` emits `definition`, `/api/quests/:id` emits `{ id, label, definition }`,
  and `.strict()` still rejects an unknown key on both.
- `/api/medals` with `game/` present and with `game/` absent.
- The deletion test already in the suite: remove `game/`, and the curriculum still validates and
  still publishes. A Field Manual that grew a medals section fails it, which is the point.
- The a11y sweep: a chip that became a button needs an accessible name and `aria-expanded`, and
  `a11y.test.tsx` fails on the first control without one.
- `Tome.test.tsx`'s rules apply to the expander: no dialog, no scrim, in flow, and what is
  underneath stays mounted.
- An area with no `glossary.md`, and a concept with no entry, both render as unwritten rather
  than blank — the honesty rule §5.1a keeps for the tilde.

## Trigger for Promotion

Promoted 2026-09-03. The fork this stub was holding — Area row versus Quest screen — is decided
above, which was the one thing blocking it.
