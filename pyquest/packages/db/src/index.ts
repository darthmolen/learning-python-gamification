/**
 * `packages/db` — the Postgres half of the picture, and nothing else.
 *
 * Content lives in git; progress lives in Postgres; the two never mix (§6.7). That line is why
 * there is no `quests` table here and never will be: rows reference quest ids as strings, the
 * content validator guarantees those resolve at load, and the database never becomes a second,
 * stale copy of the curriculum.
 *
 * Two things live in this package. The migration runner, which is the only code in the repository
 * that can lose data and is therefore the smallest and the most attacked. And a repository layer
 * of thin readers that return the shapes `@pyquest/contract` declares — the API calls them, hands
 * the result to the engine, and the engine stays a pure function of content, progress and `now`.
 */

export {
  MIGRATIONS_DIR,
  MigrationError,
  migrate,
  migrationFiles,
  type Queryable,
} from './migrate.ts';

export {
  RowShapeError,
  attempts,
  bounties,
  campaign,
  conceptReviews,
  datamines,
  forcedReviews,
  journalEntries,
  playerProgress,
  players,
  questMedals,
  sessions,
} from './repository.ts';
