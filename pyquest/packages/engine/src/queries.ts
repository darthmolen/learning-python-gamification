/**
 * The query layer — spec §6.7's projections over state and content.
 *
 * The arithmetic these sit on was built first and mutation-tested (`scoring.ts`, `invasions.ts`,
 * `level.ts`). This module is the projection that was deliberately deferred until real screens
 * could say what it must return, and every shape here traces to an artboard in
 * `docs/design/pyquest/` rather than to a guess.
 *
 * Still no I/O, no database, no network and no clock. Content arrives parsed, progress arrives
 * as rows, and "now" arrives as an ISO date string. A function here that needs a third source is
 * reaching for something it should have been handed.
 *
 * The contract is imported for **types only**. Under `verbatimModuleSyntax` those imports are
 * erased, so nothing puts zod on this package's runtime path — the engine validates nothing, it
 * computes. A value import from `@pyquest/contract` into this directory is the thing to refuse.
 */

import { conceptArea, type AreaManifest, type ContentItem, type Medal } from '@pyquest/content';
import type {
  AreaProgress,
  BossState,
  DueInvasion,
  InvasionSource,
  PlayerProgress,
  QuestCard,
  QuestStatus,
  Standing,
} from '@pyquest/contract';
import { QUESTS_TO_UNLOCK_BOSS, bossUnlocked } from './scoring.ts';
import { intervalDays } from './invasions.ts';
import { levelAt } from './level.ts';

/* -------------------------------------------------------------------------------------------
 * Dates, without a clock
 * ----------------------------------------------------------------------------------------- */

const MS_PER_DAY = 86_400_000;

/**
 * An ISO calendar date as a whole number of days.
 *
 * Parsed field by field into a UTC timestamp rather than handed to `new Date(string)`, whose
 * behaviour depends on the host's timezone: a session that starts at 9pm in one zone and 4am in
 * another must not disagree about whether a concept is due. `Date.UTC` is arithmetic on a given
 * string, not a clock read, so §6.7 holds.
 */
function toDayNumber(iso: string): number {
  const [year, month, day] = iso.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) return Number.NaN;
  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

/** Whole days from `from` to `to`. Negative when `to` is the earlier of the two. */
function daysBetween(from: string, to: string): number {
  return toDayNumber(to) - toDayNumber(from);
}

/* -------------------------------------------------------------------------------------------
 * Shared reductions
 * ----------------------------------------------------------------------------------------- */

/** Every medal held per quest, in the order the rows arrive. */
function medalsByQuest(progress: PlayerProgress): ReadonlyMap<string, Medal[]> {
  const byQuest = new Map<string, Medal[]>();
  for (const row of progress.questMedals) {
    const held = byQuest.get(row.questId);
    if (held === undefined) byQuest.set(row.questId, [row.medal]);
    else held.push(row.medal);
  }
  return byQuest;
}

/**
 * The ids a player has cleared.
 *
 * §5.10: "Only Cleared unlocks anything." A quest carrying Ironman but not Cleared has not been
 * completed, so it neither counts toward the boss nor satisfies a prerequisite.
 */
function clearedIds(progress: PlayerProgress): ReadonlySet<string> {
  const ids = new Set<string>();
  for (const row of progress.questMedals) if (row.medal === 'cleared') ids.add(row.questId);
  return ids;
}

const questsIn = (items: readonly ContentItem[], area: number): readonly ContentItem[] =>
  items.filter((item) => item.kind === 'quest' && item.area === area);

const clearedCountIn = (items: readonly ContentItem[], progress: PlayerProgress, area: number): number => {
  const done = clearedIds(progress);
  return questsIn(items, area).filter((quest) => done.has(quest.id)).length;
};

/* -------------------------------------------------------------------------------------------
 * availableQuests — the Area screen
 * ----------------------------------------------------------------------------------------- */

/**
 * The area's quests as cards, in authored order.
 *
 * Ordering is the content's, not a ranking: §5.2 gives the player five quests and lets them
 * choose which three, so sorting by difficulty or by status would be the engine nudging a choice
 * the spec hands to him.
 *
 * `risky` is absent by construction. §5.1 puts the DC >= 20 warning in the UI, and a boolean
 * stored beside the number that implies it can only ever come to disagree with it.
 */
export function availableQuests(
  items: readonly ContentItem[],
  progress: PlayerProgress,
  area: number,
): QuestCard[] {
  const done = clearedIds(progress);
  const held = medalsByQuest(progress);

  return questsIn(items, area).map((quest) => {
    const status: QuestStatus = done.has(quest.id)
      ? 'cleared'
      : quest.requires.every((id) => done.has(id))
        ? 'available'
        : 'locked';

    return {
      id: quest.id,
      title: quest.title,
      dc: quest.dc,
      concepts: [...quest.concepts],
      medals: held.get(quest.id) ?? [],
      status,
    };
  });
}

/* -------------------------------------------------------------------------------------------
 * areaProgress — spec §5.1a
 * ----------------------------------------------------------------------------------------- */

/**
 * Cleared of total, with the honesty flag §5.1a requires.
 *
 * When an area is partially authored the total is the manifest's estimate — except that an
 * estimate can be overtaken. Six authored and cleared against an estimate of five would report
 * "6 of 5", which is worse than either number alone, so the total is held at no less than what
 * has actually been done. The area still reports as an estimate, because it still is one.
 */
export function areaProgress(
  items: readonly ContentItem[],
  manifest: AreaManifest,
  progress: PlayerProgress,
  area: number,
): AreaProgress {
  const authored = questsIn(items, area).length;
  const cleared = clearedCountIn(items, progress, area);
  const estimated = manifest.authoring === 'partial';
  const total = estimated
    ? Math.max(manifest.estimatedQuests ?? authored, authored, cleared)
    : authored;

  return { cleared, total, estimated };
}

