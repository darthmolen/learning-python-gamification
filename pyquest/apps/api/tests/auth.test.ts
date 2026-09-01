/**
 * The guard, against a real Postgres.
 *
 * **The refusals are the subject, and the plan says so in as many words**: a guard that lets the
 * right token through is easy and proves little. Every test below hands the api something wrong —
 * no token, a malformed one, an expired one, one belonging to somebody else, a role that is not
 * held — and requires a refusal.
 *
 * The one acceptance test exists so that a guard which refused *everything* would not pass this
 * file. That is the mutant a suite of refusals is blind to.
 */

import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ApiErrorSchema, API_ROUTES } from '@pyquest/contract';
import {
  armBootstrap,
  createPlayer,
  issueToken,
  setRole,
} from '@pyquest/db';
import type { FastifyInstance } from 'fastify';
import { loadContentRoot } from '../src/content.ts';
import { buildServer } from '../src/server.ts';
import { HAVE_DATABASE, useMigratedDatabase } from './support/database.ts';

if (!HAVE_DATABASE) {
  throw new Error('no database: start the stack, or set TEST_DATABASE_URL');
}

const CONTENT = loadContentRoot(fileURLToPath(new URL('../../../..', import.meta.url)));
const NOW = new Date('2026-08-25T09:00:00.000Z');

describe('the guard', () => {
  const scratch = useMigratedDatabase('auth');
  let app: FastifyInstance;
  let adaId: string;
  let dmId: string;
  let adaToken: string;
  let dmToken: string;

  beforeAll(async () => {
    const { client } = scratch();
    app = buildServer({ content: CONTENT, db: client, clock: () => NOW });
    await app.ready();
  }, 60_000);

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(async () => {
    const { client } = scratch();
    await client.query('DELETE FROM api_tokens');
    await client.query('DELETE FROM player_credentials');
    await client.query('DELETE FROM bootstrap_secret');
    await client.query('DELETE FROM player_roles');
    await client.query('DELETE FROM players');

    adaId = (await createPlayer(client, { handle: 'ada', displayName: 'Ada', password: 'ada pass' })).id;
    dmId = (await createPlayer(client, { handle: 'dm', displayName: 'The DM', password: 'dm pass' })).id;
    await setRole(client, dmId, 'dm', true);
    adaToken = (await issueToken(client, adaId)).token;
    dmToken = (await issueToken(client, dmId)).token;
  });

  const get = (url: string, token?: string) =>
    app.inject({
      method: 'GET',
      url,
      headers: token === undefined ? {} : { authorization: `Bearer ${token}` },
    });

  /* -----------------------------------------------------------------------------------------
   * Refusals
   * --------------------------------------------------------------------------------------- */

  it('refuses a request with no token at all', async () => {
    const response = await get('/api/tome');
    expect(response.statusCode).toBe(401);
    expect(ApiErrorSchema.safeParse(response.json()).success).toBe(true);
  });

  it('refuses a malformed authorization header', async () => {
    for (const header of ['', 'Bearer', 'Bearer ', 'Basic abc', 'abc', `Bearer ${adaToken} extra`]) {
      const response = await app.inject({
        method: 'GET',
        url: '/api/tome',
        headers: { authorization: header },
      });
      expect(response.statusCode).toBe(401);
    }
  });

  it('refuses a token nobody issued', async () => {
    expect((await get('/api/tome', 'not-a-real-token')).statusCode).toBe(401);
  });

  it('refuses an expired token', async () => {
    const { client } = scratch();
    await client.query(`UPDATE api_tokens SET expires_at = now() - interval '1 second'`);
    expect((await get('/api/tome', adaToken)).statusCode).toBe(401);
  });

  it('refuses a token that has been revoked by signing out', async () => {
    const out = await app.inject({
      method: 'POST',
      url: '/api/session/end',
      headers: { authorization: `Bearer ${adaToken}` },
    });
    expect(out.statusCode).toBe(204);
    expect((await get('/api/tome', adaToken)).statusCode).toBe(401);
  });

  /**
   * The refusal says nothing about which guess was closer.
   *
   * An unknown token and an expired one are the same sentence, because an api that distinguishes
   * them is an api that will help somebody narrow down what they have.
   */
  it('gives one answer for every kind of bad token', async () => {
    const { client } = scratch();
    const unknown = (await get('/api/tome', 'not-a-real-token')).json();
    await client.query(`UPDATE api_tokens SET expires_at = now() - interval '1 second'`);
    const expired = (await get('/api/tome', adaToken)).json();
    expect(unknown).toEqual(expired);
  });

  /* -----------------------------------------------------------------------------------------
   * Acceptance — so a guard that refused everything would not pass this file
   * --------------------------------------------------------------------------------------- */

  it('lets a valid token through', async () => {
    const response = await get('/api/tome', adaToken);
    expect(response.statusCode).toBe(200);
  });

  it('names the player behind the token, which is what replaces PLAYER_ID', async () => {
    const response = await get('/api/me', adaToken);
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: adaId, handle: 'ada', roles: ['player'] });
  });

  it('never returns a password hash with an account', async () => {
    expect((await get('/api/me', adaToken)).body).not.toContain('scrypt');
    expect((await get('/api/players', dmToken)).body).not.toContain('scrypt');
  });

  /* -----------------------------------------------------------------------------------------
   * Every route, not just the one that was tried
   * --------------------------------------------------------------------------------------- */

  /**
   * **The assertion the plan asked for by name**: per route shape, not assumed from the
   * middleware existing.
   *
   * It walks `API_ROUTES` rather than a list written here, so a route added to the contract and
   * forgotten by the guard fails this test on the day it is added. A hand-kept list would have to
   * be remembered, which is the thing that does not happen.
   */
  it('refuses every route in the contract except the two that issue tokens', async () => {
    const open = new Set(['POST /api/session', 'POST /api/session/bootstrap']);

    for (const route of API_ROUTES) {
      const key = `${route.method} ${route.path}`;
      if (open.has(key)) continue;

      const url = route.path
        .replace(':playerId', adaId)
        .replace(':questId', 'a0-name-tag')
        .replace(':conceptId', 'print')
        .replace(':attemptId', '1')
        .replace(':jobId', '1')
        .replace(':area', '0');

      const response = await app.inject({ method: route.method, url, payload: {} });
      expect(
        response.statusCode,
        `${key} answered ${response.statusCode} without a token`,
      ).toBe(401);
    }
  });

  /* -----------------------------------------------------------------------------------------
   * Roles
   * --------------------------------------------------------------------------------------- */

  it('refuses the Console to a player who is not the DM', async () => {
    expect((await get('/api/players', adaToken)).statusCode).toBe(403);
  });

  it('allows the Console to the DM', async () => {
    const response = await get('/api/players', dmToken);
    expect(response.statusCode).toBe(200);
    expect((response.json() as { handle: string }[]).map((a) => a.handle).sort()).toEqual(['ada', 'dm']);
  });

  /**
   * The role is read now, not when the token was minted.
   *
   * `setRole` also signs that player out, so this is really two guarantees in one: the role is
   * fresh, and a token issued under the old role is already gone.
   */
  it('stops honouring a role the moment it is taken away', async () => {
    const { client } = scratch();
    expect((await get('/api/players', dmToken)).statusCode).toBe(200);
    await setRole(client, dmId, 'dm', false);
    expect((await get('/api/players', dmToken)).statusCode).toBe(401);
  });
});

