/**
 * The Fastify app: eleven of `API_ROUTES`' thirteen, plus health.
 *
 * **Two are deliberately absent.** `GET` and `POST /journal` are blocked by
 * `planning/backlog/feature_journal-text-has-no-column_2026-08-29.md`: `journal_entries` has
 * columns for a session date, a commit sha and an XP figure, and none for `prompt`, `body` or
 * `reply`. Three of `JournalEntry`'s five required fields have nowhere to come from, so the
 * routes are not registered and the 404 they produce is the honest answer. Serving an entry with
 * empty text would be worse: the Journal is §5.6's record of what a child thought, and a screen
 * of blanks reads as "you wrote nothing" rather than as "this is not built".
 *
 * **The clock is injected and it is not a query parameter.** §5.4's schedule is not negotiable by
 * the person it is scheduling, so no route accepts a date; the api reads its own clock and hands
 * the date to the engine, which takes one because §6.7 forbids it one of its own. `clock` exists
 * so a test can pin a Tuesday, which is a fixture at the engine boundary rather than a hole in a
 * public route.
 *
 * **`:playerId` is an assertion, not a credential**, and this plan says so out loud rather than
 * pretending otherwise. The api binds to the parent's machine on a household LAN and anyone on it
 * can claim to be anyone. That is acceptable for two people at a kitchen table and is not
 * acceptable for the classroom mode the modes backlog anticipates; the identity story belongs
 * with that decision, not ahead of it.
 */

import { AREAS, type Area } from '@pyquest/content';
import {
  ApiErrorSchema,
  AreaViewSchema,
  CampaignViewSchema,
  DrillResultSchema,
  DrillOutcomeSchema,
  JobAcceptedSchema,
  JobViewSchema,
  PartyViewSchema,
  PendingSignoffsSchema,
  QuestViewSchema,
  SignoffAwardSchema,
  SignoffRequestSchema,
  SubmitRequestSchema,
  TomeSchema,
  type ApiErrorCode,
  type JobResult,
  type JobState,
  type PlayerProgress,
  type RunnerJobStatus,
} from '@pyquest/contract';
import { bounties, playerProgress, players } from '@pyquest/db';
import {
  dueInvasions,
  intervalDays,
  medalDelta,
  nextRung,
  standings,
  type ScaledXpKind,
} from '@pyquest/engine';
import Fastify, { type FastifyInstance } from 'fastify';
import { ApiFailure, asFailure, notFound } from './errors.ts';
import { pricedKind, type ContentRoot } from './content.ts';
import { randomUUID } from 'node:crypto';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { exportTree, syncCheckout } from './checkout.ts';
import type { Spool } from './dispatcher.ts';
import type { Gitea, GiteaRepo } from './gitea.ts';
import { readSignal } from './gitsignal.ts';
import {
  awardMedal,
  clearForcedReviews,
  enqueueJob,
  job as readJob,
  lastAttemptAt,
  pendingSignoff,
  pendingSignoffs,
  playerRoles,
  recordAttempt,
  recordReview,
  resolveSignoff,
  attemptDetail,
  type Writable,
} from './store.ts';
import { areaView, campaignView, questView, tomeAreas } from './views.ts';

/**
 * The storage state a client sees.
 *
 * The whole of the translation, and the reason it is a function rather than an inline ternary in
 * one handler: `progress.ts` types the column in storage states and `endpoints.ts` types what the
 * client sees, and a second handler writing its own ternary is how the two vocabularies start
 * disagreeing. `claimed` is the only storage detail — a worker has the row, which no screen can
 * use. `killed` passes through, because running out of room is not being wrong.
 */
export function jobStateFor(status: RunnerJobStatus): JobState {
  return status === 'claimed' ? 'running' : status;
}

