import { DEFAULT_MEDALS, type Medal } from '@pyquest/content/browser';

/**
 * The presentation decisions the engine deliberately does not make.
 *
 * "The engine returns numbers; presentation decisions live in the UI" (CLAUDE.md, §5.1). Each
 * rule here turns a number into a claim on screen, and each one reads as decoration to anyone
 * who does not know the argument behind it — so the arguments live here, next to the code, and
 * `present.test.ts` holds the mutants that keep them honest.
 */

/**
 * §5.1's risk label. A DC of 20 or more gets the warning triangle.
 *
 * The boundary is the entire rule: at 19 the quest is hard, at 20 it is a fight worth warning
 * an 11-14-year-old about before he spends an evening on it. The engine returns the DC and says
 * nothing about how it feels, which is why this lives here.
 */
export const RISKY_DC = 20;

export const isRisky = (dc: number): boolean => dc >= RISKY_DC;

/**
 * §5.1a. `authoring: partial` means the total is an estimate, and the Area artboard's own note
 * is blunt about it: "The tilde is not decoration. This area is still being authored, so the
 * denominator is a guess." An estimate rendered as a fact is dishonest, and this is a
 * curriculum a child is measuring himself against.
 */
export const formatTotal = (total: number, estimated: boolean): string =>
  estimated ? `~${total}` : String(total);

export interface MedalSlot {
  medal: Medal;
  held: boolean;
}

/**
 * §5.10: "Unearned slots render greyed on the quest card, borrowing the visible-but-locked
 * treatment."
 *
 * Every slot the quest offers is returned, held or not, in the canonical order rather than the
 * order the medals happened to arrive in. Visible-but-unearned is the point: a slot he cannot
 * see is depth he does not know exists, which is the same argument the Map makes for showing
 * locked areas drained of colour — anticipation, not frustration.
 *
 * `QuestCard.medals` is what he holds, not what the quest offers, so the slot list comes from
 * the content package's `DEFAULT_MEDALS`. A quest with its own medal list is content the
 * contract does not carry yet; when it does, this takes the list as a parameter.
 */
export const medalSlots = (held: readonly string[]): MedalSlot[] =>
  DEFAULT_MEDALS.map((medal) => ({ medal, held: held.includes(medal) }));

/**
 * §5.10: a medal that pays no XP "reads as a brag, not as a zero."
 *
 * Rendering `0 xp` beside something he went back and earned on purpose tells him it counted for
 * nothing. The medal is elective depth; the whole reason it pays nothing is that it was not
 * required, and the word has to carry that.
 */
export const formatPayout = (xp: number): string => (xp === 0 ? 'brag' : `${xp} xp`);
