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
 * an 11–14-year-old about before he spends an evening on it. The engine returns the DC and says
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

/**
 * The order the Area screen lists quests in: cheapest first, ties by title.
 *
 * **The list used to be in no order at all.** `availableQuests` returns them "in authored
 * order", but content has no way to express an order, so what arrives is the order the manifests
 * load in — their filenames. Area 0's ten came out alphabetical by accident, which reads as
 * though somebody chose it.
 *
 * The engine is right to refuse to sort. Its own comment says a ranking there "would be the
 * engine nudging a choice the spec hands to him", and §5.2 does hand it to him: any three unlock
 * the boss and he picks which. But an accidental order is not neutrality — it is noise that
 * looks like a decision, and the screen already says out loud that the choice is his.
 *
 * So this is a presentation decision and it lives where CLAUDE.md puts them. DC is the one axis
 * the player can already see on every row, which makes the order self-evident rather than
 * something he has to be told: the list explains itself.
 *
 * Ties by title because six of Area 0's ten share a DC, and a tie broken by input order
 * reshuffles whenever content loading does.
 */
export const byDifficulty = <T extends { dc: number; title: string }>(quests: readonly T[]): T[] =>
  [...quests].sort((a, b) => a.dc - b.dc || a.title.localeCompare(b.title));

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
 * A payout of nothing, said without claiming anything.
 *
 * §5.10 asks for a medal paying no XP to "read as a brag, not as a zero", and the diagnosis is
 * right: a bare `0 xp` beside something he went back to earn tells him it counted for nothing.
 * **The word was wrong, though, and it took a real screen to see it.** Clearing a quest that
 * already held Idiomatic offered "cleared · brag" — praise, for the one medal that is not even
 * elective, in the one case where the zero means the arithmetic already paid.
 *
 * A zero is never praise. It happens when the medal does not raise the effective DC past what a
 * medal he already holds had raised it to, so the base was bought and there is no difference
 * left to pay. "no extra xp" says exactly that and claims nothing on his behalf.
 *
 * **The word survived in no call site**, which is the real evidence. `journalPayout` below
 * refuses it because §5.6's zero means an empty entry, and `DefendScreen` refuses it because a
 * concept let through is not a boast. This was the third.
 *
 * §5.10's sentence now disagrees with the screen. The spec is the document of record and this is
 * a presentation decision, so the divergence is recorded rather than quietly kept.
 */
export const formatPayout = (xp: number): string => (xp === 0 ? 'no extra xp' : `${xp} xp`);

/**
 * §5.6's ten XP an entry — and **zero is not a brag here.**
 *
 * This exists because `formatPayout` was the obvious thing to reuse and would have been wrong in
 * a way that matters. §5.10's zero means a medal that was elective: he went back and earned depth
 * nothing required, so the word is a boast. §5.6's zero means the opposite — ten XP is paid *for
 * substance*, "empty prompts pay nothing", so an entry that paid nothing is one he left blank.
 *
 * Rendering that as `brag` congratulates a child for not writing, on the one screen §5.6 says
 * must never tell somebody who did write that they wrote nothing. Same number, opposite claim,
 * so it is a different function rather than a shared one with a flag.
 */
export const journalPayout = (xp: number): string =>
  xp === 0 ? 'paid nothing — empty prompts pay nothing' : `${xp} xp`;


/**
 * §6.3's queue says how long each sign-off has been waiting, and the artboard writes it as
 * "asked 2 days ago". The contract carries an instant; the phrase is a presentation decision,
 * and the decision worth naming is the rounding.
 *
 * A submission made this morning has not been waiting "0 days" — it is waiting today, and a
 * queue that says "0 days ago" reads as a broken clock rather than as a fresh request. The
 * future is folded into today for the same reason: the parent's machine and the son's keep
 * their own time, neither is authoritative, and "-1 days ago" is what a few minutes of drift
 * would otherwise put on screen.
 */
const DAY_MS = 86_400_000;

export const sinceSubmitted = (submittedAt: string, now: number = Date.now()): string => {
  const days = Math.floor((now - Date.parse(submittedAt)) / DAY_MS);
  if (days <= 0) return 'today';
  return days === 1 ? '1 day ago' : `${days} days ago`;
};
