# The API and the Runner

**Status:** In Progress
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
| `GET` | `/api/jobs/:jobId` | — | `JobState`: queued, running, passed, failed, timed-out, killed |
| `GET` | `/api/players/:playerId/defend` | — | `DueInvasions` |
| `POST` | `/api/players/:playerId/defend/:conceptId` | `DrillResult` — repelled or not | the new rung |
| `GET` | `/api/players/:playerId/party` | — | `Standings`, `XpSources`, bounties |
| `GET` | `/api/players/:playerId/journal` | — | `JournalEntry[]` — see below |
| `POST` | `/api/players/:playerId/journal` | `JournalEntryRequest` | the entry, with XP awarded |
| `GET` | `/api/tome` | — | the syllabus: concepts by area. Content only |
| `GET` | `/api/signoffs` | `?state=pending` | pending peer-signoffs, household-wide — see below |
| `POST` | `/api/signoffs/:attemptId` | `SignoffRequest` — `by` a role | the medal awarded |

`GET /api/tome` is not player-scoped because the syllabus is content, and content is the same
for everyone (§6.7). An earlier draft had it returning "unlocked state" as well, which is
progress wearing a content route's clothes — the exact mixing §6.7 forbids. It returns concepts
by area and nothing else; the SPA already holds the player's areas from `/campaign` and derives
what is unlocked from the two. That it renders differently per player is the UI's business.

**`/defend` takes no `now` parameter, and an earlier draft had one.** The engine takes `now` as
an argument because §6.7 forbids it a clock — but the API is the caller, and the API has one.
Accepting a client-supplied date would let a player skip a session's invasions by asking for
yesterday, and §5.4's whole mechanism is a schedule that is not negotiable by the person it is
scheduling. The API reads its own clock and passes the date down. A test seam for time is a
fixture at the engine boundary, not a query parameter on a public route.

**`GET /api/signoffs` is household-wide and not filtered by caller.** The Console is the DM
seat and sees every pending sign-off; §5.11's teach-back runs both directions, so a queue
filtered to "signoffs you can grant" would hide the parent's own pending teach-back from the
screen whose job is to show it. Not player-scoped for the same reason `/api/tome` is not: it is
not one player's view.

**`JournalEntry`**, because "entries" is a placeholder and not a contract. §5.6 wants
`{ sessionDate, prompt, body, commitSha, xpAwarded, reply? }` — the prompt the DM set, the
learner's answer, the commit that proves the session happened, what it paid, and the DM's reply
if one exists. `reply` is optional because a reply lands later than the entry, and a Journal
that cannot render an unanswered entry cannot render the common case.

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

*`git-signal`* — **resolved through `POST /submit` like every other verifier, not through a
route of its own.** The review was right that a verifier with no API surface is not
implementable, and wrong that it needs a new endpoint: Submit is the one action, and which of
the four verifiers runs is decided by the quest's `verifier.type`, not by which URL the client
picked. `SubmitRequest` is a discriminated union on that type — `hidden-tests` and `local-repo`
carry code or a ref, `peer-signoff` and `git-signal` carry none. One route also keeps the UI
rule that a button's label does not change with state: it says Submit on every quest.

It reads the player's Gitea repository through the Gitea API rather than
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
| `payload` | `jsonb not null` | the submitted code, plus ids: quest id, verifier type, test **path**. Never test content — see below |
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

**`payload` carries identifiers, never content.** An earlier draft said "the submitted code and
the verifier spec", and if "spec" meant the quest's hidden tests then content had just entered
Postgres, which §6.7 forbids outright and which would also make every queued job a stale copy of
a file someone can edit in git. It stores the code the player submitted — which is progress, and
belongs there — alongside the quest id, the verifier type and the repository-relative path to
the tests. The runner reads the tests from the content root it already mounts.

Index on `(status, created_at)`. A queue scanned sequentially is fine at two players and is
the kind of thing nobody revisits.

**Which module types the row, and in which vocabulary.** `progress.ts` — the `db` track's file
— types a `runner_jobs` row with the **storage** states, because a row shape that does not
mirror the row is a second definition of the table. `JobState` lives in `endpoints.ts` and is
this track's, because it is a client-facing translation rather than a fact about the database.
Stated because both tracks touch this table from opposite sides and would otherwise each pick
the vocabulary that suited them.

