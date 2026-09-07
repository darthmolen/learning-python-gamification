---
kind: plan
status: in-progress
track: practice-spine
date: 2026-09-06
---

# The practice spine, and a HOW-TO destination

**Status:** In progress
**Track:** `practice-spine`
**Date:** 2026-09-06
**Author:** Claude (Opus 5)
**Lane:** A and B

## Objective

Store the ordering the curriculum has always had and never recorded, surface it where a
learner can see it, and give the campaign one place that explains how it works.

## Why this exists

The parent worked Area 0 as a player and it felt disjointed. Planning Area 4 surfaced the
question behind it — *what is the difference between a session and a quest?* — and the answer
turned out to be structural rather than verbal.

**The app renders the graded subset of the curriculum and never admits it is a subset.**

- **Quests are deliberately unordered.** `game/area-1/quests/a1-the-sigil.yml` refuses
  `requires` in a comment, because §5.2 gives any three of five and "a prerequisite list here
  would quietly take that choice back." That refusal is correct. Its consequence was not
  noticed: the only ordering in the curriculum lived in session plans the learner never opens,
  so removing order from quests removed it from the product. He was given freedom without a map.
- **The relation was authored three ways and stored in none.** Area 1 has a README table
  (`s1e3 + s2e3`), Areas 2 and 3 have a `### The quest` section in the plan, Area 0 had neither
  — only prose proposing, in future tense, quests that shipped months earlier.
  `ContentItemSchema` is `.strict()` with no `session` field, so `validate:content` could never
  catch the drift. CLAUDE.md's own rule — *frontmatter with no validator is markdown with more
  punctuation* — one level worse, because it was never frontmatter.
- **The export had the same blind spot.** `apps/field-manual/src/build.ts` builds `exercises`
  from `items.filter(item.kind === 'quest')`, so the published Field Manual's "the work" *is
  the quest list*. Both surfaces a confused learner could consult showed him the same graded
  subset. This is the likely root of the complaint recorded in
  `completed/feature_field-manual-teaches_2026-08-30.md` — *"a bunch of exercises… pretty
  vacuous"* — because its source was an assessment list wearing the word "exercises".
- **Nothing told the learner how any of it works.** Every orientation document is DM-voiced by
  convention; `game/medals.md` is the only player-facing systems doc and covers medals only.

## Decisions

Two, recorded as ADRs because they are arguments rather than instructions.

**ADR 0007 — a practice is the unit of work; a session is the unit of time.** *Session* already
means calendar attendance in the shipped `sessions` table and in §5.9's streak. It is also a bad
name for the curriculum unit on this repository's own terms: "Session 3" asserts a sitting, so a
learner who takes two evenings is told by the noun that he is behind — the sentence ADR 0006
exists to refuse. "Practice 3" survives the twice-as-long test.

**ADR 0008 — the rail admits what belongs to no place.** `Rail.tsx` objects that a seventh entry
would mean something was promoted out of the place it belongs to. HOW-TO belongs to no place, so
the objection does not reach it, and §6.8's real test — "true wherever you are standing" — is
satisfied rather than overridden. Confusion is the one thing in the product that is
location-independent.

## Corrections to the approved plan

- **"About half the practices carry no quest" is wrong for the authored areas.** Measured after
  the spines landed: **5 of 24** (21%) in areas 0–2. The ~half figure is Area 3's, which plans 6
  of 13. Learner-facing prose therefore states the fact without a fraction — a number there goes
  stale as areas are authored, which is the same failure this plan exists to fix.
- **The argument for a separate progress table was weaker than stated.** The `sessions` table is
  not merely the wrong shape; it is **unwired** — one reader at `repository.ts:230`, no `INSERT`
  anywhere, no endpoint, and both screens that would draw it decline in comments. That is also
  the reason not to repurpose it: practices are untimed by construction, so they cannot feed a
  streak that counts days.

## Progress

- [x] `PracticeSchema` / `PracticeManifestSchema` in `packages/content/src/schema.ts`, `.strict()`
- [x] Loader branch, the derived `quests` edge, and three rules in `validate.ts`
- [x] Fixtures: `practices/` plus three under `broken/`
- [x] `tests/practices.test.ts` — RED captured, GREEN, two mutants caught
- [x] `curriculum/area-{0,1,2}/practices.yml` — 24 practices, `validate:content` clean
- [x] `curriculum/how-to/how-to-learn.md` and `game/how-to/how-to-play.md`
- [x] `game-vocabulary` rule — the curriculum half may not use the game's words
- [x] HOW-TO rail destination, `/how-to` route, screen rendering from content
- [x] Area screen right rail — the spine, with a real checkbox and no gating
- [x] `practice_progress` table, `PracticeView`/`PracticeTick`, store queries, the two routes
- [x] Field Manual practice-shaped; `how-to.html` in both builds, both halves in the DM build
- [x] `no-game.test.ts` extended — the deletion test now covers the *export*, not just validation
- [x] ADRs 0007 and 0008; CLAUDE.md lexicon rows
- [x] **The directory rename, areas 0–2** — `sessions/` → `practices/`, plan files, per-practice
  directories, `sNeM_*.py` → `pNeM_*.py`, and `reference/session-<n>-answers.md`. 85 paths via
  `git mv`; 126 files rewritten for references. The 19 brief references went with it.
