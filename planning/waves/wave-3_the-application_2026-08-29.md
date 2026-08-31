# Wave 3 — The Application

**Status:** Open — eight plans landed, three running, nothing blocked on hardware
**Level:** Wave — coordinates plans, does not replace them
**Date:** 2026-08-29
**Author:** Claude (Opus 5)
**Tracks:** `main`, `db`, `content-wire`, `api`, `spa`, `area-0`, `area-2`, `area-3`, `world-shim`

## What a wave is, and why this is one

A plan owns a track. A **wave** owns the order the tracks start in.

The word is already this repository's. `feature_phase0-tier0-foundation` reasons about
Wave 0 and Wave 1; three backlog items record what they were discovered during; and
`feature_scoring-model-single-source` says the Datamine table lands "in Wave 3, which is the
first moment Datamine needs a real table." This document is that Wave 3, written down instead
of carried in someone's head.

**A wave is written when the plans stop fitting in a head, not before.** Nine live plans across
nine tracks is where that happened here. Two or three plans need no wave; they need a glance at
`in-progress/`.

## The problem this wave exists to solve

Nine plans are live. Four are running. **None of the five queued can start**, and not one of
them is blocked by the work it actually depends on. They are blocked by file ownership and
track capacity:

| Held plan | Held by | Kind |
|---|---|---|
| Progress Schema (`db`) | `pyquest/vitest.config.ts`, in use by `spa` | shared file |
| Content Surface (`db`) | the `db` track, plus `content/areas/area-2.yml` | track capacity |
| API and Runner (`api`) | in review; then `vitest.config.ts` | review, then shared file |
| Curriculum's Voice (`main`) | area-0 declares no file set, so nothing can be cleared against it | missing declaration |
| Area 3 (`area-3`) | world-shim and area-2, both mid-flight | **a real dependency** |

Only the last is queued for an honest reason. The other four are the same failure this project
has now hit four times — **one file doing two jobs** — after `concepts.ts`,
`pyquest/tsconfig.json`, `infra/docker-compose.yml` and `packages/contract/src/index.ts`.

## The sequence

Two short gates on `main`, then five plans start within a day of each other.

### Gate 1 — Area 0 declares its file set  *(`main`, done 2026-08-29)*

`planning/in-progress/feature_area-0-quest-backfill_2026-08-28.md` has no
`Files Expected to Change` section. The rule that admits plans in parallel is a comparison of
those lists, and one of them is absent — so every judgement about what may run beside it is a
guess wearing the clothes of a rule. Cheapest item in the wave; unblocks a whole plan.

### Gate 2 — make the alias map derive itself  *(`main`, done 2026-08-29)*

**This gate was proposed wrongly and the fix is not what it says below.** The wave asked for
`vitest.config.ts` to be split per workspace, the way `infra/compose/` was. The `spa` track had
already argued against exactly that, in the file:

> **Defined once, on purpose.** An `apps/web`-local vitest config would be a second place for
> these to be written down, and the second place is the one that goes stale — a web project
> missing the contract alias would parse its fixtures against compiled output and stay green
> against a contract that moved.

That is the better argument. Per-workspace configs make every workspace restate the alias map,
and one that forgets an entry resolves silently through `dist/`.

**What landed instead:** the map stays in one file and derives itself, reading each package's
own `package.json`. That keeps the single definition the paragraph argues for *and* removes the
queue behind the file — `db` needed one alias line and `api` needed one, and now a package that
exists is aliased with no list to forget. `db` dropped the file from its set entirely.

Verified as this wave requires: 14 files and 243 tests before, 14 and 243 after.

**The lesson for the next wave:** a gate that proposes changing a file should read that file
first. The counter-argument was written down, in the place the change was going to be made.

### Gate 3 — re-track the Content Surface  *(`main`, done 2026-08-29)*

It declares `Track: db` and so queues behind the Progress Schema. They are not the same work —
one writes SQL and a repository layer, the other writes wire shapes and YAML. Give it
`content-wire` and the bottleneck disappears.

### Then, in parallel

- **`db`** — Progress Schema. Reviewed twice; its own reviewer said nothing blocks Phase 1.
- **`main`** — Curriculum's Voice, once Gate 1 proves it disjoint from area-0.
- **`api`** — when v4 returns. Its Phase 1 writes `endpoints.ts`, which the SPA is stubbing
  against right now; this is the oldest debt on the board.
