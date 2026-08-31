# The Stack Runs End To End

**Status:** Complete
**Track:** infra
**Date:** 2026-08-31
**Author:** Claude (Opus 5)
**Lane:** A

## Objective

Make one command bring up Postgres, the API and the SPA with the browser actually talking to
the API — and put the production build in a gate, so the path that has broken twice cannot
break silently a third time.

## Why this exists

**The web container has never talked to the API.** `VITE_API_URL` is set nowhere in
`infra/`, and `apps/web/src/gateway/index.ts` falls back to fixtures when it is absent. That
fallback is deliberate and should stay — it is how the app runs offline — but it means the two
halves of this application have never once been connected. Everything anybody has looked at in
a browser has been a fixture.

**And `vite build` is in no gate.** This is the last unanswered line on the Wave 3 board and
the only one with a demonstrated failure rate. `vitest.config.ts` aliases `@pyquest/content` to
`src/`, so the suite never touches `dist/` and cannot see a packaging break. It has already
cost one silent runtime error in the dev server and one failed deploy — the Field Manual's
build broke in public while both its gates were green. **The pattern is not "a test was
missing"; it is that the tests run against source and nothing runs the build.**
`planning/reminders/decide_vite-build-goes-in-a-gate_2026-08-31.md` is the open question this
plan answers.

## Success Criteria

- [ ] One documented command brings up postgres, api and web together
- [ ] **The SPA in that stack fetches from the API rather than from fixtures**, proven by a
      request in the network log or a value on screen that exists only in the database
- [ ] The fixture fallback still works with the stack down — `npm run dev` alone must keep
      answering from fixtures, because that is how the SPA is developed
- [ ] `CONTENT_ROOT` reaches the api correctly under the two-tree layout, `curriculum/` and
      `game/` both mounted read-only
- [ ] **`vite build` runs in CI**, and a deliberately broken import fails it
- [ ] `infra/README.md` says how to run it, in the order a person types it
- [ ] Full suite green, typecheck clean

## Approach

**Set `VITE_API_URL` in `infra/compose/web.yml`, and nowhere else.** Not in a committed `.env`,
not as a default in the gateway. The gateway's rule — *absent means fixtures* — is what keeps
offline development working, and the compose file is the one place where "the API is up" is
actually true.

The value has to be the address **the browser** can reach, not the address the container can.
`http://api:3081` resolves inside the compose network and means nothing to Chrome on the host.
This is the mistake to expect: `http://localhost:${API_PORT:-3081}`.

**Confirm CORS before assuming it.** The browser will be on 3082 and the API on 3081, which is
cross-origin. If Fastify is not configured for it, every request fails in a way that looks like
the API being down. Check before wiring; if it needs a plugin, that is part of this plan.

**Put the build in CI rather than in vitest.** The alias that hides packaging breaks is correct
for the test suite and should not change — the fix is a step that runs `vite build` and
`tsc -b`, not a test that reaches into `dist/`. Two candidate homes: extend the existing Field
Manual workflow, or add a small `build` workflow. **Prefer a separate workflow**: the Field
Manual one is deliberately narrow and its own header warns it "should not quietly grow into a
general CI pipeline."

## Phases

### Phase 1 — the wiring
`VITE_API_URL` in `web.yml`, CORS if needed, and the api profile brought up beside web. Verify
by loading a page and watching a real request.

### Phase 2 — prove the fallback survives
A run with the stack down, confirming fixtures still answer. This is the regression the wiring
could cause, and it is the one that would be discovered at the worst moment — on a train, with
no database.

### Phase 3 — the build gate
A workflow that runs `npm ci`, `tsc -b`, and `vite build` for the SPA. Then, per
`test-filter-development`, **break an import on purpose and confirm the gate fails.** A build
step nobody has watched fail is the same kind of nothing as a test nobody has watched fail.

### Phase 4 — write it down
`infra/README.md`: the command, the ports, what to expect, and what "it shows fixtures" means
when you were expecting live data.

## Dependencies / Prerequisites

- Postgres up and migrated. It is.
- **A seeded household makes Phase 1 much easier to verify** —
  `planning/in-progress/feature_seed-a-test-household_2026-08-31.md`, running in parallel on the
  `db` track. Not a hard dependency: an empty database still proves the browser reached the API,
  because an empty campaign and a failed fetch look different. If the seed lands first, use it.

