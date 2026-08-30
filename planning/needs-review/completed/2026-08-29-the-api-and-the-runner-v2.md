# The API and the Runner

**Status:** Planned
**Track:** api
**Date:** 2026-08-28
**Author:** Claude (Opus 5)
**Lane:** A — **blocked by the engine query layer and the progress schema**

## Objective

A Fastify API implementing `@pyquest/contract`, the four verifiers of §6.3, and a runner
container that executes untrusted Python behind a real boundary.

## Why the runner is in this plan and not its own

They are one feature from the outside — Submit does nothing without both — but two
deployables with different risk. The API is ordinary web code. The runner executes
arbitrary Python written by a child who will, in week three, write `while True:`. Keeping
them in one plan keeps the interface between them honest; keeping them in one *container*
would not.

## Success Criteria

- [ ] Every response body typed against `@pyquest/contract`, no payload shape invented here
- [ ] The endpoint list, request bodies and error shape **added to** `@pyquest/contract` by
      this plan, because they do not exist yet — see below
- [ ] `npm run typecheck` from `pyquest/` covers both apps and their tests
- [ ] Every `.py` in the runner is ruff and pyright clean
- [ ] All four verifiers: `hidden-tests`, `local-repo`, `peer-signoff`, `git-signal` (§6.3)
- [ ] The runner refuses network access, exceeds neither its CPU nor memory cap, and dies
      at ten seconds — each **proven by a test that tries** (§6.6)
- [ ] Integration tests against the real compose stack. Nothing that mocks the database or
      the runner counts
- [ ] Hidden tests never reach the client, asserted by a test that greps the response

## Approach

**The contract gives this plan half of what it needs, and the missing half is this plan's
to write.** `packages/contract` landed on 2026-08-29 with response payloads and progress
rows — `AvailableQuestsSchema`, `AreaProgressSchema`, `BossStateSchema`, `DueInvasionsSchema`,
`StandingsSchema`, `XpSourcesSchema`, `LevelSchema`, and the `PlayerProgress` bundle the
repository assembles.

It contains **no endpoints, no request bodies and no error shape.** So "every endpoint in
`@pyquest/contract`" was not a criterion that could be met. The route table below is the fix,
and it is written here rather than deferred because the SPA's stubs are typed against it and
that track is already building.

**The routes.** One screen should cost one request; a screen that costs four is a screen that
shows three quarters of itself on a slow LAN. Player-scoped reads carry the player in the path,
because Kitchen Table has two players and a route that implies one is a route that needs
rewriting the first time the parent opens the app.

| Method | Path | Request | Response |
|---|---|---|---|
| `GET` | `/api/players/:playerId/campaign` | — | areas with `AreaProgress` and `BossState`, for the map |
| `GET` | `/api/players/:playerId/areas/:area` | — | `AvailableQuests`, `AreaProgress`, `BossState`, the brief |
| `GET` | `/api/players/:playerId/quests/:questId` | — | the quest, its brief, medals held, `effectiveDC` per medal |
| `POST` | `/api/players/:playerId/quests/:questId/submit` | `SubmitRequest` | `JobAccepted` — a `runner_jobs` id |
| `GET` | `/api/jobs/:jobId` | — | `JobState`: queued, running, passed, failed, timed-out |
| `GET` | `/api/players/:playerId/defend` | `?now=<date>` | `DueInvasions` |
| `POST` | `/api/players/:playerId/defend/:conceptId` | `DrillResult` — repelled or not | the new rung |
| `GET` | `/api/players/:playerId/party` | — | `Standings`, `XpSources`, bounties |
| `GET` | `/api/players/:playerId/journal` | — | entries |
| `POST` | `/api/players/:playerId/journal` | `JournalEntryRequest` | the entry, with XP awarded |
| `GET` | `/api/tome` | — | the syllabus: concepts by area, unlocked state |
| `GET` | `/api/signoffs` | `?state=pending` | pending peer-signoffs, for the Console |
| `POST` | `/api/signoffs/:attemptId` | `SignoffRequest` — `by` a role | the medal awarded |