- [x] Area 3's instructions — `reminders/follow-up_rename-area-3-sessions-to-practices_2026-09-06.md`
- [ ] Artboards gain the seventh rail item — nine `.dc.html` files, rail markup inline in each
- [ ] Backfill areas 0–1 READMEs with the `Quest` column Area 3 already has
- [ ] The published `PyQuest Campaign UI` artifact is stale once the artboards change

## The rename, and what it deliberately did not touch

**Only references to the *unit* changed.** A DM document still says *session* where it means the
evening — "the shape of a session" is five beats and 45–60 minutes, "at the start of the next
session" is §5.4's invasions, "one entry per session" is §5.6's Journal and the column the
database keys on. ADR 0006 already says these documents are written for somebody running a
calendar, and the DM is running one.

The rule applied: **a digit after the word names the unit; an amount of an evening is a
session.** A blanket find-and-replace gets both halves wrong in opposite directions.

**`verify.py`'s `SEARCH` tuple was left alone in every area, and it is a known collision.** It
reads `(ROOT / "exercises", ROOT / "reference")` and fails on every starter and hidden test for
carrying no `# expect:` tag — pre-existing, with an in-flight fix on `main` repointing it at
`sessions`. After this rename that fix must say `practices`. The line belongs to whoever is
fixing the search drift, so this track did not take it; whoever merges second reconciles the two.

## Evidence

- `planning/evidence/practice-spine-RED.txt` — 10 of 10 failing before implementation. The
  first failure is the predicted one: the loader parsed `practices.yml` as a content item and
  reported a missing `id`, which is a true statement about the wrong question.
- `planning/evidence/practice-spine-MUTANT.txt` — the "every exercise is claimed" check removed,
  and the suite goes red on exactly the test that check exists for. A second mutant on the
  derived edge (corrupting the join key) was also caught, by
  *is derived from the brief path, not authored*.
- `planning/evidence/practice-spine-NOTES.txt` — **a third mutant survived**, and the filter it
  exposed was decorative. The game-vocabulary check used lookarounds excluding `[A-Za-z0-9_]`
  and a comment claiming this beat `\b`. It does not: `\b` uses exactly that character set, so
  the fix and the thing it claimed to fix were the same regex. CLAUDE.md's actual trap is that
  `_` **is** a word character, so the boundary has to exclude only `[A-Za-z0-9]` and let an
  underscore separate. Fixture gained `boss_fight.py`, the test asserts on it, the regex
  dropped `_`. Re-seeding `\b` now fails on that word specifically.

## Files Expected to Change

Disjoint from `area-3`, which holds `curriculum/area-3/**` in progress with 6 of 13 practices
unwritten. **`curriculum/area-3/**` is excluded**; a reminder carries its `practices.yml`.

- `curriculum/area-{0,1,2}/practices.yml`, `README.md`, `exercises/*/BRIEF.md`
- `curriculum/how-to/**`, `game/how-to/**`
- `pyquest/packages/content/src/{schema,validate}.ts`, `tests/`, `fixtures/`
- `pyquest/packages/contract/src/payloads.ts`
- `pyquest/packages/db/migrations/0007-practice-progress.sql`, `src/repository.ts`
- `pyquest/apps/api/src/`
- `pyquest/apps/web/src/shell/Rail.tsx`, `app/App.tsx`, `screens/{AreaScreen,HowToScreen}.tsx`
- `pyquest/apps/field-manual/src/{build,render}.ts`
- `docs/decisions/0007-*.md`, `docs/decisions/0008-*.md`, `docs/design/pyquest/*.dc.html`
- `CLAUDE.md`

## Out of scope

- Filling the `sessions` table — §5.9's streak, Defend's attendance panel and Console's
  forgiveness all have artwork and no endpoint. A separate, additive feature.
- The cosmetic sweep `sessions/` -> `practices/`, `sNeM_*.py` -> `pNeM_*.py` (69 paths, 49 drill
  files). The model does not depend on it and it collides with the `area-3` track today.
  Tooling risk is low: `verify.py:33`'s `SEARCH` tuple is the only code coupling.
- `packages/content/src/scaffold.ts` still writes the pre-split layout, so `npm run new:quest`
  scaffolds paths that no longer exist. Found in passing; separate fix.
