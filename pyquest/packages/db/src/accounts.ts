/**
 * Accounts, credentials and tokens — the reads and writes behind signing in.
 *
 * `auth.ts` holds the cryptography and knows nothing about Postgres; this holds the SQL and does
 * no cryptography of its own beyond calling that module. Keeping them apart is what lets every
 * rule in `auth.ts` be tested against a string, and it means there is exactly one place a hash
 * format is decided.
 *
 * **Every function here is written so that failing tells the caller as little as possible.**
 * `authenticate` returns the same `undefined` for an unknown handle and a wrong password,
 * because an api that distinguishes them is an api that will confirm which handles exist. That
 * is not paranoia about a household LAN; it is that the alternative costs nothing.
 */

import { digest, hashPassword, mintToken, verifyPassword } from './auth.ts';
import type { Queryable } from './migrate.ts';

/** How long a token lives. See `TOKEN_TTL_HOURS` for why this number and not a longer one. */
export interface Account {
  readonly id: string;
  readonly handle: string;
  readonly displayName: string;
  readonly roles: readonly string[];
}

/**
 * Twelve hours.
 *
 * §5.4 puts a session at 45–60 minutes, so an hour would expire him mid-quest and a week would
 * mean a token overheard on Saturday still works the following Saturday. Twelve hours covers any
 * single sitting and is short enough that a stolen one is stale by morning. The plan's Anticipated
 * Backlog wants this decided against a real session rather than a guess, and this is the guess it
 * gets until then — a number chosen for a reason, in one place, easy to change.
 */
export const TOKEN_TTL_HOURS = 12;

const ROLE_SQL = `SELECT role FROM player_roles WHERE player_id = $1 ORDER BY role`;

async function rolesOf(client: Queryable, playerId: string): Promise<string[]> {
  const { rows } = await client.query(ROLE_SQL, [playerId]);
  return (rows as { role: string }[]).map((row) => row.role);
}

/** One account by id, roles included, or nothing. */
export async function accountById(
  client: Queryable,
  playerId: string,
): Promise<Account | undefined> {
  const { rows } = await client.query(
    `SELECT id::text AS "id", handle::text AS "handle", display_name AS "displayName"
       FROM players WHERE id = $1::uuid`,
    [playerId],
  );
  const row = rows[0] as Omit<Account, 'roles'> | undefined;
  if (row === undefined) return undefined;
  return { ...row, roles: await rolesOf(client, row.id) };
}

/** One account by handle, or nothing. Case-insensitive, because `handle` is `citext`. */
export async function accountByHandle(
  client: Queryable,
  handle: string,
): Promise<Account | undefined> {
  const { rows } = await client.query(
    `SELECT id::text AS "id" FROM players WHERE handle = $1::citext`,
    [handle],
  );
  const row = rows[0] as { id: string } | undefined;
  return row === undefined ? undefined : accountById(client, row.id);
}

/**
 * Sign one player out everywhere.
 *
 * Called when a password is reset and when a role changes, and both callers want the same thing:
 * whatever was true of that account a moment ago should stop being true now rather than in twelve
 * hours. It costs one person one sign-in, which is the cheaper half of the trade.
 */
export async function revokeTokensFor(client: Queryable, playerId: string): Promise<number> {
  const { rows } = await client.query(
    `DELETE FROM api_tokens WHERE player_id = $1::uuid RETURNING 1 AS "gone"`,
    [playerId],
  );
  return rows.length;
}

/**
 * Give this player a password, replacing any they had.
 *
 * `ON CONFLICT DO UPDATE` rather than an insert, because the table's primary key is the player:
 * a reset must not leave the old row working beside the new one. `updated_at` moves so the
 * Console can say when a password last changed without keeping a second history table.
 */
export async function setPassword(
  client: Queryable,
  playerId: string,
  password: string,
): Promise<void> {
  const hash = await hashPassword(password);
  await client.query(
    `INSERT INTO player_credentials (player_id, hash) VALUES ($1::uuid, $2)
     ON CONFLICT (player_id) DO UPDATE SET hash = EXCLUDED.hash, updated_at = now()`,
    [playerId, hash],
  );
}