`GET /api/tome` is not player-scoped because the syllabus is content, and content is the same
for everyone (§6.7). That it renders differently per player is the UI's business.

**Authentication is not in this plan, and that is a decision rather than an oversight.** The
API binds to the parent's machine on a household LAN, and `:playerId` in a path is an
assertion, not a credential — anyone on the LAN can claim to be anyone. That is acceptable for
two people at a kitchen table and is not acceptable for the classroom mode the modes backlog
anticipates. Recorded as a backlog item rather than solved here, because solving it properly
means choosing an identity story for every mode, and no mode but Kitchen Table exists.

**The error shape, one for every endpoint.**

```ts
{ code, message, retryable, details? }
```

`code` is a discriminated union — `not-found`, `content-invalid`, `verifier-failed`,
`runner-timeout`, `runner-killed`, `illegal-modifiers`, `already-awarded`, `signoff-denied`,
`internal` — because the SPA has to tell a failed verifier from a timed-out runner to say
anything useful, and a client that distinguishes them by matching on `message` is a client that
breaks when someone fixes a typo. `retryable` exists so the SPA knows whether to offer the
button again without knowing what any code means. `illegal-modifiers` maps to the engine's
`IllegalModifierSetError`, which already exists.

**`xpSources` belongs to the engine, not here.** The engine plan left the owner open for
whoever arrived first; this plan arrives first and declines it. It is a pure projection over
recorded completions, and an API that sums medals is doing engine arithmetic on the wrong side
of §6.7 — the same boundary that keeps `standings` out of SQL. The API serves it by calling the
engine, and the engine plan's successor implements it. Until then `GET /party` returns the
recorded rows and the field is empty, which the SPA already handles because the contract ships
the shape.

**The API serves the SPA in production** (§6.1) and reads content from git on boot,
zod-validated on load (§6.10). Content is immutable at runtime; the authoring path is the
CLI, not an endpoint.

**Verifiers, in the order they become necessary.**

*`hidden-tests`* — Submit posts code, the API enqueues a `runner_jobs` row, the runner
executes the quest's pytest specification, the API awards XP. §6.3's whole point: anything
shipped to the browser is readable, so the tests live only here.

*`local-repo`* — the API clones the player's Gitea repository over HTTP into
`/workspaces/<handle>/`, fetches and hard-resets to `origin/main` on subsequent runs rather than
merging, and runs the quest's `tests` path against the checkout, from the quest's optional
`path` subdirectory. Push is the verification mechanism (§6.4): the API tests what was pushed,
never a working tree it cannot see. Needs the Gitea LAN work in
`planning/backlog/feature_gitea-lan-access-for-the-son_2026-08-27.md` before it can be tested
against his machine.

