# The Glossary Reaches A Reader

**Status:** Backlog
**Date Discovered:** 2026-09-03
**Discovered During:** drafting the glossary — the content landed and nothing displays it

## Context

`curriculum/area-<n>/glossary.md` now defines all 95 concepts, `game/medals.md` defines the six
medals, and `validate:content` refuses a definition that drifts from `concepts.ts`. **Nothing
reads any of it.** The words are on disk and the screens still show bare labels.

Two publishers need them, and they are not the same publisher:

- **The Field Manual** (`pyquest/apps/field-manual`) — the curriculum published as static HTML,
  without the game. `AreaView.concepts` is `{ id, label }`, so it lists 95 words and defines
  none.
- **The SPA** — concept chips on the Quest screen, and the concept list on the Tome screen.

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

## The work

**Contract.** `TomeConceptSchema` gains `definition: z.string().min(1).optional()`. Optional for
the reason `lesson` is: an area authored later has none yet, and the screen says so rather than
pretending. `.strict()` still refuses anything that is progress rather than content.

**API.** `tomeAreas` already reads `area-<n>/lesson.md` per request; the glossary is the same
shape and the same file-per-area, so it reads it the same way. Per request, not at boot, which is
what keeps a definition editable without a rebuild.

**SPA.** A concept chip expands its definition **underneath, in place** — CLAUDE.md's no-pop-over
rule, and the same argument the Tome makes: nothing is covered and nothing is lost. `Markdown`
already exists and already renders exactly the subset these definitions use. The medal block on
the Quest screen gets the same treatment from `game/medals.md`.

**Field Manual.** `renderArea` prints each concept with its definition. It has `marked` and
`briefBody`, so nothing new is needed to render one.

## The one that will bite

**On the Area screen the chips sit inside the row's `<a>`.** That row became a single anchor so
the whole thing is clickable, and a `<button>` inside an `<a>` is invalid — nested interactive
content, with real behaviour differences between browsers and screen readers rather than merely
a validator complaint.

So either the glossary interaction lives on the **Quest screen and the Tome only**, and Area rows
keep plain chips, or the Area row stops being one anchor. The first is almost certainly right:
the Area screen is for choosing a quest, and a row that both navigates and expands definitions is
two controls wearing one shape. **Decide this before writing the component**, not after, because
it decides whether `ConceptList` takes an `onSelect` at all.

## Tests

- The deletion test already in the suite: remove `game/`, and the curriculum still validates and
  still publishes. A Field Manual that grew a medals section fails it, which is the point.
- `parseGlossary` against a real glossary file — headings, prose, fenced code inside a definition,
  and a `##` inside a code block, which must not start a new entry.
- The a11y sweep: a chip that became a button needs an accessible name and `aria-expanded`, and
  `a11y.test.tsx` fails on the first control without one.
- `Tome.test.tsx`'s rules apply to the expander: no dialog, no scrim, in flow, and what is
  underneath stays mounted.
- An area with no `glossary.md`, and a concept with no entry, both render as unwritten rather
  than blank — the honesty rule §5.1a keeps for the tilde.

## Files

`pyquest/packages/content/src/` (the parser, plus `validate.ts` using it),
`pyquest/packages/contract/src/endpoints.ts`, `pyquest/apps/api/src/views.ts`,
`pyquest/apps/web/src/shell/ui.tsx` (`ConceptList`), `pyquest/apps/web/src/screens/QuestScreen.tsx`
and `TomeScreen.tsx`, `pyquest/apps/field-manual/src/build.ts` and `render.ts`.

---

## Plan Review

**Reviewed:** 2026-09-03 18:24
**Reviewer:** Claude Code (plan-review-intake)

### Strengths
- Correctly identifies the two-publisher split and protects the game/-deletion test by keeping medals out of the Field Manual.
- Extracting parseGlossary into packages/content and having alidate.ts consume it is the right call; the current inline regex is exactly the duplication risk described.
- The nested-interactive hazard on the Area row is real and correctly diagnosed.
- Reuses established precedent rather than inventing new mechanisms.
- Test list targets the genuinely fragile cases: ## inside a fence, missing glossary.md, missing entry.

### Issues

#### Critical (Must Address Before Implementation)
1. **The Quest screen cannot get definitions from the stated contract change.** QuestView.concepts is bare id strings, not TomeConcept objects. The plan only adds definition to TomeConceptSchema, which serves /api/tome. It never says whether QuestView.concepts changes shape, or whether QuestScreen joins against the Tome response client-side. This is a contract decision that changes endpoints.ts, iews.ts, and Area screen call sites, and it is unstated.
2. **ConceptList's signature change is unscoped.** It currently takes concepts: readonly string[] and has three callers. Changing it to carry definitions touches AreaScreen.tsx whether or not Area rows stay non-interactive. The plan lists ui.tsx but treats Area as untouched.
3. **No delivery path for game/medals.md to the browser.** The SPA cannot read disk. The plan does not say whether medal text arrives via a new API field, a new endpoint, or build-time bundling, nor what happens when game/ is absent.

#### Important (Should Address)
1. **An unresolved design fork sits inside an in-progress plan.** "Decide this before writing the component" leaves ConceptList's onSelect � and therefore items 1 and 2 � undetermined.
2. **Plan-format conventions not met.** CLAUDE.md requires every plan to declare a **Track:** and a Files Expected to Change section. This plan has neither.
3. **Fence-aware parsing silently changes validator behavior.** Today's regex treats any line-start ##  as a heading; a fence-aware parseGlossary will stop counting ## inside code blocks. The plan should state the expected delta and that alidate:content stays green.
4. **No RED-then-mutant step.** CLAUDE.md mandates captured failure output plus a seeded mutant per check. The Tests section lists assertions but no verification protocol.

#### Minor (Consider)
1. **No API-level test named.** The parser, a11y, and deletion tests are covered, but nothing asserts /api/tome actually emits definition, nor that .strict() still rejects an unknown key after the schema change.
2. **Field Manual output is unspecified.** "prints each concept with its definition" leaves the element structure open.

### Recommendations
- Resolve the Area-row fork now and record the decision in the plan.
- Add an explicit contract subsection covering QuestView.concepts and name the affected call sites.
- Specify the medals delivery path end to end, plus the game/-absent behavior.
- Add **Track:** and a Files Expected to Change list, and correct Status to match in-progress/.
- Add alidate:content before/after checks and the RED/mutant note.

### Assessment
**Implementable as written?** With fixes

**Reasoning:** The plan is architecturally sound and unusually well-reasoned about the Lane A/Lane B boundary, but the Quest-screen definition source, the ConceptList blast radius, and the medals delivery path are still unspecified, and the plan format is missing required fields.
