# `tsc -b` Compiles No Application Code

**Status:** Backlog
**Track:** main
**Date:** 2026-08-31
**Author:** Claude (Opus 5)
**Lane:** A
**Found by:** `planning/completed/feature_the-stack-runs-end-to-end_2026-08-31.md`

## Objective

Make `tsc -b` from `pyquest/` mean what everyone reading it assumes it means: this repository
compiles.

## Why this exists

`pyquest/tsconfig.json` is:

```json
{ "files": [], "references": [
  { "path": "./packages/content" }, { "path": "./packages/contract" },
  { "path": "./packages/db" },      { "path": "./packages/engine" } ] }
```

**No app is referenced.** `apps/api`, `apps/web` and `apps/field-manual` are compiled by `tsc -b`
not at all.

Measured 2026-08-31. With `import { areaView, ... } from './views-that-do-not-exist.ts'` in
`apps/api/src/server.ts`:

```
$ npx tsc -b --pretty
$ echo $?
0
```

Nothing printed. Exit zero. The same tree under `npm run typecheck`:

```
src/server.ts(81,62): error TS2307: Cannot find module './views-that-do-not-exist.ts'
typecheck exit=2
```

This matters because **`tsc -b` is what people type and what plans specify.** The plan that found
this specified `tsc -b` for a new CI gate, in a repository that has already shipped five
green-but-blind checks; it would have been the sixth. `.github/workflows/build.yml` now calls
`npm run typecheck` instead and its header records why, but that is a workaround at the call site
— every other caller, and every person at a prompt, still gets the blind command.

## Success Criteria

- [ ] `npx tsc -b` from `pyquest/` fails on a broken import in **any** of `apps/api`,
      `apps/web`, `apps/field-manual` — one seeded mutant per app, each watched failing
- [ ] `npm run typecheck` still passes and still covers what it covers
- [ ] `.github/workflows/build.yml` can go back to `tsc -b`, or its header updated to say why
      it deliberately does not
- [ ] Full suite green

## Approach

Add `./apps/api`, `./apps/web` and `./apps/field-manual` to the root references. Each app has a
working `tsconfig.json` already — they are compiled today by `npm run typecheck --workspaces`,
so this is wiring, not new configuration.

**Expect it not to be free.** Project references require `composite: true` on the referenced
project and every project it references, and the apps may not be composite. `apps/web` has JSX
and `.tsx`, and `tsc -b` on it emits — which is either harmless or a new gitignore entry,
depending on its `outDir`. Check what each app's build actually produces before assuming the
references are cosmetic.

**Then seed a mutant in each of the three.** The whole point of this item is that the config
looked plausible and did nothing; a fixed config that also looks plausible is worth exactly as
much until it has been watched failing three times.

## Dependencies / Prerequisites

None. `tsconfig.json` at `pyquest/` root is named by no plan currently in flight, which is why
the workflow worked around it rather than editing it.

## Files Expected to Change

- `pyquest/tsconfig.json`
- possibly `pyquest/apps/*/tsconfig.json` — `composite`, `outDir`
- `.github/workflows/build.yml` — the header's explanation, if the step reverts

## Out of Scope

- Adding `vitest` to the build gate. That needs Postgres on the runner and is a separate
  question.
