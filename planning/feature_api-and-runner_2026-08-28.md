# The API and the Runner

**Status:** Planned
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

- [ ] Every endpoint in `@pyquest/contract`, typed against it, no shape invented here
- [ ] All four verifiers: `hidden-tests`, `local-repo`, `peer-signoff`, `git-signal` (§6.3)
- [ ] The runner refuses network access, exceeds neither its CPU nor memory cap, and dies
      at ten seconds — each **proven by a test that tries** (§6.6)
- [ ] Integration tests against the real compose stack. Nothing that mocks the database or
      the runner counts
- [ ] Hidden tests never reach the client, asserted by a test that greps the response

## Approach

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

The security properties are the tests. Write a job that opens a socket and assert it
fails. Write one that allocates a gigabyte and assert it is killed. Write `while True:`
and assert it dies at ten seconds, not eleven. A boundary you have not attacked is a
boundary you have assumed.

## Phases

### Phase 1 — skeleton and content loading
Fastify, health, content loaded and validated on boot, contract types wired. Integration
test asserts a bad content root fails startup loudly rather than serving a half-campaign.

### Phase 2 — the runner and `hidden-tests`
The container, the queue, the caps, and the attack tests above. Then Submit end to end.

### Phase 3 — the remaining verifiers
`peer-signoff` and `git-signal` first (no runner needed), then `local-repo` once Gitea is
reachable from his laptop.

### Phase 4 — awarding
Attempts recorded, medals written at the delta §5.10 prices, invasion rungs advanced.
Every write goes through the repository layer; the engine decides, the API records.

## Dependencies / Prerequisites

- `planning/feature_engine-query-layer_2026-08-28.md` — the shapes
- `planning/feature_progress-schema_2026-08-28.md` — somewhere to write
- Gitea reachable from the son's machine, for `local-repo` only

## Files Expected to Change

- `pyquest/apps/api/**` — new
- `pyquest/apps/runner/**` — new
- `infra/docker-compose.yml` — `api` and `runner` services

## Out of Scope

Anything a screen renders. The API returns the contract's shapes and stops; the DC warning
threshold, the `~`, and a zero payout reading as "brag" are all the UI's.
