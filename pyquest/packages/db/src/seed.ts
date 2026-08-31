/**
 * A known household, put into an empty database, idempotently.
 *
 * `select count(*) from players` returned **0**. The schema was migrated and nothing in the
 * repository created a row, so the SPA pointed at a live API showed empty screens or 404s — not
 * because anything was broken, but because there was nobody to have progress. This is the fixture
 * that gives it somebody, and it is *only* a fixture: how a real household comes into existence
 * is `planning/backlog/feature_accounts-and-auth_2026-08-30.md`, and keeping the two apart is
 * what stops a seed script written in a hurry from quietly deciding how the product onboards
 * people. There are no passwords here and nothing a person would type.
 *
 * **Every date is an offset from `now`, and none is a literal.** A fixture with hardcoded dates
 * passes on the afternoon it is written and is wrong a fortnight later: the reviews stop being
 * overdue, the campaign silently advances four weeks, and nothing fails. `now` is a parameter for
 * the same reason the engine takes one (§6.7) — this module reads no clock of its own except in
 * `main`, where a command-line tool is entitled to one.
 *
 * **Ids come from content, never from strings typed here.** The quests, the concepts and the DCs
 * are read through `@pyquest/content`, so a renamed quest breaks the seed loudly instead of
 * leaving a progress row pointing at nothing. Which quests are cleared is a *rule* over that
 * corpus rather than a list — see `clearedByArea` — so the fixture keeps its four area states as
 * the curriculum grows.
 *
 * **What it does not do is price anything.** §5.10's prices are the engine's, and `packages/db`
 * does not depend on `@pyquest/engine` (nor could it: the root build orders `engine` after `db`).
 * `MEDAL_XP` below is therefore *fixture* XP — plausible, deterministic, and explicitly not the
 * engine's answer. Nothing in the campaign, area or quest views reads it; the Party screen's
 * levels do, and a level drawn from this household is a shape rather than a score.
 *
 * **Idempotent by construction.** Fixed uuids and `ON CONFLICT ... DO UPDATE` everywhere a row
 * has a natural key, so a second run converges rather than appends. Two tables have no usable
 * key and are deleted first instead: `attempts` is a `bigserial` log, and `forced_reviews`' key
 * includes `due_on`, which moves with `now` — so a plain upsert would leave yesterday's row
 * beside today's and grow the queue by one every day somebody ran the seed.
 */

import { checkContent, contentRootsFrom, conceptArea } from '@pyquest/content';
import type { ContentItem, Medal } from '@pyquest/content';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import type { Queryable } from './migrate.ts';

/* -------------------------------------------------------------------------------------------
 * Who is in the household
 * ----------------------------------------------------------------------------------------- */

/**
 * Two seats, and two rows, because the seats are two.
 *
 * §6.3 defines peer sign-off as "somebody other than the submitter presses the button", so a
 * fixture with one player cannot exercise it at all. Kitchen Table mode (§5.11) is one adult
 * holding both seats, which is why the dm row also holds `player`: roles are not people.
 *
 * The role vocabulary is the schema's — `player_roles` CHECKs `role IN ('player', 'dm')`. The
 * lexicon's word for the seat is `peer`, and that is the *handle*; widening the CHECK to match
 * would be this fixture editing the schema on its way past.
 *
 * The uuids are fixed so that re-running converges, and so that a person reading a log can tell
 * the seeded household from a real one at a glance.
 */
export const SEEDED_PLAYERS = {
  peer: {
    id: '5eed0000-0000-4000-8000-000000000001',
    handle: 'peer',
    displayName: 'The Peer',
    roles: ['player'],
  },
  dm: {
    id: '5eed0000-0000-4000-8000-000000000002',
    handle: 'dm',
    displayName: 'The DM',
    roles: ['dm', 'player'],
  },
} as const;

const EVERYONE = [SEEDED_PLAYERS.peer, SEEDED_PLAYERS.dm] as const;

/**
 * Nine whole weeks back, which reads as **week 10 of 48**.
 *
 * ADR 0002 ruled that the week number is a road marker, that it needs a date to count from, and
 * that the date is household state rather than content. This is that date, expressed the only way
 * a fixture may express one: as a distance from `now`.
 */
