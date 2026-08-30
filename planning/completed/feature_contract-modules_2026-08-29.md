# The Contract Modules the Lane A Tracks Cannot Share

**Status:** Completed
**Track:** main
**Date:** 2026-08-29
**Author:** Claude (Opus 5)
**Lane:** A — the seam, again, and for the same reason as the last two

## Objective

Split `packages/contract/src/index.ts` into one module per owner, so `db` and `api` can each
add the shapes they owe the other tracks without editing the same file, and `index.ts`
changes exactly once — here.

## Why this exists

The contract shipped on 2026-08-29 with the payload half and three progress rows. Two plans
have since come back from review needing to add to it, and they cannot both do that:

- **`db` owes seven row shapes.** The contract's input half covers only what the *engine*
  reads — `quest_medals`, `concept_reviews`, `forced_reviews`. The schema has ten tables.
  There is no shape for `players`, `player_roles`, `attempts`, `datamines`,
  `journal_entries`, `sessions` or `bounties`, and the db plan's Phase 2 promises a
  repository "returning the shapes `@pyquest/contract` declares."
- **`api` owes the route table, request bodies and one error shape.** The contract has no
  endpoints at all, which its own review found makes that plan's first success criterion
  unmeetable.

Both edits land in one 380-line `index.ts`. Under the disjointness rule that serialises two
tracks that have no real dependency on each other — `db` writing SQL has nothing to do with
`api` writing routes.

This is the fourth shared file to block parallel work, after `concepts.ts`,
`pyquest/tsconfig.json` and `infra/docker-compose.yml`. The compose split worked; this is the
same move on the same reasoning, and by now the pattern is worth naming: **when three tracks
need to write to one file, the file is doing two jobs.**

## Success Criteria

- [ ] One module per owner, each named in a header comment that says which track owns it
- [ ] `src/index.ts` re-exports everything and contains no schema of its own
- [ ] **Every existing test passes with no edit to any test file.** They import from
      `@pyquest/contract` and must not know the split happened — that is the check that this was
      mechanical. The count is whatever `vitest run packages/contract` reports before the split;
      capture it then rather than hardcoding it here, so adding a test tomorrow does not falsify
      a criterion
- [ ] `npm run typecheck` clean, `tsc -b` still builds the package
- [ ] The public surface is byte-identical, proved by **checksumming the whole built
      `dist/index.d.ts`** before and after. Comparing exported names would pass while a type's
      shape changed underneath one
- [ ] `dist/` gains four new `.d.ts` files, one per module, and that is expected — only
      `dist/index.d.ts` is compared, because it is the only one anything outside this package
      resolves through

## Approach

**The split follows ownership, not subject matter.** A `schemas.ts` / `types.ts` split would
look tidier and solve nothing, because both tracks would still be in both files.

| Module | Holds | Owned by |
|---|---|---|
| `src/payloads.ts` | what the API returns: quest cards, progress, boss state, the queue, the board, XP sources, level | `main` |
| `src/progress.ts` | the row shapes the repository returns — three today, ten when `db` is done | `db` |
| `src/endpoints.ts` | routes, request bodies, the error shape | `api` |
| `src/primitives.ts` | the shared pieces all three need: content ids, concept ids, counts, `PRESENTATION_FIELDS`, `TOP_RUNG_BOUND`, `INVASION_QUEUE_CAP` | `main` |
| `src/index.ts` | re-exports, and nothing else | `main` |

`primitives.ts` is the part that stops this from becoming three files that each redefine an
id. It is `main`'s and it should almost never change; a track that needs a new primitive is a
track that has found something the other two will also need.

**It may hold unexported internals.** `ContentIdSchema`, `ConceptIdSchema` and `CountSchema` are
shared today and exported by nobody, and they have to keep working across a module boundary
without becoming public API — so `primitives.ts` exports them to its siblings while `index.ts`
does not re-export them. That is the one place in this package where a module's exports and the
package's exports deliberately differ.

**Imports run one way.** `payloads.ts` and `progress.ts` both import from `primitives.ts`, and
neither imports the other. A cross-import between them is the split failing: the two exist
because two tracks own them, and a dependency between them re-couples the tracks.

**No behaviour changes here.** Every schema moves verbatim. The one thing that may not survive
mechanically is import order — `ConceptIdSchema` is built from `ContentIdSchema` and
`CONCEPT_IDS`, so `primitives.ts` has to land first — and if anything needs rewriting rather
than moving, that is the signal to stop and say so rather than to improve it in passing.

## Phases

### Phase 1 — the modules

