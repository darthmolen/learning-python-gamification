/**
 * `packages/engine` — spec §6.7.
 *
 * Pure functions over state and content. This wave exports only the arithmetic the spec pins
 * to the number: §5.1's effective DC and XP, §5.10's medal payment, §5.12's legality rule, and
 * §5.2's boss unlock. `availableQuests`, `tierProgress`, `duePatrols`, `standings` and `level`
 * are deliberately absent — each is a projection whose shape a screen has to settle first, and
 * guessing at them now means building them twice.
 */

export {
  FLAT_XP,
  IllegalModifierSetError,
  MODIFIER_DC_DELTA,
  QUESTS_PER_TIER,
  QUESTS_TO_UNLOCK_BOSS,
  XP_PER_DC,
  bossUnlocked,
  effectiveDC,
  medalDelta,
  modifierConflict,
  questXpEarned,
  xpFor,
  type DifficultyModifier,
  type FlatXpKind,
  type ScaledXpKind,
  type XpKind,
} from './scoring.ts';
