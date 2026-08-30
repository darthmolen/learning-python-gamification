# The Content Surface, So the SPA Stops Inventing Curriculum

**Status:** Planned
**Track:** db
**Date:** 2026-08-29
**Author:** Claude (Opus 5)
**Lane:** A — the seam, a third time

## Objective

Add the area-manifest shapes to `packages/contract` so an area's name reaches the screens from
`content/areas/*.yml`, and editing the curriculum changes the app without editing code.

## Why this exists

The contract has exactly one `title` field in the whole package — `QuestCardSchema.title`,
`packages/contract/src/index.ts:138`. Quest titles cross the wire. **Area titles do not
exist on it at all:**

- `AreaProgressSchema` is `{ cleared, total, estimated }`
- `AreaRecordSchema` is `{ area, cleared, medals }`

Neither carries a name, and three surfaces need one: the Map draws eight areas, the Area screen
titles itself, and every breadcrumb through an area reads `Area 3 · Collections`.

The SPA plan says "nine screens rendering contract shapes" and neither of its two reviews
checked that the contract carried everything nine screens display. It does not.

**What that produced.** SPA Phase 1 shipped an `AREA_NAMES` table inside a React component. It
duplicated `content/areas/*.yml` for the three authored areas and **invented names for the five
that have no manifest at all** — areas 3 through 7 are unauthored, and the app asserted their
titles anyway. It has been removed, and `apps/web/src/app/App.test.tsx` now carries a test
(`names no area it could only have invented`) that fails if a name the SPA could only have made
up appears on screen. That test is a guard over a hole, not a fix; this plan is the fix.

**The acceptance test for the whole thing** is the question that found it: edit
`content/areas/area-3.yml`, run `validate:content`, and see the new title in the app having
touched no TypeScript. Today that fails silently, which is the worst way for it to fail.

## What the wire shape is, and why it is not the file shape

`packages/content` already exports `AreaManifestSchema`:
`{ area, title, authoring: 'complete' | 'partial', estimatedQuests?: number }`, with a
`superRefine` requiring `estimatedQuests` when `authoring` is `partial`.

**The contract must not re-export it.** That schema validates a *file on disk*; the contract
describes a *payload on a wire*, and the two already disagree on purpose. `AreaProgressSchema`
carries `estimated: boolean`, and its comment says that field "carries the area manifest's
`authoring: partial`" — the translation from file vocabulary to wire vocabulary has already
happened once, deliberately.

Re-exporting the file schema would put `authoring` and `estimatedQuests` on the wire beside the
`estimated` and `total` that `AreaProgressSchema` already carries: two sources for one fact,
which this package's own comments call out as the thing a contract exists to prevent —
"a redundant field that is never checked is a field that can lie."

So the wire shape carries **identity only**, and progress stays where progress already is:

```ts
AreaIdentitySchema = {
  area: AreaSchema,
  title: z.string().min(1),
  weeks: { from: z.number().int().positive(), to: z.number().int().positive() },  // to >= from
  blurb: z.string().min(1),
}
AreaIdentitiesSchema = z.array(AreaIdentitySchema)   // the Map's eight
```

The collection schema is where the rules live, per the SPA plan's own rule: one entry per area,
and areas unique. An array of identities that names area 3 twice is a bug that must not cross
the wire even if whatever built it is the thing that is wrong.

## The second half of the manifest: weeks and blurb

The Area artboard's subtitle reads:

> Weeks 9–14 · Minecraft data. Inventories are lists. Recipes are dicts.

**Nothing in `content/areas/*.yml` holds it.** The manifest is four fields, none of them a week
range or a blurb. Ruled on in `docs/decisions/0002-weeks-are-road-markers.md`: that string is a
schedule and a blurb glued together, and it splits.

```yaml
area: 3
title: Collections
weeks: { from: 9, to: 14 }
blurb: Minecraft data. Inventories are lists. Recipes are dicts.
```

The wire carries the integers and the UI formats `Weeks 9–14`, which is the standing split —
the engine returns numbers, presentation decisions live in the UI.

**Three things the decision binds this plan to, and the first is a trap:**

- **The ranges overlap and the validator must allow it.** Area 1 is weeks 3–6, Area 2a is 6–7,
  Area 2b is 7–8. An obvious-looking "ranges must not be overlapping" refinement rejects the
  real curriculum on the day it is written. The only rule is `to >= from`. Note too that
  `area-2.yml` is a single manifest covering both halves, so its range is 6–8.
- **All eight areas have a manifest as of 2026-08-29**, so this plan writes weeks and a blurb
  into eight files, not three. Areas 3–7 were transcribed from spec §3 — title from the
  heading, `estimatedQuests` from §5.2's rule of five, `authoring: partial` because nothing in
  them is written. ADR 0002's amendment covers why that is transcription and not the
  `AREA_NAMES` mistake this plan exists to replace: a manifest may carry any value the spec
  states and must not carry one it does not. Blurbs are the one field with no §3 source of the
  right shape — §3's **Vehicle:** lines are close but written as prose about the area rather
  than as a subtitle for it, so a blurb is authored here rather than copied.
- **No pace judgement.** Nothing derives ahead, behind or on-track from these numbers. The
  decision record says why, and says that reopening it is an argument against §361 and §5.8
  rather than a wiring detail.

This does mean widening `AreaManifestSchema` in `packages/content/src/schema.ts` and editing
**eight** YAML files — a content-side change, in Lane B's tree, named in *Files Expected to
Change* rather than done quietly. It was three when this plan was written; areas 3–7 have had
manifests since 2026-08-29, which is also what makes `max(area.weeks.to)` resolve to 48 rather
than to 8.

## Success Criteria