- **`content-wire`** — Content Surface, **started**. It no longer waits for area-2: that track
  is blocked on the son's laptop, so rather than hold a plan behind hardware, the content
  surface lands the six manifests nobody holds and leaves `area-0.yml` and `area-2.yml` to the
  tracks that hold them, as deferred work carried in those plans.
- **`area-3`** — after world-shim and area-2. Correctly queued; nothing to fix.

## Exit criteria

- [x] Every in-flight plan declares a file set — area-0 was the only gap
- [x] No file appears in two in-flight plans' `Files Expected to Change` — checked by listing
      every path and looking for a duplicate, not by reading
- [x] No plan lists `pyquest/vitest.config.ts` **for an alias**. Two still list it: `spa`, which
      owns it, and `api`, which needs one `projects` entry for `apps/api`'s node environment.
      That is one claimant at a time and not the queue this wave existed to break — the
      criterion was written too absolutely
- [x] Five queued plans running or complete — **five of five**, 2026-08-30. The progress
      schema, the content surface and the curriculum's voice landed 2026-08-29; the API
      completed 2026-08-30 and area-3 is still correctly queued behind area-2
- [x] The API's endpoint half exists — **done 2026-08-30.** All five phases, all four §6.3
      verifiers, `local-repo` proven from a push to a medal

## What landed, 2026-08-29

| Track | Plan | Result |
|---|---|---|
| `db` | Progress Schema | `f6ad25a` — 13 tables, migrations run against live Postgres, 60 integration tests, smoke 35/0 |
| `content-wire` | Content Surface | `81dc3ab` — six manifests carry weeks and blurb; an area's name reaches the wire from YAML |
| `main` | Curriculum's Voice | `31a115d` — 875 pronouns across 40 files; 11 deliberate survivors, all Dad |

Suite went 243 → **361 tests across 18 files**, `validate:content` clean at 8 areas.

## What the wave learned

- **A gate that proposes changing a file should read that file first.** Gate 2 proposed a split
  the `spa` track had already argued against, in the file, with the better argument.
- **Two plans by one author a day apart still disagree.** `journal_entries` was built exactly as
  its appendix ruled, and the API plan promises three columns that appendix never had. Written
  down as `planning/backlog/feature_journal-text-has-no-column_2026-08-29.md`.
- **A mutant found a test passing for the wrong reason.** Deleting the migration runner's
  transaction control left the suite green — `pg` wraps a multi-statement file implicitly, so
  the test proved something Postgres does for free. The seam it missed was between the migration
  and its ledger row, two separate calls.
- **Four agents doing RED-first work in one tree makes the shared gate meaningless.** The `spa`
  track reported 33 failures and 21 type errors it could not act on; they were the `api` track's
  RED, in an untracked file. The isolation existed and was not used. Next wave: give concurrent
  agents their own worktrees, or tell each one that `vitest --project <name>` is its gate and
  the root suite is not.
- **Blocked on hardware is not blocked on everything.** area-2 waits on a laptop; the content
  surface stopped waiting on area-2 by landing six manifests and deferring two into the tracks
  that hold them.

## Where it stands, 2026-08-30

**Nothing on this board is blocked by software any more.** Every remaining hold is a person, a
machine, or a decision — which is why they moved to `planning/reminders/` rather than staying as
prose inside plans nobody rereads.

| Track | Plan | State |
|---|---|---|
| `db` | Progress Schema | complete |
| `content-wire` | Content Surface | complete |
| `main` | Curriculum's Voice | complete |
| `content-wire` | Content browser-safe entry | complete — found on 2026-08-30, fixed the same day |
| `spa` | The SPA v2 | **running**, phases 3 and 4 |
| `api` | API and Runner | **running**, phases 1/2/4 landed; 3 held |
| `area-0` | Quest backfill | running, three quests done |
| `world-shim` | The World Shim | running, one measurement outstanding |
| `area-2` | Scribe's Rite | **held on hardware** |
| `area-3` | Collections | queued behind area-2a |

### What is actually blocking, and who can clear it

- **The son's laptop.** Four tasks need it and not one of them can be done from here: the VS
  Code profile (holds `area-2`, which holds `area-3`), a real push to Gitea (holds the API's
  last two verifiers *and* is Area 2a's win condition), the Ursina framerate (holds a
  `world-shim` criterion), and the nine-screen check. **One afternoon, four reminders**, and
  clearing it releases two tracks and closes a third plan's remaining phase.
- **`vite build` is in no gate.** The SPA's gate is `vitest --project web`, which stayed green
  while the production build was broken — that is how a `node:fs` import survived a commit and
  surfaced as a runtime error in the dev server. Whether the build joins a suite, a hook or a
  wave's exit criteria is still unanswered.

