# TypeScript Has No Linter, and the Learner Is Graded on One

**Status:** Backlog
**Date Discovered:** 2026-08-29
**Discovered During:** `planning/feature_contract-modules_2026-08-29.md`, v3 review

## Context

A reviewer asked that a plan's success criteria name `npm run lint`. There is no such script.
There is no ESLint, Biome or oxlint config anywhere in `pyquest/`, no lint dependency in any
`package.json`, and no lint step in any workflow. TypeScript quality here is `tsc` and nothing
else.

That is defensible on its own — `strict`, `noUncheckedIndexedAccess` and `verbatimModuleSyntax`
catch a great deal, and a linter nobody configured is a linter nobody agrees with. What makes
it worth an item is the asymmetry:

- **Python has a standard and it is enforced.** `CLAUDE.md` requires ruff and pyright clean on
  every `.py`, and the `python-quality-developer` skill exists to hold it.
- **§5.10 grades the learner on exactly that.** The Idiomatic medal is literally "ruff and
  pyright clean, plus one written line on why this solution is idiomatic."
- **The repository holds itself to that standard in Python and to no standard in TypeScript** —
  and TypeScript is most of the repository.

At Boss 7 he opens this repository and reads it. The argument for the medal is that the bar is
real and the grown-ups meet it too. That argument is currently true of `content/` and
`apps/runner/**` and untrue of every package he would actually be reading.

## Known Scope

Choose one linter and configure it, or write down why TypeScript does not get one. Both are
answers; the absence of either is the problem.

If a linter lands, the rules that would have caught real defects in this repo so far are worth
seeding from: unused imports, floating promises, `any` (none today, worth keeping that way), and
consistent type-only imports — the engine's contract dependency is type-only by design and
nothing currently enforces that it stays so.

Not a large job. It is here rather than in a plan because it touches every package, which means
it belongs to `main` and to a moment when no track is mid-flight.

## Trigger for Promotion

The first time a review asks for a lint command again, or the first `apps/` package landing —
`apps/web` and `apps/api` are both React-and-Fastify shaped, which is where lint rules earn
their keep far more than in a pure library.
