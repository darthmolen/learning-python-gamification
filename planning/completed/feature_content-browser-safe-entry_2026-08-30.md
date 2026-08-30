# The Content Package Cannot Be Bundled For A Browser

**Status:** Completed
**Track:** content-wire
**Date:** 2026-08-30
**Author:** Claude (Opus 5)
**Lane:** A
**Discovered During:** `planning/in-progress/feature_spa_2026-08-28-v2.md`, Phase 2

## Objective

Give `@pyquest/content` a browser-safe entry point so anything that bundles
`@pyquest/contract` for a browser stops pulling `node:fs` in behind it.

## The failure

`npm run build --workspace @pyquest/web` fails:

```
[vite:resolve] Module "node:fs" has been externalized for browser compatibility,
  imported by "packages/content/dist/validate.js"
[vite:resolve] Module "node:fs" has been externalized for browser compatibility,
  imported by "packages/content/dist/scaffold.js"
error during build:
  import { existsSync, readFileSync, readdirSync } from 'node:fs';
```

The chain is three links and every one of them is deliberate on its own:

1. `packages/content/package.json` declares exactly one export, `"."` → `dist/index.js`.
2. That barrel re-exports **both halves of the package**: the schemas and constants
   (`AreaSchema`, `MedalSchema`, `CONCEPT_IDS`, `DEFAULT_MEDALS` — pure data, browser-safe) and
   the validator, the scaffolder and the CLI (`validate.ts`, `scaffold.ts`, `cli/` — `node:fs`
   and `yaml`).
3. `packages/contract` imports from that barrel in four files: `primitives.ts` takes
   `CONCEPT_IDS`, `payloads.ts` takes `AreaSchema`, `DifficultyClassSchema` and `MedalSchema`,
   `progress.ts` takes `MedalSchema`, `endpoints.ts` takes several.

So importing one enum from the contract reaches a filesystem API. Rollup cannot tree-shake it
away, because a side-effectful module graph is not something it is allowed to guess at.

## Why nobody hit it until now

**The SPA's tests and dev server both pass.** `vitest.config.ts` aliases `@pyquest/content` to
`src/index.ts` and the web project runs in jsdom, where an unused `node:fs` import is never
evaluated. `vite dev` serves modules unbundled and never resolves the branch. Only `vite build`
— rollup, whole-graph, production — trips it.

SPA Phase 1 built clean on 2026-08-29 because it imported nothing from the contract at runtime.
Phase 2's gateway was the first code to do so, and the build broke on the commit that added it.
**The bug is older than the commit that revealed it**, and it was verified independently of the
SPA: the build fails identically with every `@pyquest/content` import removed from `apps/web`.

## Decision needed: which half moves

Two shapes, and this plan does not pick one because the owner of `packages/content` should.

**A — a subpath export (recommended).** Add `"./schema"` to the exports map, pointing at a
module carrying only the browser-safe half; leave `"."` exactly as it is so every existing
Node-side consumer and the CLI are untouched. `packages/contract`'s four imports change to
`@pyquest/content/schema`. Smallest blast radius, and the package keeps one identity.

**B — invert the barrel.** Make `"."` the browser-safe half and move the validator and
scaffolder to `"./node"` or their own package. Cleaner in the abstract — the default export
becomes the one that is safe everywhere — but it changes what every existing importer gets, and
`validate:content` and `new:quest` are on the critical path for Lane B authoring right now.

Recommendation: **A**. B is the better long-term shape and a worse thing to do while three
content tracks are mid-flight.

## Success Criteria

- [ ] `npm run build --workspace @pyquest/web` succeeds
- [ ] **A test that fails if this regresses.** The build is the only thing that catches it today,
      and the build is not in any suite — so a check that the browser-safe entry's module graph
      reaches no `node:` builtin, run as a test rather than trusted to whoever next runs a build