### What is free right now

`main`, `db` and `content-wire` hold no in-flight plan. The work sitting in backlog that any of
them could pick up today, without waiting for anyone:

- **The boss XP bug** — a boss medal pays a tenth of what §5.1 prices. Wrong money the first
  time a boss is beaten, and boss sign-off is how the parent's gap-detector works.
- **The Journal columns** — `prompt`, `body` and `reply` have no home, and §6.9 calls the
  Journal unregenerable.
- **Three compose services cannot start on Windows** — one decision applied three times.
- **`weeks`/`blurb` tightened to required**, once area-0 and area-2 land theirs.
- **A guard in `apps/web`** against importing the bare `@pyquest/content`, which is what broke
  the build; the browser entry only helps consumers that ask for it.

## What Wave 4 inherits

- The API, approved and unblocked, with the Journal columns to add first
- `area-3`, still waiting on world-shim and area-2 — the only honestly-blocked plan on the board
- Tightening `weeks`/`blurb` to required once area-0 and area-2 land theirs; until then a
  weekless manifest is invisible to the validator, which a mutant proved
- The overlap defence in `payloads.test.ts` rests on a hand-written literal carrying Area 2's
  6–8 range. When area-2 lands its weeks, that literal should give way to real content

## What this wave does not do

It does not re-plan anything. Every plan named here keeps its own objective, phases, criteria
and review history; a wave that starts editing the substance of its plans has become a very
large plan and should be split back up.

It also does not schedule Lane B. `area-0`, `area-2` and `area-3` appear because they hold
files Lane A wants, not because a wave decides when curriculum gets written. Lane B is never
the thing that gets postponed.

---

## Where it stands, 2026-08-31 — the wave's own premise has expired

**Wave 3 was written to break a queue caused by file ownership. That queue is gone**, and so is
the hardware hold that replaced it. Every plan this wave sequenced has landed except the four
still in `in-progress/`, and none of those four is waiting on another plan.

| Track | Plan | State |
|---|---|---|
| `db` | Progress Schema | complete |
| `content-wire` | Content Surface | complete |
| `main` | Curriculum's Voice | complete |
| `content-wire` | Content browser-safe entry | complete |
| `api` | API and Runner | **complete 2026-08-30** — all five phases, all four §6.3 verifiers |
| `world-shim` | The World Shim | **complete 2026-08-31** — 213.8 fps at 5,000 fused |
| `reminders-ext` | Reminders extension | **complete 2026-08-30** — merged as PR #1 |
| `spa` | The SPA v2 | in progress — all five phases done, three criteria outstanding |
| `area-0` | Quest backfill | in progress — three quests done, six gated on one question |
| `area-2` | Scribe's Rite | in progress — profile proved on the machine; re-export outstanding |
| `field-manual` | The Field Manual | in progress — built and gated; the round trip unproven |
| `area-3` | Collections | queued — **now behind area-2 alone**, world-shim having closed |

### The laptop afternoon, and what it released

One sitting on 2026-08-31 cleared four of the five things this wave named as blocking. It
released `world-shim` to completed, freed `area-2` and `spa` from the blocked column, and left
`area-3` waiting on one plan instead of two.

**It also found two defects that had nothing to do with hardware.** `tools/vscode/README.md`
sent the reader to a `Profiles: Import Profile` command that does not exist in VS Code 1.135,
and its export step named a `Save to file` dialog that had been renamed. Both were authored
instructions that had never been run — the same class of thing as the plan's own argument that
*an exported profile is a JSON blob and reading one proves nothing*.

**And it retired an assumption that had been shaping design.** The son's screen is 1920×1080,
not the 1366×768 three documents asserted. That number was never measured; it was carried from
"an old laptop" into a success criterion, the Map's panel budget, and a worry about the type
ramp. Nothing needs redesigning.

### What is actually blocking now — three questions and two errands

Not one of these is a plan waiting on a plan. That is the state this wave was written to reach.

| # | What | Holds | Who can clear it |
|---|---|---|---|
| 1 | ~~Can `hidden-tests` assert on a traceback?~~ **Answered 2026-08-31: yes, today, no change anywhere.** | ~~six Area 0 quests~~ — **now startable** | closed |
| 2 | ~~Where does the Journal's text live?~~ **Ruled 2026-08-31: markdown in git, not Postgres.** No migration | ~~the Journal screen~~ — now ordinary work | closed |
| 3 | ~~Did the Field Manual publish?~~ **It does now** — fixed and deployed 2026-08-31, `33348507577`, HTTP 200 | ~~the round trip~~ | closed |
| 4 | **Re-export the VS Code profile** on the learner's machine | `area-2` Phase 4, and `area-3` behind it | the machine, briefly, again |
| 5 | **`vite build` is in no gate** — unanswered from the previous section, and still true | nothing yet; it will | a decision about where the build runs |

