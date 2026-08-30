/**
 * The constraints, each one watched doing its job and then watched failing to.
 *
 * The plan's criterion is "every table has the constraint that makes its invariant impossible to
 * violate — not a comment saying what the invariant is", and its Phase 3 says how to prove that:
 * remove the constraint and show the bad row lands. A constraint nobody has watched fail is a
 * comment.
 *
 * So every case below is two halves, and the second half is the one that matters:
 *
 * 1. with the constraint in place, the bad row is refused;
 * 2. inside a transaction that is rolled back, the constraint is DROPped and *the same row lands*.
 *
 * Half two is the seeded mutant, and it is here in the suite rather than in a one-off session
 * somebody ran once. If it ever starts failing, the row was being refused by something other than
 * the constraint under test — a different key, a type error, a typo in the fixture — and the first
 * half had been proving nothing. That is the exact failure mode this shape exists to catch.
 *
 * Postgres does transactional DDL, which is what makes seeding a schema mutant cheap enough to do
 * fifteen times in one suite and safe enough to do against a database the next test still needs.
 *
 * Every row here is one the application would happily have written on some Tuesday.
 */

import { describe, expect, it } from 'vitest';
import { inRollback, useMigratedDatabase } from './support/migrated-db.ts';
import { HAVE_DATABASE } from './support/scratch-db.ts';

interface ConstraintCase {
  /** What the database is being asked to make impossible, in the words of the spec. */
  readonly what: string;
  /** The one constraint under test. Dropping it is the mutant. */
  readonly drop: string;
  /** Statements that must succeed first, so that the bad row is bad for the right reason. */
  readonly setup?: readonly string[];
  /** The row the application would have written. */
  readonly bad: string;
}

const PLAYER = '11111111-1111-1111-1111-111111111111';
const OTHER = '22222222-2222-2222-2222-222222222222';
const GHOST = '99999999-9999-9999-9999-999999999999';

const ROSTER = [
  `INSERT INTO players (id, handle, display_name) VALUES ('${PLAYER}', 'ada', 'Ada')`,
  `INSERT INTO players (id, handle, display_name) VALUES ('${OTHER}', 'grace', 'Grace')`,
];

