import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { digest, hashPassword, mintToken, verifyPassword } from '../src/auth.ts';

/**
 * The password store, tested without a database because it does not need one.
 *
 * Every assertion here is about a property a secret store must have, and each one names the
 * attack it exists against. A test that only checked "the right password verifies" would pass
 * against `hash = (p) => p`, which is the failure this file is written to make impossible.
 */

describe('hashing a password', () => {
  it('accepts the right password and refuses the wrong one', async () => {
    const stored = await hashPassword('correct horse battery staple');
    expect(await verifyPassword('correct horse battery staple', stored)).toBe(true);
    expect(await verifyPassword('correct horse battery stapler', stored)).toBe(false);
  });

  /**
   * The whole point of a salt, and the one property a plain digest does not have.
   *
   * Two players who pick the same password must not produce the same row. If they did, the
   * table would say "these two accounts share a password" to anybody who read it, and one
   * precomputed table would open both.
   */
  it('gives two identical passwords two different hashes', async () => {
    const [a, b] = await Promise.all([hashPassword('the same'), hashPassword('the same')]);
    expect(a).not.toBe(b);
    expect(await verifyPassword('the same', a)).toBe(true);
    expect(await verifyPassword('the same', b)).toBe(true);
  });

  /** A stored secret that does not say how it was made cannot be migrated. See `PREFIX`. */
  it('names its own scheme, so the cost can be raised later without a flag day', async () => {
    expect(await hashPassword('anything')).toMatch(/^scrypt\$/);
  });

  /** The password must not be recoverable from, or present in, what is stored. */
  it('does not store the password', async () => {
    const stored = await hashPassword('hunter2');
    expect(stored).not.toContain('hunter2');
    expect(Buffer.from(stored, 'utf8').toString('base64')).not.toContain('hunter2');
  });

  it('refuses to hash an empty password rather than storing something that verifies', async () => {
    await expect(hashPassword('')).rejects.toThrow();
  });

  /**
   * A corrupted or foreign row is a failed sign-in, never a thrown error.
   *
   * A 500 on one account and a 401 on every other is an oracle: it tells whoever is knocking
   * which accounts are worth more attention.
   */
  it('refuses a malformed hash instead of throwing', async () => {
    for (const junk of ['', 'nonsense', 'scrypt$only-two', 'argon2$a$b', 'scrypt$$']) {
      expect(await verifyPassword('anything', junk)).toBe(false);
    }
  });

  /** A truncated key must not verify, which is the shape of a hash accidentally cut in storage. */
  it('refuses a hash whose key is the wrong length', async () => {
    const stored = await hashPassword('hunter2');
    const [scheme, salt, key] = stored.split('$');
    expect(await verifyPassword('hunter2', `${scheme}$${salt}$${key?.slice(0, 20)}`)).toBe(false);
  });
});

/**
 * The one property here that no behavioural test can reach.
 *
 * A seeded mutant replaced `timingSafeEqual` with a string comparison and **passed all ten tests
 * above**, which is correct and is the point: the two are functionally identical. The difference
 * is how long they take to say no. `===` returns at the first byte that differs, so a nearly-right
 * guess takes measurably longer than a wrong one, and that difference is enough to recover a
 * secret one byte at a time against a network service.
 *
 * Asserting on timing would be slow and flaky — the thing being measured is microseconds against
 * a JIT and a scheduler. So this reads the source instead, which is a real compromise and worth
 * naming: it pins the *implementation* because the *behaviour* is identical by construction.
 * `gateway/boundary.test.ts` reads source for the same kind of reason.
 */
describe('the comparison itself', () => {
  it('uses a constant-time verifier, because == leaks the answer one byte at a time', () => {
    const source = readFileSync(new URL('../src/auth.ts', import.meta.url), 'utf8');
    const compare = source.slice(source.indexOf('export async function verifyPassword'));
    expect(compare).toContain('timingSafeEqual');
    expect(compare).not.toMatch(/return\s+actual\.toString\([^)]*\)\s*===/);
  });
});

describe('minting a token', () => {
  it('does not repeat itself', () => {
    const many = new Set(Array.from({ length: 500 }, () => mintToken()));
    expect(many.size).toBe(500);
  });

  /** 32 bytes, base64url — long enough that guessing is not the attack anybody would choose. */
  it('is 256 bits, and url-safe so it can travel in a header', () => {
    const token = mintToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(Buffer.from(token, 'base64url')).toHaveLength(32);
  });

  /**
   * What is stored is not what is presented, so a copy of `api_tokens` is not a ring of keys.
   */
  it('is stored as a digest of itself rather than as itself', () => {
    const token = mintToken();
    expect(digest(token)).not.toBe(token);
    expect(digest(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(digest(token)).toBe(digest(token));
    expect(digest(token)).not.toBe(digest(mintToken()));
  });
});
