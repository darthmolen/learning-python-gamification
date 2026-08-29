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
`@pyquest/contract`" was not a criterion that could be met; there is no list to implement
against. Three things have to be added here, and the SPA is waiting on all three because its
stubs are typed against whatever this becomes:

- **The route table.** Which path returns `AvailableQuests`, which returns `Standings`, and
  what a screen's worth of data costs in requests. The Party screen alone wants standings,
  XP sources and bounties.
- **Request bodies.** Submit is the one that matters: quest id, player id, and the code
  itself. Nothing in the contract describes it today.
- **One error shape, used everywhere.** A verifier that fails, a quest that does not exist and
  a runner that timed out are three different failures, and the SPA has to tell them apart to
  say anything useful. Inventing this per endpoint is how a client ends up parsing strings.

**`xpSources` may land here.** The contract ships its shape with no implementation behind it;
the engine plan left open whether the projection belongs to the engine or the API and said it
was a call for whoever arrived first. This plan arrives first. If it lands here, note that it
is a pure projection over completions and the engine is the more natural home — the API doing
arithmetic over medals is the seam §6.7 draws, crossed.

**The API serves the SPA in production** (§6.1) and reads content from git on boot,
zod-validated on load (§6.10). Content is immutable at runtime; the authoring path is the
CLI, not an endpoint.

**Verifiers, in the order they become necessary.**

*`hidden-tests`* — Submit posts code, the API enqueues a `runner_jobs` row, the runner
executes the quest's pytest specification, the API awards XP. §6.3's whole point: anything
shipped to the browser is readable, so the tests live only here.

*`local-repo`* — the API pulls his Gitea repository into `/workspaces/<username>/` and runs
the quest's specification against it (§6.4). Needs the Gitea LAN work in
`planning/backlog/feature_gitea-lan-access-for-the-son_2026-08-27.md` before it can be
tested with his machine.

*`peer-signoff`* — someone other than the submitter presses the button, `by` naming a role
(`peer` or `dm`), never a person.

*`git-signal`* — reads his log for commits, pushes, tags and journal entries.

**The runner (§6.6).** v1 is a subprocess inside the runner container with `--network
none`, a ten-second wall timeout, and memory capped at both the container and `RLIMIT_AS`.
The queue is a `runner_jobs` table — no new infrastructure, and swapping to an ephemeral
container per job later touches only the worker.

**Its columns are undefined in both plans.** `feature_progress-schema` lists `runner_jobs` as
"the queue the API and runner share" and stops, because the queue's shape is a consequence of
how Submit works rather than of anything the schema knows. This plan is the one that knows, so
it specifies the columns and the db plan implements them — settled in one place, in that
order, rather than guessed at twice.

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

Integration test asserts a bad content root fails startup loudly rather than serving a
half-campaign.

### Phase 2 — the runner and `hidden-tests`

The container, the queue, the caps, and the attack tests above. Then Submit end to end.

### Phase 3 — the remaining verifiers

`peer-signoff` and `git-signal` first (no runner needed), then `local-repo` once Gitea is
reachable from his laptop.

### Phase 4 — awarding

Attempts recorded, medals written at the delta §5.10 prices, invasion rungs advanced.
Every write goes through the repository layer; the engine decides, the API records.

## Dependencies / Prerequisites

- `planning/completed/feature_engine-query-layer_2026-08-28.md` — **done**. The query layer
  and the payload half of the contract
- `planning/feature_progress-schema_2026-08-28.md` — somewhere to write. In review as of
  2026-08-29; this plan owes it the `runner_jobs` columns
- Gitea reachable from the son's machine, for `local-repo` only

## Files Expected to Change

- `pyquest/apps/api/**` — new
- `pyquest/apps/runner/**` — new, and Python: ruff and pyright clean
- `pyquest/packages/contract/**` — the route table, request bodies and error shape. **Shared:
  see Track discipline**
- `infra/compose/api.yml` — the `api` and `runner` services; this track owns the file,
  and the root `docker-compose.yml` is not the place

## Track discipline

**This plan edits `packages/contract`, which the engine plan handed to `main` on completion.**
That was written when nothing else was expected to touch it; the endpoint half has to live
somewhere, and the API is the only track that knows what the routes are.

So: the `api` track holds `packages/contract` for the duration, and the rule the engine plan
set still holds for everyone else — `spa` and `db` consume it and do not edit it. The
alternative, batching contract edits through `main`, would put a round trip between the SPA
and every route it is waiting on, which is worse for the same risk.

`apps/api` and `apps/runner` are leaves that nothing imports, so this track needs no line in
the root `tsconfig.json` or `vitest.config.ts`. `infra/compose/api.yml` is this track's; the
root `docker-compose.yml` is not to be edited here.

## Out of Scope

Anything a screen renders. The API returns the contract's shapes and stops; the DC warning
threshold, the `~`, and a zero payout reading as "brag" are all the UI's.