**Storage states and the states the client sees are not the same set, and the mapping is here
rather than left to whoever writes the handler.** `claimed` is a storage detail — a worker has
taken the row — and the client has no use for the distinction, so it reads as `running`. Every
other state passes through unchanged, `killed` included.

| `runner_jobs.status` | `JobState` |
|---|---|
| `queued` | `queued` |
| `claimed` | `running` |
| `passed` | `passed` |
| `failed` | `failed` |
| `timed-out` | `timed-out` |
| `killed` | `killed` |

The review suggested collapsing `killed` into `failed` or `timed-out`. Declining that: `killed`
is the resource limits firing — memory, processes, output — and it is the one outcome where the
right thing to tell an 11-14-year-old is not "your code is wrong." It ran out of room, which is
a different lesson and a different next step, and a client that cannot tell the two apart cannot
say either. `JobState` carries all six.

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
   **Every outcome writes one, not just a pass.** `failed`, `timed-out` and `killed` all produce
   a row with `passed = false` and stop there: no medal, no XP, no rung. Those rows are the
   scars §5.3 counts and the Boss screen renders, and §3.5 is why they are never deleted — a
   record that only remembers successes teaches that failure is the thing you hide.
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
- `planning/completed/feature_progress-schema_2026-08-28.md` — **done** 2026-08-29. Thirteen
  tables, the `runner_jobs` appendix above implemented as written
- `planning/backlog/feature_journal-text-has-no-column_2026-08-29.md` — **blocks the Journal
  endpoints only.** `JournalEntry` above promises `prompt`, `body` and `reply`; the table has
  no column for any of them. One forward-only migration, and it belongs to whichever phase
  builds `GET`/`POST /journal` rather than to a plan of its own
- `planning/feature_contract-modules_2026-08-29.md` — **landed 2026-08-29**, in
  `planning/completed/`. `endpoints.ts` exists, owned by this track and empty but for its
  header. Phase 1 is unblocked
- Gitea reachable from the son's machine, for `local-repo` only

## Files Expected to Change

- `pyquest/apps/api/**` — new
- `pyquest/apps/runner/**` — new, and Python: ruff and pyright clean
- `pyquest/vitest.config.ts` — a `projects` entry for each app's suite. **A coordination point
  with the `spa` track**, which names the same file for `apps/web`. Listed here because the
  disjointness check reads this list and an acknowledged shared file that is not in it is a gap
- `pyquest/packages/contract/src/endpoints.ts` — **this track owns it**, per
  `planning/completed/feature_contract-modules_2026-08-29.md`: the route table, request bodies
  and the error shape. `primitives.ts` and `payloads.ts` are `main`'s and `progress.ts` is the
  `db` track's; none is edited here
- `pyquest/packages/contract/src/index.ts` — **exactly one line**, added once, when the first
  shape lands in `endpoints.ts`: `export * from './endpoints.ts';`. The gate could not add it
  in advance because a file with no exports is not a module and cannot be re-exported from, so
  this is the one edit to a `main`-owned file the split could not remove. The `db` track needs
  no equivalent — `progress.ts` is already re-exported wholesale, so its seven row shapes
  appear on the public surface with no edit here at all
- `infra/compose/api.yml` — the `api` and `runner` services; this track owns the file,
  and the root `docker-compose.yml` is not the place

## Track discipline

**This plan edits `packages/contract`, which the engine plan handed to `main` on completion.**
An earlier draft claimed the whole package for the duration, which would have blocked the `db`
track from the seven row shapes it owes. `planning/feature_contract-modules_2026-08-29.md`
splits the package by owner instead, and this track holds exactly one file: `endpoints.ts`.
That gate ran on 2026-08-29 and is complete.

**One line of `index.ts` is still this track's to write**, and the gate's own plan said
otherwise. `endpoints.ts` ships empty — comment only, no marker export — which means it is not
a module and `index.ts` cannot re-export from it yet. So the first shape that lands here also
adds `export * from './endpoints.ts';` to `index.ts`. One line, one time, at a known place: if
`main` is mid-edit on that file, append rather than merge blind, the same rule this plan
already applies to `vitest.config.ts`.

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