- [ ] `validate:content` and `new:quest` still work, unchanged, from `pyquest/`
- [ ] Every existing test passes with no edit to any test file — the split is mechanical
- [ ] `npm run typecheck` clean and `tsc -b` still builds both packages

## Approach

**Move, do not rewrite.** Every schema and constant moves verbatim. The one thing that may not
survive mechanically is import order, the same caveat the modules split carried.

**The filter is the module graph, not the build.** "Run the build and see" is not a check that
lives anywhere — it passes on the machine of whoever remembers to run it. Walk the browser-safe
entry's imports transitively and assert none resolves to a `node:` builtin. Seed the mutant that
decides it: re-export `validate.ts` from the browser-safe module. A suite that stays green has
tested that the file exists.

**Note for the implementer.** `packages/contract` is a shared file set — `payloads.ts` is
`main`'s, `progress.ts` is `db`'s, `endpoints.ts` is `api`'s, and `api` is **in flight in this
working tree right now**. This plan edits one import line in each. Coordinate on `endpoints.ts`
rather than assuming it is free.

## Files Expected to Change

- `pyquest/packages/content/package.json` — the exports map
- `pyquest/packages/content/src/` — the browser-safe entry module
- `pyquest/packages/contract/src/primitives.ts`, `payloads.ts`, `progress.ts`,
  `endpoints.ts` — one import specifier each. **`endpoints.ts` is `api`'s and in flight**
- `pyquest/packages/content/tests/` — the module-graph test

## Out of Scope

- Splitting `packages/content` into two packages. Option B territory, and a bigger decision
- Anything in `apps/web`. The SPA needs no change; it is the thing that noticed

## Anticipated Backlog

- **`vite build` is in no gate.** The SPA's gate is `npx vitest run --project web`, which is
  green while the production build is broken — that is how this survived a commit. Whether the
  build joins a suite, a hook or a wave's exit criteria is a question this plan raises and does
  not answer

---

## Status

**Final Status:** Completed
**Track:** content-wire
**Completed:** 2026-08-30
**Completed By:** Claude (Opus 5)

### Outcomes

- `packages/content/src/browser.ts` — concepts and schema only, nothing that reads a disk.
- `packages/content/package.json` exports `./browser` alongside `.`, which is unchanged: the
  full entry still reaches `validate.ts`, because `apps/api/src/content.ts` imports
  `checkContent` through the bare specifier and must keep being able to.
- All four contract modules import `@pyquest/content/browser`. `endpoints.ts` was released by
  the `api` track first (`08e6fd0`) rather than edited under it.
- `packages/content/tests/browser-entry.test.ts` walks the module graph transitively and asserts
  no `node:` builtin is reachable. Three mutants seeded, three killed: re-export `validate.ts`,
  re-export `scaffold.ts`, import `node:fs` directly.
- `vitest.config.ts` learned subpath aliases — 509 tests across 28 files, typecheck clean.

### Deviations

- **`vitest.config.ts` was edited and the plan did not name it.** Without a
  `@pyquest/content/browser` alias the tests resolve that specifier through `dist/`, which is
  the staleness the alias map exists to prevent. The subpath key must be inserted *before* the
  bare one: Vite matches string aliases by prefix, so `@pyquest/content` sitting first rewrites
  `@pyquest/content/browser` into a path ending `index.ts/browser`.
- **Out of Scope was wrong: "the SPA needs no change".** See below.

### The plan's one wrong sentence

`npm run build --workspace @pyquest/web` still fails after this plan, and correctly so.
`apps/web/src/present/index.ts` imports `DEFAULT_MEDALS` from the bare `@pyquest/content`, which
pulls the full entry — and `node:fs` — into the browser bundle regardless of what the contract
does.

**A safe entry only helps the consumers who ask for it.** Nothing stops the next browser-side
import from naming the bare specifier, and the failure it produces names a file in
`packages/content/dist/` rather than the line that caused it.

Two lines fix it today, both the `spa` track's:
`apps/web/src/present/index.ts` and `present.test.ts` import from `@pyquest/content/browser`.