export const CAMPAIGN_START_OFFSET_DAYS = 63;

/* -------------------------------------------------------------------------------------------
 * The rule that picks the four area states
 * ----------------------------------------------------------------------------------------- */

/**
 * How many quests the peer has cleared in each area that has any, in area order.
 *
 * These four states are chosen, not arbitrary. `Infinity` is an area finished, so its island
 * draws lit and its boss reads unlocked. **Three** is §5.2's boss-unlock boundary exactly, and a
 * fourth would stop testing it. **One** is the state that caught a real bug — the first Map drew
 * that area as locked while its own label read `1 of ~5`. Everything past the list is untouched,
 * which is the drained treatment and the fourth state.
 */
export const CLEARED_BY_RANK: readonly number[] = [Number.POSITIVE_INFINITY, 3, 1];

const isQuest = (item: ContentItem): boolean => item.kind === 'quest';

/**
 * The area's quests in a stable order: cheapest first, ties broken by id.
 *
 * Cheapest first because prerequisites in this corpus run from the cheap quest to the dear one —
 * `a2-the-first-commit` (DC 5) gates two others — so taking the first *n* of this order yields a
 * position a player could actually have reached rather than one with a hole in it.
 */
function questsIn(items: readonly ContentItem[], area: number): ContentItem[] {
  return items
    .filter((item) => isQuest(item) && item.area === area)
    .sort((a, b) => a.dc - b.dc || a.id.localeCompare(b.id));
}

const areasWithQuests = (items: readonly ContentItem[]): number[] =>
  [...new Set(items.filter(isQuest).map((item) => item.area))].sort((a, b) => a - b);

/**
 * Which quests the peer has cleared, by area — a rule over the corpus, not a list of ids.
 *
 * Written this way so the fixture survives the curriculum growing: a sixth quest in Area 1 does
 * not silently turn "three of five" into "three of six is still three", and a newly authored
 * Area 3 becomes the next state in the list rather than breaking the seed.
 */
export function clearedByArea(items: readonly ContentItem[]): Map<number, string[]> {
  const byArea = new Map<number, string[]>();
  areasWithQuests(items).forEach((area, rank) => {
    const wanted = CLEARED_BY_RANK[rank] ?? 0;
    if (wanted <= 0) return;
    const chosen = questsIn(items, area).slice(0, wanted);
    if (chosen.length > 0) byArea.set(area, chosen.map((item) => item.id));
  });
  return byArea;
}

/**
 * The dm's own progress: half of the first area, and no further.
 *
 * Present because §5.8's Party screen renders standings for everyone, and a household where only
 * one seat has ever done anything draws one bar and proves half the screen.
 */
export function dmCleared(items: readonly ContentItem[]): string[] {
  const [first] = areasWithQuests(items);
  if (first === undefined) return [];
  const quests = questsIn(items, first);
  return quests.slice(0, Math.max(1, Math.floor(quests.length / 2))).map((item) => item.id);
}

/**
 * The medals taken beyond `cleared`, by position within an area.
 *
 * `MedalSlots` renders held and unheld slots together, so a household holding only `cleared`
 * proves half of that screen. One extra per position spreads them without ever inventing a
 * combination §5.12 forbids — `conjured` beside `ironman` is the illegal pair, and neither is
 * taken on the same quest here.
 */
const EXTRA_MEDALS: readonly Medal[] = ['idiomatic', 'ironman', 'teach-back'];

/**
 * Fixture XP, and deliberately not the engine's prices — see this file's header.
 *
 * Zero stays legal and is not seeded only because nothing here needs it: at the DC floor a medal
 * genuinely pays nothing, which the UI renders as a brag.
 */
const MEDAL_XP: Readonly<Record<string, number>> = {
  cleared: 40,
  ironman: 20,
  idiomatic: 20,
  'teach-back': 15,
  conjured: 0,
};

/* -------------------------------------------------------------------------------------------
 * The review queue — §5.4's ladder and §5.5's guarantees
 * ----------------------------------------------------------------------------------------- */

