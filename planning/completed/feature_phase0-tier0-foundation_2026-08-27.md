# Phase 0 + Area 0 — Foundation, then UI Design

**Status:** Planned
**Date:** 2026-08-27
**Author:** Claude (Opus 5), with Steven Molen
**Spec:** `docs/specs/2026-08-26-gamified-python-curriculum-design.md`

---

## Context

The Ursina Area 3 spike closed on 2026-08-27. Both questions it existed to answer came back
clean: the son's laptop renders a hardware-accelerated cube at ~57 fps with no GDI
Generic fallback, and a three-name shim (`BLOCKS`, `place`, `start`) closes the Area 3
vocabulary gap at 0% ceremony against raw Ursina's 100%. Spec §8 Phase 0a is cleared. Nothing
in the build order is gated on it any longer.

The repository today holds a spec, a completed spike, and two backlog stubs. There is no
application code. Phase 0 of the build order — compose stack, engine, schema, content
validator — is due week 0, and Area 0 teaching is due immediately, because §8 warns in as many
words that if Area 0 waits on Phase 1 *the app becomes a satisfying way to postpone teaching a
child Python*.

This plan delivers Phase 0 and Area 0, then runs a Claude Design session for the seven screens
of §6.8, then builds the teaching system against those screens rather than against a bullet
list.

**Toolchain verified present on the parent's machine:** Docker 28.3.2 with Compose v2.39.1
(Linux containers, daemon up), Node v24.0.0, npm 11.3.0, Python 3.14.6, git 2.54.0.

---

## What is blocked, and what is not

Almost nothing is blocked externally. The dependencies that remain are internal sequencing.

| Work | Blocked by | Status |
|---|---|---|
| Compose stack (postgres, gitea) | nothing | **ready** |
| Engine scoring core | the content contract (Wave 0) | **ready after ~30 min** |
| Content validator, `new:quest` | the content contract (Wave 0) | **ready after ~30 min** |
| Area 0 curriculum | nothing at all | **ready — and on nobody's critical path** |
| UI design session | Wave 1 landing, and a human | gated on wall-clock, not on code |
| Engine query layer, DB schema, API contract | the UI design session | deliberately deferred |
| Two remaining Ursina measurements | **physical access to the son's laptop** | the only hard external blocker |

The Ursina measurements — locating the son's laptop on the `_bench.py` scaling curve, and confirming
whether Panda3D bound to the iGPU or the discrete Quadro — block nothing. Both backlog stubs
say so explicitly. Take them opportunistically next time the laptop is in reach.

---

## Design decisions this plan makes

The spec is approved prose and leaves several engine inputs undefined. These are decided here
so Wave 1 has something to test against. Each is a single exported constant or a five-line
function, so each is cheap to retune.

**DC-1 — Effective DC is clamped to [5, 30].** §5.1 gives Conjured −5 and Datamine −5 as
separate modifiers, and §5.5 permits both on one quest. A DC 5 quest taking both lands at −5
and pays negative XP. Clamping to the published 5–30 scale keeps the D&D vocabulary honest and
guarantees XP is never negative.

**DC-2 — Medal payment is the delta at time of earning, and is order-independent.** §5.10 says
each medal "raises the quest's effective DC and pays the difference, once." Because modifiers
sum, total XP across all earned medals equals `xp(finalEffectiveDC)` regardless of the order
they were earned in. That commutativity is a property worth pinning with a test, and it is the
single best mutant in the engine — change the sum to a max and it must go red.

**DC-3 — Conjured and Ironman are mutually exclusive.** §5.12 states it; the engine enforces
it by rejecting the pair rather than by silently dropping one.

**DC-4 — The concept tag registry is authored from §4.** §6.10 requires the validator to prove
every concept tag is known, but the known set does not exist yet. It gets written as
`pyquest/packages/content/src/concepts.ts`, one entry per vocabulary item in the §4 area listings.