What would stop it recurring is a guard in `apps/web` asserting that nothing under `src/`
imports the bare specifier — the same shape as the module-graph test here, one level up. That
belongs to the `spa` track and is written down in the backlog rather than done here.

### Lessons Learned

- **A production build that is in no gate will break and stay broken.** This survived a commit
  because the SPA's gate is `vitest --project web`, which is green while `vite build` fails. The
  plan raised it and did not answer it; it is still unanswered.
- **Escaping a path separator inside a regex, inside a heredoc, produced a test that passed
  vacuously.** `[\/]` arrived as `[\/]`, which matches only forward slashes, so the assertion
  that the browser entry reaches neither `validate` nor `scaffold` was true of nothing on
  Windows. Normalising separators once, at the source, is what the file does now.

---

## Closing note — 2026-08-30, from the `spa` track

The two deferred lines are done and the guard is written.

`apps/web/src/present/index.ts` and `present/present.test.ts` now import from
`@pyquest/content/browser`. `npm run build --workspace @pyquest/web` **succeeds**, and the
served dev graph resolves `packages/contract/dist/payloads.js` to `content/dist/browser.js` with
no `vite-browser-external` shim anywhere in it.

The guard is `apps/web/src/gateway/boundary.test.ts` —
*imports the browser entry of the content package, never the bare one*. It walks every file
under `apps/web/src/` and fails on a bare `@pyquest/content` specifier, naming the file that did
it. Verified by seeding the bare import back: caught, one test, pointing at
`present/index.ts` rather than at `packages/content/dist/validate.js`.

**Correcting this plan's Out of Scope**, which said "the SPA needs no change; it is the thing
that noticed." Wrong, and usefully so: fixing the contract's four imports left the build broken
on one line in a package the plan had excluded. A safe entry is not a property of the package
that offers it — it is a property of every consumer that remembers to ask.

Two things this leaves standing, both already named above and neither closed here:

- **`vite build` is still in no gate.** The SPA's gate stayed green through the entire outage,
  because jsdom never evaluates an unused `node:fs` import and vite dev serves modules
  unbundled. The new guard catches this particular cause; it does not make the build a gate.
- **The dev server fails differently from the build, and later.** `curl` returns 200 because
  that is the HTML shell; the graph only breaks when the browser evaluates it. A reachability
  check that stops at the status code will report a blank page as healthy — which is what
  happened here, in this session, to me.

### A third one, 2026-08-30 — a running dev server holds resolution state

Adding an import of `@pyquest/content/browser` produced, in the browser,
`Uncaught ReferenceError: CONCEPTS is not defined` — from a module whose source imported it and
whose tests passed.

The dev server had been started **before** the `./browser` subpath existed in the exports map.
It could not resolve the new specifier, and rather than failing it **silently dropped the import
line** and served a module that used the binding without importing it. Same file, two
transforms:

| | line 11 | line 32 |
|---|---|---|
| stale server | *(no import)* | `CONCEPTS.filter(...)` |
| fresh server | `import { CONCEPTS } from "/@fs/…/content/dist/browser.js"` | `CONCEPTS.filter(...)` |

Killing the process and clearing `node_modules/.vite` fixed it with no code change. The first
restart attempt also failed, on `strictPort`, because the old server still held 5173 — which is
worth knowing, since a failed restart looks like a broken app.

**The pattern, now three for three.** `boundary.test.ts` not loading under jsdom while the
summary read *54 passed*; `vitest --project web` staying green through a completely broken
`vite build`; and now a dev server serving a module it had quietly mutilated. Different
mechanisms, one shape: **the check and the thing it checks drifted apart, and the check kept
reporting on what it used to be looking at.**

The practical rule this leaves: *"the tests pass and dev is up"* is not evidence after the
dependency graph changes underneath a long-lived process. Restart it, or you are reading a
cached opinion.