/**
 * Concepts on the ladder, dated backwards from `now`.
 *
 * Two are far enough back to be overdue on any rung the ladder has, one is mildly overdue, and
 * `for` is deliberately **not** due: a queue that contains everything tests nothing about the
 * filter that decides what is in it.
 */
const LADDER_REVIEWS: readonly { conceptId: string; rung: number; daysSince: number }[] = [
  { conceptId: 'print', rung: 2, daysSince: 40 },
  { conceptId: 'variables', rung: 0, daysSince: 36 },
  { conceptId: 'git-commit', rung: 1, daysSince: 9 },
  { conceptId: 'for', rung: 3, daysSince: 3 },
];

/**
 * §5.5's forced reviews, which are a second source `dueInvasions` merges.
 *
 * `print` is on both lists on purpose. The engine merges a concept that is due from the ladder
 * *and* from a Datamine into one entry with `source: 'both'`, and a fixture where the two never
 * overlap leaves that merge undrawn — indistinguishable, on screen, from a dropped review.
 */
const FORCED_REVIEWS: readonly { conceptId: string; dueDaysAgo: number }[] = [
  { conceptId: 'print', dueDaysAgo: 1 },
  { conceptId: 'reading-errors', dueDaysAgo: 2 },
];

/* -------------------------------------------------------------------------------------------
 * Dates, as distances
 * ----------------------------------------------------------------------------------------- */

const MS_PER_DAY = 86_400_000;

/** An ISO calendar date. `DATE` columns take this; the driver never sees a `Date`. */
const dayBefore = (now: Date, days: number): string =>
  new Date(now.getTime() - days * MS_PER_DAY).toISOString().slice(0, 10);

/** An ISO instant, for the `timestamptz` columns where order within a day is the point. */
const instantBefore = (now: Date, days: number, minutes = 0): string =>
  new Date(now.getTime() - days * MS_PER_DAY + minutes * 60_000).toISOString();

/* -------------------------------------------------------------------------------------------
 * Loading the corpus
 * ----------------------------------------------------------------------------------------- */

/**
 * The repository root, found relative to this module rather than to the process's cwd.
 *
 * `src/` and `dist/` are both exactly one level under the package root, so this resolves the same
 * whether the caller loaded the TypeScript (vitest, aliased to source) or the compiled output.
 */
export const REPO_ROOT = fileURLToPath(new URL('../../../..', import.meta.url));

/** A refusal that names the root, rather than a seed that writes nothing and exits 0. */
export class SeedContentError extends Error {
  readonly root: string;

  constructor(root: string, detail: string) {
    super(`the seed cannot read content at ${root} — ${detail}`);
    this.name = 'SeedContentError';
    this.root = root;
  }
}

/** Every content item, read from git. Refuses an empty corpus rather than seeding nothing. */
export function householdItems(root: string = REPO_ROOT): readonly ContentItem[] {
  const { items } = checkContent(contentRootsFrom(root));
  if (items.filter(isQuest).length === 0) {
    throw new SeedContentError(root, 'it has no quests, so there is no progress to seed');
  }
  return items;
}

/* -------------------------------------------------------------------------------------------
 * Writing it down
 * ----------------------------------------------------------------------------------------- */

export interface SeedOptions {
  /** The instant every seeded date is measured back from. Defaults to the wall clock. */
  readonly now?: Date;
  /** The corpus. Defaults to the one in this checkout. */
  readonly items?: readonly ContentItem[];
}

export interface SeedSummary {
  readonly startedOn: string;
  readonly players: number;
  readonly questMedals: number;
  readonly conceptReviews: number;
  readonly forcedReviews: number;
  readonly attempts: number;
  readonly datamines: number;
  /** Cleared quest ids by area, so a caller can print the four states it just produced. */
  readonly clearedByArea: ReadonlyMap<number, readonly string[]>;
}

/**
 * `($1, $2), ($3, $4)` and the flat parameter list that goes with it.
 *
 * Every value below reaches Postgres as a bound parameter. Nothing is interpolated, including the
 * ids that came out of content — a quest id is authored text, and authored text does not get to
 * be SQL even when the author is us.
 */
