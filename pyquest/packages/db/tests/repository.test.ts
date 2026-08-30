/**
 * The repository, checked against the contract it claims to satisfy.
 *
 * The engine's suite parses engine output through `@pyquest/contract`. This is the same check
 * from the other direction, and it is the only thing that makes "the repository returns what the
 * contract declares" a fact rather than an intention: without it, `packages/db` and the engine
 * meet for the first time at integration, which is the drift the contract package exists to stop.
 *
 * Two of these tests are about conversions rather than shapes, and they are the ones that would
 * otherwise be found in production. A `DATE` handed to `pg` unaided becomes a JavaScript `Date` at
 * *local* midnight, so west of UTC every calendar date in this schema would come back one day
 * early — on a machine in a timezone nobody tested from.
 */

import { randomUUID } from 'node:crypto';
import {
  AttemptSchema,
  BountySchema,
  CampaignSchema,
  DatamineSchema,
  JournalEntryRecordSchema,
  PlayerProgressSchema,
  PlayerSchema,
  SessionSchema,
} from '@pyquest/contract';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  RowShapeError,
  attempts,
  bounties,
  campaign,
  datamines,
  journalEntries,
  playerProgress,
  questMedals,
  players,
  sessions,
} from '../src/repository.ts';
import { useMigratedDatabase } from './support/migrated-db.ts';
import { HAVE_DATABASE } from './support/scratch-db.ts';

const ADA = '11111111-1111-1111-1111-111111111111';
const GRACE = '22222222-2222-2222-2222-222222222222';

const SEED = [
  `INSERT INTO players (id, handle, display_name) VALUES ('${ADA}', 'ada', 'Ada'), ('${GRACE}', 'grace', 'Grace')`,
  `INSERT INTO player_roles (player_id, role) VALUES ('${ADA}', 'player'), ('${ADA}', 'dm'), ('${GRACE}', 'player')`,
  `INSERT INTO campaign (started_on) VALUES ('2026-06-01')`,
  `INSERT INTO quest_medals (player_id, quest_id, medal, earned_at, xp_awarded)
   VALUES ('${ADA}', 'a0-hello-world', 'cleared', '2026-08-20', 12),
          ('${ADA}', 'a0-hello-world', 'ironman', '2026-08-20', 0),
          ('${GRACE}', 'a0-hello-world', 'cleared', '2026-08-21', 12)`,
  `INSERT INTO concept_reviews (player_id, concept_id, last_reviewed_at, rung)
   VALUES ('${ADA}', 'variables', '2026-08-20', 2)`,
  `INSERT INTO forced_reviews (player_id, concept_id, due_on, source)
   VALUES ('${ADA}', 'print', '2026-08-23', 'datamine')`,
  `INSERT INTO attempts (player_id, quest_id, passed, attempted_at, detail)
   VALUES ('${ADA}', 'a0-hello-world', false, '2026-08-19T18:00:00Z', '{"stderr": "SyntaxError"}'),
          ('${ADA}', 'a0-hello-world', false, '2026-08-19T18:05:00Z', NULL),
          ('${ADA}', 'a0-hello-world', true,  '2026-08-19T18:20:00Z', NULL)`,
  `INSERT INTO datamines (player_id, quest_id, unlocked_at, attempts_before, note)
   VALUES ('${ADA}', 'a0-hello-world', '2026-08-19T18:06:00Z', 2, 'a print needs its parentheses')`,
  `INSERT INTO journal_entries (player_id, session_date, commit_sha, xp_awarded)
   VALUES ('${ADA}', '2026-08-20', 'deadbeef', 10)`,
  `INSERT INTO sessions (scheduled_for, attended, forgiven_by, note)
   VALUES ('2026-08-20', true, NULL, NULL), ('2026-08-27', false, '${ADA}', 'sick')`,
  `INSERT INTO bounties (posted_by, claimed_by, title, xp, state, claimed_at)
   VALUES ('${GRACE}', NULL, 'Draw a hexagon', 25, 'open', NULL),
          ('${ADA}', '${GRACE}', 'Name three list methods', 15, 'claimed', now())`,
];