export interface ServerOptions {
  readonly content: ContentRoot;
  readonly db: Writable;
  /** Injected so a suite can pin a date. Never reachable from a request. */
  readonly clock?: () => Date;
  /**
   * Gitea, for the two verifiers that read the learner's repository.
   *
   * Optional, because the other eleven routes have nothing to do with git and an api that refused
   * to boot without a token would take the whole campaign down over two quests in Area 2. Absent,
   * `local-repo` and `git-signal` refuse with a stated reason and record nothing.
   */
  readonly gitea?: Gitea;
  /**
   * The spool, so `local-repo` can put the exported tree where the runner will find it.
   *
   * Optional for the same reason `gitea` is: the eleven routes that are not Submit do not need
   * one, and a suite that only reads should not have to invent a directory to get them.
   */
  readonly spool?: Spool;
  /** `/workspaces/` — one clone per player lives under it. See `checkout.ts`. */
  readonly workspaceRoot?: string;
  readonly logger?: boolean;
}

/**
 * How large an exported repository may be before Submit refuses it.
 *
 * The runner unpacks it onto a 64 MB tmpfs, so a repository bigger than this does not fail in the
 * sandbox — it fails the *next* job too, by filling the memory that one needed. Refusing it here
 * is the difference between one learner being told his repository is too big and every submission
 * after his being killed for no reason he can see.
 */
const MAX_EXPORT_BYTES = 24 * 1024 * 1024;

/** ISO calendar date in UTC. The engine takes `now` as a string and this is where it comes from. */
const today = (clock: () => Date): string => (clock().toISOString().split('T')[0] as string);

function asArea(raw: string): Area {
  const parsed = Number(raw);
  const area = AREAS.find((candidate) => candidate === parsed);
  if (area === undefined) throw notFound(`area ${raw}`);
  return area;
}

/** One player by id, or a 404. A player id that is not a uuid is not a player. */
async function playerFor(db: Writable, playerId: string): Promise<{ id: string; handle: string }> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playerId)) {
    throw notFound(`player ${playerId}`);
  }
  const found = (await players(db)).find((player) => player.id === playerId);
  if (found === undefined) throw notFound(`player ${playerId}`);
  return found;
}

/** Progress for one player, or a 404. */
async function progressFor(db: Writable, playerId: string): Promise<PlayerProgress> {
  await playerFor(db, playerId);
  return playerProgress(db, playerId);
}

