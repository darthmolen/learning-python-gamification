---
kind: plan
status: queued
track: build-integrity
date: 2026-09-09
---

# The build and the tests see the same code

**Status:** Planned
**Track:** build-integrity
**Date:** 2026-09-09
**Author:** Claude (Opus 5)
**Lane:** A

## Objective

Close the gap where 1154 passing tests and a clean `validate:content` sit alongside two
applications that will not start, because the suite reads `src/` and the applications read
`dist/`.

## Why this exists

Two apps broke within twenty minutes of each other on 2026-09-09, while everything that
claims to check this repository was green.

**The Field Manual would not build.** `npm run build` threw 32 validation issues, every one
of them `practices.yml` being parsed as a quest — a file the validator has understood since
the practice spine landed on 2026-09-06.

**The SPA would not start.** The browser reported:

```text
Uncaught SyntaxError: The requested module
'/@fs/.../packages/contract/dist/index.js' does not provide an export named 'HowToSchema'
```

`HowToSchema` was added to `contract/src/endpoints.ts` on 2026-09-06 and had never reached
`dist`.

### One cause, measured

Every `@pyquest/*` package publishes compiled `dist/`, and the compiled output had drifted
days behind source:

| package | `dist/index.js` | newest `src/*.ts` | drift |
|---|---|---|---|
| `contract` | Aug 30 | Sep 6 | **7 days** |
| `db` | Sep 1 | Sep 6 | 5 days |
| `content` | Sep 6 | Sep 9 | 3 days |
| `engine` | Aug 30 | Aug 30 | none |

`apps/api` depends on all four. `apps/web` on two. `apps/field-manual` on one. All of them
resolve the package entry, which is `./dist/index.js`.

### Three reasons nobody saw it

**1. The suite never loads `dist`.** `pyquest/vitest.config.ts` aliases every `@pyquest/*`
to source. That alias is deliberate and worth keeping — its own comment argues it — but the
consequence is that no test in the repository has ever executed the compiled output that
every application actually imports.

**2. CI cannot reproduce it, and is right not to.** `build.yml` and `field-manual.yml` both
begin `npm ci`, which removes `dist/` entirely, and `field-manual.yml` explicitly runs
`npm run build --workspace @pyquest/content` before it builds the site. CI is green because
it always starts from nothing. **This is a working-tree failure, not a CI failure**, and any
fix that only adds a CI step will not touch it.

**3. `tsc -b` reported success without doing anything.** Four times. `npm run build` for
`@pyquest/contract` exited 0 while `dist/index.js` kept its Aug 30 timestamp. Deleting
`packages/contract/tsconfig.tsbuildinfo` and running the identical command rebuilt it
immediately.

That third one is the most alarming, because it is the mechanism a developer would reach
for on being told "your dist is stale" — and it would tell them they had already fixed it.
**Why the build info asserted freshness it could not back is not yet diagnosed**, and this
plan says so rather than guessing. Branch switching is the obvious suspect: `dist/` and
`*.tsbuildinfo` are both gitignored, so neither changes on checkout while every `src/` file
is rewritten, and this branch has switched between `main`, three feature branches and two
worktrees today.

## Success criteria

- [ ] Something in the repository fails when `dist/` is stale, **on a developer's machine**,
      without a clean install
- [ ] At least one test imports a package by its **entry point** rather than through the
      alias, so the compiled artifact is exercised at least once
- [ ] `npm run build` for a package either rebuilds or explains why it did not — a command
      that exits 0 having done nothing is worse than one that fails
- [ ] The Field Manual and the SPA cannot be started against stale packages by accident
- [ ] The vitest source alias **stays**. It is correct, and this plan is not an argument
      against it
- [ ] Diagnosed and written down: why `tsc -b` trusted its build info

## Approach

Four candidates. They are not alternatives; 1 and 2 are the floor and the rest are worth
arguing.

### 1 — Build the packages before anything consumes them

`apps/field-manual`'s `build` and `apps/web`'s `dev` and `build` gain a dependency on the
workspace packages being current. `field-manual.yml` already does exactly this in CI, which
is evidence the step is the right shape; it simply is not present locally.

Cheapest, and it makes the common path correct. It does **not** satisfy the first success
criterion on its own, because a developer running `vite` directly still gets stale modules.

### 2 — One test that imports the built entry

A single test that does `import { HowToSchema } from '@pyquest/contract'` **without the
alias** and asserts the export exists. It fails the moment `dist` lacks something `src` has.

Small, and it is the check that would have caught both failures this morning. The awkward
part is arranging for one project in the vitest workspace to opt out of the alias, and that
is the design work in this plan.

An alternative shape worth weighing: a script rather than a test — compare the exported
names of `src/index.ts` against `dist/index.js` for every package. It needs no alias
surgery and reports the difference directly. It is not a test, which in this repository is a
real cost.

### 3 — Make the staleness visible

A `check:dist` script comparing newest `src/*.ts` mtime against `dist/index.js` per package,
wired into `pretest` or `predev`. Crude, and mtimes are exactly what the build info already
got wrong, so this is a second opinion rather than a fix.

### 4 — Stop shipping `dist` to local consumers

The larger option: point the package `exports` at source for development, the way the alias
already does for tests, and compile only for publish. It removes the two-artifact problem
instead of policing it, and it is a change to how every package is consumed — so it is named
here and deliberately not chosen without discussion.

## Files expected to change

- `pyquest/apps/field-manual/package.json`, `pyquest/apps/web/package.json` — build ordering
- `pyquest/vitest.config.ts` — one project that resolves packages by entry point
- a new test or `pyquest/scripts/` check, depending on which shape 2 takes
- `pyquest/package.json` — a `check:dist` or equivalent, if 3 is taken

**Not changed:** the alias for the existing projects. Every current test keeps reading
source.

## Out of scope

Rewriting the packages' `exports` (option 4) without a decision. Anything under
`curriculum/` or `game/`. The `apps/web/src/fixtures` disagreements, which belong to
`the-fixture-ledger-compares-facts_2026-09-06`.

## What was already done, so it is not done twice

All four packages were rebuilt by hand on 2026-09-09 after deleting their `tsbuildinfo`,
and both applications now start. **That is a repair, not a fix** — the next branch switch
can put it back exactly as it was, which is the whole reason for this plan.