/**
 * The handle and password, or nothing — and never a reason.
 *
 * **The same answer for three different failures**: no such handle, no credential, wrong
 * password. A caller cannot tell them apart, so neither can anybody talking to the caller.
 *
 * `handle` is `citext`, so the comparison is already case-insensitive in the database and this
 * does not lower-case anything on the way in. A second normalisation here would be a second
 * definition of what "the same handle" means.
 */
export async function authenticate(
  client: Queryable,
  handle: string,
  password: string,
): Promise<Account | undefined> {
  const { rows } = await client.query(
    `SELECT p.id::text AS "id", p.handle::text AS "handle", p.display_name AS "displayName",
            c.hash AS "hash"
       FROM players p
       JOIN player_credentials c ON c.player_id = p.id
      WHERE p.handle = $1::citext`,
    [handle],
  );
  const row = rows[0] as { id: string; handle: string; displayName: string; hash: string } | undefined;
  if (row === undefined) return undefined;
  if (!(await verifyPassword(password, row.hash))) return undefined;
  return {
    id: row.id,
    handle: row.handle,
    displayName: row.displayName,
    roles: await rolesOf(client, row.id),
  };
}

export interface IssuedToken {
  /** The only time this string exists. It is not stored and cannot be read back. */
  readonly token: string;
  readonly expiresAt: string;
}

/** Issue a token for a player, storing only its digest. */
export async function issueToken(
  client: Queryable,
  playerId: string,
  label?: string,
): Promise<IssuedToken> {
  const token = mintToken();
  const { rows } = await client.query(
    `INSERT INTO api_tokens (token_sha256, player_id, expires_at, label)
     VALUES ($1, $2::uuid, now() + ($3 || ' hours')::interval, $4)
     RETURNING to_char(expires_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "expiresAt"`,
    [digest(token), playerId, String(TOKEN_TTL_HOURS), label ?? null],
  );
  return { token, expiresAt: (rows[0] as { expiresAt: string }).expiresAt };
}

/**
 * Who is presenting this token, or nothing.
 *
 * **Expiry is checked in the `WHERE`, not in JavaScript after the row comes back.** A row that
 * has expired must not be returned at all, because the only thing standing between "returned
 * and checked" and "returned and used" is a caller remembering. One clock decides — Postgres's,
 * the same clock that wrote `expires_at` — which is the lesson `gitsignal.ts` learned the
 * expensive way this morning: a comparison between two machines' clocks is not a comparison.
 */
export async function playerForToken(
  client: Queryable,
  token: string,
): Promise<Account | undefined> {
  const { rows } = await client.query(
    `SELECT player_id::text AS "playerId" FROM api_tokens
      WHERE token_sha256 = $1 AND expires_at > now()`,
    [digest(token)],
  );
  const row = rows[0] as { playerId: string } | undefined;
  if (row === undefined) return undefined;
  return accountById(client, row.playerId);
}

/** Sign out: this token only. Returns whether there was one to revoke. */
export async function revokeToken(client: Queryable, token: string): Promise<boolean> {
  const { rows } = await client.query(
    `DELETE FROM api_tokens WHERE token_sha256 = $1 RETURNING 1 AS "gone"`,
    [digest(token)],
  );
  return rows.length > 0;
}

/**
 * Delete expired tokens.
 *
 * Not a security measure — `playerForToken` already refuses them — but a row that can never be
 * used again is a row that should not be in a list of live sessions the Console renders.
 */
export async function purgeExpiredTokens(client: Queryable): Promise<number> {
  const { rows } = await client.query(
    `DELETE FROM api_tokens WHERE expires_at <= now() RETURNING 1 AS "gone"`,
  );
  return rows.length;
}

/* -------------------------------------------------------------------------------------------
 * The bootstrap — somebody has to be first
 * ----------------------------------------------------------------------------------------- */