**DC-5 — The challenge-run bonus is a +5 difficulty modifier, not a new concept.** §5.2 says
beating a boss early "pays a bonus" without naming an amount. Expressing it as a modifier
reuses the machinery §5.1 already built and honours that section's argument that a bonus should
not be a special case bolted onto scoring. Skipped quests pay nothing, because they were not
done.

**Deferred to the design session, on purpose:** the level curve (§6.7 returns a level; no
formula is given, and how often a level should fire is a presentation question), the invasion
review interval ladder (§5.4 names an interval and never specifies it — proposal below, but
the queue shape belongs to the Defend screen), and the estimated-total tilde of §5.1a. All
three are shaped by screens that do not exist yet.

*Proposed invasion ladder, to confirm at the design session:* fixed rungs at 1, 3, 7, 16, and 35
days, advancing on a successful retrieval and stepping back one rung on a failure rather than
resetting to zero — resetting punishes and floods the queue. §5.5's guaranteed +3 and +10 day
reviews after a Datamine are a second, additive source, not a ladder position.

---

## The engine split, and why

`pyquest/packages/engine` is described in §6.7 as the one component that must never be wrong, which is
also what makes it the one component that is trivially testable. It divides cleanly:

| Built in Wave 1 — pinned by spec | Deferred to Wave 3 — shaped by the UI |
|---|---|
| `effectiveDC(baseDC, modifiers)` | `availableQuests(state)` return shape |
| `xpFor(kind, effectiveDC)` | `areaProgress()` → `{cleared, total, estimated}` |
| `medalDelta(baseDC, earned, newMedal)` | `dueInvasions()` queue shape and cap |
| modifier legality (DC-3) | `standings()` for Party |
| `bossUnlocked(clearedInArea)` — any 3 of 5 | `level(xp)` — curve undefined |

The left column is arithmetic the spec specifies to the number; it cannot move. The right
column is a projection whose shape only a real screen can settle. Building the right column
before the design session means building it twice.

**Layer boundary, from §5.1:** the engine owns `effectiveDC` and nothing else. The threshold at
which a number becomes a warning is a presentation decision. A test asserts the engine's return
types carry no `risk` or `warning` field, which pins the boundary cheaply and permanently.

---

## Waves

### Wave 0 — the content contract (sequential, me, ~30 min)

A genuine barrier: Wave 1's agents would otherwise race on the same type files.

- `package.json` npm workspaces, TypeScript, vitest
- `pyquest/packages/content/src/schema.ts` — zod schema for the quest YAML of §6.2
- `pyquest/packages/content/src/concepts.ts` — the concept registry of DC-4

### Wave 1 — four parallel agents, disjoint directories

| Agent | Owns | Depends on |
|---|---|---|
| **A — engine core** | `pyquest/packages/engine/` | Wave 0 types |
| **B — infrastructure** | `infra/` | nothing |
| **C — content tooling** | `pyquest/packages/content/` beyond the schema | Wave 0 types |
| **D — Area 0 curriculum** | `curriculum/area-0/` | nothing |

**A** builds the five pinned functions above under full test-filter discipline.

**B** builds `infra/docker-compose.yml` with postgres 16 and gitea on a shared instance
(§6.1), persistent volumes, healthchecks throughout, and `.env.example`. Also the §6.9 backup
job — `pg_dump` plus a mirror of every Gitea repository to a dated tarball, thirty-day
retention — **and rehearses the restore**, which §6.9 requires before week 3.

**C** builds the validator (`npm run validate:content`: acyclic prerequisite graph, every
concept tag known, every referenced brief and test file present) and the `npm run new:quest`
scaffolder. §6.10 notes the parent will run this more than 150 times and it should take two
minutes.

**D** authors `curriculum/area-0/` — the §4 Area 0 vocabulary as turtle-graphics session
briefs, the exercises, and the Journal template of §5.6. No code dependency whatsoever. This
is the workstream that lets teaching start this week.