function tuples(rows: readonly (readonly unknown[])[]): { text: string; values: unknown[] } {
  const values: unknown[] = [];
  const text = rows
    .map((row) => `(${row.map((value) => `$${values.push(value)}`).join(', ')})`)
    .join(', ');
  return { text, values };
}

/** Every table this fixture writes, in an order that never violates a foreign key on the way out. */
const HOUSEHOLD_TABLES = [
  'runner_jobs',
  'attempts',
  'quest_medals',
  'concept_reviews',
  'forced_reviews',
  'datamines',
  'journal_entries',
  'bounties',
  'sessions',
  'player_roles',
] as const;

/**
 * Drop the household and leave the schema.
 *
 * A run has to be able to start from a known place, or an integration suite asserts against
 * whatever the last run left behind. It deletes by player id rather than truncating, so a
 * database that also holds a real household loses only the fixture; `campaign` is the exception
 * because §6.1's one-row table has no owner to scope it to.
 *
 * The migration ledger is untouched. A reset is not a re-migration.
 */
export async function resetHousehold(client: Queryable): Promise<void> {
  const ids = EVERYONE.map((player) => player.id);
  await client.query('BEGIN');
  try {
    for (const table of HOUSEHOLD_TABLES) {
      const column = table === 'sessions' ? 'forgiven_by' : table === 'bounties' ? 'posted_by' : 'player_id';
      await client.query(`DELETE FROM ${table} WHERE ${column} = ANY($1::uuid[])`, [ids]);
    }
    await client.query('DELETE FROM players WHERE id = ANY($1::uuid[])', [ids]);
    await client.query('DELETE FROM campaign WHERE id');
    await client.query('COMMIT');
  } catch (cause) {
    await client.query('ROLLBACK');
    throw new Error('resetting the seeded household failed and was rolled back', { cause });
  }
}

/**
 * Fill an empty database, or converge an already-seeded one, in one transaction.
 *
 * One transaction because a half-seeded household is worse than none: a Map drawn from three of
 * the four states looks like a bug in the engine rather than an interrupted script.
 */
