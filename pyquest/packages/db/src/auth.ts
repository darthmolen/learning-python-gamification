/**
 * Passwords, tokens, and the bootstrap secret — the only module that handles a secret.
 *
 * It is in `packages/db` rather than in the api because the repository functions beside it are
 * the only callers, and because a hash format is a property of what is stored. It has no I/O of
 * its own: `hashPassword` and `verifyPassword` are pure functions over strings, so every rule
 * below is testable without a database.
 *
 * ## scrypt, not argon2id, and the plan said argon2id
 *
 * **A deliberate deviation, recorded rather than quietly taken.** The plan named argon2id, which
 * is the better algorithm and would need `node-argon2` — a native module, compiled at install
 * time, on a Windows machine whose `planning/backlog/feature_compose-services-cannot-start-on-windows_2026-08-29.md`
 * already records three services that will not start because of how this platform resolves
 * native and linked artifacts. Trading a working password store for a marginally stronger KDF,
 * on a household LAN behind a threat model of *one household*, is not a trade worth making.
 *
 * `scrypt` is in `node:crypto`, needs no dependency at all, and is memory-hard for the same
 * reason argon2 is — RFC 7914 exists precisely to make parallel guessing expensive. The
 * parameters below are the point of comparison, not the name of the function.
 *
 * **If this ever leaves the household**, argon2id is the upgrade, and `PREFIX` is why it costs
 * nothing: every stored hash names its own scheme, so both can be verified while old rows are
 * rewritten on next sign-in. That is what the format is for.
 */

import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

/**
 * The scheme tag, stored in every hash.
 *
 * A stored secret that does not say how it was made is a secret nobody can migrate: raising the
 * cost, or moving to argon2id, becomes a flag day where every password has to be reset. Naming
 * the scheme makes it a rolling upgrade instead.
 */
const PREFIX = 'scrypt';

/** 16 bytes of salt, 64 of derived key. Node's own defaults for N, r and p sit behind `scrypt`. */
const SALT_BYTES = 16;
const KEY_BYTES = 64;

/**
 * `scrypt$<salt base64>$<key base64>`.
 *
 * Self-describing on purpose — see `PREFIX`. The salt is stored beside the key because a salt is
 * not a secret; its job is to make two identical passwords hash differently, which defeats a
 * table of precomputed answers.
 */
export async function hashPassword(password: string): Promise<string> {
  if (password === '') throw new Error('a password of no characters is not a password');
  const salt = randomBytes(SALT_BYTES);
  const key = await scrypt(password, salt, KEY_BYTES);
  return `${PREFIX}$${salt.toString('base64')}$${key.toString('base64')}`;
}

/**
 * Does this password produce that hash?
 *
 * **`timingSafeEqual`, not `===`.** A comparison that returns as soon as two bytes differ takes
 * measurably longer for a nearly-right answer than for a wrong one, and that difference is enough
 * to recover a secret one byte at a time. It is a real attack on a network service and the fix is
 * one function call, so there is no reason to be the service it works against.
 *
 * Returns `false` for anything malformed rather than throwing. A corrupted row is a sign-in that
 * fails, not a route that 500s — and a 500 would tell whoever is knocking that this account is
 * interesting.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, salt, key] = stored.split('$');
  if (scheme !== PREFIX || salt === undefined || key === undefined) return false;

  let expected: Buffer;
  try {
    expected = Buffer.from(key, 'base64');
  } catch {
    return false;
  }
  if (expected.length !== KEY_BYTES) return false;

  const actual = await scrypt(password, Buffer.from(salt, 'base64'), KEY_BYTES);
  return timingSafeEqual(actual, expected);
}

/**
 * A bearer token: 32 bytes of randomness, base64url.
 *
 * `randomBytes` is the CSPRNG, and the distinction from `Math.random` is the whole of the
 * security here — a token a person could guess is not a token. 256 bits is past the point where
 * guessing is the attack anybody would choose.
 */
export const mintToken = (): string => randomBytes(32).toString('base64url');

/**
 * What gets stored for a token or a bootstrap secret.
 *
 * A plain SHA-256 rather than scrypt, and the difference in reasoning is worth stating: a
 * password is short, human-chosen and guessable, so its hash must be *slow*. A token is 256 bits
 * of CSPRNG output, so there is nothing to guess and slowness buys nothing — it would only make
 * every authenticated request more expensive, which is a cost paid on the hot path forever.
 *
 * What the digest does buy is that a copy of `api_tokens` is not a ring of keys.
 */
export const digest = (token: string): string =>
  createHash('sha256').update(token).digest('hex');