/* -------------------------------------------------------------------------------------------
 * Signing in, and the bootstrap
 * ----------------------------------------------------------------------------------------- */

describe('getting a token in the first place', () => {
  const scratch = useMigratedDatabase('auth_signin');
  let app: FastifyInstance;

  beforeAll(async () => {
    const { client } = scratch();
    app = buildServer({ content: CONTENT, db: client, clock: () => NOW });
    await app.ready();
  }, 60_000);

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(async () => {
    const { client } = scratch();
    await client.query('DELETE FROM api_tokens');
    await client.query('DELETE FROM player_credentials');
    await client.query('DELETE FROM bootstrap_secret');
    await client.query('DELETE FROM player_roles');
    await client.query('DELETE FROM players');
  });

  const signIn = (body: Record<string, unknown>) =>
    app.inject({ method: 'POST', url: '/api/session', payload: body });

  it('exchanges a handle and password for a token that works', async () => {
    const { client } = scratch();
    await createPlayer(client, { handle: 'ada', displayName: 'Ada', password: 'ada pass' });

    const response = await signIn({ handle: 'ada', password: 'ada pass' });
    expect(response.statusCode).toBe(200);
    const grant = response.json() as { token: string; account: { handle: string } };
    expect(grant.account.handle).toBe('ada');

    const me = await app.inject({
      method: 'GET',
      url: '/api/me',
      headers: { authorization: `Bearer ${grant.token}` },
    });
    expect(me.statusCode).toBe(200);
  });

  it('refuses a wrong password and an unknown handle with one answer', async () => {
    const { client } = scratch();
    await createPlayer(client, { handle: 'ada', displayName: 'Ada', password: 'ada pass' });

    const wrong = await signIn({ handle: 'ada', password: 'not it' });
    const unknown = await signIn({ handle: 'nobody', password: 'not it' });
    expect(wrong.statusCode).toBe(401);
    expect(unknown.statusCode).toBe(401);
    expect(wrong.json()).toEqual(unknown.json());
  });

  it('does not echo the password back in any answer', async () => {
    const { client } = scratch();
    await createPlayer(client, { handle: 'ada', displayName: 'Ada', password: 'ada pass' });
    for (const body of [{ handle: 'ada', password: 'ada pass' }, { handle: 'ada', password: 'no' }]) {
      const response = await signIn(body);
      expect(response.body).not.toContain('ada pass');
      expect(response.body).not.toContain('scrypt');
    }
  });

  it('claims the DM seat with the printed secret, exactly once', async () => {
    const { client } = scratch();
    const secret = (await armBootstrap(client)) as string;

    const claim = {
      secret,
      handle: 'dm',
      displayName: 'The DM',
      password: 'the first password',
    };
    const first = await app.inject({ method: 'POST', url: '/api/session/bootstrap', payload: claim });
    expect(first.statusCode).toBe(200);
    expect((first.json() as { account: { roles: string[] } }).account.roles.sort()).toEqual([
      'dm',
      'player',
    ]);

    const second = await app.inject({
      method: 'POST',
      url: '/api/session/bootstrap',
      payload: { ...claim, handle: 'intruder' },
    });
    expect(second.statusCode).toBe(401);
  });

  it('refuses a bootstrap secret that was never armed', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/session/bootstrap',
      payload: { secret: 'invented', handle: 'dm', displayName: 'D', password: 'p' },
    });
    expect(response.statusCode).toBe(401);
  });
});