const CASES: readonly ConstraintCase[] = [
  {
    what: '§6.2: a medal pays once',
    drop: 'ALTER TABLE quest_medals DROP CONSTRAINT quest_medals_pkey',
    setup: [
      `INSERT INTO quest_medals (player_id, quest_id, medal, earned_at, xp_awarded)
       VALUES ('${PLAYER}', 'a0-hello-world', 'ironman', '2026-08-20', 12)`,
    ],
    bad: `INSERT INTO quest_medals (player_id, quest_id, medal, earned_at, xp_awarded)
          VALUES ('${PLAYER}', 'a0-hello-world', 'ironman', '2026-08-21', 12)`,
  },
  {
    what: '§5.10: a medal never pays less than nothing',
    drop: 'ALTER TABLE quest_medals DROP CONSTRAINT quest_medals_xp_awarded_check',
    bad: `INSERT INTO quest_medals (player_id, quest_id, medal, earned_at, xp_awarded)
          VALUES ('${PLAYER}', 'a0-hello-world', 'ironman', '2026-08-20', -5)`,
  },
  {
    what: '§5.4: the ladder has five rungs, so there is no rung 9',
    drop: 'ALTER TABLE concept_reviews DROP CONSTRAINT concept_reviews_rung_check',
    bad: `INSERT INTO concept_reviews (player_id, concept_id, last_reviewed_at, rung)
          VALUES ('${PLAYER}', 'variables', '2026-08-20', 9)`,
  },
  {
    what: '§5.11: a player cannot hold dm twice',
    drop: 'ALTER TABLE player_roles DROP CONSTRAINT player_roles_pkey',
    setup: [`INSERT INTO player_roles (player_id, role) VALUES ('${PLAYER}', 'dm')`],
    bad: `INSERT INTO player_roles (player_id, role) VALUES ('${PLAYER}', 'dm')`,
  },
  {
    what: '§5.8: a bounty is in one of four states, and pending is not one of them',
    drop: 'ALTER TABLE bounties DROP CONSTRAINT bounties_state_check',
    // The claimant is here so that this row breaks exactly one rule. Without it the row also
    // violated `bounties_claim_matches_state` — a not-open bounty with no claimant — and the
    // mutant caught that: dropping the state check still refused the row, which meant the first
    // half of this case had been proving the wrong constraint.
    bad: `INSERT INTO bounties (posted_by, claimed_by, title, xp, state, claimed_at)
          VALUES ('${PLAYER}', '${OTHER}', 'Draw a hexagon', 25, 'pending', now())`,
  },
  {
    what: '§5.8: a claimed bounty cannot pretend to be open',
    drop: 'ALTER TABLE bounties DROP CONSTRAINT bounties_claim_matches_state',
    bad: `INSERT INTO bounties (posted_by, claimed_by, title, xp, state, claimed_at)
          VALUES ('${PLAYER}', '${OTHER}', 'Draw a hexagon', 25, 'open', now())`,
  },
  {
    what: '§5.5: a Datamine note is required, and whitespace is not a note',
    drop: 'ALTER TABLE datamines DROP CONSTRAINT datamines_note_check',
    bad: `INSERT INTO datamines (player_id, quest_id, unlocked_at, attempts_before, note)
          VALUES ('${PLAYER}', 'a0-hello-world', now(), 3, '   ')`,
  },
  {
    what: '§5.5: a Datamine follows real failures, so zero of them is not a Datamine',
    drop: 'ALTER TABLE datamines DROP CONSTRAINT datamines_attempts_before_check',
    bad: `INSERT INTO datamines (player_id, quest_id, unlocked_at, attempts_before, note)
          VALUES ('${PLAYER}', 'a0-hello-world', now(), 0, 'read the loop again')`,
  },
  {
    what: '§5.5: the same forced review cannot be scheduled twice',
    drop: 'ALTER TABLE forced_reviews DROP CONSTRAINT forced_reviews_pkey',
    setup: [
      `INSERT INTO forced_reviews (player_id, concept_id, due_on, source)
       VALUES ('${PLAYER}', 'variables', '2026-08-23', 'datamine')`,
    ],
    bad: `INSERT INTO forced_reviews (player_id, concept_id, due_on, source)
          VALUES ('${PLAYER}', 'variables', '2026-08-23', 'datamine')`,
  },
  {
    what: '§5.3: a scar belongs to a player who exists',
    drop: 'ALTER TABLE attempts DROP CONSTRAINT attempts_player_id_fkey',
    bad: `INSERT INTO attempts (player_id, quest_id, passed)
          VALUES ('${GHOST}', 'a0-hello-world', false)`,
  },
  {
    what: '§5.6: an entry names a real commit, because push is the verification (§6.4)',
    drop: 'ALTER TABLE journal_entries DROP CONSTRAINT journal_entries_commit_sha_check',
    bad: `INSERT INTO journal_entries (player_id, session_date, commit_sha, xp_awarded)
          VALUES ('${PLAYER}', '2026-08-20', 'not-a-sha', 10)`,
  },
  {
    what: '§5.9: a streak cannot be forgiven in the name of a player who does not exist',
    drop: 'ALTER TABLE sessions DROP CONSTRAINT sessions_forgiven_by_fkey',
    bad: `INSERT INTO sessions (scheduled_for, attended, forgiven_by)
          VALUES ('2026-08-22', false, '${GHOST}')`,
  },
  {
    what: '§5.9: one Saturday is one session, so a streak cannot be inflated by writing a row',
    drop: 'ALTER TABLE sessions DROP CONSTRAINT sessions_scheduled_for_key',
    setup: [`INSERT INTO sessions (scheduled_for) VALUES ('2026-08-22')`],
    bad: `INSERT INTO sessions (scheduled_for) VALUES ('2026-08-22')`,
  },
  {
    what: 'one campaign, so week 10 of 48 has one answer',
    drop: 'ALTER TABLE campaign DROP CONSTRAINT campaign_id_check',
    setup: [`INSERT INTO campaign (started_on) VALUES ('2026-06-01')`],
    bad: `INSERT INTO campaign (id, started_on) VALUES (false, '2026-07-01')`,
  },
  {
    what: 'one handle, and case is not what makes a second player',
    drop: 'ALTER TABLE players DROP CONSTRAINT players_handle_key',
    bad: `INSERT INTO players (handle, display_name) VALUES ('Ada', 'Ada again')`,
  },
  {
    what: 'a display name is a name, and whitespace is not one',
    drop: 'ALTER TABLE players DROP CONSTRAINT players_display_name_check',
    bad: `INSERT INTO players (handle, display_name) VALUES ('bob', '  ')`,
  },
];

