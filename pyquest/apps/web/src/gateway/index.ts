import {
  AreaIdentitiesSchema,
  AreaProgressSchema,
  AvailableQuestsSchema,
  BossStateSchema,
  DueInvasionsSchema,
  LevelSchema,
  StandingsSchema,
  XpSourcesSchema,
  type AreaIdentity,
  type AreaProgress,
  type BossState,
  type DueInvasion,
  type Level,
  type QuestCard,
  type Standing,
  type XpSource,
} from '@pyquest/contract';
import * as fixtures from '../fixtures/index.ts';

/**
 * The one module that knows where data comes from.
 *
 * Phase 2 answers from `../fixtures`; Phase 5 answers from the API. Nothing else in the app
 * changes when that happens, which is only true because nothing else in the app is allowed to
 * reach past this file — `boundary.test.ts` is what makes "allowed" mean something.
 *
 * **Every function parses.** Returning the fixture unchanged would typecheck and render, and
 * would also let a payload that violates the §5.4 cap, or names an area twice, or drops a
 * required field reach a screen. The schemas hold rules the compiler cannot see, and `.parse()`
 * is the only thing that runs them. That is the difference between a stub and a lie about
 * what the API will send.
 *
 * The parse functions are exported alongside the getters so the drift can be tested directly,
 * rather than only through whatever the fixture happens to contain today.
 */

/* -------------------------------------------------------------------------------------------
 * Parsers — exported so a test can hand them something wrong on purpose
 * ----------------------------------------------------------------------------------------- */

export const parseAreaIdentities = (raw: unknown): AreaIdentity[] =>
  AreaIdentitiesSchema.parse(raw);

export const parseAvailableQuests = (raw: unknown): QuestCard[] =>
  AvailableQuestsSchema.parse(raw);

export const parseDueInvasions = (raw: unknown): DueInvasion[] => DueInvasionsSchema.parse(raw);

export const parseStandings = (raw: unknown): Standing[] => StandingsSchema.parse(raw);

export const parseXpSources = (raw: unknown): XpSource[] => XpSourcesSchema.parse(raw);

export const parseAreaProgress = (raw: unknown): AreaProgress => AreaProgressSchema.parse(raw);

export const parseBossState = (raw: unknown): BossState => BossStateSchema.parse(raw);

export const parseLevel = (raw: unknown): Level => LevelSchema.parse(raw);

/* -------------------------------------------------------------------------------------------
 * The surfaces the screens read
 * ----------------------------------------------------------------------------------------- */

/** Every area, named. The Map draws all eight; the Area screen and its crumbs take one. */
export const getAreaIdentities = (): AreaIdentity[] =>
  parseAreaIdentities(fixtures.areaIdentities);

/** One area's identity, or `undefined` for an area id that is not in the campaign. */
export const getAreaIdentity = (area: number): AreaIdentity | undefined =>
  getAreaIdentities().find((a) => a.area === area);

export const getAreaProgress = (area: number): AreaProgress =>
  parseAreaProgress(fixtures.areaProgress[area]);

export const getBossState = (area: number): BossState =>
  parseBossState(fixtures.bossState[area]);

/** An area with no authored quests yet answers with an empty board rather than throwing. */
export const getAvailableQuests = (area: number): QuestCard[] =>
  parseAvailableQuests(fixtures.availableQuests[area] ?? []);

export const getDueInvasions = (): DueInvasion[] => parseDueInvasions(fixtures.dueInvasions);

export const getStandings = (): Standing[] => parseStandings(fixtures.standings);

export const getLevel = (): Level => parseLevel(fixtures.level);

/**
 * **The one surface that never becomes a fetch.** No engine function and no endpoint stands
 * behind `xpSources` yet, so Phase 5 swaps the eight above and leaves this one exactly as it
 * is. It parses like the rest, because the shape is real even though the source is not.
 */
export const getXpSources = (): XpSource[] => parseXpSources(fixtures.xpSources);