/* -------------------------------------------------------------------------------------------
 * The Console's three acts
 * ----------------------------------------------------------------------------------------- */

describe('the Console', () => {
  const scratch = useMigratedDatabase('auth_console');
  let app: FastifyInstance;
  let dmToken: string;
  let dmId: string;
  let adaId: string;

  beforeAll(async () => {
    const { client } = scratch();
    app = buildServer({ content: CONTENT, db: client, clock: () => NOW });
    await app.ready();
  }, 60_000);

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(async () => {
    const { client } = scratch();
    await client.query('DELETE FROM api_tokens');
    await client.query('DELETE FROM player_credentials');
    await client.query('DELETE FROM player_roles');
    await client.query('DELETE FROM players');
    dmId = (await createPlayer(client, { handle: 'dm', displayName: 'The DM', password: 'dm pass' })).id;
    await setRole(client, dmId, 'dm', true);
    adaId = (await createPlayer(client, { handle: 'ada', displayName: 'Ada', password: 'ada pass' })).id;
    dmToken = (await issueToken(client, dmId)).token;
  });

  const asDm = (method: 'GET' | 'POST', url: string, payload?: Record<string, unknown>) =>
    app.inject({ method, url, payload, headers: { authorization: `Bearer ${dmToken}` } });

  it('creates a player who is never a dm', async () => {
    const response = await asDm('POST', '/api/players', {
      handle: 'grace',
      displayName: 'Grace',
      password: 'grace pass',
    });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ handle: 'grace', roles: ['player'] });
  });

  it('refuses a handle somebody already has', async () => {
    const response = await asDm('POST', '/api/players', {
      handle: 'ada',
      displayName: 'Another Ada',
      password: 'x',
    });
    expect(response.statusCode).toBe(409);
  });

  /** A reset the learner will need on a Saturday morning, and it signs the old tokens out. */
  it('resets a password and signs that player out', async () => {
    const { client } = scratch();
    const adaToken = (await issueToken(client, adaId)).token;

    const response = await asDm('POST', `/api/players/${adaId}/password`, { password: 'a new one' });
    expect(response.statusCode).toBe(204);

    const stale = await app.inject({
      method: 'GET',
      url: '/api/me',
      headers: { authorization: `Bearer ${adaToken}` },
    });
    expect(stale.statusCode).toBe(401);

    const signIn = await app.inject({
      method: 'POST',
      url: '/api/session',
      payload: { handle: 'ada', password: 'a new one' },
    });
    expect(signIn.statusCode).toBe(200);
  });

  it('promotes a player to dm', async () => {
    const response = await asDm('POST', `/api/players/${adaId}/roles`, { role: 'dm', held: true });
    expect(response.statusCode).toBe(200);
    expect((response.json() as { roles: string[] }).roles.sort()).toEqual(['dm', 'player']);
  });

  /**
   * A household whose only DM demotes themselves has no way back: the bootstrap is spent, and
   * nobody left can promote anybody. The refusal is far cheaper than the recovery.
   */
  it('refuses to let the DM take the seat away from themselves', async () => {
    const response = await asDm('POST', `/api/players/${dmId}/roles`, { role: 'dm', held: false });
    expect(response.statusCode).toBe(403);
  });

  it('refuses all three acts to somebody who is not the DM', async () => {
    const { client } = scratch();
    const adaToken = (await issueToken(client, adaId)).token;
    const asAda = (method: 'GET' | 'POST', url: string, payload?: Record<string, unknown>) =>
      app.inject({ method, url, payload, headers: { authorization: `Bearer ${adaToken}` } });

    expect((await asAda('POST', '/api/players', { handle: 'x', displayName: 'X', password: 'p' })).statusCode).toBe(403);
    expect((await asAda('POST', `/api/players/${dmId}/password`, { password: 'p' })).statusCode).toBe(403);
    expect((await asAda('POST', `/api/players/${dmId}/roles`, { role: 'dm', held: false })).statusCode).toBe(403);
  });
});
