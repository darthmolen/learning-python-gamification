/**
 * The seeded household, checked against the states it exists to produce.
 *
 * This suite is not "does the script run". It is the list of things a fixture has to be true of
 * before anybody can trust a screen drawn from it: two seats rather than one, a campaign with an
 * origin, four different area states, medals on more than one rung, a review queue that is
 * actually overdue, and every date computed from `now` rather than typed in.
 *
 * **The dates are the part worth writing a test for.** A fixture with literal dates passes on the
 * afternoon it is written and is wrong a fortnight later — the reviews stop being overdue, the
 * campaign is suddenly in week 14, and nothing fails. So two of the tests below seed the same
 * household at two different `now`s and assert the rows moved with it.
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { checkContent, contentRootsFrom, type ContentItem } from '@pyquest/content';
import { fileURLToPath } from 'node:url';
import {
  CAMPAIGN_START_OFFSET_DAYS,
  SEEDED_PLAYERS,
  clearedByArea,
  resetHousehold,
  seedHousehold,
} from '../src/seed.ts';
import { useMigratedDatabase } from './support/migrated-db.ts';
import { HAVE_DATABASE } from './support/scratch-db.ts';

if (!HAVE_DATABASE) {
  throw new Error('no database: start the stack, or set TEST_DATABASE_URL');
}

/** The real corpus, not a stand-in. A renamed quest must break this suite. */
const ITEMS: readonly ContentItem[] = checkContent(
  contentRootsFrom(fileURLToPath(new URL('../../../..', import.meta.url))),
).items;

/** Pinned, so every assertion below is arithmetic rather than a race with the wall clock. */
const NOW = new Date('2026-08-31T09:00:00.000Z');
/** A different `now`, eleven days later, for the "the dates move" tests. */
const LATER = new Date('2026-09-11T09:00:00.000Z');

const scratch = useMigratedDatabase('seed');

const count = async (table: string): Promise<number> => {
  const { rows } = await scratch().client.query(`SELECT count(*)::int AS n FROM ${table}`);
  return (rows[0] as { n: number }).n;
};

const one = async <T>(sql: string, values?: unknown[]): Promise<T> => {
  const { rows } = await scratch().client.query(sql, values);
  return rows[0] as T;
};

beforeAll(async () => {
  await seedHousehold(scratch().client, { now: NOW, items: ITEMS });
}, 60_000);

/* -------------------------------------------------------------------------------------------
 * The seats
 * ----------------------------------------------------------------------------------------- */

describe('the household', () => {
  it('seats two players, because peer sign-off needs somebody who is not the submitter', async () => {
    expect(await count('players')).toBe(2);

    const { rows } = await scratch().client.query(
      `SELECT p.id::text AS id,
              p.handle::text AS handle,
              ARRAY(SELECT r.role FROM player_roles r WHERE r.player_id = p.id ORDER BY r.role) AS roles
         FROM players p ORDER BY p.handle`,
    );

    expect(rows).toEqual([
      { id: SEEDED_PLAYERS.dm.id, handle: 'dm', roles: ['dm', 'player'] },
      { id: SEEDED_PLAYERS.peer.id, handle: 'peer', roles: ['player'] },
    ]);
  });

  it('starts the campaign a fixed number of days before now, never on a literal date', async () => {
    const row = await one<{ days: number }>(
      `SELECT (($1::date) - started_on)::int AS days FROM campaign WHERE id`,
      [NOW.toISOString().slice(0, 10)],
    );
    expect(row.days).toBe(CAMPAIGN_START_OFFSET_DAYS);
  });
});

/* -------------------------------------------------------------------------------------------
 * The four area states — §5.2's boundary is one of them, exactly
 * ----------------------------------------------------------------------------------------- */

describe('progress', () => {
  it('covers cleared, the boss-unlock boundary, one, and untouched', async () => {
    const { rows } = await scratch().client.query(
      `SELECT quest_id AS "questId" FROM quest_medals
        WHERE player_id = $1 AND medal = 'cleared'`,
      [SEEDED_PLAYERS.peer.id],
    );
    const cleared = new Set((rows as { questId: string }[]).map((row) => row.questId));

    const questsIn = (area: number): ContentItem[] =>
      ITEMS.filter((item) => item.kind === 'quest' && item.area === area);
    const clearedIn = (area: number): number =>
      questsIn(area).filter((item) => cleared.has(item.id)).length;

    const areasWithQuests = [
      ...new Set(ITEMS.filter((item) => item.kind === 'quest').map((item) => item.area)),
    ].sort((a, b) => a - b);
    const [first, second, third] = areasWithQuests;
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(third).toBeDefined();

    // Cleared: every authored quest in the area.
    expect(clearedIn(first as number)).toBe(questsIn(first as number).length);
    // The §5.2 threshold, exactly — three of five unlocks the boss and a fourth would not test it.
    expect(clearedIn(second as number)).toBe(3);
    // Started with one. This is the state that caught the Map drawing an area locked at `1 of ~5`.
    expect(clearedIn(third as number)).toBe(1);
    // Untouched: an area with a manifest and nothing done in it.
    expect(clearedIn(7)).toBe(0);
  });

  it('agrees with the plan the seed reports', async () => {
    const byArea = clearedByArea(ITEMS);
    expect(byArea.get(0)?.length).toBeGreaterThan(3);
    expect(byArea.get(1)).toHaveLength(3);
    expect(byArea.get(2)).toHaveLength(1);
    expect(byArea.has(3)).toBe(false);
  });

  it('only ever names quests that exist in content', async () => {
    const ids = new Set(ITEMS.map((item) => item.id));
    const { rows } = await scratch().client.query(
      `SELECT DISTINCT quest_id AS "questId" FROM quest_medals
       UNION SELECT DISTINCT quest_id FROM attempts
       UNION SELECT DISTINCT quest_id FROM datamines`,
    );
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows as { questId: string }[]) expect(ids).toContain(row.questId);
  });

  it('holds medals on more than one rung, so an unheld slot has something to sit beside', async () => {
    const { rows } = await scratch().client.query(
      `SELECT DISTINCT medal FROM quest_medals WHERE player_id = $1 ORDER BY medal`,
      [SEEDED_PLAYERS.peer.id],
    );
    expect((rows as { medal: string }[]).map((row) => row.medal).length).toBeGreaterThan(1);
    expect(rows).toContainEqual({ medal: 'cleared' });
  });

  it('gives the dm progress of their own, so the Party screen has two standings', async () => {
    const row = await one<{ n: number }>(
      `SELECT count(*)::int AS n FROM quest_medals WHERE player_id = $1`,
      [SEEDED_PLAYERS.dm.id],
    );
    expect(row.n).toBeGreaterThan(0);
  });

  it('leaves scars — attempts that did not pass, and a Datamine that follows from them', async () => {
    const scars = await one<{ n: number }>(
      `SELECT count(*)::int AS n FROM attempts WHERE passed = false`,
    );
    expect(scars.n).toBeGreaterThan(0);
    expect(await count('datamines')).toBeGreaterThan(0);
  });
});