export function buildServer(options: ServerOptions): FastifyInstance {
  const { content, db } = options;
  const clock = options.clock ?? ((): Date => new Date());
  const app = Fastify({ logger: options.logger ?? false });

  /**
   * The Gitea client, or a refusal that records nothing.
   *
   * `internal` rather than `verifier-failed`, and the distinction is the whole reason this is a
   * function. A missing token is the parent's configuration, not the learner's work; recording it
   * as a failed attempt would write a scar for a verifier that never ran, into the one record
   * §3.5 says is never edited.
   */
  function requireGitea(what: string): Gitea {
    if (options.gitea === undefined) {
      throw new ApiFailure(
        'internal',
        `${what} reads the player's git repository, and this api has no GITEA_TOKEN configured`,
      );
    }
    return options.gitea;
  }

  function requireRepo(client: Gitea, handle: string): GiteaRepo {
    const repo = client.repoFor(handle);
    if (repo === undefined) {
      throw new ApiFailure(
        'internal',
        `no git repository is configured for ${handle} — set PLAYER_REPOS, e.g. ${handle}=${handle}/quests`,
      );
    }
    return repo;
  }

  /**
   * Phase 4's step 2, for a verifier that resolved without the runner.
   *
   * The engine prices the delta and exactly that number is written. A medal already held pays
   * nothing and is not an error: §5.10 pays the difference once, and a zero payout is a brag
   * rather than a refusal — which is the UI's sentence to write, not this one's.
   *
   * `kind` travels beside `dc` rather than being looked up from `questId`, because this function
   * takes a bare DC and a bare id — and a rate inferred here would be a second place that
   * decides what a boss pays. The caller holds the `ContentItem`; it narrows and passes both.
   */
  async function awardCleared(
    kind: ScaledXpKind,
    questId: string,
    dc: number,
    playerId: string,
  ): Promise<number> {
    const progress = await playerProgress(db, playerId);
    const held = progress.questMedals.filter((row) => row.questId === questId).map((row) => row.medal);
    const xpAwarded = medalDelta(kind, dc, held, 'cleared');
    await awardMedal(db, {
      playerId,
      questId,
      medal: 'cleared',
      earnedAt: today(clock),
      xpAwarded,
    });
    return xpAwarded;
  }

  /**
   * One error shape on the way out, whatever went wrong on the way in.
   *
   * Fastify's own 400 for a malformed body is remapped too: a client that gets `{ statusCode,
   * error, message }` from one route and `{ code, message, retryable }` from another has two
   * error shapes to parse, which is exactly the outcome `endpoints.ts` refuses.
   */
  app.setErrorHandler((error, _request, reply) => {
    const failure = asFailure(error);
    if (failure.code === 'internal') app.log.error({ err: error }, 'unhandled failure');
    return reply.code(failure.status).send(failure.body());
  });

  app.setNotFoundHandler((request, reply) =>
    reply.code(404).send(
      ApiErrorSchema.parse({
        code: 'not-found',
        message: `no route for ${request.method} ${request.url}`,
        retryable: false,
      }),
    ),
  );

  /** Liveness only. It does not touch Postgres, so it stays true while the database is restarting. */
  app.get('/health', async () => ({ status: 'ok', items: content.items.length }));

  /* ---------------------------------------------------------------------------------------
   * The map and the area screen
   * ------------------------------------------------------------------------------------- */

  app.get<{ Params: { playerId: string } }>(
    '/api/players/:playerId/campaign',
    async (request) => {
      const progress = await progressFor(db, request.params.playerId);
      return CampaignViewSchema.parse(campaignView(content, progress));
    },
  );

  app.get<{ Params: { playerId: string; area: string } }>(
    '/api/players/:playerId/areas/:area',
    async (request) => {
      const progress = await progressFor(db, request.params.playerId);
      const view = areaView(content, progress, asArea(request.params.area));
      if (view === undefined) throw notFound(`area ${request.params.area}`);
      return AreaViewSchema.parse(view);
    },
  );

  app.get<{ Params: { playerId: string; questId: string } }>(
    '/api/players/:playerId/quests/:questId',
    async (request) => {
      const progress = await progressFor(db, request.params.playerId);
      const item = content.item(request.params.questId);
      if (item === undefined) throw notFound(`quest ${request.params.questId}`);
      return QuestViewSchema.parse(questView(content, item, progress));
    },
  );

  /* ---------------------------------------------------------------------------------------
   * Submit — one route, four verifiers (§6.3)
   * ------------------------------------------------------------------------------------- */

  /**
   * Which verifier runs is a property of the quest, not of the URL the client picked.
   *
   * A body whose `type` disagrees with the quest's verifier is refused rather than coerced: a
   * client that could pick `peer-signoff` on a `hidden-tests` quest could take a medal by asking
   * a person instead of passing the tests, which is not a bug in the client so much as an
   * invitation this route declines to send.
   */
  app.post<{ Params: { playerId: string; questId: string } }>(
    '/api/players/:playerId/quests/:questId/submit',
    async (request, reply) => {
      const { playerId, questId } = request.params;
      const player = await playerFor(db, playerId);

      const item = content.item(questId);
      if (item === undefined) throw notFound(`quest ${questId}`);

      const parsed = SubmitRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiFailure('verifier-failed', 'that submission is not a shape this api accepts', {
          details: { issues: parsed.error.issues.map((issue) => issue.message) },
        });
      }
      const body = parsed.data;

      const mismatch = (): ApiFailure =>
        new ApiFailure(
          'verifier-failed',
          `${questId} is verified by ${item.verifier.type}, and this submission is a ${body.type}`,
        );

      /**
       * The switch is on the *quest's* verifier, never on the body's.
       *
       * A client that could choose would choose the cheapest: `peer-signoff` on a `hidden-tests`
       * quest takes the medal by asking a person instead of by passing the tests. So the quest
       * decides and the body is checked against it, which is also what a fifth verifier in
       * content will arrive here as — a missing case, at compile time.
       */
      switch (item.verifier.type) {
        case 'peer-signoff': {
          if (body.type !== 'peer-signoff') throw mismatch();
          const attemptId = await recordAttempt(db, {
            playerId,
            questId,
            passed: false,
            detail: attemptDetail.awaitingSignoff(item.verifier.by),
          });
          return reply
            .code(202)
            .send(JobAcceptedSchema.parse({ jobId: attemptId, state: 'queued' }));
        }

        case 'hidden-tests': {
          if (body.type !== 'hidden-tests') throw mismatch();
          /**
           * The payload carries the code and identifiers, never the tests. The tests are content,
           * they live in git, and a copy in Postgres would be both a §6.7 violation and stale the
           * moment somebody edits the file.
           */
          const jobId = await enqueueJob(db, {
            playerId,
            questId,
            payload: {
              verifier: 'hidden-tests',
              questId,
              tests: item.verifier.tests,
              code: body.code,
            },
          });
          return reply.code(202).send(JobAcceptedSchema.parse({ jobId, state: 'queued' }));
        }

        /**
         * `git-signal` resolves here and now, because there is nothing to run.
         *
         * The evidence is the history, the history is already on the server, and the answer is a
         * read. So Submit returns a terminal state with a `200` rather than a `202` and an id to
         * poll: there is no job, and telling a client to poll for an answer it already has is how
         * a screen ends up saying "working" about something that finished.
         */
        case 'git-signal': {
          if (body.type !== 'git-signal') throw mismatch();
          const client = requireGitea('git-signal');
          const repo = requireRepo(client, player.handle);
          const since = await lastAttemptAt(db, playerId, questId);

          let evidence;
          try {
            evidence = await readSignal(client, repo, item.verifier.signal, { since });
          } catch (cause) {
            /** Gitea refused. Not the learner's failure, so no scar — see `requireGitea`. */
            throw new ApiFailure(
              'internal',
              `gitea could not be read for ${repo.owner}/${repo.name}`,
              { cause },
            );
          }

          /** Every outcome writes an attempts row, pass or fail (§5.3, §3.5). */
          const attemptId = await recordAttempt(db, {
            playerId,
            questId,
            passed: evidence.satisfied,
            detail: attemptDetail.gitSignal(item.verifier.signal, evidence),
          });

          if (evidence.satisfied) await awardCleared(pricedKind(item), item.id, item.dc, playerId);

          return reply
            .code(200)
            .send(
              JobAcceptedSchema.parse({
                jobId: attemptId,
                state: evidence.satisfied ? 'passed' : 'failed',
              }),
            );
        }

        /**
         * `local-repo` — the api pulls what he pushed and the runner grades it (§6.4).
         *
         * The clone happens here rather than in the dispatcher, and that placement is the point:
         * a repository that cannot be reached, a ref that does not exist, or a tree too large for
         * the sandbox are all things to tell the person who just pressed the button, in the
         * response to the press. Discovered a tick later in a background pump they become a job
         * that quietly died.
         *
         * No `attempts` row is written here. The verdict comes from the runner, and Phase 4 writes
         * exactly one row from it — recording a second one at submit time would double every scar
         * §5.3 counts.
         */
        case 'local-repo': {
          if (body.type !== 'local-repo') throw mismatch();
          const client = requireGitea('local-repo');
          const repo = requireRepo(client, player.handle);
          if (options.spool === undefined || options.workspaceRoot === undefined) {
            throw new ApiFailure(
              'internal',
              'local-repo needs SPOOL_ROOT and WORKSPACE_ROOT, and this api has neither',
            );
          }

          let checkout;
          try {
            checkout = syncCheckout({
              root: options.workspaceRoot,
              handle: player.handle,
              cloneUrl: client.cloneUrl(repo),
              ref: body.ref,
            });
          } catch (cause) {
            /** git refused. Not the learner failing a test, so no scar — see `requireGitea`. */
            throw new ApiFailure(
              'internal',
              `the api could not check out ${repo.owner}/${repo.name}: ${
                cause instanceof Error ? cause.message : String(cause)
              }`,
              { cause },
            );
          }

          options.spool.ensure();
          const relative = `repos/${randomUUID()}.tar`;
          const absolute = join(options.spool.root, relative);
          const bytes = exportTree(checkout, absolute, item.verifier.path);
          if (bytes > MAX_EXPORT_BYTES) {
            rmSync(absolute, { force: true });
            throw new ApiFailure(
              'verifier-failed',
              `${repo.owner}/${repo.name} exports ${Math.round(bytes / 1_048_576)} MB, and the sandbox has room for ${MAX_EXPORT_BYTES / 1_048_576} MB`,
            );
          }

          const jobId = await enqueueJob(db, {
            playerId,
            questId,
            payload: {
              verifier: 'local-repo',
              questId,
              /** The path to the tests, never the tests: they are content and content is in git. */
              tests: item.verifier.tests,
              repoTar: relative,
              ref: checkout.ref,
              sha: checkout.sha,
            },
          });
          return reply.code(202).send(JobAcceptedSchema.parse({ jobId, state: 'queued' }));
        }
      }
    },
  );

  app.get<{ Params: { jobId: string } }>('/api/jobs/:jobId', async (request) => {
    if (!/^\d+$/.test(request.params.jobId)) throw notFound(`job ${request.params.jobId}`);
    const row = await readJob(db, request.params.jobId);
    if (row === undefined) throw notFound(`job ${request.params.jobId}`);

    return JobViewSchema.parse({
      jobId: row.id,
      playerId: row.playerId,
      questId: row.questId,
      state: jobStateFor(row.status),
      result: (row.result as JobResult | null) ?? null,
      errorCode: (row.errorCode as ApiErrorCode | null) ?? null,
      attemptId: row.attemptId,
    });
  });

  /* ---------------------------------------------------------------------------------------
   * Defend — §5.4
   * ------------------------------------------------------------------------------------- */

  app.get<{ Params: { playerId: string } }>('/api/players/:playerId/defend', async (request) => {
    const progress = await progressFor(db, request.params.playerId);
    return dueInvasions(progress, today(clock));
  });

  /**
   * The drill's outcome. The engine returns the rung and the interval; this stores both.
   *
   * `nextRung` is called and its answer written — not `rung + 1`, which is the same number today
   * and stops being the same number the first time §5.4's ladder is retuned.
   */
  app.post<{ Params: { playerId: string; conceptId: string } }>(
    '/api/players/:playerId/defend/:conceptId',
    async (request) => {
      const { playerId, conceptId } = request.params;
      const progress = await progressFor(db, playerId);

      const parsed = DrillResultSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiFailure('verifier-failed', 'a drill result is { repelled: boolean } and nothing else');
      }

      const current = progress.conceptReviews.find((review) => review.conceptId === conceptId);
      if (current === undefined) throw notFound(`concept ${conceptId} on this player's ladder`);

      const now = today(clock);
      const rung = nextRung(current.rung, parsed.data.repelled);
      await recordReview(db, { playerId, conceptId, lastReviewedAt: now, rung });
      await clearForcedReviews(db, { playerId, conceptId, upTo: now });

      const dueOn = new Date(`${now}T00:00:00Z`);
      dueOn.setUTCDate(dueOn.getUTCDate() + intervalDays(rung));

      return DrillOutcomeSchema.parse({
        conceptId,
        rung,
        dueOn: dueOn.toISOString().split('T')[0],
        /** §5.1 prices an invasion flat, and only a repelled one is work done. */
        xpAwarded: parsed.data.repelled ? 5 : 0,
      });
    },
  );

  /* ---------------------------------------------------------------------------------------
   * The Party screen — §5.8
   * ------------------------------------------------------------------------------------- */

  app.get<{ Params: { playerId: string }; Querystring: { area?: string } }>(
    '/api/players/:playerId/party',
    async (request) => {
      await progressFor(db, request.params.playerId);
      const roster = await players(db);
      const everyone = await Promise.all(roster.map((player) => playerProgress(db, player.id)));
      const area = request.query.area === undefined ? 0 : asArea(request.query.area);

      return PartyViewSchema.parse({
        standings: standings(content.items, everyone, area),
        /** Declined by this plan and owed by the engine — see `endpoints.ts`. Empty, not absent. */
        xpSources: [],
        bounties: (await bounties(db)).map((bounty) => ({
          id: bounty.id,
          title: bounty.title,
          xp: bounty.xp,
          state: bounty.state,
          postedBy: bounty.postedBy,
          claimedBy: bounty.claimedBy,
          postedAt: bounty.postedAt,
        })),
      });
    },
  );

  /* ---------------------------------------------------------------------------------------
   * The Tome — content, and only content
   * ------------------------------------------------------------------------------------- */

  app.get('/api/tome', async () => TomeSchema.parse({ areas: tomeAreas() }));

  /* ---------------------------------------------------------------------------------------
   * Sign-offs — §6.3, §5.11
   * ------------------------------------------------------------------------------------- */

  app.get('/api/signoffs', async () => {
    const queue = await pendingSignoffs(db);
    return PendingSignoffsSchema.parse(
      queue.map((row) => ({
        ...row,
        questTitle: content.item(row.questId)?.title ?? row.questId,
      })),
    );
  });

  /**
   * Resolve one sign-off, with the two checks that make it a verification rather than a formality.
   *
   * The approver may not be the submitter — a teach-back you sign off yourself teaches nothing —
   * and they must hold the role the quest's `by` field names, checked against `player_roles`
   * rather than against a name. §5.11's teach-back runs both directions, and the role check is
   * what makes that the same mechanism instead of a special case.
   */
  app.post<{ Params: { attemptId: string } }>('/api/signoffs/:attemptId', async (request) => {
    const { attemptId } = request.params;
    const parsed = SignoffRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ApiFailure('signoff-denied', 'a sign-off names the player granting it, and whether it was granted');
    }
    const { by, granted, note } = parsed.data;

    const pending = await pendingSignoff(db, attemptId);
    if (pending === undefined) throw notFound(`pending sign-off ${attemptId}`);

    if (pending.playerId === by) {
      throw new ApiFailure('signoff-denied', 'a player cannot sign off their own submission (§6.3)');
    }

    const roles = await playerRoles(db, by);
    if (pending.by === 'dm' && !roles.includes('dm')) {
      throw new ApiFailure('signoff-denied', 'this quest is signed off by the DM seat (§5.11)');
    }
    if (pending.by === 'peer' && !roles.includes('player')) {
      throw new ApiFailure('signoff-denied', 'this quest is signed off by another player (§5.11)');
    }

    const resolved = await resolveSignoff(db, { attemptId, by, granted, ...(note === undefined ? {} : { note }) });
    if (!resolved) throw notFound(`pending sign-off ${attemptId}`);

    if (!granted) {
      throw new ApiFailure('signoff-denied', 'the sign-off was not granted');
    }

    const item = content.item(pending.questId);
    if (item === undefined) {
      throw new ApiFailure('content-invalid', `${pending.questId} is not in the content root`);
    }

    /**
     * The engine decides, the api records. `medalDelta` returns the number; `awardMedal` writes
     * exactly that number and never one computed here.
     */
    const progress = await playerProgress(db, pending.playerId);
    const held = progress.questMedals.filter((row) => row.questId === item.id).map((row) => row.medal);
    const xpAwarded = medalDelta(pricedKind(item), item.dc, held, 'cleared');

    const written = await awardMedal(db, {
      playerId: pending.playerId,
      questId: item.id,
      medal: 'cleared',
      earnedAt: today(clock),
      xpAwarded,
    });
    if (!written) throw new ApiFailure('already-awarded', `${item.id} is already cleared`);

    return SignoffAwardSchema.parse({
      attemptId,
      questId: item.id,
      medal: 'cleared',
      xpAwarded,
    });
  });

  return app;
}
