# The Contract Modules the Lane A Tracks Cannot Share

**Status:** Planned
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
touching anything of `main`'s. It must typecheck and lint clean carrying only that comment: no
placeholder export, no unused import, nothing that has to be deleted before real work starts.

### Phase 2 — the index

`index.ts` becomes re-exports. Run the suite: the same count as the run captured before Phase 1,
and no edit to any test file. A test that needs changing means the public surface moved, which
this plan is not allowed to do.

### Phase 3 — prove the surface did not move

Checksum `dist/index.d.ts` before the split and after it, and compare the two. Reading the
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

**v1 reviewed 2026-08-29 — implementable with fixes.** Five findings taken: `INVASION_QUEUE_CAP`
placed in `primitives.ts`, the `.d.ts` check strengthened from names to a checksum, unexported
internals given a home and a rule, import direction between the two owned modules stated, and
the empty `endpoints.ts` required to compile clean.

One finding rejected on the facts. The review called the "54 existing tests" claim wrong and put
the number at 45, counting `it`/`test` calls in the two test files. That count misses
`payloads.test.ts:88`, an `it.each(PRESENTATION_FIELDS)` that expands to nine cases at run time;
`vitest run packages/contract` reports 54. The reviewer's underlying point was better than the
correction, though, so the criterion no longer names a number at all — a hardcoded count is
falsified by the next test anyone writes.

---

## Plan Review (v3)

**Reviewed:** 2026-08-29 19:47
**Reviewer:** Claude Code (plan-review-intake)

### Previous Issues — Resolution Status

1. **Resolved** — Test count removed; Success Criteria and Phase 2 now say to capture the count before the split rather than hardcoding it.
2. **Resolved** — `INVASION_QUEUE_CAP` placed in `primitives.ts` in the module table.
3. **Resolved** — Phase 3 now requires checksumming the full `dist/index.d.ts`, not just comparing exported names.
4. **Resolved** — `primitives.ts` explicitly permitted to hold unexported internals shared across modules.
5. **Resolved** — Import direction stated: payloads and progress import from primitives; neither imports the other.
6. **Resolved** — Empty `endpoints.ts` required to typecheck and lint clean, no placeholder exports or unused imports.

### New Issues

#### Critical (Must Address Before Implementation)

- **Success criteria do not name the lint command**
  - Section: Success Criteria
  - What's wrong: Phase 1 requires `endpoints.ts` to "typecheck and lint clean," but the checklist in Success Criteria only names `npm run typecheck` and `tsc -b`. A checklist that can be ticked while skipping lint is a checklist with a hole.
  - Suggested fix: Add `npm run lint` (or the equivalent ruff/eslint command from `pyquest/`) to the Success Criteria checklist.

#### Important (Should Address)

- **Byte-identical `dist/index.d.ts` checksum claim needs scoping**
  - Section: Success Criteria / Phase 3
  - What's wrong: After the split, five `dist/*.d.ts` files will exist where one did. The plan says "checksum `dist/index.d.ts`" — that file should be unchanged if index.ts becomes pure re-exports — but the plan does not state that per-module declaration files are expected to appear and do not count as a surface change.
  - Suggested fix: Add one sentence: "New per-module `dist/*.d.ts` files are expected and do not affect the check; only `dist/index.d.ts` is compared."

#### Minor (Consider)

- **Review History says "Five findings taken" but all six v1 issues are now addressed** — the paragraph is slightly misleading as written.

### Assessment

**Implementable as written?** With fixes (minor)

**Reasoning:** All six prior issues are resolved and the design is correct. The one critical gap — lint not in the Success Criteria checklist — is a one-line fix; without it, a developer could ship unlinted code and genuinely believe the checklist was satisfied.

---

## Disposition

*Appended by the author after `plan-receive-review`. Everything above is the review as received and is unaltered.*

**2 taken, 1 declined** — applied in `dfb3f26`, `688ce48`.

Declined: it asked that Success Criteria name `npm run lint`. There is no lint script, and no ESLint, Biome or oxlint config anywhere in `pyquest/` — the criterion would have been unmeetable rather than merely unticked.

The gap behind it was real and became `planning/backlog/feature_typescript-has-no-linter_2026-08-29.md`: the repository requires ruff and pyright clean of every `.py`, §5.10 grades the learner on exactly that, and its own TypeScript has no equivalent bar.