### Wave 2 — Claude Design session for the UI (me + you, human-in-the-loop)

A canvas with one artboard per §6.8 screen: Campaign Map, Quest, Defend, Boss, Party,
Journal, Console. This is a wall-clock gate that agents cannot parallelise, which is exactly
why curriculum churn continues underneath it.

Three things the artboards must settle, because Wave 3 reads them as inputs: how a quest card
renders its medal slots greyed (§5.10), how an area header renders `1 of ~5` (§5.1a), and where
the DC ≥ 20 warning lives.

*Background, in parallel:* **agent D2** carries curriculum authoring forward into Area 1.

### Wave 3 — the teaching system, shaped by the design

- The deferred engine query layer, now with known return shapes
- DB schema and migrations job — progress in Postgres, content in git, the two never mixing
  (§6.7). Tables for players, `quest_medals` keyed exactly as §6.2 specifies, attempts as
  scars, datamines, concept reviews, journal entries, sessions, bounties
- The API contract derived from the artboards

*Background, in parallel:* curriculum churn continues into Area 2a.

Phase 1 proper — Fastify, the runner container, the SPA, Pyodide, and the turtle-to-canvas shim
of §8 — follows this pass and is not in scope here.

---

## Test-filter discipline, by workstream

The filter axis is not uniform across this work, and pretending it is would over-validate the
cheap parts and under-validate the expensive one.

| Workstream | Axis | Discipline |
|---|---|---|
| **A — engine** | **Filter, high bar** | Full RED → capture → GREEN → capture → MUTATE → kill → restore, per behavior. Named mutants: drop a modifier from the sum, return a constant XP, flip the `>= 3` in the boss unlock, remove the clamp. Every one must go red. |
| **C — validator** | Filter | Mutants: accept a cyclic prerequisite graph, accept an unknown concept tag. Both must be caught. |
| **B — compose** | **Configuration** — the skill's stated exception | Not unit tests. A smoke script asserting every healthcheck reaches green and that the restore actually restores. That is the composition test, and it is the right one. |
| **D — curriculum** | n/a | Prose. Verified by a person reading it, and ultimately by a child sitting down with it. |
| **Wave 3 — DB, API** | **Composition** | Migrations run against a real Postgres; API integration tests run against the real compose stack. Per the skill: a mock here *is* the registration you forgot. |

Engine work captures failure and pass output into the transcript rather than attesting to it.
A checked box whose evidence cannot be produced is unchecked.

---

## Verification

**Wave 1 gate — all four must hold before the design session:**

1. `npm test` green across `pyquest/packages/engine` and `pyquest/packages/content`, output pristine
2. Every engine mutant listed above demonstrated red, then `git diff` clean on the mutated file
3. `docker compose up -d` brings postgres and gitea to healthy; `docker compose ps` shows it
4. Backup job produces a dated tarball, and a restore into a scratch database is rehearsed and
   verified — not assumed
5. `npm run validate:content` passes on the fixtures and **fails** on a deliberately cyclic one
6. `npm run new:quest` scaffolds a quest that validates without hand-editing
7. Area 0 briefs read start to finish by a human

**End-to-end, after Wave 3:** author a quest with `new:quest`, validate it, load it, and have
the engine return correct availability, effective DC, and XP for both players — with the medal
commutativity property holding across a randomised earn order.

---

## Files expected to change

- `package.json`, `tsconfig.base.json` — new, npm workspaces root
- `pyquest/packages/content/src/{schema,concepts}.ts` — new, the Wave 0 contract
- `pyquest/packages/content/src/validate.ts`, `scripts/new-quest.ts` — new, §6.10
- `pyquest/packages/engine/src/scoring.ts` + tests — new, the pinned arithmetic
- `infra/docker-compose.yml`, `infra/.env.example`, `infra/backup.sh` — new, §6.1 and §6.9
- `curriculum/area-0/**` — new, §4 Area 0
- `planning/in-progress/feature_phase0-tier0-foundation_2026-08-27.md` — this plan, per the
  project's kanban convention