export async function seedHousehold(
  client: Queryable,
  options: SeedOptions = {},
): Promise<SeedSummary> {
  const now = options.now ?? new Date();
  const items = options.items ?? householdItems();

  const unknownConcept = [...LADDER_REVIEWS, ...FORCED_REVIEWS]
    .map((review) => review.conceptId)
    .find((id) => conceptArea(id) === undefined);
  if (unknownConcept !== undefined) {
    throw new SeedContentError(REPO_ROOT, `"${unknownConcept}" is not a concept in the registry`);
  }

  const cleared = clearedByArea(items);
  const startedOn = dayBefore(now, CAMPAIGN_START_OFFSET_DAYS);

  /* The medals, dated backwards so that the earliest area was cleared the longest ago. */
  const medals: { playerId: string; questId: string; medal: Medal; earnedAt: string; xp: number }[] = [];
  let ordinal = 0;
  for (const [, questIds] of [...cleared].sort((a, b) => a[0] - b[0])) {
    questIds.forEach((questId, index) => {
      const earnedAt = dayBefore(now, Math.max(1, CAMPAIGN_START_OFFSET_DAYS - 7 - ordinal * 3));
      ordinal += 1;
      medals.push({
        playerId: SEEDED_PLAYERS.peer.id,
        questId,
        medal: 'cleared',
        earnedAt,
        xp: MEDAL_XP['cleared'] ?? 0,
      });
      const extra = EXTRA_MEDALS[index];
      if (extra !== undefined) {
        medals.push({
          playerId: SEEDED_PLAYERS.peer.id,
          questId,
          medal: extra,
          earnedAt,
          xp: MEDAL_XP[extra] ?? 0,
        });
      }
    });
  }
  dmCleared(items).forEach((questId, index) => {
    const earnedAt = dayBefore(now, Math.max(1, CAMPAIGN_START_OFFSET_DAYS - 10 - index * 4));
    medals.push({
      playerId: SEEDED_PLAYERS.dm.id,
      questId,
      medal: 'cleared',
      earnedAt,
      xp: MEDAL_XP['cleared'] ?? 0,
    });
    if (index === 0) {
      medals.push({
        playerId: SEEDED_PLAYERS.dm.id,
        questId,
        medal: 'idiomatic',
        earnedAt,
        xp: MEDAL_XP['idiomatic'] ?? 0,
      });
    }
  });

  /*
   * The scars, and the Datamine that follows from them (§5.3, §5.5).
   *
   * `struggle` is the one quest cleared in the "started with one" area, and it is cleared the way
   * a real one is: failed, failed, passed. `stuck` is a quest in the same area that is *not*
   * cleared, failed three times, which is what §5.5 grants a Datamine for.
   */
  const rankedAreas = areasWithQuests(items);
  const startedArea = rankedAreas[2] ?? rankedAreas[rankedAreas.length - 1];
  const areaQuests = startedArea === undefined ? [] : questsIn(items, startedArea);
  const clearedHere = new Set(startedArea === undefined ? [] : (cleared.get(startedArea) ?? []));
  const struggle = areaQuests.find((item) => clearedHere.has(item.id));
  const stuck = [...areaQuests].reverse().find((item) => !clearedHere.has(item.id));

  const attempts: { questId: string; passed: boolean; at: string }[] = [];
  if (struggle !== undefined) {
    attempts.push(
      { questId: struggle.id, passed: false, at: instantBefore(now, 5) },
      { questId: struggle.id, passed: false, at: instantBefore(now, 5, 5) },
      { questId: struggle.id, passed: true, at: instantBefore(now, 5, 20) },
    );
  }
  if (stuck !== undefined) {
    attempts.push(
      { questId: stuck.id, passed: false, at: instantBefore(now, 3) },
      { questId: stuck.id, passed: false, at: instantBefore(now, 3, 12) },
      { questId: stuck.id, passed: false, at: instantBefore(now, 3, 31) },
    );
  }

  await client.query('BEGIN');
  try {
    const people = tuples(EVERYONE.map((p) => [p.id, p.handle, p.displayName]));
    await client.query(
      `INSERT INTO players (id, handle, display_name) VALUES ${people.text}
       ON CONFLICT (id) DO UPDATE SET handle = EXCLUDED.handle,
                                      display_name = EXCLUDED.display_name`,
      people.values,
    );

    const roles = tuples(EVERYONE.flatMap((p) => p.roles.map((role) => [p.id, role])));
    await client.query(
      `INSERT INTO player_roles (player_id, role) VALUES ${roles.text} ON CONFLICT DO NOTHING`,
      roles.values,
    );

    await client.query(
      `INSERT INTO campaign (id, started_on) VALUES (true, $1)
       ON CONFLICT (id) DO UPDATE SET started_on = EXCLUDED.started_on`,
      [startedOn],
    );

    if (medals.length > 0) {
      const rows = tuples(medals.map((m) => [m.playerId, m.questId, m.medal, m.earnedAt, m.xp]));
      await client.query(
        `INSERT INTO quest_medals (player_id, quest_id, medal, earned_at, xp_awarded)
         VALUES ${rows.text}
         ON CONFLICT (player_id, quest_id, medal)
           DO UPDATE SET earned_at = EXCLUDED.earned_at, xp_awarded = EXCLUDED.xp_awarded`,
        rows.values,
      );
    }

    const reviews = tuples(
      LADDER_REVIEWS.map((r) => [
        SEEDED_PLAYERS.peer.id,
        r.conceptId,
        dayBefore(now, r.daysSince),
        r.rung,
      ]),
    );
    await client.query(
      `INSERT INTO concept_reviews (player_id, concept_id, last_reviewed_at, rung)
       VALUES ${reviews.text}
       ON CONFLICT (player_id, concept_id)
         DO UPDATE SET last_reviewed_at = EXCLUDED.last_reviewed_at, rung = EXCLUDED.rung`,
      reviews.values,
    );

    // Deleted first: the key carries `due_on`, which moves with `now`, so an upsert would leave
    // yesterday's row beside today's and lengthen the queue by one for every day it was run.
    await client.query('DELETE FROM forced_reviews WHERE player_id = $1', [SEEDED_PLAYERS.peer.id]);
    const forced = tuples(
      FORCED_REVIEWS.map((f) => [
        SEEDED_PLAYERS.peer.id,
        f.conceptId,
        dayBefore(now, f.dueDaysAgo),
        'datamine',
      ]),
    );
    await client.query(
      `INSERT INTO forced_reviews (player_id, concept_id, due_on, source) VALUES ${forced.text}`,
      forced.values,
    );

    // Deleted first for the other reason: `attempts` is a `bigserial` log with no natural key, so
    // there is nothing for `ON CONFLICT` to converge on and a second run would double the scars.
    await client.query('DELETE FROM attempts WHERE player_id = $1', [SEEDED_PLAYERS.peer.id]);
    if (attempts.length > 0) {
      const rows = tuples(
        attempts.map((a) => [SEEDED_PLAYERS.peer.id, a.questId, a.passed, a.at]),
      );
      await client.query(
        `INSERT INTO attempts (player_id, quest_id, passed, attempted_at) VALUES ${rows.text}`,
        rows.values,
      );
    }

    if (stuck !== undefined) {
      await client.query(
        `INSERT INTO datamines (player_id, quest_id, unlocked_at, attempts_before, note)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (player_id, quest_id)
           DO UPDATE SET unlocked_at = EXCLUDED.unlocked_at,
                         attempts_before = EXCLUDED.attempts_before,
                         note = EXCLUDED.note`,
        [
          SEEDED_PLAYERS.peer.id,
          stuck.id,
          instantBefore(now, 3, 32),
          3,
          'Three tries on the same error. Read the traceback from the bottom up.',
        ],
      );
    }

    await client.query('COMMIT');
  } catch (cause) {
    await client.query('ROLLBACK');
    throw new Error('seeding the household failed and was rolled back', { cause });
  }

  return {
    startedOn,
    players: EVERYONE.length,
    questMedals: medals.length,
    conceptReviews: LADDER_REVIEWS.length,
    forcedReviews: FORCED_REVIEWS.length,
    attempts: attempts.length,
    datamines: stuck === undefined ? 0 : 1,
    clearedByArea: cleared,
  };
}