describe.skipIf(!HAVE_DATABASE)('the schema, constraint by constraint', () => {
  const scratch = useMigratedDatabase('schema');

  it.each(CASES)('refuses the row that breaks: $what', async (testCase) => {
    await inRollback(scratch(), async () => {
      for (const statement of [...ROSTER, ...(testCase.setup ?? [])]) {
        await scratch().client.query(statement);
      }
      await expect(scratch().client.query(testCase.bad)).rejects.toThrow();
    });
  });

  it.each(CASES)('...and the constraint is what does it: $what', async (testCase) => {
    // The mutant. If this throws, the row was being refused by something else and the check above
    // was proving nothing about the constraint it names.
    await inRollback(scratch(), async () => {
      await scratch().client.query(testCase.drop);
      for (const statement of [...ROSTER, ...(testCase.setup ?? [])]) {
        await scratch().client.query(statement);
      }
      await scratch().client.query(testCase.bad);
    });
  });
});

describe.skipIf(!HAVE_DATABASE)('the schema, on what it deliberately allows', () => {
  const scratch = useMigratedDatabase('schema_allows');

  it('accepts a zero payout — at the DC floor a medal reads as a brag, not an error (§5.10)', async () => {
    await inRollback(scratch(), async () => {
      for (const statement of ROSTER) await scratch().client.query(statement);
      await scratch().client.query(
        `INSERT INTO quest_medals (player_id, quest_id, medal, earned_at, xp_awarded)
         VALUES ('${PLAYER}', 'a0-hello-world', 'ironman', '2026-08-20', 0)`,
      );
      const { rows } = await scratch().client.query('SELECT count(*)::int AS n FROM quest_medals');
      expect((rows[0] as { n: number }).n).toBe(1);
    });
  });

  it('accepts both rung 0 and the top rung, which are the ends of the §5.4 ladder', async () => {
    await inRollback(scratch(), async () => {
      for (const statement of ROSTER) await scratch().client.query(statement);
      await scratch().client.query(
        `INSERT INTO concept_reviews (player_id, concept_id, last_reviewed_at, rung)
         VALUES ('${PLAYER}', 'variables', '2026-08-20', 0), ('${PLAYER}', 'lists', '2026-08-20', 4)`,
      );
      const { rows } = await scratch().client.query('SELECT count(*)::int AS n FROM concept_reviews');
      expect((rows[0] as { n: number }).n).toBe(2);
    });
  });

  it('accepts a forced review for a concept with no ladder row — the ruling, pinned', async () => {
    // No composite FK to `concept_reviews`, on purpose. A Datamine is granted when a quest is
    // failed enough times and schedules reviews for that quest's concepts; the ladder row is
    // written when a concept is first taught. Nothing guarantees the second happens first, so an
    // FK here would make a legal sequence fail at write time. The engine already skips a forced
    // review with no ladder row, and this test is what pins the behaviour instead of a constraint.
    await inRollback(scratch(), async () => {
      for (const statement of ROSTER) await scratch().client.query(statement);
      await scratch().client.query(
        `INSERT INTO forced_reviews (player_id, concept_id, due_on, source)
         VALUES ('${PLAYER}', 'variables', '2026-08-23', 'datamine')`,
      );
      const { rows } = await scratch().client.query(
        `SELECT count(*)::int AS n FROM concept_reviews WHERE player_id = '${PLAYER}'`,
      );
      expect((rows[0] as { n: number }).n).toBe(0);
    });
  });

  it('stores no quests, no XP totals and no unlock flags — content lives in git (§6.7)', async () => {
    const { rows } = await scratch().client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
    );
    const tables = rows.map((r) => (r as { table_name: string }).table_name).sort();
    expect(tables).toEqual([
      'attempts',
      'bounties',
      'campaign',
      'concept_reviews',
      'datamines',
      'forced_reviews',
      'journal_entries',
      'player_roles',
      'players',
      'quest_medals',
      'runner_jobs',
      'schema_migrations',
      'sessions',
    ]);

    const { rows: columns } = await scratch().client.query(
      `SELECT table_name || '.' || column_name AS c
         FROM information_schema.columns
        WHERE table_schema = 'public'
          AND (column_name LIKE '%total%' OR column_name LIKE 'is_unlocked%' OR column_name LIKE '%current_week%')`,
    );
    expect(columns).toEqual([]);
  });
});