- [ ] `AreaIdentitySchema` and `AreaIdentitiesSchema` exported from `@pyquest/contract`
- [ ] The collection rejects a duplicate area, with a message naming the rule
- [ ] **The contract does not import `AreaManifestSchema` from `@pyquest/content`.** Asserted,
      not intended — a test that the wire shape has no `authoring` and no `estimatedQuests`
      key, so the file schema cannot leak onto the wire by someone "removing duplication"
- [ ] Round-trip test: a real `content/areas/area-0.yml`, parsed by `parseAreaManifest`, maps to
      a valid `AreaIdentity`. This is the only test that proves the two halves still meet
- [ ] `npm run typecheck` clean, `tsc -b` builds, every existing contract test passes unedited

## Approach

**It lands in `payloads.ts`, and this track does not own that file.** Per
`planning/feature_contract-modules_2026-08-29.md`, `payloads.ts` holds "what the API returns"
and is **`main`'s**; `db` owns `progress.ts`. This plan runs on `db` because that is the track
already inside `packages/contract`, which avoids standing up a `main` slot to add two schemas —
but it means `db` writes to a file the modules plan assigns to `main`.

**So this is a coordination point, stated rather than assumed** — the same shape as the SPA
track's claim on `vitest.config.ts`. It is safe today because `main` holds no in-flight plan
that touches `payloads.ts`, and it is additive: two schemas appended, nothing moved. If `main`
picks up payload work while this is open, the two coordinate rather than one discovering the
other. The alternative — a fourth module owned by `db` — is more structure than two schemas
justify, and the modules plan's own rule is that a file gets split when *three* tracks need it.

**It runs after the modules split, not before.** That plan is a gate that rewrites `index.ts`
and both other tracks' file sets, and it explicitly "runs alone and completes before `db` or
`api` starts". Adding schemas to `index.ts` first would mean the split has to move them too,
turning a mechanical move into a merge. Queue behind it.

**The filter is the round trip, not the schema.** A zod schema always parses the object literal
written next to it — that is what the SPA plan means by "an object literal agrees with whatever
you believed when you typed it". The test with teeth reads an actual file from `content/areas/`
through content's own parser and asserts the result satisfies the contract. Seed the mutants
that matter: rename `title` to `name` in the wire schema, and drop the duplicate-area
refinement. A suite surviving either is checking that zod is installed.

## Phases

### Phase 1 — the shapes

`AreaIdentitySchema` and `AreaIdentitiesSchema` in `payloads.ts`, with the header comment
saying why the file schema is not re-exported — the next person to see two similar schemas will
try to merge them, and the comment is what stops it.

### Phase 2 — the round trip

The test that reads `content/areas/area-0.yml` from disk. It is the only place the file half and
the wire half are checked against each other, so it belongs here rather than in either package's
own suite in isolation.

## Dependencies / Prerequisites

- **`planning/feature_contract-modules_2026-08-29.md` — blocking.** It is a gate and it rewrites
  the file this plan writes into
- `docs/decisions/0002-weeks-are-road-markers.md` — **decided**, 2026-08-29. It settles what
  the weeks are for and what must not be derived from them; this plan implements it

## Files Expected to Change

- `pyquest/packages/contract/src/payloads.ts` — the two schemas. `main` owns this file after
  the modules split
- `pyquest/packages/contract/tests/payloads.test.ts` — the schema tests
- `pyquest/packages/contract/tests/round-trip.test.ts` — new; the file-to-wire check
- `pyquest/packages/content/src/schema.ts` — `AreaManifestSchema` gains `weeks` and `blurb`.
  **The one file here that is not `main`'s usual ground**, and the reason this plan says so out
  loud: it is the file every authored area is validated against
- `content/areas/area-0.yml` through `area-7.yml` — **all eight** manifests gain
  their week range and blurb. Lane B's tree, eight small edits, no quest touched

## Track discipline

`db`. It shares no file with `spa` or `api` once the modules split has landed — `api` owns
`endpoints.ts`, and this plan touches neither that nor `apps/`. Before the split it would
collide with both, which is the whole reason it queues behind the gate.

The one file it touches outside its own ownership is `payloads.ts` (`main`'s), named as a
coordination point above. It also edits `packages/content/src/schema.ts` and eight YAML
manifests in Lane B's tree — small, additive, and no quest touched, but worth `area-2`'s
track knowing since that track is in `content/` right now.

It does **not** touch `apps/web`. The SPA consuming these shapes is SPA Phase 2's gateway work,
in the SPA track, after this lands.

## Out of Scope

- The endpoint that serves it. `api` owns `endpoints.ts` and its route table
- Reading `content/` at runtime. The API is already the content reader — briefs are Markdown,
  hidden tests are Python under `content/tests/` — and this plan adds a shape, not a reader
- Quest titles, which already cross the wire on `QuestCardSchema`

## Anticipated Backlog

- **The campaign start date has no home.** `week 10 of 48` needs one, and it is household state
  rather than content, so it is a Postgres row. The engine reads no clock — `now` arrives as a
  parameter (§6.7) — so the current week is computed from a row the `db` track owes.
  `planning/feature_progress-schema_2026-08-28.md` does not name it. **Raise it against that
  plan rather than absorbing it here**, because the Map and every crumb bar display it
- **Whether the horizon should be derived.** `0002` observes that `max(area.weeks.to)` makes the
  48 true after a re-pace instead of quietly disagreeing with the spec. That only works once all
  eight areas have manifests; until then the denominator has no honest source and the Map should
  say so rather than print a number it cannot stand behind
- **Whether the Map needs anything else per area** — the artboard drains locked areas of colour,
  which is a presentation decision over progress the contract already carries. Believed covered;
  confirmed when SPA Phase 2 builds the Map against real shapes