## Files Expected to Change

- `infra/compose/web.yml` — `VITE_API_URL`. **Ownership taken from the `spa` track on
  2026-08-31**, recorded there: that track created the service and is finished with it, and
  what is left to do to the file is wiring rather than SPA work. Without the transfer these two
  plans could not run in parallel, which is the rule the transfer exists to honour rather than
  to dodge
- `infra/compose/api.yml` — only if CORS or the content mount needs it
- `infra/README.md` — how to run the stack
- `.github/workflows/build.yml` — new, the build gate
- `pyquest/apps/api/src/server.ts` — **only** if CORS requires a plugin, and if so that is the
  one file this track touches under `pyquest/`

**Disjoint from the `db` track**, which owns `packages/db/**` and two test files. If CORS turns
out to need `server.ts`, that is still disjoint — the `db` track's api file is a new test.

## Out of Scope

- The integration suite. This plan makes the stack runnable; driving a browser through it is
  `planning/backlog/feature_integration-suite_2026-08-30.md`.
- Authentication. The stack runs for one household on one machine; who may connect is
  `planning/feature_accounts-and-auth_2026-08-30.md`.
- Production hosting. §6.4 puts the API on the parent's machine, and that is still the design.
- Pyodide, Run and Submit. Read-only end-to-end is this plan's bar; the SPA plan owns the rest.

---

## Status — 2026-08-31, complete

**All four phases are done. The wiring is in, and both gates have been watched failing.**

Three defects were found on the way, and two of them were in the very thing this plan was
adding to.

### What was delivered

| Phase | State | Where |
|---|---|---|
| 1 — the wiring | done | `infra/compose/web.yml`, `pyquest/apps/api/src/server.ts` |
| 2 — the fallback survives | done, measured with the api process killed | — |
| 3 — the build gate | done, mutant confirmed | `.github/workflows/build.yml` |
| 4 — write it down | done | `infra/README.md` |

### Success criteria

- [x] One documented command brings up postgres, api and web together
- [x] **The SPA fetches from the API rather than from fixtures.** Proven by loading the real
      `apps/web/src/gateway/index.ts` through Vite — same resolution, same `import.meta.env`
      injection the browser gets — and calling it against the live api. `getTome()` returned
      **8 areas** and `getSignoffs()` **0 rows** (a real Postgres read of an empty table); the
      same module with `VITE_API_URL` absent returned **3 areas** and **2 rows** from fixtures.
      Two different numbers from the same call is the discriminator, and it is not an assertion
      about what the code ought to do
- [x] The fixture fallback still works with the stack down. The api process was killed outright
      — `curl` to 3081 refused the connection — and all four calls still answered from fixtures
- [x] `CONTENT_ROOT` reaches the api under the two-tree layout. Booted against the repository
      root: `content loaded {items: 23, areas: 8}`, `curriculum/` and `game/` both resolved
- [x] **`vite build` runs in CI, and a deliberately broken import fails it**
- [x] `infra/README.md` says how to run it, in the order a person types it
- [x] Full suite green (**47 files, 750 tests**), typecheck clean

### The three defects

**1. `web.yml` published a port nothing was listening on.** The service set `HOST: "0.0.0.0"`
and mapped `3082:3082`. Vite 6.4.3 reads neither `HOST` nor `PORT` from the environment — there
is no such read anywhere in its `dist` — and `vite.config.ts` pins `port: 5173` with
`strictPort`. So the container would have bound `127.0.0.1:5173` and the mapping would have
published nothing. **This service has never started successfully**, which is consistent with the
plan's own observation that everything anyone has looked at has been a fixture. Fixed with
`--host 0.0.0.0 --port 3082` on the command line, where the flags actually take effect.

**2. There was no CORS, and it needed no plugin.** 3082 to 3081 is cross-origin and the
Console's sign-off `POST` sends `content-type: application/json`, which preflights. Rather than
add `@fastify/cors` — a dependency change touching `package.json` and the shared lockfile while
another track was working in the tree — `server.ts` grew a `corsOrigin` function and one
`onRequest` hook, about thirty lines. The allowance is loopback, the RFC 1918 ranges and
`*.local`, which is exactly the set §6.4 makes reachable: `localhost` alone would break the day
the son opens the Console on his own laptop, and `*` would let any page he happens to be reading
fetch the household's progress with his browser. Observed over HTTP: `access-control-allow-origin:
http://localhost:3082` echoed on a `GET`, a `204` preflight carrying the methods and headers, and
no allow-origin header at all for `https://evil.example.com`.