/* -------------------------------------------------------------------------------------------
 * The command
 * ----------------------------------------------------------------------------------------- */

/**
 * `npm run seed --workspace @pyquest/db`, and `seed:reset` for the same thing from empty.
 *
 * It lives at the foot of this module rather than in `cli.ts` because `cli.ts` is the migration
 * job — a compose service with `restart: "no"` — and a fixture loader is not that. The guard below
 * is what keeps importing `@pyquest/db` from running it.
 */
async function main(argv: readonly string[]): Promise<void> {
  const connectionString = process.env['DATABASE_URL'];
  if (connectionString === undefined || connectionString === '') {
    throw new Error('DATABASE_URL is not set — see infra/.env');
  }

  const { Client } = await import('pg');
  const client = new Client({ connectionString });
  await client.connect();
  try {
    if (argv.includes('--reset')) {
      await resetHousehold(client);
      console.log('seed: dropped the seeded household');
    }
    const summary = await seedHousehold(client);
    console.log(`seed: campaign started ${summary.startedOn}`);
    for (const [area, questIds] of [...summary.clearedByArea].sort((a, b) => a[0] - b[0])) {
      console.log(`seed: area ${area} — ${questIds.length} cleared`);
    }
    console.log(
      `seed: ${summary.questMedals} medals, ${summary.conceptReviews} reviews, ` +
        `${summary.forcedReviews} forced, ${summary.attempts} attempts`,
    );
  } finally {
    await client.end();
  }
}

/** True only when node was pointed at this file. An import must not seed anything. */
const invokedDirectly =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    // Chained, not swallowed: the driver's complaint is the cause and it is the useful half.
    console.error(error);
    process.exitCode = 1;
  }
}