**Items 1 and 2 were the wave's own failure mode wearing new clothes.** Both were questions
with no owner, sitting in prose inside plans, holding real work — exactly the shape of the five
queued plans this wave opened to unstick. The lesson repeats: *a thing nobody owns is not
scheduled, however clearly it is written down.*

**All three were investigated on 2026-08-31, and the answers were not what the questions
assumed.** That is the finding worth carrying forward more than any individual answer:

- **Item 1 needed no work at all** — six quests sat gated for three days on a capability the
  repository already had, in a pattern already shipping in `content/tests/a2-*`. Nobody had
  read it. *Three days of block, zero days of work.*
- **Item 2 was the wrong question.** "Which columns should we add" has an obvious answer and a
  wrong premise; the real question is which of two already-built stores is the record, and the
  spec's own partition rule does not reach it. It also turned up two mismatches nobody had
  recorded — §5.6 wants four prompts where the contract models one, and `commit_sha NOT NULL`
  makes the first eight weeks of entries unstorable.
- **Item 3's failure was one step earlier than predicted**, and the prediction being wrong is
  what makes it interesting: the plan feared a deploy-permissions failure and got a build that
  never produced an artifact — **while both gates reported green**, because vitest aliases
  `@pyquest/content` to `src/` and never touches `dist/`.

**Item 3 and item 5 are the same bug.** "`vite build` is in no gate" was already written down in
the previous section, and the Field Manual just proved it a second time in a second place. The
pattern is not a missing test: **the suite runs against source and the artifact is built from
`dist`, so a green suite is silent about whether the thing can be built at all.** Whatever
answers item 5 should answer both.

### Should there be a Wave 4?

**Not yet, and possibly not at all.** A wave is written when the plans stop fitting in a head.
Four in-progress plans on four tracks, with no plan-on-plan dependency between them, fits in a
head — it needs a glance at `in-progress/`, which is this document's own test for when *not* to
write one.

What Wave 3 hands forward is a shorter list than the one it inherited: three questions, two
errands, and `area-3` queued behind a single track. If `area-3`, the Journal and the API's
Datamine table all start at once, that is the moment to write Wave 4 — not before.


## 2026-08-31, later — the blocking list is down to one line

Three of the five holds cleared the same day they were investigated, and the fourth was ruled.

**The Field Manual is live** at `https://darthmolen.github.io/learning-python-gamification/`
— HTTP 200, `<title>The Field Manual</title>`, build and deploy both green on run
`33348507577`. The missing workspace build landed as `37d98f0`. **The deploy job's permissions
are finally proven**, which this plan had listed as untested since the workflow was written.

The privacy check is now the real one rather than its stand-in: the **live pages** were read and
scanned. No name, machine, path, host or email; the only whole-word hit for anything relational
was `family` inside the Google Fonts query string. The page's single third-party call is that
font request, which hands Google each visitor's IP — removable by self-hosting if that ever
matters.

**The Journal is ruled**, and the ruling came with a reason better than either option the
question offered: markdown is transportable and outlives the tool. *"If we strand it in the db,
it dies with the game."* §6.9's *unregenerable* had been read as a backup problem; it is an
obsolescence problem. Two mismatches that would have been schema churn — §5.6's four prompts,
and `commit_sha NOT NULL` blocking the first eight weeks — **dissolve rather than get fixed**,
which is usually the sign a design argument came out the right way.

### What is left of item 5, and why it now matters more

**`vite build` is in no gate — and neither was the Field Manual's build until it broke in
public.** Both gates went green on the failing run because vitest aliases `@pyquest/content` to
`src/` and never touches `dist/`. That alias is right and should stay; the gap is that **nothing
runs the build**. It has now cost one silent runtime error in the dev server and one failed
deploy. This is the last unanswered line on the board and the only one with a demonstrated
failure rate.

### The board, end of day

Four plans in progress on four tracks, no plan-on-plan dependency, one queued plan (`area-3`)
behind a single track. **Still not a Wave 4** — that fits in a head. Two open reminders, both
genuinely waiting on a person rather than on work: the boss-medal query, and a thirty-second
aside about a robot turtle.