## Review History

**v1 reviewed 2026-08-29 — implementable with fixes.** Six criticals, all taken: the route table
written rather than promised, the error shape designed, `runner_jobs` specified in full, the
three remaining verifiers given mechanisms, Phase 4 written as a sequence so no arithmetic
crosses §6.7, and the runner isolation extended past `--network none` to the limits that stop a
fork bomb and a disk fill. `xpSources` was declined and returned to the engine.

**v2 reviewed 2026-08-29 — implementable with fixes.** Three findings. `vitest.config.ts` was
acknowledged in Track discipline but missing from the file set, which is the list the
disjointness check actually reads — added. The `?now` query parameter got a ruling rather than a
schema: it is gone, because a client that supplies the date can skip its own spaced repetition.

The job-status mapping was taken but not as suggested. The review proposed collapsing `killed`
into `failed` or `timed-out`; `JobState` instead carries all six states, because running out of
memory and being wrong are different things to tell a learner, and only `claimed → running` is a
genuine storage detail the client has no use for.

**v3 reviewed 2026-08-29 — implementable with fixes.** Both criticals taken. The route table
said five job states while the mapping table below it said six, which would have typed the
contract without `killed`; it now says six. `/api/tome` was returning "unlocked state", which is
progress on a content route — the §6.7 mixing this plan spends a section refusing elsewhere —
and now returns concepts only.

`git-signal`'s missing surface was real and the suggested fix was not taken. Rather than a new
route, every verifier resolves through `POST /submit`, with `SubmitRequest` a discriminated
union on `verifier.type`: which verifier runs is a property of the quest, not of the URL the
client chose, and one Submit route is also what lets the button say Submit on every quest.

Three more taken as offered: `JournalEntry` given a real shape, Phase 4 extended so failed,
timed-out and killed outcomes each write an `attempts` row and stop, and `runner_jobs.payload`
constrained to code plus identifiers. That last one was the sharpest finding in three rounds —
"the verifier spec" would have put hidden tests in Postgres, breaking §6.7 and making every
queued job a stale copy of a file that lives in git.

**v4 reviewed 2026-08-29 — implementable, one clarification.** All six v3 findings confirmed
resolved. Two taken: `progress.ts` types `runner_jobs` in storage states while `endpoints.ts`
owns the client-facing `JobState`, which stops the two tracks picking different vocabularies for
one table from opposite sides; and `/api/signoffs` is stated household-wide, because a queue
filtered to what the caller can grant would hide the parent's own teach-back from the screen
that exists to show it.

Three minors left as they are. Naming composite payload types for `/campaign` and
`/areas/:area` is real but is work Phase 1 does when it writes them rather than a decision this
plan owes. The `vitest.config.ts` note is already moot — Wave 3 made the alias map derive itself
and no track lists that file for an alias any more.

---

## Status

**Stopped at Phase 3, deliberately.** Phases 1, 2 and 4 are done and proven; two of the four
verifiers are not built, because both need the Gitea work this plan already lists as a
prerequisite. The plan stays in `in-progress/` and the `api` track stays held.

### Outcomes

**Phase 1 — the contract's endpoint half, then the skeleton. Done.**

`packages/contract/src/endpoints.ts` carries the thirteen routes, the request bodies, the six-state
`JobState`, the composite views and one error shape with nine codes; `index.ts` gained its one
re-export line. Thirty-three tests pin the rulings rather than the schemas — that there is exactly
one Submit route, that no path or query names a clock, that `killed` did not collapse into
`failed`, that a `tests` path cannot ride out on a quest payload.

`apps/api` boots by validating the whole content root through `checkContent` and refuses to start
otherwise, with the offending file named. Nine tests, including one proving that a `..` in a
content-relative read is refused rather than normalised.

Eleven of the thirteen routes are served, against the real content root and a real Postgres:
`/campaign`, `/areas/:area`, `/quests/:questId`, `/submit`, `/jobs/:jobId`, `/defend` (both),
`/party`, `/tome`, and both `/signoffs`.