---

## Backlog expected to surface

- The level curve and the invasion interval ladder, if the design session does not settle them
- The two Ursina measurements already stubbed in `planning/backlog/`, unchanged by this work
- A decision on whether the son's repository is created by hand or scaffolded by the Gitea
  bootstrap — it is Phase 1.5 work, but the compose stack makes it answerable early

---

## Design session inputs, gathered during Wave 1

Questions the artboards have to answer, surfaced by building the layers underneath them.

**A medal can legitimately pay zero XP, and the UI must explain that.** Decision DC-1 clamps
effective DC to the published 5–30 scale. At base DC 5 the floor absorbs the negative
modifiers: earning Conjured pays 0, and a subsequent Datamine also pays 0. This is correct, it
is tested, and it is invisible without help — a player takes a medal, watches the number not
move, and concludes the app is broken. §5.10 promises each medal "pays the difference"; the
honest rendering of a difference of zero is a design problem, not an arithmetic one.

**Where does a Datamine render?** It is a difficulty modifier (§5.1) and a named, legal,
costed move (§5.5), but it is not a medal, so it has no slot on the quest card that §5.10
describes. It still needs to be visible, because §5.5's whole argument is that a costed, logged,
*named* move beats a hidden one.

**Boss unlock is a 3-of-5 progress state, not a boolean.** §5.2 gives each area five quests and
unlocks the boss on any three. The engine returns a boolean, but the campaign map has to show
how close he is, and §5.1a insists on a denominator everywhere.

---

## Wave 1 — complete, 2026-08-27

All four workstreams landed. The Wave 1 gate in *Verification* above is met:

1. 84 tests green across `pyquest/packages/engine` and `pyquest/packages/content`, output pristine
2. Mutants demonstrated red and restored in all three code workstreams. **Two initially
   survived and the tests were rejected and strengthened**, which is the process working rather
   than a defect: the DC-2 commutativity property computed its expectation from the engine
   itself and so could not see sum→max, and a scaffolder test accepted any file under `areas/`
3. `docker compose up -d` brings postgres and gitea to healthy from destroyed volumes —
   verified independently on a cold boot, not taken from a report
4. Backup produces a dated tarball and the restore rehearsal round-trips **both artifacts §6.9
   names as irreplaceable** — a git commit and a Journal entry — by exact content. 28 of 28
   composition checks pass
5. `validate:content` passes on the authored root and fails, with the cycle named hop by hop,
   on a deliberately cyclic fixture
6. `new:quest` scaffolds a quest that validates with no hand-editing
7. Area 0 briefs written; `py -3.14 curriculum/area-0/verify.py` reports 19 of 19

### What Wave 1 changed about the plan

**Three composition bugs, none of which any unit test could have caught.** `npm run new:quest --
--id x` was unusable because the root script dropped a trailing `--`; a relative `--root`
resolved against the package directory rather than where the command was typed; and Gitea
crash-looped thirteen times against its own image's SSH daemon, with the bad setting persisting
into `app.ini` so that removing the environment variable did not undo it. The plan predicted
this axis would matter here and it did, three times over.

**The `dist/` collection problem.** `tsc -b` emitted compiled `*.test.ts`, and vitest 4 no
longer excludes `dist` by default, so a green run could be reporting on code that no longer
exists. Fixed repo-wide in `vitest.config.ts`.

### Backlog raised

- `feature_scoring-model-single-source_2026-08-27.md` — the modifier table is published twice
  in the spec and implemented a third time; Datamine is a modifier that is not a medal and has
  no storage shape; the challenge-run magnitude is unvalidated
- `feature_backup-destination-second-disk_2026-08-27.md` — §6.9 wants a second disk; this
  machine has one. Due before week 3