*`peer-signoff`* — a submission creates an `attempts` row with `passed = false` and a pending
signoff; `GET /api/signoffs?state=pending` is the Console's queue and `POST
/api/signoffs/:attemptId` resolves it. The API enforces that the approver is not the submitter
and holds the role the quest's `by` field names (`peer` or `dm`), which is a role check against
`player_roles`, never a name check. §5.11's teach-back inverts the direction, and that is the
same mechanism rather than a special case.

*`git-signal`* — reads the player's Gitea repository through the Gitea API rather than
shelling out to git, because the API already needs a Gitea token for `local-repo` and one
integration is cheaper to reason about than two. `commit` and `push` are commits since the last
recorded attempt; `tag` is a matching tag; `journal-entry` is a commit touching the journal path
whose message matches the quest's convention. Polled when a screen asks, not by webhook —
webhooks need a reachable callback and this is a laptop that sleeps.

**The runner (§6.6).** v1 is a subprocess inside the runner container. The review was right
that `--network none` plus a wall timeout plus `RLIMIT_AS` is not a boundary: `while True:
os.fork()` and `open('/dev/zero').read()` both walk straight through it. The full set:

- `--network none` at the container, so there is no network to reach.
- Wall timeout of ten seconds, enforced by the parent, plus `RLIMIT_CPU` so a process that
  ignores signals still dies.
- `RLIMIT_AS` for memory, under a container `mem_limit`, so the process hits its own limit
  before the container hits the kernel's OOM killer and takes the worker with it.
- **`RLIMIT_NPROC`**, which is what a fork bomb runs into.
- **`RLIMIT_FSIZE` and a per-job tmpfs workspace**, so filling the disk fills a small
  memory-backed directory that vanishes with the job.
- **An output cap** — stdout and stderr truncated at a fixed size — because a `while True:
  print()` is a disk-fill and a memory-fill wearing a different hat.
- **Non-root, read-only root filesystem**, writable only in the tmpfs workspace.
- Cleanup is unconditional: the workspace is removed whether the job passed, failed, timed out
  or crashed the worker.
The queue is a `runner_jobs` table — no new infrastructure, and swapping to an ephemeral
container per job later touches only the worker.

**`runner_jobs`, in full.** The db plan lists it and stops, correctly — the queue's shape
follows from how Submit works, which is this plan's subject. This is the one definition; the db
plan writes the migration against it and does not invent a second.

| Column | Type | Notes |
|---|---|---|
| `id` | `bigserial pk` | the id `POST /submit` returns |
| `player_id` | `uuid not null` | FK `players` |
| `quest_id` | `text not null` | resolved against content, not a FK (§6.7) |
| `attempt_id` | `bigint null` | FK `attempts`, set when the attempt row is written |
| `status` | `text not null` | check in `queued, claimed, passed, failed, timed-out, killed` |
| `payload` | `jsonb not null` | the submitted code and the verifier spec |
| `result` | `jsonb null` | test output, truncated to the output cap |
| `error_code` | `text null` | the same union the API's error shape uses |
| `created_at` | `timestamptz not null default now()` | |
| `claimed_at` | `timestamptz null` | set when a worker takes it |
| `claimed_by` | `text null` | worker identity, for stuck-job forensics |
| `lease_expires_at` | `timestamptz null` | a claimed job past this is reclaimable |
| `attempts_made` | `smallint not null default 0` | check `<= 3` |

Claiming is `UPDATE ... SET status='claimed' WHERE id = (SELECT id FROM runner_jobs WHERE
status='queued' OR (status='claimed' AND lease_expires_at < now()) ORDER BY created_at FOR
UPDATE SKIP LOCKED LIMIT 1) RETURNING *`. `SKIP LOCKED` is what makes a second worker safe
later; the lease is what stops a worker that died mid-job from parking a submission forever,
which is the failure an 11-14-year-old experiences as "the button did nothing."

Index on `(status, created_at)`. A queue scanned sequentially is fine at two players and is
the kind of thing nobody revisits.

**The runner is Python, and this repository has a standard for that.** `apps/runner/**` is
`.py`, so the `python-quality-developer` skill applies: ruff and pyright clean, no `Any`,
exception chaining. That is not housekeeping here — §5.10's Idiomatic medal is *literally*
"ruff and pyright clean", so this is the code that has to meet the bar the 11-14-year-old is
graded against. He opens this repository at Boss 7.

The security properties are the tests. Write a job that opens a socket and assert it
fails. Write one that allocates a gigabyte and assert it is killed. Write `while True:`
and assert it dies at ten seconds, not eleven. A boundary you have not attacked is a
boundary you have assumed.

## Phases

### Phase 1 — the contract additions, then the skeleton

The route table, request bodies and error shape go into `packages/contract` **first**, because
the SPA's stubs are typed against them and every week they do not exist is a week that track
is guessing.

Then Fastify, health, content loaded and validated on boot, contract types wired. Both apps
get their own `typecheck` and `test` scripts: root `npm run typecheck` fans out with
`--workspaces --if-present`, so a workspace without them is unchecked and does not say so.
Neither app needs a root `tsconfig` reference or a vitest alias — nothing imports an app.

The content root arrives as `CONTENT_ROOT`, mounted read-only at `/content` by
`infra/compose/api.yml`. Read-only is deliberate: §6.10 makes authoring a CLI, and an API that
cannot write content cannot grow an authoring endpoint by accident.

Content loading is whole-corpus and fail-fast: every `content/**/*.yml` is parsed through
`ContentItemSchema` and every area manifest through `AreaManifestSchema`, the prerequisite
graph is checked for cycles with the validator that already exists, and **one bad file refuses
the boot**. A half-loaded campaign is worse than a stopped one — it shows a child a map with a
hole in it and no way to tell that the hole is a bug.

Integration test asserts a bad content root fails startup loudly rather than serving a
half-campaign.

### Phase 2 — the runner and `hidden-tests`

The container, the queue, the caps, and the attack tests above. Then Submit end to end.

### Phase 3 — the remaining verifiers

`peer-signoff` and `git-signal` first (no runner needed), then `local-repo` once Gitea is
reachable from his laptop.

### Phase 4 — awarding

The engine decides, the API records. Written as a sequence so that no arithmetic leaks across
the seam:

1. The API writes an `attempts` row from the runner's result — the only thing it decides alone.
2. It reads the medals already held and calls `medalDelta(baseDC, held, newMedal)`. The engine
   returns a number; the API writes `quest_medals` with `xp_awarded` set to exactly that number
   and never to one it computed.
3. For a drill, it calls `nextRung(rung, repelled)` and writes the returned rung. The ladder is
   §5.4's arithmetic and lives in the engine; the API stores what it is told.
4. Totals are never written. §5.10 prices once and totals are `SUM` — a cached total is the
   second source of truth the db plan already refuses.

Every write goes through the repository layer. An API that calls `xpFor` or re-derives an
effective DC has crossed §6.7, and the test for that is that `apps/api` imports no engine
function that returns money it did not first ask for.

## Dependencies / Prerequisites

- `planning/completed/feature_engine-query-layer_2026-08-28.md` — **done**. The query layer
  and the payload half of the contract
- `planning/feature_progress-schema_2026-08-28.md` — somewhere to write. The `runner_jobs`
  appendix above is what that plan is waiting on, and it is now written
- `planning/feature_contract-modules_2026-08-29.md` — **blocks Phase 1**, which begins by
  writing `endpoints.ts`, a file that gate creates
- Gitea reachable from the son's machine, for `local-repo` only

## Files Expected to Change

- `pyquest/apps/api/**` — new
- `pyquest/apps/runner/**` — new, and Python: ruff and pyright clean
- `pyquest/packages/contract/src/endpoints.ts` — **this track owns it**, per
  `planning/feature_contract-modules_2026-08-29.md`: the route table, request bodies and the
  error shape. `index.ts`, `primitives.ts` and `payloads.ts` are `main`'s and `progress.ts` is
  the `db` track's; none is edited here
- `infra/compose/api.yml` — the `api` and `runner` services; this track owns the file,
  and the root `docker-compose.yml` is not the place

## Track discipline

**This plan edits `packages/contract`, which the engine plan handed to `main` on completion.**
An earlier draft claimed the whole package for the duration, which would have blocked the `db`
track from the seven row shapes it owes. `planning/feature_contract-modules_2026-08-29.md`
splits the package by owner instead, and this track holds exactly one file: `endpoints.ts`.
That gate runs before this plan starts.

`apps/api` and `apps/runner` are leaves that nothing imports, so this track needs no project
reference in the root `tsconfig.json`. **It does need a `vitest.config.ts` entry**, and an
earlier draft said otherwise — the `spa` track already names that file for the `projects` entry
that gives `apps/web` a DOM, and this track needs the same for its own suites. Two tracks, one
file, a distinct entry each: append, do not merge blind. `infra/compose/api.yml` is this track's; the
root `docker-compose.yml` is not to be edited here.

## Anticipated Backlog

- **Identity.** `:playerId` in a path is an assertion, not a credential. Fine for two people on
  one LAN; not fine for the classroom mode the modes backlog anticipates, and the two decisions
  belong together.

## Out of Scope

Anything a screen renders. The API returns the contract's shapes and stops; the DC warning
threshold, the `~`, and a zero payout reading as "brag" are all the UI's.

---

## Plan Review (v2)

**Reviewed:** 2026-08-29 18:26
**Reviewer:** Claude Code (plan-review-intake)

### Previous Issues — Resolution Status

1. **Resolved** — `runner_jobs` now has a full column table, status set, lease fields, claim semantics, and an index.
2. **Resolved** — Concrete route table listed with methods, paths, requests, and responses for all 13 endpoints.
3. **Partially resolved** — Error shape and code union exist, but only as inline prose/TS, not a named contract schema with field types and nullability fully pinned.
4. **Partially resolved** — All four verifiers described concretely; `git-signal` journal detection rule and `peer-signoff` state transitions still leave some implementation choices open.
5. **Resolved** — Phase 4 states "engine decides, API records" with specific engine calls and storage responsibilities for each write.
6. **Resolved** — Runner isolation now covers network, CPU, memory, `RLIMIT_NPROC`, file size, tmpfs workspace, output cap, non-root, read-only rootfs, and cleanup.
7. **Resolved** — `xpSources` explicitly assigned to engine; temporary API behavior (return empty, contract already ships shape) stated.
8. **Partially resolved** — Boot-load says whole-corpus/fail-fast and names schemas, but not the exact in-memory shape the API serves from.
9. **Resolved** — `vitest.config.ts` shared ownership with SPA track explicitly acknowledged.
10. **Resolved** — Cross-plan coordination is now formal: this plan defines `runner_jobs`; db plan consumes it.

### New Issues

#### Important (Should Address)

- **`vitest.config.ts` missing from Files Expected to Change**
  - Section: Files Expected to Change / Track discipline
  - What's wrong: The track discipline section acknowledges the file needs an entry, but it is not listed in Files Expected to Change.
  - Why it matters: Disjointness checks scan that list; an acknowledged shared file that is not listed is a gap.
  - Suggested fix: Add `pyquest/vitest.config.ts` to Files Expected to Change with a note that this is a coordination point with the `spa` track.

- **`runner_jobs` storage states vs API-facing states not mapped**
  - Section: Routes table / `runner_jobs` column table
  - What's wrong: `GET /api/jobs/:jobId` returns `queued, running, passed, failed, timed-out` as `JobState`, but `runner_jobs.status` uses `claimed` and `killed` which have no stated mapping.
  - Why it matters: The API must translate storage states to contract states; unspecified means implemented ad hoc.
  - Suggested fix: Add an explicit mapping: `claimed → running`, `killed → timed-out` or `failed`, with the rule stated.

- **`GET /defend` query parameter contract not specified**
  - Section: Routes table
  - What's wrong: `?now=<date>` is noted but no schema/validation contract for the query parameter is defined alongside the request body schemas.
  - Suggested fix: Add a `NowQuerySchema` or state explicitly that an absent `?now` defaults to server date.

### Assessment

**Implementable as written?** With fixes

**Reasoning:** The plan is substantially improved — the route table, `runner_jobs`, awarding flow, and runner isolation are all now workable — but the missing `vitest.config.ts` file-set entry and the unspecified job-status mapping are design decisions that would be made inconsistently during implementation without a ruling here.

---

## Disposition

*Appended by the author after `plan-receive-review`. Everything above is the review as received and is unaltered.*

**3 taken, 1 not as suggested** — applied in `f48aa93`.

`vitest.config.ts` was acknowledged in Track discipline and missing from the file set, which is the list the disjointness check actually reads. The `?now` query parameter was removed rather than schematised — a client that supplies the date can ask for yesterday and skip its own invasions, and §5.4 is a schedule not negotiable by the person being scheduled.

Merged rather than accepted: the review proposed collapsing `killed` into `failed` or `timed-out`. `JobState` carries all six instead, because running out of memory and being wrong are different things to tell an 11-14-year-old.