/* -------------------------------------------------------------------------------------------
 * The review queue — §5.4, and its dates are the whole point
 * ----------------------------------------------------------------------------------------- */

describe('the review queue', () => {
  it('leaves at least two concepts overdue against now', async () => {
    // The ladder's longest interval is 35 days; anything older than that is due on any rung.
    const row = await one<{ n: number }>(
      `SELECT count(*)::int AS n FROM concept_reviews
        WHERE player_id = $1 AND last_reviewed_at <= ($2::date - 35)`,
      [SEEDED_PLAYERS.peer.id, NOW.toISOString().slice(0, 10)],
    );
    expect(row.n).toBeGreaterThanOrEqual(2);
  });

  it('leaves a concept that is not yet due, so the filter has something to exclude', async () => {
    const row = await one<{ n: number }>(
      `SELECT count(*)::int AS n FROM concept_reviews
        WHERE player_id = $1 AND last_reviewed_at > ($2::date - 4)`,
      [SEEDED_PLAYERS.peer.id, NOW.toISOString().slice(0, 10)],
    );
    expect(row.n).toBeGreaterThanOrEqual(1);
  });

  it('schedules a forced review that is already due', async () => {
    const row = await one<{ n: number }>(
      `SELECT count(*)::int AS n FROM forced_reviews
        WHERE player_id = $1 AND due_on <= $2::date`,
      [SEEDED_PLAYERS.peer.id, NOW.toISOString().slice(0, 10)],
    );
    expect(row.n).toBeGreaterThanOrEqual(1);
  });
});

/* -------------------------------------------------------------------------------------------
 * Run it twice
 * ----------------------------------------------------------------------------------------- */

describe('running the seed again', () => {
  it('converges rather than appends', async () => {
    const tables = [
      'players',
      'player_roles',
      'campaign',
      'quest_medals',
      'concept_reviews',
      'forced_reviews',
      'attempts',
      'datamines',
    ];
    // Sequentially: one `pg` client runs one query at a time, and a fan-out here only earns a
    // deprecation warning that reads as a failure to whoever meets it next.
    const census = async (): Promise<Record<string, number>> => {
      const out: Record<string, number> = {};
      for (const table of tables) out[table] = await count(table);
      return out;
    };

    const before = await census();
    await seedHousehold(scratch().client, { now: NOW, items: ITEMS });
    expect(await census()).toEqual(before);
  });

  it('moves every date when now moves', async () => {
    const dayOf = async (): Promise<{ startedOn: string; latestMedal: string; latestDue: string }> =>
      one(
        `SELECT (SELECT started_on::text FROM campaign WHERE id)                     AS "startedOn",
                (SELECT max(earned_at)::text FROM quest_medals)                      AS "latestMedal",
                (SELECT max(due_on)::text FROM forced_reviews)                       AS "latestDue"`,
      );

    const before = await dayOf();
    await seedHousehold(scratch().client, { now: LATER, items: ITEMS });
    const after = await dayOf();

    const shift = (a: string, b: string): number =>
      Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

    expect(shift(before.startedOn, after.startedOn)).toBe(11);
    expect(shift(before.latestMedal, after.latestMedal)).toBe(11);
    expect(shift(before.latestDue, after.latestDue)).toBe(11);

    // And still exactly one campaign, one set of medals, one queue.
    await seedHousehold(scratch().client, { now: NOW, items: ITEMS });
  });
});

/* -------------------------------------------------------------------------------------------
 * The reset path
 * ----------------------------------------------------------------------------------------- */

describe('resetting', () => {
  it('drops the household and leaves the schema, so a run starts from a known place', async () => {
    await resetHousehold(scratch().client);

    for (const table of [
      'players',
      'player_roles',
      'campaign',
      'quest_medals',
      'concept_reviews',
      'forced_reviews',
      'attempts',
      'datamines',
    ]) {
      expect(await count(table)).toBe(0);
    }

    // The ledger is untouched: a reset is not a re-migration.
    expect(await count('schema_migrations')).toBeGreaterThan(0);

    // And it is safe to run against an empty database.
    await resetHousehold(scratch().client);
    await seedHousehold(scratch().client, { now: NOW, items: ITEMS });
    expect(await count('players')).toBe(2);
  });
});