/**
 * Write a new bootstrap secret, replacing any unspent one.
 *
 * Returns the plaintext exactly once; only its digest is stored. **Refuses when the standing
 * secret has already been spent**, because re-arming a consumed bootstrap is how a household
 * that already has a DM grows a second way in. Rotating an *unspent* secret is fine — that is
 * somebody who lost the printout, not somebody minting a spare key.
 */
export async function armBootstrap(client: Queryable): Promise<string | undefined> {
  const secret = mintToken();
  const { rows } = await client.query(
    `INSERT INTO bootstrap_secret (id, secret_sha256) VALUES (true, $1)
     ON CONFLICT (id) DO UPDATE SET secret_sha256 = EXCLUDED.secret_sha256, created_at = now()
       WHERE bootstrap_secret.consumed_at IS NULL
     RETURNING 1 AS "armed"`,
    [digest(secret)],
  );
  return rows.length > 0 ? secret : undefined;
}

/** Has the bootstrap already been spent? The Console and the script both ask. */
export async function bootstrapConsumed(client: Queryable): Promise<boolean> {
  const { rows } = await client.query(
    `SELECT consumed_at IS NOT NULL AS "consumed" FROM bootstrap_secret WHERE id`,
  );
  return (rows[0] as { consumed: boolean } | undefined)?.consumed ?? false;
}

export class BootstrapError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options?.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'BootstrapError';
  }
}

/**
 * Spend the bootstrap secret to create the first account, holding both roles.
 *
 * **One transaction, and the secret is consumed inside it.** A crash between "player created"
 * and "secret spent" would otherwise leave a live secret beside the account it already made —
 * the exact second way in this is written to prevent.
 *
 * **The consuming `UPDATE` carries `consumed_at IS NULL` in its own `WHERE`.** That, rather than
 * the read above it, is what makes the secret single-use: two requests arriving together both
 * pass the read, and only one can match the update. Checking and then acting is not the same as
 * acting on the check.
 *
 * The DM seat may already exist — the seeded household has a player called `dm` — so this claims
 * an existing handle rather than failing against `players_handle_key`, and says which it did.
 */
export async function claimBootstrap(
  client: Queryable,
  secret: string,
  account: { handle: string; displayName: string; password: string },
): Promise<{ account: Account; claimedExisting: boolean }> {
  await client.query('BEGIN');
  try {
    /*
     * The player is created first, and the secret is spent last — which is the opposite of the
     * order this was written in.
     *
     * Spending first looks safer: win the race, then do the work. But `consumed_at` and
     * `claimed_by` have to agree by CHECK, and the player they refer to does not exist yet, so
     * that ordering needs two writes and a moment in between where the row is illegal. Postgres
     * refuses to defer a CHECK, and it was right to: the invariant is about the row, not about a
     * convenient sequence.
     *
     * Creating first costs nothing, because a caller who then loses the race throws and rolls
     * back the player it had speculatively made. The single UPDATE below is still what decides,
     * and its WHERE is still what makes the secret single-use.
     */
    const { rows: existing } = await client.query(
      `SELECT id::text AS "id" FROM players WHERE handle = $1::citext`,
      [account.handle],
    );
    const found = existing[0] as { id: string } | undefined;

    let playerId: string;
    if (found === undefined) {
      const { rows } = await client.query(
        `INSERT INTO players (handle, display_name) VALUES ($1::citext, $2)
         RETURNING id::text AS "id"`,
        [account.handle, account.displayName],
      );
      playerId = (rows[0] as { id: string }).id;
    } else {
      playerId = found.id;
      await client.query(`UPDATE players SET display_name = $2 WHERE id = $1::uuid`, [
        playerId,
        account.displayName,
      ]);
    }

    /* Both seats. §5.11's Kitchen Table mode is one adult holding player and dm together. */
    await client.query(
      `INSERT INTO player_roles (player_id, role) VALUES ($1::uuid, 'player'), ($1::uuid, 'dm')
       ON CONFLICT DO NOTHING`,
      [playerId],
    );

    const hash = await hashPassword(account.password);
    await client.query(
      `INSERT INTO player_credentials (player_id, hash) VALUES ($1::uuid, $2)
       ON CONFLICT (player_id) DO UPDATE SET hash = EXCLUDED.hash, updated_at = now()`,
      [playerId, hash],
    );

    /*
     * The one statement that decides, and the last thing to happen before COMMIT.
     *
     * `consumed_at IS NULL` in its own WHERE is what makes this single-use: two callers arriving
     * together both reach here, and only one row can match. Checking first and acting after is
     * not the same as acting on the check.
     */
    const { rows: spent } = await client.query(
      `UPDATE bootstrap_secret SET consumed_at = now(), claimed_by = $2::uuid
        WHERE id AND secret_sha256 = $1 AND consumed_at IS NULL
        RETURNING 1 AS "ok"`,
      [digest(secret), playerId],
    );
    if (spent.length === 0) {
      throw new BootstrapError(
        'that bootstrap secret is not the one this database is waiting for, or it has already been used',
      );
    }

    await client.query('COMMIT');
    const claimed = await accountById(client, playerId);
    if (claimed === undefined) throw new BootstrapError('the account vanished as it was created');
    return { account: claimed, claimedExisting: found !== undefined };
  } catch (cause) {
    await client.query('ROLLBACK');
    if (cause instanceof BootstrapError) throw cause;
    /* Chained, never swallowed: the driver's complaint is the useful half. */
    throw new BootstrapError('claiming the DM seat failed and was rolled back', { cause });
  }
}

