# The Field Manual — the curriculum, published without the game

**Status:** In Progress
**Track:** field-manual
**Date:** 2026-08-30
**Author:** Claude (Opus 5)
**Lane:** A — but it serves Lane B, which is the point

## Objective

Publish the teaching content to GitHub Pages, rebuilt whenever content changes, as **the proof
that the gamification is only encouragement and the curriculum is the substance.**

## Why this exists

The parent's framing: *"the actual meat of what we're learning without the gamification. It's the
ultimate proof that the gamification is just to encourage and that what we're teaching is the
importance."*

**It is not the Tome screen, and that distinction is what unblocks it.** `TomeScreen.tsx` needs
`/api/tome` and `/api/players/:id/campaign`, so it waits on an API that is mid-flight. The
curriculum needs neither: §6.7 already puts content in git, so a generator reads the YAML and the
markdown at build time. The unfinished API is irrelevant to this.

The name is the spec's own. §6.8 calls the Tome "the field manual and the whole syllabus" — the
Tome is the screen, the Field Manual is the teaching content it will one day render. Publishing
it now costs the Tome screen nothing and takes nothing from it.

## Success Criteria

- [ ] Eight areas, ninety-five concepts, and every authored exercise, rendered from `content/`
- [ ] Areas 3–7 show their gap honestly rather than appearing complete or being hidden — §5.1a's
      rule, applied to a website
- [ ] **The output carries no scoring vocabulary at all**, proven by a test over the built HTML
- [ ] Every brief a content item references is rendered; a missing file fails the build
- [ ] `npm run validate:content` runs in CI before anything publishes
- [ ] A one-word content edit reaches the live page with no code change

## Approach

**A build-time generator emitting static HTML — not a Vite app.** This avoids all three Pages
blockers `apps/web` has today: no `base`, no router `basename`, no `404.html` rewrite. No client
JavaScript, so it loads instantly and reads offline. And no rail, gateway or fixtures, so none of
the game's furniture leaks in by inheritance.

**Reuse the validator's own reader.** `checkContent()` is fs-bound and that is correct at build
time — it is what `npm run validate:content` runs, so the site cannot drift from what the
validator accepts. Concepts come from `@pyquest/content/browser`. Nothing re-parses YAML.

**The gate is the thesis.** A test asserts the built output contains no `xp`, `dc`, `medal`,
`ironman`, `boss` or `cleared`. If the site ever quietly grows a medal column, that test is what
notices. It is the artifact's claim made checkable.

## Phases

### Phase 1 — the generator and its pages
`src/build.ts` reads content, renders an index and one page per area, emits `dist/`. Relative
links throughout so it works at any subpath.

### Phase 2 — the gate
The no-game test, RED first with a deliberate leak, then a seeded mutant rendering a `dc`.

### Phase 3 — evergreen
`.github/workflows/field-manual.yml`, the repository's first CI file. `npm ci` →
`validate:content` → build → `upload-pages-artifact` → `deploy-pages`. Pure Node; no Docker, no
database, which is why this is deployable today when nothing else is.

## Dependencies / Prerequisites

- None. Everything it reads is committed and already validated.

## Files Expected to Change

- `pyquest/apps/field-manual/**` — new
- `.github/workflows/field-manual.yml` — new, the first CI in this repository
- `pyquest/vitest.config.ts` — one `projects` entry

## Track discipline

`field-manual`, a new track. `apps/field-manual` is a leaf nothing imports and `.github/` is
untouched ground.

**`pyquest/vitest.config.ts` is the one shared file**, named by `spa` and `api` too. Append one
project entry; do not restructure. The alias map derives itself and needs nothing.

## Out of Scope

The Tome screen. `curriculum/` — a larger body of prose written for a DM rather than a reader,
worth its own pass. And the field-manual prose itself: the Area 3 teaching in `Tome.dc.html` is
hand-written HTML with no data source anywhere, which is authoring work rather than plumbing.