Move, do not rewrite. `primitives.ts` first, then `payloads.ts` and `progress.ts` from what
exists. `endpoints.ts` is created **empty but real**, with its header naming the `api` track
and a comment saying what belongs in it — an empty owned file is what lets `api` start without
touching anything of `main`'s. It must typecheck clean carrying only that comment: no
placeholder export, no unused import, nothing that has to be deleted before real work starts.

An earlier draft said "typecheck and lint clean." **There is no TypeScript linter in this
repository** — no ESLint, Biome or oxlint, no config, no dependency, no script — so that was a
bar nobody could check. Recorded as `planning/backlog/feature_typescript-has-no-linter_2026-08-29.md`
rather than solved here; a mechanical file split is not where a linter should arrive.

### Phase 2 — the index

`index.ts` becomes re-exports. Run the suite: the same count as the run captured before Phase 1,
and no edit to any test file. A test that needs changing means the public surface moved, which
this plan is not allowed to do.

### Phase 3 — prove the surface did not move

Checksum `dist/index.d.ts` before the split and after it, and compare the two. The split also
produces `primitives.d.ts`, `payloads.d.ts`, `progress.d.ts` and `endpoints.d.ts` alongside it;
those are new files rather than a changed surface, since `package.json` points consumers at
`dist/index.d.ts` and nothing resolves the others by path. Reading the
file and believing it looks the same is what this check exists to replace — and comparing only
the list of exported names would let `AreaProgress` keep its name while losing a field, which is
exactly the failure a contract package exists to prevent.

## Dependencies / Prerequisites

- None. `packages/contract` is complete and its plan is in `completed/`

## Files Expected to Change

- `pyquest/packages/contract/src/index.ts` — becomes re-exports
- `pyquest/packages/contract/src/primitives.ts` — new
- `pyquest/packages/contract/src/payloads.ts` — new
- `pyquest/packages/contract/src/progress.ts` — new
- `pyquest/packages/contract/src/endpoints.ts` — new, empty, owned by `api`
- `planning/feature_progress-schema_2026-08-28.md` — file set names `progress.ts`
- `planning/feature_api-and-runner_2026-08-28.md` — file set names `endpoints.ts`

## Track discipline

A **gate, not a parallel track.** It runs alone and completes before `db` or `api` starts,
because it rewrites both of their file sets and edits the package they are both waiting on.

After it, `packages/contract` is no longer a single-owner file: `main` holds `index.ts`,
`primitives.ts` and `payloads.ts`; `db` holds `progress.ts`; `api` holds `endpoints.ts`. The
engine plan's rule that "contract edits belong to `main`" is superseded, and the api plan's
claim to hold the whole package for the duration is narrowed to one file.

## Out of Scope

Writing any of the shapes the two tracks owe. This plan creates an empty `endpoints.ts` and
moves three existing row schemas into `progress.ts`; filling either is the owning track's
work, in its own plan, after this lands.

---

## Review History

**v1 reviewed 2026-08-29 — implementable with fixes.** Six findings: five taken outright, one
rejected on the facts with its underlying point adopted, which is why the count below reads five.
Taken: `INVASION_QUEUE_CAP`
placed in `primitives.ts`, the `.d.ts` check strengthened from names to a checksum, unexported
internals given a home and a rule, import direction between the two owned modules stated, and
the empty `endpoints.ts` required to compile clean.

One finding rejected on the facts. The review called the "54 existing tests" claim wrong and put
the number at 45, counting `it`/`test` calls in the two test files. That count misses
`payloads.test.ts:88`, an `it.each(PRESENTATION_FIELDS)` that expands to nine cases at run time;
`vitest run packages/contract` reports 54. The reviewer's underlying point was better than the
correction, though, so the criterion no longer names a number at all — a hardcoded count is
falsified by the next test anyone writes.

**v3 reviewed 2026-08-29 — implementable, minor fixes.** All six v1 findings confirmed resolved.
Three more, two taken: the checksum is now scoped to `dist/index.d.ts` with the four new
per-module declaration files named as expected output, and the Review History wording above is
corrected.

The third was declined as written. It asked that Success Criteria name `npm run lint`, on the
strength of this plan's own "typecheck and lint clean" phrasing. There is no lint script, and no
linter configured anywhere in `pyquest/` — so the criterion would have been unmeetable rather
than merely unticked. The phrase is gone and the real gap is recorded in
`planning/backlog/feature_typescript-has-no-linter_2026-08-29.md`, which is a larger question
than this plan: the repository requires ruff and pyright clean of every `.py`, §5.10 grades the
learner on exactly that, and its own TypeScript has no equivalent bar.

---

## Status

**Final Status:** Completed
**Track:** main
**Completed:** 2026-08-29
**Completed By:** Claude (Opus 5)

### Outcomes