describe.skipIf(!HAVE_DATABASE)('the repository returns the contract shapes', () => {
  const scratch = useMigratedDatabase('repository');

  beforeAll(async () => {
    for (const statement of SEED) await scratch().client.query(statement);
  }, 60_000);

  it('assembles one player progress bundle, and only that player is in it', async () => {
    const progress = await playerProgress(scratch().client, ADA);

    expect(PlayerProgressSchema.parse(progress)).toEqual(progress);
    expect(progress.questMedals.map((m) => m.medal)).toEqual(['cleared', 'ironman']);
    expect(progress.conceptReviews).toEqual([
      { playerId: ADA, conceptId: 'variables', lastReviewedAt: '2026-08-20', rung: 2 },
    ]);
    expect(progress.forcedReviews).toEqual([
      { playerId: ADA, conceptId: 'print', dueOn: '2026-08-23' },
    ]);
    // Grace's medal for the same quest is hers, and a bundle that mixed them would be refused by
    // the contract anyway — which is the point of asking for it here.
    expect(progress.questMedals.every((m) => m.playerId === ADA)).toBe(true);
  });

  it('keeps a calendar date a calendar date, whatever timezone the machine is in', async () => {
    const progress = await playerProgress(scratch().client, ADA);
    // Not a Date, not shifted: the literal day that was written.
    expect(progress.questMedals[0]?.earnedAt).toBe('2026-08-20');
    expect(progress.conceptReviews[0]?.lastReviewedAt).toBe('2026-08-20');
    expect(progress.forcedReviews[0]?.dueOn).toBe('2026-08-23');
  });

  it('keeps a zero payout, because §5.10 says that reads as a brag', async () => {
    const progress = await playerProgress(scratch().client, ADA);
    expect(progress.questMedals.find((m) => m.medal === 'ironman')?.xpAwarded).toBe(0);
  });

  it('folds the roles into the player row', async () => {
    const roster = await players(scratch().client);
    expect(roster.map((p) => p.handle)).toEqual(['ada', 'grace']);
    expect(PlayerSchema.parse(roster[0])).toEqual(roster[0]);
    expect(roster[0]?.roles).toEqual(['dm', 'player']);
    expect(roster[1]?.roles).toEqual(['player']);
  });

  it('returns attempts oldest first, because a scar is a sequence (§5.3)', async () => {
    const scars = await attempts(scratch().client, ADA);
    expect(scars.map((a) => a.passed)).toEqual([false, false, true]);
    expect(AttemptSchema.parse(scars[0])).toEqual(scars[0]);
    expect(scars[0]?.attemptedAt).toBe('2026-08-19T18:00:00.000Z');
    expect(scars[0]?.detail).toEqual({ stderr: 'SyntaxError' });
    expect(scars[1]?.detail).toBeNull();
  });

  it('returns a bigserial id as a string, because the range does not fit a JS number', async () => {
    const scars = await attempts(scratch().client, ADA);
    expect(typeof scars[0]?.id).toBe('string');
  });

  it('returns the Datamine with its note and the failures that earned it', async () => {
    const [mine] = await datamines(scratch().client, ADA);
    expect(DatamineSchema.parse(mine)).toEqual(mine);
    expect(mine?.attemptsBefore).toBe(2);
    expect(mine?.note).toBe('a print needs its parentheses');
  });

  it('returns journal entries by session day', async () => {
    const [entry] = await journalEntries(scratch().client, ADA);
    expect(JournalEntryRecordSchema.parse(entry)).toEqual(entry);
    expect(entry?.sessionDate).toBe('2026-08-20');
    expect(entry?.commitSha).toBe('deadbeef');
  });

  it('returns sessions with the forgiveness signed', async () => {
    const rows = await sessions(scratch().client);
    expect(rows.map((s) => s.scheduledFor)).toEqual(['2026-08-20', '2026-08-27']);
    expect(SessionSchema.parse(rows[0])).toEqual(rows[0]);
    expect(rows[0]?.forgivenBy).toBeNull();
    expect(rows[1]?.forgivenBy).toBe(ADA);
  });

  it('returns bounties with claim and state agreeing', async () => {
    const rows = await bounties(scratch().client);
    expect(rows).toHaveLength(2);
    for (const row of rows) expect(BountySchema.parse(row)).toEqual(row);
    expect(rows.find((b) => b.state === 'open')?.claimedBy).toBeNull();
    expect(rows.find((b) => b.state === 'claimed')?.claimedBy).toBe(GRACE);
  });

  it('returns the campaign start date and nothing derived from it', async () => {
    const row = await campaign(scratch().client);
    expect(row).toBeDefined();
    expect(CampaignSchema.parse(row)).toEqual(row);
    expect(row?.startedOn).toBe('2026-06-01');
    expect(Object.keys(row ?? {}).sort()).toEqual(['createdAt', 'startedOn']);
  });
});

describe.skipIf(!HAVE_DATABASE)('the repository refuses a row the contract forbids', () => {
  const scratch = useMigratedDatabase('repository_refuses');

  /**
   * `quest_medals.medal` deliberately carries no SQL CHECK: medal names are content vocabulary,
   * and a list of them in Postgres would be content in Postgres (§6.7). The parse at the
   * repository boundary is therefore the *only* thing standing between a typo in a write path and
   * the engine being handed a medal that does not exist. This test is what proves it is standing.
   */
  it('rejects a medal the content package has never heard of', async () => {
    const player = randomUUID();
    await scratch().client.query(
      `INSERT INTO players (id, handle, display_name) VALUES ('${player}', 'ada', 'Ada')`,
    );
    await scratch().client.query(
      `INSERT INTO quest_medals (player_id, quest_id, medal, earned_at, xp_awarded)
       VALUES ('${player}', 'a0-hello-world', 'gold', '2026-08-20', 12)`,
    );

    // Asked of `questMedals` rather than `playerProgress` on purpose. `playerProgress` parses the
    // assembled bundle as well, so it would have refused this row even with the per-row parse
    // deleted — a mutant that survives is a test proving something other than what it claims.
    await expect(questMedals(scratch().client, player)).rejects.toThrow(RowShapeError);
    await expect(questMedals(scratch().client, player)).rejects.toThrow(/quest_medals/);
    await expect(playerProgress(scratch().client, player)).rejects.toThrow(RowShapeError);
  });

  it('names the table it came from, because a zod trace does not', async () => {
    const player = randomUUID();
    await scratch().client.query(
      `INSERT INTO players (id, handle, display_name) VALUES ('${player}', 'grace', 'Grace')`,
    );
    await scratch().client.query(
      `INSERT INTO concept_reviews (player_id, concept_id, last_reviewed_at, rung)
       VALUES ('${player}', 'not-a-real-concept', '2026-08-20', 2)`,
    );

    await expect(playerProgress(scratch().client, player)).rejects.toThrow(/concept_reviews/);
  });
});
