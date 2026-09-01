/**
 * Accounts, credentials, tokens and the bootstrap, against a real Postgres.
 *
 * **The refusals are the subject.** A guard that lets the right credential through is easy and
 * proves almost nothing; what has to be true is that the wrong one, the expired one, the spent
 * one and the second one all fail. Every test below names the way in it is closing.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  BootstrapError,
  accountById,
  armBootstrap,
  authenticate,
  bootstrapConsumed,
  claimBootstrap,
  createPlayer,
  issueToken,
  playerForToken,
  purgeExpiredTokens,
  revokeToken,
  roster,
  setPassword,
  setRole,
} from '../src/accounts.ts';
import { digest } from '../src/auth.ts';
import { useMigratedDatabase } from './support/migrated-db.ts';
import { HAVE_DATABASE } from './support/scratch-db.ts';

describe.skipIf(!HAVE_DATABASE)('accounts and credentials', () => {
  const scratch = useMigratedDatabase('accounts');

  beforeEach(async () => {
    const { client } = scratch();
    await client.query('DELETE FROM api_tokens');
    await client.query('DELETE FROM player_credentials');
    await client.query('DELETE FROM bootstrap_secret');
    await client.query('DELETE FROM player_roles');
    await client.query('DELETE FROM players');
  });

  const ada = async () => {
    const { client } = scratch();
    return createPlayer(client, { handle: 'ada', displayName: 'Ada', password: 'a good one' });
  };

  it('creates a player who can then sign in', async () => {
    const { client } = scratch();
    const made = await ada();
    expect(made.handle).toBe('ada');
    expect(made.roles).toEqual(['player']);

    const signedIn = await authenticate(client, 'ada', 'a good one');
    expect(signedIn?.id).toBe(made.id);
  });

  /** Nobody created at the Console is a DM. The seat arrives by bootstrap or by promotion. */
  it('never creates a dm', async () => {
    expect((await ada()).roles).not.toContain('dm');
  });

  /**
   * Three failures, one answer.
   *
   * An api that says "no such handle" for one and "wrong password" for the other will confirm
   * which handles exist to anybody who asks in a loop. Costing nothing to avoid, it is avoided.
   */
  it('answers the same way for an unknown handle, a wrong password and no credential', async () => {
    const { client } = scratch();
    await ada();
    await client.query(
      `INSERT INTO players (handle, display_name) VALUES ('grace'::citext, 'Grace')`,
    );

    expect(await authenticate(client, 'nobody', 'a good one')).toBeUndefined();
    expect(await authenticate(client, 'ada', 'the wrong one')).toBeUndefined();
    /* `grace` exists and has no password at all. */
    expect(await authenticate(client, 'grace', 'anything')).toBeUndefined();
  });

  /** `handle` is citext, so the database already decides this and nothing re-decides it. */
  it('signs in whatever case the handle is typed', async () => {
    const { client } = scratch();
    await ada();
    expect(await authenticate(client, 'ADA', 'a good one')).toBeDefined();
  });

  /**
   * A reset must not leave the old password working. The table's primary key is the player, so
   * there is only ever one row — this is the test that says the upsert replaces rather than adds.
   */
  it('replaces a password rather than adding a second one', async () => {
    const { client } = scratch();
    const made = await ada();
    await setPassword(client, made.id, 'the new one');

    expect(await authenticate(client, 'ada', 'the new one')).toBeDefined();
    expect(await authenticate(client, 'ada', 'a good one')).toBeUndefined();

    const { rows } = await client.query('SELECT count(*)::int AS n FROM player_credentials');
    expect(rows[0]).toEqual({ n: 1 });
  });

  it('does not hand a password hash back with a player', async () => {
    const { client } = scratch();
    const made = await ada();
    expect(JSON.stringify(await accountById(client, made.id))).not.toContain('scrypt');
    expect(JSON.stringify(await roster(client))).not.toContain('scrypt');
  });
});

describe.skipIf(!HAVE_DATABASE)('tokens', () => {
  const scratch = useMigratedDatabase('accounts_tokens');
  let adaId: string;

  beforeEach(async () => {
    const { client } = scratch();
    await client.query('DELETE FROM api_tokens');
    await client.query('DELETE FROM player_credentials');
    await client.query('DELETE FROM player_roles');
    await client.query('DELETE FROM players');
    adaId = (
      await createPlayer(client, { handle: 'ada', displayName: 'Ada', password: 'a good one' })
    ).id;
  });

  it('identifies the player holding it', async () => {
    const { client } = scratch();
    const { token } = await issueToken(client, adaId);
    expect((await playerForToken(client, token))?.id).toBe(adaId);
  });

  it('refuses a token nobody issued', async () => {
    const { client } = scratch();
    await issueToken(client, adaId);
    expect(await playerForToken(client, 'not-a-token')).toBeUndefined();
  });

  /** The plaintext exists once, in the response. A copy of the table is not a ring of keys. */
  it('stores a digest and never the token', async () => {
    const { client } = scratch();
    const { token } = await issueToken(client, adaId);
    const { rows } = await client.query('SELECT token_sha256 AS "d" FROM api_tokens');
    expect(rows).toEqual([{ d: digest(token) }]);
    expect(rows[0]).not.toEqual({ d: token });
  });

  /**
   * Expiry is enforced by the query, not by a caller remembering to look.
   *
   * The row is aged with Postgres's own clock, which is also the clock that wrote `expires_at`.
   * One clock decides — the lesson `gitsignal.ts` learned expensively this morning.
   */
  it('refuses an expired token', async () => {
    const { client } = scratch();
    const { token } = await issueToken(client, adaId);
    await client.query(`UPDATE api_tokens SET expires_at = now() - interval '1 second'`);
    expect(await playerForToken(client, token)).toBeUndefined();
  });

  it('revokes one token without touching the others', async () => {
    const { client } = scratch();
    const first = await issueToken(client, adaId);
    const second = await issueToken(client, adaId);

    expect(await revokeToken(client, first.token)).toBe(true);
    expect(await playerForToken(client, first.token)).toBeUndefined();
    expect(await playerForToken(client, second.token)).toBeDefined();
    /* Revoking twice is not an error, and is not a second revocation either. */
    expect(await revokeToken(client, first.token)).toBe(false);
  });

  it('purges only what has expired', async () => {
    const { client } = scratch();
    const live = await issueToken(client, adaId);
    const dead = await issueToken(client, adaId);
    await client.query(`UPDATE api_tokens SET expires_at = now() - interval '1 hour' WHERE token_sha256 = $1`, [
      digest(dead.token),
    ]);

    expect(await purgeExpiredTokens(client)).toBe(1);
    expect(await playerForToken(client, live.token)).toBeDefined();
  });

  /**
   * A demotion has to be true now, not in twelve hours.
   *
   * The guard reads roles fresh on every request, so a stale token would still carry the right
   * identity — but a DM who has just removed somebody's `dm` expects it to have happened. Signing
   * them out is the only answer that is immediately true.
   */
  it('signs a player out when their roles change', async () => {
    const { client } = scratch();
    const { token } = await issueToken(client, adaId);
    await setRole(client, adaId, 'dm', true);
    expect(await playerForToken(client, token)).toBeUndefined();
  });
});