- `src/primitives.ts`, `src/payloads.ts`, `src/progress.ts` and `src/endpoints.ts` exist, each
  with a header naming its owning track. `src/index.ts` is re-exports and a header, and holds no
  schema.
- Every schema moved verbatim. Nothing was rewritten, and nothing needed to be.
- **54 tests pass, the same 54 as before the split, with no edit to any test file** —
  `git status packages/contract/tests/` is empty. 243 pass across the workspace.
- `npm run typecheck` clean across all four workspaces; `tsc -b` builds the package from clean.
- The public surface is unchanged: 38 exports, every resolved type identical (see Deviations for
  how that was measured, which is not what the plan said).
- `ContentIdSchema`, `ConceptIdSchema` and `CountSchema` are exported to siblings and absent
  from the package surface, checked by name against the snapshot rather than by reading the file.

### Deviations

**The `dist/index.d.ts` checksum could not be the check, and this was known before the split
rather than discovered after.** Once `index.ts` is pure re-exports its emitted declaration file
*is* re-export lines — `9c7218c8…` before, `c473c2e9…` after. The plan and its v3 review both
expected that file to survive unchanged. It cannot, and the failure mode matters: a checksum
that changes for a purely textual reason cannot distinguish "the surface moved" from "the
surface was relocated", so it would have had to be waived, and a waived check is not a check.

Replaced with the check the criterion was reaching for: **the resolved public surface**. A
compiler-API probe enumerates every export of the built `dist/index.d.ts` and prints its fully
expanded type — `AreaProgress` prints as `{ cleared: number; total: number; estimated: boolean; }`,
not as a name — sorted, 114 lines. Captured before Phase 1 and again after Phase 3.

That diff was not empty on the first run, and the six differing lines are worth recording. Every
one was the print order of the `Area` union: `0 | 3 | 6 | 5 | 1 | 2 | 4 | 7` against
`0 | 5 | 4 | 3 | 6 | 1 | 2 | 7`. Same eight members, reordered, because TypeScript prints union
members in type-id order and the ids shift when the module graph changes shape. Normalising
numeric-literal union order — and nothing else — the two sides are byte-identical at
`523eed15…`. This is the same instability that made the raw checksum unusable, showing up a
second time one layer down.

**The check was then made load-bearing rather than trusted**, per `test-filter-development`.
Seeded a mutant — dropped `estimated` from `AreaProgressSchema` — rebuilt, and the surface check
caught it, naming the field. The existing suite caught it too, 2 failed of 54. Reverted, and the
surface returned to `523eed15…`. A surface check that has not been seen to fail would have been
the weakest part of a plan whose entire purpose is proving nothing moved.

**`index.ts` re-exports the two owned modules wholesale rather than export by export.** House
style in `packages/engine` and `packages/content` is a named list, and this departs from it
deliberately: a named list would mean `db` editing `index.ts` to publish each of its seven row
shapes and `api` editing it for the route table, which puts both tracks back in `main`'s file —
the exact collision this plan exists to end. `primitives.ts` keeps the named list for the
opposite reason, since a wholesale re-export there would publish the three internals by
accident. The difference between the two lists is now the thing that enforces the boundary.

### Lessons Learned

- **A file with no exports is not a module, so it cannot be re-exported from.** `endpoints.ts`
  ships comment-only, as Phase 1 required, which means `index.ts` does *not* mention it yet and
  the Objective's "`index.ts` changes exactly once — here" does not quite hold: the `api` track
  adds one line when its first shape lands. The alternative was an `export {}` marker, rejected
  because Phase 1 said "carrying only that comment" and a marker is one more thing to delete.
  One known line in one known place, recorded in that track's plan, is the cheaper of the two.
  The `db` track has no equivalent — `progress.ts` already has exports, so it is re-exported
  wholesale today and its seven shapes need no edit here at all.
- **The plan's own check was the part that needed reviewing hardest.** Three review rounds
  strengthened it — names, then a checksum, then the checksum scoped against the four new
  declaration files — and it was still the one thing that could not work, because every round
  refined the check rather than asking what the compiler actually emits. Reviewing a
  verification step means predicting its output, not tightening its wording.
- **Capture the baseline before touching anything.** The 54-count, the checksum and the surface
  snapshot were all taken first. That is the only reason the checksum's failure was legible as a
  textual artefact within a minute instead of an unexplained red flag at the end.
- The union-order instability is a live hazard for anything else that compares TypeScript's
  printed types across a refactor. It is not a zod quirk and it will recur.

### Backlog Items Created

- None here. `planning/backlog/feature_typescript-has-no-linter_2026-08-29.md` was written
  during the v3 intake, before execution.
