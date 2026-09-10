---
kind: plan
status: completed
track: build-integrity
date: 2026-09-09
completed: 2026-09-10
---

# The build and the tests see the same code

**Status:** Complete
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

- [x] Something in the repository fails when `dist/` is stale, **on a developer's machine**,
      without a clean install
- [x] At least one test imports a package by its **entry point** rather than through the
      alias, so the compiled artifact is exercised at least once
- [x] `npm run build` for a package either rebuilds or explains why it did not — a command
      that exits 0 having done nothing is worse than one that fails
- [x] The Field Manual and the SPA cannot be started against stale packages by accident
- [x] The vitest source alias **stays**. It is correct, and this plan is not an argument
      against it
- [x] Diagnosed and written down: why `tsc -b` trusted its build info

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

## Status — 2026-09-10, complete

**Every success criterion is met, including the one that was a question rather than a task.**
`tsc -b`'s behavior is diagnosed, reproduced three ways and written down.

### The diagnosis, which turned out to decide the design

`planning/evidence/tsc-b-trusts-buildinfo-DIAGNOSIS.txt`. Reproduced on the first attempt,
with no setup: checking out `main` left `packages/content` stale, and `npm run build` exited
0, left `dist/index.js` at 08:31, and pushed `tsconfig.tsbuildinfo` forward to 21:50.

Three mechanisms compose into it, each demonstrated separately:

1. **`tsc -b` never stats `dist/`.** With `dist/index.js` deleted and the buildinfo intact,
   it exits 0. With the buildinfo *backdated eight days behind source*, it still exits 0 and
   still does not emit. The recorded input hashes are the whole of its knowledge.
2. **A mtime-only change pushes the buildinfo's own mtime forward.** `git checkout` rewrites
   every `src/` mtime and changes no text, so the first `tsc -b` after a branch switch
   re-dates the buildinfo ahead of every input — and the file becomes self-confirming.
3. **Emit is per-file.** A real text change to `validate.ts` re-emitted `validate.js` and
   *still* left `index.js` missing, with `index.js.map` and `index.d.ts` sitting beside the
   hole. Unrelated work never sweeps up the one artifact that is wrong.

So it was never a corrupted cache. The compiler behaved exactly as designed, and the design
assumes nothing but `tsc` writes to `outDir`. **This is why the plan's option 3 was not
taken**: an mtime comparison is a second opinion from the witness that was already wrong, and
it cannot see a `dist/index.js` whose contents are stale but whose date is fine.

### What was built

| | |
|---|---|
| `pyquest/scripts/dist-parity.ts` | the comparison — entry points derived from the manifests, export names diffed, the report |
| `pyquest/tests/compiled-entry-points.test.ts` | **the check**: imports each package by its published specifier and diffs against source |
| `pyquest/vitest.config.ts` | a `dist` project, the only one with **no alias** |
| `pyquest/scripts/build-packages.ts` | `npm run build` — compile, verify, repair once, verify again, fail loudly |
| `pyquest/package.json` | `build` and `check:dist` |
| `apps/field-manual`, `apps/web`, `apps/api` | `prebuild` / `predev` / `prestart` |
| `.github/workflows/build.yml` | the parity project, as a supplement |

Approaches 1 and 2 from the plan, as specified. Option 2 was taken in its **test** shape
rather than its script shape, and the script that was also written does not reimplement the
comparison — it shells out to the same suite, so there is one check rather than two that can
disagree.

**`pyquest/tests/` is a new directory and the placement is load-bearing.** A parity test under
`scripts/**` or `packages/**` would be collected by an *aliased* project as well, and the
aliased copy would compare source against itself: green, measuring nothing.

### The repair loop, and why the build does it rather than printing instructions

`npm run build` runs `tsc -b`, verifies, and on failure discards the buildinfo, rebuilds with
`--force`, and verifies again. Deleting the buildinfo is the only thing that makes the
compiler look at reality, so the build does it. It will not hide a second failure: parity
still wrong after a forced rebuild says so and exits 1, because that is no longer a stale
cache.

### Verified — commands and output

