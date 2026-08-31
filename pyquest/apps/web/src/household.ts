/**
 * Who the app is, until it can ask.
 *
 * Kitchen Table mode is one household (§5.11) and the seats are roles rather than people, so
 * there is exactly one player to be and no screen for choosing. These are the ids of the two
 * seats in the development household created by `packages/db/src/seed.ts`.
 *
 * **They are uuids, and that is load-bearing.** `PLAYER_ID` read `'peer'` for the whole life of
 * the gateway — the name of the seat rather than an id. `playerFor` in `apps/api/src/server.ts`
 * rejects any non-uuid *before* it looks in the database, so every player-scoped screen answered
 * 404 against a live api: map, area, quest, defend, party. Nothing caught it, because the
 * fixtures answer to any string at all and there was no seeded household to be live against.
 *
 * They live here rather than in the gateway because the fixtures need them too, and the gateway
 * imports the fixtures — putting them there would be a cycle. Both sides answering with the same
 * id is what stops "who am I" becoming a ninth entry in the ledger of ways the fixtures and the
 * api disagree.
 *
 * This module goes when `planning/feature_accounts-and-auth_2026-08-30.md` lands and a real
 * player can be named.
 */

/** The `peer` seat — the one every request is made as. */
export const PLAYER_ID = '5eed0000-0000-4000-8000-000000000001';

/** The `dm` seat. Present so a sign-off has somebody other than the submitter to come from. */
export const DM_ID = '5eed0000-0000-4000-8000-000000000002';