**Phase 2 — the runner. Done, and attacked.**

`apps/runner` is four Python modules and twenty-nine tests that run **inside the runner container**,
because `resource` is POSIX-only and because three of the limits are the container's:
`docker compose --profile api run --rm runner-tests`. Every attack the plan names is executed for
real — a socket, a name lookup, a gigabyte, an unbounded list, `while True:`, a program that
ignores every catchable signal, a fork bomb, two hundred subprocesses, a disk fill, unbounded
printing — plus a write to `/usr/local/lib`, a read of the worker's environment, and `os.getuid()`.

The image is built and pinned, runs as uid 10001 on a read-only root with `cap_drop: ALL` and
`no-new-privileges`, and the per-job workspace is on tmpfs and removed unconditionally.

**Phase 3 — `peer-signoff` only.** Submit records an attempt awaiting a person, `GET /api/signoffs`
is the household-wide queue, and `POST /api/signoffs/:attemptId` enforces that the approver is not
the submitter and holds the role the quest's `by` field names — a role check against `player_roles`,
never a name check.

**Phase 4 — awarding. Done for both verifiers that run.**

Every runner outcome writes an `attempts` row; `failed`, `timed-out` and `killed` each write
`passed = false` and stop. `medalDelta` prices the medal and exactly its return value is stored.
`nextRung` walks the ladder and the api stores what it returns. No total is written anywhere.

**The loop closes.** `npm run e2e --workspace @pyquest/api` submits real code through the real api
into a real Postgres, hands it to the real runner container with no network and a read-only root,
and gets back a `passed` job and one `cleared` medal priced at exactly `medalDelta`'s ten XP.

