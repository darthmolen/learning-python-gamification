# The SPA's Player Id Is Not A UUID

**Status:** Backlog
**Track:** spa
**Date:** 2026-08-31
**Author:** Claude (Opus 5)
**Lane:** A
**Found by:** `planning/completed/feature_the-stack-runs-end-to-end_2026-08-31.md`

## Objective

Let the SPA name a player the api will accept, so the player-scoped screens show something
against a live stack.

## Why this exists

`apps/web/src/gateway/index.ts` ends with:

```ts
export const PLAYER_ID = 'peer';
```

`playerFor` in `apps/api/src/server.ts` rejects anything that is not a UUID **before** it looks
in the database:

```ts
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-.../i.test(playerId)) throw notFound(`player ${playerId}`);
```

So every player-scoped route 404s. Observed 2026-08-31 by driving the real gateway module
against the live api: `/api/players/peer/campaign answered 404`, `/api/players/peer/party
answered 404`, while `getTome()` — the one route that is not player-scoped — returned all eight
areas. **The wiring is fine; the identifier is not.**

**Seeding does not fix this.** The `db` track's seed uses fixed UUIDs, so the row exists and the
SPA still asks for `peer`. The two halves were built against a contract that never said which
form a player id takes, and each picked a reasonable one.

`peer` is not a name at all, incidentally — it is a *role* (CLAUDE.md's lexicon: `peer` / `dm`,
and "roles are not people"). A constant that holds a role where the api wants an identity is the
shape of the confusion, not a typo.

## Success Criteria

- [ ] The Map, the Area screen, the Quest screen and the Party screen render against a live,
      seeded api
- [ ] The SPA does not hardcode a UUID either — a literal from the seed script is the same bug
      with a different constant, and it breaks the moment a household is seeded differently
- [ ] Whatever answers "who am I" is one place, not one per screen
- [ ] The fixture path still works with no api, unchanged

## Approach — options, not a decision

1. **The api resolves a handle.** `/api/players/peer/...` where `peer` is a `players.handle`.
   Smallest change to the SPA, and handles are already unique and already how Gitea names
   people. It widens the api's identifier surface, which the auth plan may want to narrow again.
2. **An endpoint that says who is playing.** `GET /api/me`, or a household roster the SPA reads
   at boot and picks from. Honest about Kitchen Table mode being one household with two seats,
   and it is the shape the Console needs anyway to switch between them.
3. **Configuration.** `VITE_PLAYER_ID` beside `VITE_API_URL`. Cheapest, and it puts an identity
   in a build-time variable, which is exactly where it will be forgotten.

Option 2 is probably right and is the most work. It also overlaps
`planning/feature_accounts-and-auth_2026-08-30.md`, which should be read before choosing — this
is the first half of the identity question that plan owns, arriving early because a screen
needs it.

## Dependencies / Prerequisites

- A seeded household — `packages/db`'s seed, landed 2026-08-31

## Files Expected to Change

- `pyquest/apps/web/src/gateway/index.ts`
- `pyquest/apps/api/src/server.ts` and `packages/contract/src/endpoints.ts`, under options 1 or 2

## Out of Scope

- Authentication. `:playerId` is an assertion and not a credential, and this item does not
  change that — it only makes the assertion one the api can parse.
