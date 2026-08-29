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
- [ ] **The 54 existing tests pass untouched.** They import from `@pyquest/contract` and must
      not know the split happened — that is the check that this was mechanical
- [ ] `npm run typecheck` clean, `tsc -b` still builds the package
- [ ] The public surface is byte-identical: every name exported before is exported after,
      verified by comparing the built `.d.ts` rather than by reading

## Approach

**The split follows ownership, not subject matter.** A `schemas.ts` / `types.ts` split would
look tidier and solve nothing, because both tracks would still be in both files.

| Module | Holds | Owned by |
|---|---|---|
| `src/payloads.ts` | what the API returns: quest cards, progress, boss state, the queue, the board, XP sources, level | `main` |
| `src/progress.ts` | the row shapes the repository returns — three today, ten when `db` is done | `db` |
| `src/endpoints.ts` | routes, request bodies, the error shape | `api` |
| `src/primitives.ts` | the shared pieces all three need: content ids, concept ids, counts, `PRESENTATION_FIELDS`, `TOP_RUNG_BOUND` | `main` |
| `src/index.ts` | re-exports, and nothing else | `main` |

`primitives.ts` is the part that stops this from becoming three files that each redefine an
id. It is `main`'s and it should almost never change; a track that needs a new primitive is a
track that has found something the other two will also need.

**No behaviour changes here.** Every schema moves verbatim. The one thing that may not survive
mechanically is import order — `ConceptIdSchema` is built from `ContentIdSchema` and
`CONCEPT_IDS`, so `primitives.ts` has to land first — and if anything needs rewriting rather
than moving, that is the signal to stop and say so rather than to improve it in passing.

## Phases

### Phase 1 — the modules

Move, do not rewrite. `primitives.ts` first, then `payloads.ts` and `progress.ts` from what
exists. `endpoints.ts` is created **empty but real**, with its header naming the `api` track
and a comment saying what belongs in it — an empty owned file is what lets `api` start without
touching anything of `main`'s.

### Phase 2 — the index

`index.ts` becomes re-exports. Run the suite: 54 tests, no edits to any test file. A test that
needs changing means the public surface moved, which this plan is not allowed to do.

### Phase 3 — prove the surface did not move

Compare the exported names in `dist/index.d.ts` before and after. Reading the file and
believing it looks the same is what this check exists to replace.

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