**Verification.** `npm run typecheck` clean. `npx vitest run` — 505 tests across 27 files, up from
361 across 18 (105 are this track's; the rest arrived from `spa`). `npm run validate:content` clean.
`ruff check`, `ruff format --check` and `pyright --strict` all clean on `apps/runner`.

### What is not built, and why

- **`git-signal` and `local-repo`.** Both read the player's Gitea repository over its API, and
  `planning/backlog/feature_gitea-lan-access-for-the-son_2026-08-27.md` is not done. `POST /submit`
  refuses them with a stated reason rather than recording a scar for a verifier that never ran — a
  false entry in the one record §3.5 says is never edited would be worse than a refusal.
- **`GET` and `POST /journal`.** Blocked by
  `planning/backlog/feature_journal-text-has-no-column_2026-08-29.md`. The shapes are typed in
  `endpoints.ts` so the SPA is not held up; the routes are not registered, and the 404 they produce
  carries the same error shape as everything else.
- **The `api` compose service does not start on a Windows host.** Diagnosed, documented in
  `infra/compose/api.yml`, not fixed. `npm install` on Windows writes the workspace links in
  `pyquest/node_modules/@pyquest/*` as absolute Docker-VM paths, which do not resolve inside a
  container mounting only `/workspace`. `migrate.yml` and `web.yml` mount the same workspace and run
  the same command, so all three share the bug and the fix is one decision across three tracks'
  files: give the node services a Dockerfile that installs for Linux, as `apps/runner` already does.

### Deviations

- **`packages/db` has no writers, so the api's SQL lives in `apps/api/src/store.ts`.** Phase 4 says
  "every write goes through the repository layer"; that layer is twelve `SELECT`s and belongs to the
  `db` track, which this one may not edit. The seam the rule protects still exists — nothing above
  `store.ts` knows a column name — and the move is a rename plus an import when `db` adopts it. What
  the rule actually guards is unchanged: the engine decides and the api records.
- **The runner reaches the queue through a spool volume, not a database connection.** `--network
  none` at the container and "the runner polls `runner_jobs`" cannot both be true. The isolation is
  the half this plan spends a section defending, so the handoff moved: the api claims the row with
  `FOR UPDATE SKIP LOCKED` and writes it into a shared volume, and the runner — which cannot resolve
  a hostname — picks it up. The queue is still the table and the api is still the only process
  holding a database connection.
- **`vitest.config.ts` took one appended `projects` entry**, as coordinated. The file was re-read
  immediately before the edit and was unchanged.
- **`packages/contract/tests/endpoints.test.ts` is new**, and the plan's file list did not name it.
  It is the test for the one file this track owns in that package and collides with nothing.
- **`apps/api/tests/support/database.ts` duplicates `packages/db/tests/support/scratch-db.ts`.**
  Reaching into another track's test internals by relative path is the coupling the split exists to
  prevent; sixty lines of overlap is the cheaper of the two.
- **`api.yml` gained a `runner-tests` service and a named `runner_spool` volume**, and the runner
  gained a `Dockerfile`. `--network none` makes `pip install` at runtime impossible, so pytest is
  baked into the image.
- **`RLIMIT_CPU` is set soft and hard one second apart** rather than equal — see Lessons.

### Mutants that survived their first pass

Twenty-seven seeded; three survived, all three because a *test* was wrong rather than the code.

1. **`nextRung(rung, repelled)` replaced by `repelled ? rung + 1 : 0`** — survived the whole server
   suite. The fixture seeded rung 1, where the ladder and the naive version agree on both answers.
   Reseeded at rung 3, where a miss steps back to 2 and the naive version resets to zero, which is
   §5.4's entire argument; a top-rung test was added for the clamp. The mutant now dies twice.
2. **`medalDelta(dc, held, 'cleared')` replaced by `dc * 2`** — survived in both the dispatcher and
   the sign-off suite. On a quest with no medals held those are the same number. Both suites gained
   a case with Ironman already held, where the delta is zero and `dc * 2` is not — which is also
   §5.10's "pays the difference, once" and its zero-payout-reads-as-a-brag case.
3. **`RLIMIT_NPROC` removed** — caught, but not cleanly. The fork bomb takes the test container down
   and the suite never reports at all, rather than one test going red. That is itself the
   demonstration: without the limit, the bomb reaches the worker. Recorded rather than papered over.

### Lessons Learned

- **Three of the runner's tests were wrong before the code was.** `RLIMIT_CPU` with soft and hard
  equal made every busy loop an anonymous `SIGKILL`, reported as `killed` — telling a learner his
  program ran out of room when what it did was not finish. The fix is a one-second gap so `SIGXCPU`
  is delivered and readable, plus measuring the child's actual CPU time so a hard-limit kill can be
  told from the OOM killer. Found by the test that ignores every catchable signal.
- **The §6.3 leak test grepped for a string the brief publishes on purpose.** `Welcome, Steve!` is
  in the specification, because the specification is meant to be readable; only the assertions are
  secret. A leak test that cannot tell those apart fails on correct content. It now greps for the
  hidden test file's own source.
- **A leak test that runs against a passing job proves nothing.** The failing fixture printed the
  exact line the hidden test asserts on, so pytest reported one pass and the assertions were reading
  output from a run that never produced a traceback.
- **Everything was green and the api would not boot.** Node's `--experimental-strip-types` refuses a
  TypeScript parameter property, which no typecheck and no vitest run can see because both go
  through a real compiler. That is the whole argument for `scripts/e2e.ts`.
- **The per-job workspace was on the spool volume.** A submission filling it would have been filling
  a disk the api shares — the disk fill the tmpfs exists to contain — and on a Windows bind mount
  pytest's output capture could not even run. Both found by the end-to-end run, neither by a suite.
- **`AreaIdentity` requires `weeks` and `blurb`; `area-0.yml` and `area-2.yml` carry neither.** The
  map would not render at all under a strict reading. `AreaCard.identity` is optional, which is what
  `payloads.ts` already ruled: an area without them has no identity to send.
- **`medalDelta` has no boss variant.** §5.1 prices a boss at 20×DC and `xpFor('boss', dc)` exists,
  but `medalDelta` calls `xpFor('quest', ...)` unconditionally — so a boss sign-off pays quest rates.
  The api calls `medalDelta` as instructed and does not correct it, because correcting it here would
  be the api doing engine arithmetic. **This is an engine bug and it belongs to the engine's
  successor plan.**
