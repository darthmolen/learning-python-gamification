# The Stack Runs End To End

**Status:** In Progress
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