describe.skipIf(!HAVE_DATABASE)('the bootstrap, which is the one way in', () => {
  const scratch = useMigratedDatabase('accounts_bootstrap');

  beforeEach(async () => {
    const { client } = scratch();
    await client.query('DELETE FROM api_tokens');
    await client.query('DELETE FROM player_credentials');
    await client.query('DELETE FROM bootstrap_secret');
    await client.query('DELETE FROM player_roles');
    await client.query('DELETE FROM players');
  });

  const seat = { handle: 'dm', displayName: 'The DM', password: 'the first password' };

  it('claims the DM seat with both roles, once', async () => {
    const { client } = scratch();
    const secret = await armBootstrap(client);
    expect(secret).toBeDefined();

    const { account } = await claimBootstrap(client, secret as string, seat);
    expect([...account.roles].sort()).toEqual(['dm', 'player']);
    expect(await authenticate(client, 'dm', 'the first password')).toBeDefined();
    expect(await bootstrapConsumed(client)).toBe(true);
  });

  /** The mutant this exists for: a secret that can be spent twice is a second way in. */
  it('refuses the same secret a second time', async () => {
    const { client } = scratch();
    const secret = (await armBootstrap(client)) as string;
    await claimBootstrap(client, secret, seat);

    await expect(claimBootstrap(client, secret, { ...seat, handle: 'intruder' })).rejects.toThrow(
      BootstrapError,
    );
    const { rows } = await client.query(`SELECT count(*)::int AS n FROM players`);
    expect(rows[0]).toEqual({ n: 1 });
  });

  it('refuses a secret that is not the one it is waiting for', async () => {
    const { client } = scratch();
    await armBootstrap(client);
    await expect(claimBootstrap(client, 'not-the-secret', seat)).rejects.toThrow(BootstrapError);
    expect(await bootstrapConsumed(client)).toBe(false);
  });

  /** Re-arming a spent bootstrap would grow a second way in beside an existing DM. */
  it('will not re-arm after it has been spent', async () => {
    const { client } = scratch();
    const secret = (await armBootstrap(client)) as string;
    await claimBootstrap(client, secret, seat);
    expect(await armBootstrap(client)).toBeUndefined();
  });

  /** Losing the printout before using it is not the same as minting a spare key. */
  it('re-arms while it is still unspent, and the old secret stops working', async () => {
    const { client } = scratch();
    const first = (await armBootstrap(client)) as string;
    const second = (await armBootstrap(client)) as string;
    expect(second).not.toBe(first);

    await expect(claimBootstrap(client, first, seat)).rejects.toThrow(BootstrapError);
    await expect(claimBootstrap(client, second, seat)).resolves.toBeDefined();
  });

  /**
   * The seeded household already has a player called `dm`, and `handle` is unique.
   *
   * Creating a second one fails against the unique index; the bootstrap has to adopt the seat
   * that is there and say that is what it did.
   */
  it('claims an existing handle rather than failing against the unique index', async () => {
    const { client } = scratch();
    await client.query(`INSERT INTO players (handle, display_name) VALUES ('dm'::citext, 'Seeded')`);
    const secret = (await armBootstrap(client)) as string;

    const { account, claimedExisting } = await claimBootstrap(client, secret, seat);
    expect(claimedExisting).toBe(true);
    expect(account.displayName).toBe('The DM');
    const { rows } = await client.query(`SELECT count(*)::int AS n FROM players`);
    expect(rows[0]).toEqual({ n: 1 });
  });

  /** A failed claim must leave nothing behind — no half-made player, no spent secret. */
  it('rolls the whole claim back when part of it fails', async () => {
    const { client } = scratch();
    const secret = (await armBootstrap(client)) as string;
    await expect(
      claimBootstrap(client, secret, { ...seat, password: '' }),
    ).rejects.toThrow(BootstrapError);

    const { rows } = await client.query(`SELECT count(*)::int AS n FROM players`);
    expect(rows[0]).toEqual({ n: 0 });
    expect(await bootstrapConsumed(client)).toBe(false);
  });
});
