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
 *
 * A third thing joined them: `seed.ts`, a known household for tests and for looking at the SPA
 * against a live API. It is a fixture and says so — no passwords, nothing a person would type —
 * and it is the only file here that reads content, because progress rows name quests and the ids
 * have to come from the corpus rather than from strings somebody typed.
 */

export {
  MIGRATIONS_DIR,
  MigrationError,
  migrate,
  migrationFiles,
  type Queryable,
} from './migrate.ts';

export {
  BootstrapError,
  TOKEN_TTL_HOURS,
  accountById,
  accountByHandle,
  armBootstrap,
  authenticate,
  bootstrapConsumed,
  claimBootstrap,
  createPlayer,
  issueToken,
  playerForToken,
  purgeExpiredTokens,
  revokeToken,
  revokeTokensFor,
  roster,
  setPassword,
  setRole,
  type Account,
  type IssuedToken,
} from './accounts.ts';

export { digest, hashPassword, mintToken, verifyPassword } from './auth.ts';

export {
  CAMPAIGN_START_OFFSET_DAYS,
  CLEARED_BY_RANK,
  REPO_ROOT,
  SEEDED_PLAYERS,
  SeedContentError,
  clearedByArea,
  dmCleared,
  householdItems,
  resetHousehold,
  seedHousehold,
  type SeedOptions,
  type SeedSummary,
} from './seed.ts';

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
