---
kind: plan
status: queued
track: audience-flag
date: 2026-09-10
---

# Audience becomes a declared fact, not a filename

**Status:** Planned
**Track:** `audience-flag`
**Date:** 2026-09-10
**Author:** Claude (Opus 5)
**Lane:** A
**Wave:** `wave-4_the-workflow-and-the-bootstrap_2026-09-10`

## Objective

Replace two filename regexes and one directory convention with a single declared field, and give
it a validator — so that "who reads this file?" has one answer and every consumer reads the same
one.

## Why this exists

**The convention has already failed, in the instruction a learner reads.**

`curriculum/area-0/practices/README.md:10` says *"Copy this whole directory somewhere you own."*
`practices/` holds the learner's drills — `practice-1/`, `practice-2/` — **and** the DM's plans,
`practice-1-first-light.md` through `practice-6-the-commission.md`. Among them is
`practice-3-the-broken-sigil.md`, the practice built on the learner not knowing what is coming.
`curriculum/area-{1,2}/practices/README.md` carry the same sentence.

Directory-as-audience failed because the two audiences share a directory. Nothing caught it,
because nothing can: there is no field to check.

**Two audience predicates already exist, and they disagree.**

- `packages/content/src/validate.ts:786` — `readsAsLesson`, a regex over `lesson.md` and
  `brief*.md`. Its own comment warns that scoping it wrongly *"would be worse than not having
  it"*, and `validate.ts:850` warns specifically against a second predicate that disagrees.
- `apps/field-manual/src/build.ts:150-159` — `dm-guide.md`'s audience **is its filename**.

They already disagree in one place. The Field Manual serves `game/how-to/` to the DM build only
(`build.ts:296`); the API's `content.howTo()` concatenates both roots for everybody
(`apps/api/src/content.ts:253`). Two surfaces, two answers, same question.

**And `curriculum/README.md:76-80` already states the rule in prose** — a three-row table of
audience, files and voice. CLAUDE.md's own line applies: frontmatter with no validator is markdown
with more punctuation. This is one level worse, because it was never frontmatter.

## Decisions

**Frontmatter, not a sidecar.** The failure mode is a *copy* — a directory handed to a learner —
and a sidecar manifest does not survive `cp`. The marking has to travel inside the file.

**Absent means `dm`.** Fail closed: an unmarked file never ships to a learner. Then require the
field explicitly on markdown under `curriculum/area-*/`, so nothing depends on the default
quietly. Implement the default in code, the way `medalsFor()` does at `schema.ts:397`, rather
than as a zod scalar default — zod defaults rewrite the parsed value and hide what the author
actually wrote.

**One parser.** `splitFrontmatter` already exists at `pyquest/scripts/plans.ts:164`, hand-rolled
on purpose: *"A real YAML parser would accept documents this checker has no rules for, and the
first one written would be the one nobody validates."* Extract it into `@pyquest/content` and have
`plans.ts` import it back. Two parsers is the drift `validate.ts:850` names.

It already anchors on line 0 (`plans.ts:167`), which matters more here than in `planning/`:
**no markdown under `curriculum/` or `game/` carries frontmatter today — all 129 files** — and
every `^---` in them is a horizontal rule. A parser that scans for the first fence rather than
requiring it at line 0 would read a mid-document rule as a delimiter.

## Scope

### The field

`packages/content/src/schema.ts` — `AUDIENCES = ['learner', 'dm'] as const`, `AudienceSchema =
z.enum(AUDIENCES)`, derived type. The `MEDALS` idiom at `schema.ts:45-56`.

### The rule

- Add `audience` to `ValidationRule` (`validate.ts:46`).
- Append `audienceIssues(roots)` in `checkContent` (`validate.ts:437-455`).
- Walk markdown the way `markIssues` does (`validate.ts:860-891`) — `readdirSync` with
  `recursive: true`, `toPosix`, sorted.
- Two failures: the field is absent where it is required, and the value is not in the enum.
  Both carry a `fix:`, because an error without a next action is a riddle (`validate.ts:75`).

### The consumers, which is where the value is

1. **`readsAsLesson`** reads the flag. It currently answers "what a learner reads" with a regex;
   that is the same question the field answers, and keeping both re-creates the disagreement this
   plan exists to remove.
2. **`build.ts:150-159`** reads the flag rather than the name `dm-guide.md`. **Preserve the
   posture exactly** — its comment is load-bearing: *"Reading it and letting the renderer decide
   would put the teacher's notes one template mistake away from the learner's page; not reading it
   means the learner build has nothing to leak."* The flag decides **whether to read the file**,
   never whether to render what was read.
3. **Frontmatter strippers.** Neither `briefBody` (`build.ts:100-115`, which strips a leading `#`
   only) nor the how-to title reader (`build.ts:74`) knows about frontmatter, and neither does the
   API's `content.read`. Without strippers, the first marked file publishes its own metadata into
   the HTML.
4. **The `game/how-to/` disagreement** gets one answer in one place. Recommended: the API matches
   the Field Manual, because the Field Manual's is the considered one — `build.ts:283-292` argues
   it. That is a behavior change to `/api/how-to`, so it is called out rather than slipped in.

### Then the sentence that started this

`curriculum/area-{0,1,2}/practices/README.md` must stop telling the learner to copy a directory
that holds the DM's plans. What it should say instead depends on what `gitea-remote`'s payload
CLI ships, so **write the marking here and coordinate the sentence with that track** rather than
guessing at it twice.

## Fixtures and tests

Follow the established pair — a broken fixture asserting the exact message, the valid control
asserting silence (`tests/practices.test.ts:142-165`).

- `fixtures/broken/audience-missing/` — a required file with no frontmatter.
- `fixtures/broken/audience-unknown/` — `audience: teacher`.
- A row for each in `fixtures/broken/README.md`, which carries the table of what the validator
  refuses.
- `fixtures/practices/` (the existing valid control) gains the field, and asserts the rule stays
  silent.

**The mutant:** make `audienceIssues` return `[]` unconditionally and confirm both broken
fixtures go green — then restore. A rule that cannot be seen to fail is worth nothing, and three
of this repository's checks were wrong rather than the code.

Separately, seed a horizontal rule as the first `---`-looking line in a fixture and confirm the
parser does not treat it as a fence. That is the specific hazard of 129 files with no frontmatter.

## Files expected to change

- `pyquest/packages/content/src/{schema.ts,validate.ts,frontmatter.ts (new),index.ts}`
- `pyquest/scripts/plans.ts` (import the extracted parser)
- `pyquest/apps/field-manual/src/build.ts`
- `pyquest/apps/api/src/content.ts`
- `pyquest/packages/content/fixtures/broken/{audience-missing,audience-unknown}/` (new)
- `pyquest/packages/content/fixtures/broken/README.md`
- `pyquest/packages/content/tests/{validate.test.ts,practices.test.ts}`
- `curriculum/**/*.md` — the field itself, added area by area

## Verification

```bash
cd pyquest
npm run validate:content   # the new rule, against real content
npm run validate:plans     # proves the extracted parser still serves the kanban
npm test
npm run build --workspace @pyquest/field-manual   # then grep the output for a stray `audience:`
```

The last one is the check that matters: a frontmatter block rendered into published HTML is the
failure this plan can most easily introduce.

## Evidence

`planning/evidence/audience-flag-RED.txt`, `-GREEN.txt`, `-MUTANT.txt`.