`planning/evidence/dist-parity-RED-GREEN-MUTANT.txt` carries all of it. In brief:

```console
# RED — HowToSchema's exact failure, reproduced
$ npx vitest run --project dist
  FAIL |dist| '@pyquest/contract' > exports from dist everything it exports from src
        missing from dist:  StaleProbeSchema
  Tests  1 failed | 5 passed (6)

# the hardest case: output deleted, buildinfo intact
$ npx tsc -b                       exit 0, dist/index.js STILL MISSING
$ npm run build                    Tests 2 failed -> repair -> Tests 6 passed
                                   "Recovered after discarding stale build info."  EXIT=0

# three mutants seeded into dist-parity.ts, each caught (4, 2 and 2 tests failing)

$ npx vitest run                   75 files, 1170 passed | 1 skipped     (1154 before)
$ npm run typecheck                clean
$ npm run build --workspace @pyquest/field-manual
                                   8 areas, 95 ideas, 26 exercises -> dist/
$ npm run dev --workspace @pyquest/web -- --port 5199
                                   VITE ready in 218 ms; GET / -> 200; /src/main.tsx -> 200
$ node -e "import('@pyquest/contract').then(m=>console.log('HowToSchema' in m))"
                                   true
```

Production was up throughout (3081, 3082, 5433) and a vite dev server was already on 5173.
Neither was touched — the SPA was verified on 5199 and that server stopped afterwards, with
5173 re-checked at 200.

### Option 4 — argued, and not taken

The plan asked for an argument rather than a change, so: **do not point `exports` at source.**

- It does not remove the two-artifact problem, it *relocates* it. `apps/api`'s container
  builds from source and runs compiled output, so the compiled path has to keep existing and
  keep being correct; a dev condition on `exports` means every consumer must pass the
  condition, and the one that forgets is back to today's failure with a longer explanation.
- **It does not work here, measured.** `packages/db/src/migrate.ts` uses a TypeScript
  parameter property, which Node's `--experimental-strip-types` refuses outright with
  `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`. This was found the hard way: the first draft of
  `build-packages.ts` imported package *source* directly and died on it. Any scheme that has
  Node load `@pyquest/db` from source needs that file rewritten first, and probably others.
- The cost it was meant to save is now about half a second per build, and the failure it was
  meant to prevent is caught by a test.

Worth revisiting only if the transform cost becomes real. It is not currently a cost.

### Where the plan turned out to be wrong

**"`tsc -b` reported success without doing anything" undersold it.** It is not that the
command did nothing — it *actively pushed the buildinfo forward*, which is what made the next
four attempts fail the same way. A developer deleting one package's buildinfo and rebuilding
would fix that package and re-arm the trap for the others.

**Option 2's "awkward part" was the easy part.** The plan expected alias surgery to be the
design work. Adding a project with no `resolve.alias` was three lines. The real design work
was *where the file lives* — anywhere under an existing project's glob and the check quietly
measures nothing.

### Found along the way, fixed, and outside the plan

`apps/field-manual`'s build did `rmSync(outDir, { recursive: true, force: true })`, which
fails `EPERM` when anything holds the directory handle — and something did: a
`python -m http.server` previewing the site, with its working directory *inside* `dist/`. The
build died having produced nothing, for a reason unrelated to content. Clearing the
directory's children needs no such handle and clears just as thoroughly. Changed, with the
reasoning in a comment; the preview server picked up the rebuilt site without a restart.

### Still open, and who owns it

**`pyquest/scripts/` and `pyquest/tests/` are not typechecked by `npm run typecheck`.** Root
`tsconfig.json` references the four packages and no more, so `plans.ts`, `validate-plans.ts`
and now `dist-parity.ts` are compiled by vitest and by nothing else. This is pre-existing —
`build.yml`'s own header names it and deliberately declines to edit root `tsconfig.json`
"from the side", because that file belongs to no track. This plan follows that precedent
rather than overturning it. The new files were typechecked ad hoc (`tsc --noEmit --strict`,
clean) and that is not a substitute. **Owner: whoever takes the root-tsconfig-references
question, which still belongs to no track.**
