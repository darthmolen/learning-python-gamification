# Decide where `vite build` runs as a gate, and put it there

**Category:** decide
**Audience:** dm
**Subject:** tooling
**Raised:** 2026-08-31
**Plan:** `planning/**/feature_integration-suite_2026-08-30.md`
**Status:** open

## What to do

Pick one of three homes for "the thing must actually build", then do it. Tier 3 of the
integration-suite item is this decision and says it is "a decision above this track" — which is
why it has stayed open: no track can take it.

1. **A CI job.** There is now exactly one workflow (`field-manual.yml`) and it proves the shape
   works. A second job, or a second workflow, running `npm run build` across the workspaces.
2. **A pre-push hook.** Catches it before it leaves the machine, costs a wait on every push,
   and §7's "no hooks on a learner's repository" does not apply here — this is the DM's repo.
3. **A wave exit criterion.** Cheapest, and the weakest: it depends on somebody reading a
   checklist.

**Deferred deliberately on the evening of 2026-08-31**, with tracks launching the same night, so
the decision is tomorrow's and the exposure is tonight's — see below.

## Why it cannot be a test

It is a decision about **where the tests run**, which no test can make. The suite cannot notice
that nothing invokes the build, because from inside the suite nothing is missing.

That is precisely the failure mode: `pyquest/vitest.config.ts` aliases `@pyquest/content` to
`src/index.ts`, so vitest never touches `dist/`. The alias is correct and should stay. The
consequence is that **a green suite is silent about whether the artifact can be built at all.**

## What it changes

**Three failures so far, and they were not near each other:**

| | What happened | What was green at the time |
|---|---|---|
| 1 | `vite build` broke on a `node:fs` import for days | `vitest --project web` |
| 2 | The SPA's production build broke across several commits | the same |
| 3 | The Field Manual's CI build died on `ERR_MODULE_NOT_FOUND`, so nothing published | `validate:content` **and** the no-game gate |

The third is the one that should decide it. It was not a local inconvenience — the deploy job
never ran, the site 404'd, and **both gates reported success on the failing run**. The gap is not
a missing test. It is that the suite runs against source and the artifact is built from `dist`.

**Chosen and installed:** the class of failure that has cost three incidents stops being
possible, and it is an hour's work.

**Left open:** the fourth one is already scheduled — it just has not happened yet.

## The exposure this reminder is holding open

Work was launched on other tracks the night this was deferred. **The thing being deferred is the
thing that would catch mistakes made by that work**, which is worth stating plainly rather than
discovering.

The agreed mitigation, until the gate exists: **any track that changes `pyquest/` builds by
hand before it reports done.** That is the gate, executed by a person, and it is the reason
deferring the decision by a day is safe rather than merely convenient.

## Step zero, found while arranging that mitigation

**There is no repo-wide build command.** `npm run build` from `pyquest/` fails with
`Missing script: "build"` — the root scripts are `test`, `test:watch`, `typecheck`,
`validate:content` and `new:quest`. Builds are per workspace:

```
npm run build --workspace @pyquest/web           # vite
npm run build --workspace @pyquest/field-manual  # the static site
npm run build --workspace @pyquest/content       # tsc -b, and the one CI was missing
```

**So there is nothing to put in a gate yet.** Whichever home wins, the first step is a root
`build` script that builds the workspaces in dependency order — and that is not bookkeeping, it
is most of why this kept not happening: three separate incidents, and no single command anybody
could have run to catch any of them.

It also explains the shape of the Field Manual failure. `field-manual.yml` had to name
`@pyquest/content` explicitly because no command exists that would have built it as a
dependency, and naming dependencies by hand in a workflow is exactly the thing that gets
forgotten once.