/* -------------------------------------------------------------------------------------------
 * bossState — spec §5.2
 * ----------------------------------------------------------------------------------------- */

/**
 * How close the boss is, not merely whether it is open.
 *
 * The map and the area screen both draw the distance, so returning a boolean would force both to
 * recount. `unlocked` comes from `bossUnlocked` rather than from a second comparison written
 * here — one rule, one home.
 */
export function bossState(
  items: readonly ContentItem[],
  progress: PlayerProgress,
  area: number,
): BossState {
  const cleared = clearedCountIn(items, progress, area);
  return { cleared, required: QUESTS_TO_UNLOCK_BOSS, unlocked: bossUnlocked(cleared) };
}

/* -------------------------------------------------------------------------------------------
 * dueInvasions — spec §5.4 and §5.5
 * ----------------------------------------------------------------------------------------- */

/**
 * §5.4 shows three to five drills in a session; five is the ceiling.
 *
 * Restated from the contract rather than imported, for the same reason the contract restates the
 * ladder bound: a value import would put the contract on this package's runtime path. The
 * engine's suite asserts the two agree.
 */
const INVASION_QUEUE_CAP = 5;

interface Due {
  conceptId: string;
  area: DueInvasion['area'];
  lastSeen: string;
  overdueDays: number;
  source: InvasionSource;
}

/**
 * The session's Defend queue, merged from the two schedules that can produce one.
 *
 * The ladder (§5.4) says a concept at a given rung may go so many days untouched. A Datamine
 * (§5.5) schedules forced reviews regardless of the rung, which is the point of it — the ladder
 * would otherwise let a concept the player just failed sit for sixteen days.
 *
 * A concept can be overdue on both at once, and it is then **one entry carrying `both`**. At a
 * cap of five, letting it take two slots costs a fifth of the session for no extra retrieval.
 */
export function dueInvasions(progress: PlayerProgress, now: string): DueInvasion[] {
  const byConcept = new Map<string, Due>();

  for (const review of progress.conceptReviews) {
    const overdueDays = daysBetween(review.lastReviewedAt, now) - intervalDays(review.rung);
    if (overdueDays < 0) continue;
    byConcept.set(review.conceptId, {
      conceptId: review.conceptId,
      area: conceptArea(review.conceptId) ?? 0,
      lastSeen: review.lastReviewedAt,
      overdueDays,
      source: 'ladder',
    });
  }

  for (const forced of progress.forcedReviews) {
    const overdueDays = daysBetween(forced.dueOn, now);
    if (overdueDays < 0) continue;

    const onLadder = byConcept.get(forced.conceptId);
    if (onLadder !== undefined) {
      // Both fired. The more overdue of the two is the honest number, and `both` is what stops
      // the merge from being indistinguishable from a dropped review.
      byConcept.set(forced.conceptId, {
        ...onLadder,
        overdueDays: Math.max(onLadder.overdueDays, overdueDays),
        source: 'both',
      });
      continue;
    }

    const review = progress.conceptReviews.find((r) => r.conceptId === forced.conceptId);
    // A ladder row is written when a concept is first taught, so a forced review without one
    // describes a player who never met the concept. Skipped rather than thrown: a corrupt row
    // should not stop a session, which is the argument `levelAt` already makes.
    if (review === undefined) continue;

    byConcept.set(forced.conceptId, {
      conceptId: forced.conceptId,
      area: conceptArea(forced.conceptId) ?? 0,
      lastSeen: review.lastReviewedAt,
      overdueDays,
      source: 'datamine',
    });
  }

  return [...byConcept.values()]
    .sort((a, b) => b.overdueDays - a.overdueDays || a.conceptId.localeCompare(b.conceptId))
    .slice(0, INVASION_QUEUE_CAP);
}

/* -------------------------------------------------------------------------------------------
 * standings — the completion board, spec §5.8
 * ----------------------------------------------------------------------------------------- */

/**
 * The completion board: what each player cleared and which medals they took.
 *
 * §5.8 as ruled on 2026-08-29 — a record, not a race. There is no rank here and no ordering
 * claim; rows come back in the order the players were passed. There is no display name either,
 * because §6.2 keys on `player_id` and joining a roster is the API's job, not this module's.
 *
 * XP is summed from `xpAwarded` and never re-derived. §5.10 prices a medal's delta once, at the
 * moment it is earned, so recomputing it from today's DC would report a figure the player was
 * never paid and would disagree with every row already stored.
 */
export function standings(
  items: readonly ContentItem[],
  players: readonly PlayerProgress[],
  area: number,
): Standing[] {
  const areasWithContent = [...new Set(items.filter((i) => i.kind === 'quest').map((i) => i.area))].sort(
    (a, b) => a - b,
  );

  return players.map((progress) => {
    const totalXp = progress.questMedals.reduce((sum, row) => sum + row.xpAwarded, 0);
    const { level, toNext } = levelAt(totalXp);

    const questArea = new Map(items.map((item) => [item.id, item.area]));
    const areaXp = progress.questMedals
      .filter((row) => questArea.get(row.questId) === area)
      .reduce((sum, row) => sum + row.xpAwarded, 0);

    return {
      playerId: progress.playerId,
      level,
      toNext,
      areaXp,
      areas: areasWithContent.map((n) => ({
        area: n,
        cleared: clearedCountIn(items, progress, n),
        // Every medal taken in the area, duplicates included: three Ironmen are three entries.
        // A distinct set would lose the count the Party screen's bars are drawn from.
        medals: progress.questMedals
          .filter((row) => questArea.get(row.questId) === n)
          .map((row) => row.medal),
      })),
    };
  });
}
