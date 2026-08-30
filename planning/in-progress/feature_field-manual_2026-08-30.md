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

- [x] Eight areas, ninety-five concepts, and every authored exercise, rendered from `content/`
- [x] Areas 3–7 show their gap honestly rather than appearing complete or being hidden — §5.1a's
      rule, applied to a website
- [x] **The output carries no scoring vocabulary at all**, proven by a test over the built HTML
- [x] Every brief a content item references is rendered; a missing file fails the build
- [x] `npm run validate:content` runs in CI before anything publishes
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

---

## Status — 2026-08-30: built and gated; Pages not yet switched on

**Built.** Eight areas, 95 ideas, 14 exercises, rendered as nine pages of static HTML with no
client script. `checkContent` is the reader, so the site cannot accept content the validator
rejects. Full suite 678 across 41 files, typecheck clean, `validate:content` clean.

**The gate was broken on its first three mutants, and that is the part worth keeping.** All
twelve vocabulary assertions were vacuous. The pattern was written with a *single* backslash
inside a template literal — `\b` rather than `\\b` — which JavaScript reads as the
backspace character, not a word boundary. The regex was backspace-d-c-backspace and matched
nothing, ever, while the suite reported fifteen passes and three seeded mutants walked through
it. `String.raw` fixed it. That is the second time in one day an escape inside a heredoc
produced a test that measured nothing, which is now a pattern rather than an accident.

**The working gate immediately caught the rule rather than the site.** "boss" appears in three
Area 2 briefs — in the author's own teaching prose. Rewriting an author's sentence to satisfy a
test would be the site editing the curriculum, which is the opposite of what it is for. So the
check is scoped to what the *generator* contributes: headings, labels, navigation, metadata. The
author's words are excluded, and a difficulty class printed beside an exercise title still fails,
which is the case that matters.

**Six mutants die now. Two others taught something before they did:**

- `exercises[].concepts` was **dead data** — computed and never rendered, so a mutant could put
  anything in it and nothing noticed. It renders now, because what an exercise teaches is worth
  reading.
- The missing-brief guard was **unreachable**. `validate.ts:389` already enforces that every path
  an item points at exists, so `buildSite` throws at the issues check before any brief is read.
  Removed rather than tested — the same rule in two homes, and the copy further from the content
  is the one that goes stale.

### Remains

- **GitHub Pages must be switched on** — Settings → Pages → Source → *GitHub Actions*. Until
  then the build and both gates pass and nothing publishes: a green-looking run and no site.
  `planning/reminders/follow-up_enable-github-pages_2026-08-30.md`.
- **Evergreen is unproven until that round trip runs**: edit a blurb, push, read the page. Today
  it is a claim about a workflow file.
- `area-0.yml` and `area-2.yml` carry no `weeks` or `blurb`, so those two pages read "Weeks not
  yet set". Honest today; it resolves when those tracks land their fields.
