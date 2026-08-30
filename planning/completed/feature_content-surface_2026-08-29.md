# The Content Surface, So the SPA Stops Inventing Curriculum

**Status:** Completed
**Track:** content-wire
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
- **All eight areas have a manifest as of 2026-08-29**, but this plan writes weeks and a blurb
  into **six** of them. `area-0.yml` and `area-2.yml` are held by their own in-flight tracks,
  and those two edits are deferred into those plans — see *Track discipline*. Areas 3–7 were transcribed from spec §3 — title from the
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
**six** YAML files — a content-side change, in Lane B's tree, named in *Files Expected to
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
- `content/areas/area-1.yml`, and `area-3.yml` through `area-7.yml` — **six** manifests gain
  their week range and blurb. Lane B's tree, six small edits, no quest touched.
  `area-0.yml` and `area-2.yml` are deliberately absent: see *Track discipline*

## Track discipline

`content-wire`, its own track as of Wave 3. It declared `db` and queued behind the progress
schema for no reason: one writes SQL and a repository, the other writes wire shapes and YAML,
and they share not one file.

**Two manifests are not this plan's to edit.** `content/areas/area-0.yml` is held by
`feature_area-0-quest-backfill` and `area-2.yml` by `feature_area-2-scribes-rite-and-sandbox`,
both in flight. Two tracks editing different fields of the same small YAML is precisely the
merge the disjointness rule exists to prevent, so each of those plans now carries its own
manifest's `weeks` and `blurb` as deferred work, to land when it next opens the file.

Ordering matters and is one-way: **this plan widens `AreaManifestSchema` first.** Until it has,
`weeks` and `blurb` are unknown keys and the schema is `.strict()` — either track landing its
two fields early fails `validate:content`. Neither is blocked by that; both simply wait.

It shares no other file with `spa` or `api` once the modules split has landed — `api` owns
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
## Status

**Final Status:** Completed
**Track:** content-wire
**Completed:** 2026-08-29
**Completed By:** Claude (Opus 5)

### Outcomes

- `WeekRangeSchema`, `AreaIdentitySchema` and `AreaIdentitiesSchema` in
  `packages/contract/src/payloads.ts`, exported from `@pyquest/contract` through the wholesale
  re-export the modules split left in place — no edit to `index.ts`.
- The collection refuses a duplicate area with a message naming the rule; it does **not** check
  its length, because a screen showing one area's identity is a legitimate use of the shape and
  "the Map has eight" is the Map's rule.
- `AreaManifestSchema` gains `weeks: { from, to }` and `blurb`, both optional — see *Deviations*.
- Six manifests carry their range and blurb: `area-1` 3–6, `area-3` 9–14, `area-4` 15–20,
  `area-5` 21–28, `area-6` 29–36, `area-7` 37–48, each verified against spec §3's own heading.
  Blurbs are authored, one line each. `area-0.yml` and `area-2.yml` untouched, as the track
  discipline section required.
- `tests/round-trip.test.ts` reads the real `content/` through `checkContent` — the reader
  `validate:content` itself runs — and maps each manifest to an identity. It hardcodes no title,
  which is what makes the acceptance test true rather than asserted.
- **The acceptance test was run, not reasoned about.** `title: Collections` was edited to
  `Collections and Crates` in the YAML; `validate:content` stayed green and the new title reached
  the wire shape with no TypeScript touched and no test edited. Reverted.
- 311 tests across 16 files, up from the baseline 243 across 14. `npm run validate:content` reports
  17 items across 8 areas; `npm run typecheck` clean across all five workspaces.

### Mutants seeded, and what caught them

Every one was caught on its first pass; none survived.

| Mutant | Caught by |
|---|---|
| Drop the `to >= from` refinement | 2 failed — `refuses a range that ends before it starts`, and the collection test that carries a bad identity |
| Add a "ranges must not overlap" refinement | 2 failed — the literal fixture holding Area 1 (3–6) beside Area 2 (6–8) |
| Drop `title` from the wire shape | 26 failed across both suites |
| Drop the duplicate-area refinement | 1 failed, on the message as well as the throw |
| Remove `weeks:` from `content/areas/area-3.yml` | 8 failed in the round trip |

The overlap mutant is the one worth recording: the six manifests this plan authored do **not**
overlap each other, because the overlap in the real curriculum is Area 1 against Area 2 and
`area-2.yml` has no weeks yet. The round-trip suite alone would have survived it. The object
literal in `payloads.test.ts` that names Area 2's 6–8 range is what killed it — the one case where
the fixture is stronger than the file, and it stops being needed the day `area-2.yml` lands.

### Deviations

**`weeks` and `blurb` are optional on `AreaManifestSchema`, not required.** Requiring them fails
`validate:content` on `area-0.yml` and `area-2.yml` the moment the schema widens, and those two
files belong to in-flight tracks. The field comment says so and says what to do about it. The wire
shape requires both, so an area without them has no identity to send — which is the honest
rendering of "not authored yet" rather than a hole.

**The round trip reads the whole content root, not `area-0.yml` alone.** Two reasons, and the
first is fatal to the plan's wording: `area-0.yml` has no weeks and cannot map to an identity
until its own track lands them. The second is that `packages/contract` does not depend on `yaml`,
and adding a dependency to a `package.json` this track does not own to parse one file is worse
than calling the content package's own reader. `checkContent` is that reader — the same one
`validate:content` runs — so the test proves the shipping path rather than a parallel one.

**The "file schema does not reach the wire" guard reads the import lines, not the whole file.**
Its first pass failed against `payloads.ts` itself, because the header comment names
`AreaManifestSchema` in order to argue against re-exporting it. A guard that forbids naming the
thing forbids explaining why, so it now matches `^import` lines and asserts it found the real
import list rather than an empty one.

### Lessons Learned

- **A round-trip test over real files is only as strong as the files.** The overlap mutant
  survived the file-driven half and died to a literal. "Test against reality" and "test against
  the case that matters" are not the same instruction, and today the real content does not yet
  contain the case ADR 0002 exists to protect.
- **A weekless manifest is invisible to `validate:content`.** The mutant that stripped
  `area-3.yml` left the validator green and only the contract suite complained. That is correct
  while the fields are optional, and it is the thing to fix when they become required.
- **The negative tests passed vacuously in RED.** `expect(() => Schema.parse(x)).toThrow()` passes
  when `Schema` is `undefined`, so before the schemas existed six positive assertions were the
  only real red. The mutants are what turned the refusals into evidence.

### Backlog Items Created

- **Tighten `weeks` and `blurb` to required** once `area-0.yml` and `area-2.yml` carry them, and
  add a `validate:content` rule so a weekless manifest is an issue rather than a silence. Belongs
  with whichever of the two deferred tracks lands second.
- The campaign start date remains unraised against `planning/feature_progress-schema_2026-08-28.md`
  — that plan is another track's file. It is still the missing half of `week 10 of 48`.