**3. `tsc -b` builds no application code, and only the mutant found it.** The plan specified
`tsc -b` for the gate. Root `tsconfig.json` references exactly four projects — `content`,
`contract`, `db`, `engine` — and **no app**. A broken import seeded into `apps/api/src/server.ts`
left `npx tsc -b --pretty` printing nothing and exiting **0**. The same tree under `npm run
typecheck` exited **2** with `src/server.ts(81,62): error TS2307`. The workflow calls
`npm run typecheck`, and the header records the measurement.

This would have been the sixth green-but-blind gate in this repository, and it is precisely the
one the plan was written to prevent. It was not found by reading the config; it was found by
breaking something and being surprised.

### The mutants

| Gate | Mutant | Result |
|---|---|---|
| typecheck | `from './views-that-do-not-exist.ts'` in `apps/api/src/server.ts` | `tsc -b` **exit 0 — blind**; `npm run typecheck` exit 2. Restored byte-identical |
| `vite build` | `@pyquest/contract` → `@pyquest/contract-does-not-exist`, injected into the gateway at transform time by a temporary config | exit **1**, rollup `handleInvalidResolvedId`. Clean build exits 0 |

The `vite build` mutant was injected through a throwaway `--config` rather than by editing a
file, because `apps/web/src/` belongs to another track. It is a real broken import in the real
module graph; nothing tracked was touched, and the temporary config was deleted in the same
command that ran it.

### Deviations

- **`npm run typecheck`, not `tsc -b`.** Forced by defect 3. The narrower fix is to add `apps/*`
  to root `tsconfig.json`'s references, and that file belongs to no track and is named by no plan
  in flight — so this workflow calls the script that is already correct rather than editing a
  shared file from the side. **The backlog item below is the real fix.**
- **The gate does not run `vitest`.** `apps/api`'s suites throw `no database: start the stack`
  without Postgres, so a bare `vitest run` on a hosted runner fails for a reason that is not a
  regression. A service container is the answer and it belongs to whoever owns the api suite.
- **`web.yml` gained a command change as well as an environment variable.** Defect 1 was found
  while wiring the environment variable and is in the same file; leaving it would have shipped
  `VITE_API_URL` into a service that cannot start.

### Not done, and it is not this plan's to do

**`PLAYER_ID = 'peer'` in `apps/web/src/gateway/index.ts` is not a UUID, and the api requires
one.** `playerFor` rejects anything that does not match the UUID pattern before it looks in the
database, so **every player-scoped screen 404s against the live api** — `/api/players/peer/campaign`
answered 404, observed. The `db` track's seed uses fixed UUIDs, so this does not resolve itself
when the seed lands. It is one constant in a file this track must not touch. Backlog item below.

Also observed and left alone: the fixture Tome has **3** areas where content has **8**. Nothing
compares the two, which is the disagreement the `db` track's plan predicted would be hiding
somewhere.

### Lessons Learned

- **The mutant was worth more than the gate.** Both gates passed before the mutants and one of
  them was measuring nothing. Reading `tsconfig.json` would have shown four references and no
  apps, and it would not have felt like a finding; watching `tsc -b` exit 0 on a nonexistent
  import did.
- **A wire that was never connected fails silently at both ends.** `web.yml` had a port mapping,
  a host binding and a plausible comment, and none of the three did anything. It looked
  configured. The tell was that nobody could name a time it had run.
- **Fixture fallback is invisible until you can see both numbers.** "It renders" proves nothing
  about which side answered. Two different area counts from the same call proves it in one line,
  and that comparison should be the shape of the integration suite when it is written.

### Backlog Items Created

- `planning/backlog/feature_spa-player-id-is-not-a-uuid_2026-08-31.md` — the gateway's
  `PLAYER_ID`, and where the SPA learns which player it is
- `planning/backlog/feature_root-tsconfig-omits-the-apps_2026-08-31.md` — add `apps/*` to the
  root references so `tsc -b` means what everyone reads it to mean
- `planning/backlog/feature_node-services-need-a-linux-dockerfile_2026-08-31.md` — the Windows
  symlink gap that keeps `api`, `web` and `migrate` from starting in containers at all