/* -------------------------------------------------------------------------------------------
 * The Console's three acts — §6.8
 * ----------------------------------------------------------------------------------------- */

/**
 * Create a player. Everyone made here is a `player` and nothing more.
 *
 * There is no path to `dm` through this function, and that is the design: the DM seat arrives
 * by bootstrap or by promotion, both of which are deliberate acts by somebody who already holds
 * it. A create endpoint that took a role is a create endpoint that can be asked for `dm`.
 */
export async function createPlayer(
  client: Queryable,
  input: { handle: string; displayName: string; password: string },
): Promise<Account> {
  const { rows } = await client.query(
    `INSERT INTO players (handle, display_name) VALUES ($1::citext, $2)
     RETURNING id::text AS "id"`,
    [input.handle, input.displayName],
  );
  const playerId = (rows[0] as { id: string }).id;
  await client.query(
    `INSERT INTO player_roles (player_id, role) VALUES ($1::uuid, 'player') ON CONFLICT DO NOTHING`,
    [playerId],
  );
  await setPassword(client, playerId, input.password);
  const account = await accountById(client, playerId);
  if (account === undefined) throw new Error('the player vanished as it was created');
  return account;
}

/**
 * Grant a role, and revoke every token that player holds.
 *
 * **The revocation is the part worth stating.** A token proves who you are, and the guard reads
 * the role fresh on every request — but a DM who has just *demoted* somebody expects that to be
 * true now, not in twelve hours. Signing them out is the only answer that is true immediately,
 * and it costs one person one sign-in.
 */
export async function setRole(
  client: Queryable,
  playerId: string,
  role: 'player' | 'dm',
  held: boolean,
): Promise<readonly string[]> {
  if (held) {
    await client.query(
      `INSERT INTO player_roles (player_id, role) VALUES ($1::uuid, $2) ON CONFLICT DO NOTHING`,
      [playerId, role],
    );
  } else {
    await client.query(`DELETE FROM player_roles WHERE player_id = $1::uuid AND role = $2`, [
      playerId,
      role,
    ]);
  }
  await revokeTokensFor(client, playerId);
  return rolesOf(client, playerId);
}

/** Every player, for the Console's roster. No hashes come back with them. */
export async function roster(client: Queryable): Promise<Account[]> {
  const { rows } = await client.query(
    `SELECT p.id::text AS "id", p.handle::text AS "handle", p.display_name AS "displayName",
            coalesce(array_agg(r.role ORDER BY r.role) FILTER (WHERE r.role IS NOT NULL), '{}') AS "roles"
       FROM players p
       LEFT JOIN player_roles r ON r.player_id = p.id
      GROUP BY p.id, p.handle, p.display_name
      ORDER BY p.handle`,
  );
  return rows as Account[];
}