- `feature_gitea-lan-access-for-the-son_2026-08-27.md` — Gitea is healthy but advertises
  `localhost`, so his laptop cannot reach it. Due by Area 2a

### Open question for the parent

Area 0 authoring **started the Journal in week 1 rather than week 3**, deviating from §5.6 on
the grounds that §5.6 also requires re-reading it before Boss 1, and entries beginning in week 3
leave almost nothing to re-read. The commit-and-push half still arrives at Area 2a on schedule,
and the six Area 0 entries become his repository's first real commit. This needs a ruling.

---

## Status

**Final Status:** Completed
**Completed:** 2026-08-28
**Completed By:** Claude (Opus 5), with Steven Molen

### Outcomes

**Phase 0 shipped.** Compose stack (postgres + gitea on one server, pinned by tag and
digest, healthchecks throughout) with a backup job whose restore was rehearsed and
verified — a git commit and a Journal entry both came back out of a tarball by exact
content, which is what §6.9 asks for before week 3. The engine's pinned arithmetic, the
content contract, an eight-rule validator, and the `new:quest` scaffolder.

**Area 0 shipped.** Six session plans, 17 verified exercises, the Journal template, and
a DM guide — deliverable with a text editor, a terminal and Python, per §8's warning
that the app must not become a way to postpone teaching a child Python.

**The design session happened, and changed the product.** Nine screens, and the
discovery that the learning had no home: §2.2 concedes gamification has minimal impact
on competency, and the spec's answer — building things teaches — assumed he already
knew what a dict was when he opened The Recipe Book. The Tome exists because of that
gap.

### Deviations

- **Scope grew from Phase 0 + Area 0** to include the full design session and two
  lexicon resets. Both were cheap at the time they were taken and expensive later,
  which was the argument for taking them.
- **The engine split** into pinned arithmetic (built) and a query layer (deferred until
  screens existed). The deferred half is now unblocked and has its own plan.
- **`packages/engine` became `pyquest/packages/engine`** in a late restructure.

### Lessons Learned

- **Three composition bugs, none catchable by a unit test.** `npm run new:quest -- --id
  x` was unusable because a root script dropped a trailing `--`; a relative `--root`
  resolved against the package directory; Gitea crash-looped against its own image's
  SSH daemon with the bad setting persisted into a volume. Every one was found by
  running the command a human would type.
- **Tests were importing built output.** Cross-package imports resolved through
  `package.json` to `dist/`, so the engine's suite could have passed against a stale
  build of content. Found only because a restructure deleted `dist`.
- **Three checks were wrong rather than the code** — a naive SVG bounds check, a
  hole-binding scan, and a glyph measurement. Two of them surfaced real bugs anyway, by
  accident. A green line from an unvalidated check is worth nothing.
- **Renaming a mechanic is not done when the noun changes.** Patrol became Invasion
  while the verbs stayed custodial — "due back", "arrives", "queued" — and it read, in
  the parent's words, like herding pigs rather than defending anything.
- **The son read the rail correctly, cold.** That is the only test of the lexicon that
  counts, and it passed.

### Backlog Items Created

- `planning/backlog/feature_scoring-model-single-source_2026-08-27.md`
- `planning/backlog/feature_backup-destination-second-disk_2026-08-27.md`
- `planning/backlog/feature_gitea-lan-access-for-the-son_2026-08-27.md`
- `planning/backlog/feature_vscode-profile-and-tool-quests_2026-08-28.md`
- `planning/backlog/feature_roles-modes-and-the-dm-seat_2026-08-28.md`

### Follow-on Plans

- `planning/feature_engine-query-layer_2026-08-28.md`
- `planning/feature_progress-schema_2026-08-28.md`
- `planning/feature_api-and-runner_2026-08-28.md`
- `planning/feature_spa_2026-08-28.md`
