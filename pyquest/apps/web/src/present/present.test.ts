import { DEFAULT_MEDALS } from '@pyquest/content/browser';
import { describe, expect, it } from 'vitest';
import { byDifficulty, formatPayout, formatTotal, isRisky, medalSlots, sinceSubmitted } from './index.ts';

/**
 * The decisions §5.1 says the engine deliberately does not make.
 *
 * "The engine returns numbers; presentation decisions live in the UI" (CLAUDE.md). Each of
 * these is a rule about what a number *means* on screen, and each of them is a rule a
 * reasonable person would delete as decoration. They are tested here, apart from any screen,
 * so the reason survives in one place rather than four components.
 */
describe('the DC ≥ 20 warning', () => {
  it('marks 20 and above as risky', () => {
    expect(isRisky(20)).toBe(true);
    expect(isRisky(24)).toBe(true);
    expect(isRisky(30)).toBe(true);
  });

  it('leaves everything below 20 unmarked', () => {
    expect(isRisky(19)).toBe(false);
    expect(isRisky(12)).toBe(false);
    expect(isRisky(5)).toBe(false);
  });

  /** The boundary is the whole rule. Off by one and the warning is on the wrong quests. */
  it('puts the boundary at exactly 20', () => {
    expect(isRisky(19)).toBe(false);
    expect(isRisky(20)).toBe(true);
  });
});

/**
 * §5.1a. `authoring: partial` means the denominator is an estimate, and an estimate presented
 * as fact is dishonest — the Map artboard's own note says "the tilde is not decoration".
 */
describe('the tilde on an estimated total', () => {
  it('marks an estimate', () => {
    expect(formatTotal(5, true)).toBe('~5');
  });

  it('leaves a settled total bare', () => {
    expect(formatTotal(5, false)).toBe('5');
  });
});

/**
 * §5.10: "Unearned slots render greyed on the quest card, borrowing the visible-but-locked
 * treatment." Visible is the point — a slot he cannot see is depth he does not know exists,
 * and the Map makes the same argument for locked areas: "anticipation, not frustration."
 */
describe('medal slots', () => {
  it('shows every slot the quest offers, not only the ones earned', () => {
    const slots = medalSlots(['cleared']);
    expect(slots).toHaveLength(DEFAULT_MEDALS.length);
  });

  it('marks which are held and which are still open', () => {
    const slots = medalSlots(['cleared', 'idiomatic']);
    const held = slots.filter((s) => s.held).map((s) => s.medal);
    const open = slots.filter((s) => !s.held).map((s) => s.medal);

    expect(held).toEqual(['cleared', 'idiomatic']);
    expect(open).toContain('ironman');
    expect(open).toContain('teach-back');
  });

  it('keeps the slots in their canonical order however the medals arrive', () => {
    const slots = medalSlots(['teach-back', 'cleared']);
    expect(slots.map((s) => s.medal)).toEqual([...DEFAULT_MEDALS]);
  });

  it('shows every slot open on a quest with nothing earned', () => {
    const slots = medalSlots([]);
    expect(slots.every((s) => !s.held)).toBe(true);
    expect(slots).toHaveLength(DEFAULT_MEDALS.length);
  });
});

/**
 * §5.10 says a medal paying no XP "reads as a brag, not as a zero", and the diagnosis is right
 * while the word is not: a bare `0 xp` beside something he went back to earn does say it was
 * worth nothing. But **"brag" claims praise, and a zero is never praise** — it is the arithmetic
 * saying the price was already paid by a medal he holds.
 *
 * The word survived in no call site. `journalPayout` refuses it because §5.6's zero means an
 * empty entry; `DefendScreen` refuses it because a concept let through is not a boast; and this
 * one was found on a real screen, where clearing a quest that already held Idiomatic offered
 * "cleared · brag" — congratulating him for the medal that is not even elective.
 *
 * "no extra xp" keeps §5.10's point, which is that the base was paid rather than that the work
 * counted for nothing, and claims nothing on his behalf.
 */
describe('a zero payout', () => {
  it('says the base was already paid rather than claiming a boast', () => {
    expect(formatPayout(0)).toBe('no extra xp');
  });

  it('leaves a real payout as a number', () => {
    expect(formatPayout(40)).toBe('40 xp');
  });
});


/**
 * The artboard's `s.when` — "asked 2 days ago", "passed 8 days ago · unsigned". The contract
 * carries an instant; how long ago that reads as is a presentation decision, and the interesting
 * part is the rounding. A sign-off made this morning has not been waiting "0 days" — it is
 * waiting today, and a queue that says "0 days ago" reads like a bug in the clock.
 */
describe('how long a sign-off has been waiting', () => {
  const at = (iso: string) => Date.parse(iso);

  it('reads as today until a whole day has passed', () => {
    expect(sinceSubmitted('2026-08-30T08:00:00.000Z', at('2026-08-30T22:00:00.000Z'))).toBe('today');
  });

  it('says one day in the singular', () => {
    expect(sinceSubmitted('2026-08-29T08:00:00.000Z', at('2026-08-30T22:00:00.000Z'))).toBe('1 day ago');
  });

  it('counts whole days after that', () => {
    expect(sinceSubmitted('2026-08-22T08:00:00.000Z', at('2026-08-30T22:00:00.000Z'))).toBe('8 days ago');
  });

  /**
   * The two machines keep their own clocks and neither is authoritative, so a submission can
   * arrive stamped a few minutes in the future. "-1 days ago" would be the visible symptom.
   */
  it('does not run backwards when the clocks disagree', () => {
    expect(sinceSubmitted('2026-08-31T08:00:00.000Z', at('2026-08-30T22:00:00.000Z'))).toBe('today');
  });
});

/**
 * The order the Area screen lists quests in, and why it is a decision at all.
 *
 * It was the order content happened to load in — which is the order the YAML files sit in on
 * disk, which is their filenames. `queries.ts` calls that "authored order", but nothing in
 * content can express an order, so nobody authored it. Area 0 came out alphabetical by accident
 * and read as though it meant something.
 *
 * The engine is right to refuse this sort: §5.2 hands the choice to the player and a ranking
 * baked into the data would be the engine taking it back. But an arbitrary order is not
 * neutrality, it is noise wearing neutrality's clothes — so the order is chosen here, where
 * CLAUDE.md puts every other presentation decision.
 */
describe('the order quests are listed in', () => {
  const q = (title: string, dc: number) => ({ title, dc });

  it('puts the cheapest first, because that is the only honest reading of a free choice', () => {
    const listed = byDifficulty([q('The Trading Hall', 20), q('The Recipe Book', 12), q('The Smelter', 14)]);
    expect(listed.map((quest) => quest.title)).toEqual(['The Recipe Book', 'The Smelter', 'The Trading Hall']);
  });

  /** Six of Area 0's ten quests share a DC. Ties have to land somewhere stable, or the list
   * reshuffles between renders for no reason a reader could name. */
  it('breaks a tie by title rather than by whatever order it was handed', () => {
    const listed = byDifficulty([q('Out Of Line', 8), q('Never Closed', 8), q('The Perimeter', 8)]);
    expect(listed.map((quest) => quest.title)).toEqual(['Never Closed', 'Out Of Line', 'The Perimeter']);
  });

  /** A screen that sorted in place would reorder the caller's array as a side effect. */
  it('leaves what it was given alone', () => {
    const given = [q('The Trading Hall', 20), q('The Recipe Book', 12)];
    byDifficulty(given);
    expect(given.map((quest) => quest.title)).toEqual(['The Trading Hall', 'The Recipe Book']);
  });
});
