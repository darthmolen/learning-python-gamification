/**
 * `packages/engine` — spec §6.7.
 *
 * Pure functions over state and content: no I/O, no database, no network, no clock. Two layers,
 * built in that order for a reason. The arithmetic the spec pins to the number — §5.1's effective
 * DC and XP, §5.10's medal payment, §5.12's legality rule, §5.2's boss unlock, the §5.4 ladder,
 * the level curve — came first and is mutation-tested.
 *
 * The projections over it came second, once the artboards in `docs/design/pyquest/` existed to
 * say what a quest card and a Defend queue actually carry. They were deferred rather than
 * guessed at, on the argument that guessing means building them twice; the shapes they return
 * are declared in `@pyquest/contract`, which the API and the SPA also build against.
 *
 * The contract is a type-only dependency here. The engine computes and returns plain data; it
 * validates nothing, so zod never reaches this package's runtime path.
 *
 * Mutation-tested is not the same as covered. Thirty-three seeded mutants died here and a real
 * bug lived through all of them: `medalDelta` asked `xpFor` for `'quest'` unconditionally, so a
 * medal on a boss paid a tenth of §5.1's rate. No mutant could reveal it, because no test ever
 * priced a medal on a boss — mutation testing proves the suite notices a change in what the code
 * does, never a case the suite does not exercise. The fix was to make the kind a required
 * argument, so the compiler asks the question at every call site instead of the tests being
 * relied on to.
 */

export {
  FLAT_XP,
  IllegalModifierSetError,
  MODIFIER_DC_DELTA,
  QUESTS_PER_AREA,
  QUESTS_TO_UNLOCK_BOSS,
  XP_PER_DC,
  bossUnlocked,
  effectiveDC,
  medalDelta,
  medalXpEarned,
  modifierConflict,
  xpFor,
  type DifficultyModifier,
  type FlatXpKind,
  type ScaledXpKind,
  type XpKind,
} from './scoring.ts';

export {
  FIRST_RUNG,
  INVASION_LADDER,
  TOP_RUNG,
  intervalDays,
  nextRung,
} from './invasions.ts';

export { LEVEL_COEFFICIENT, levelAt, xpForLevel } from './level.ts';

export {
  areaProgress,
  availableQuests,
  bossState,
  dueInvasions,
  standings,
} from './queries.ts';
