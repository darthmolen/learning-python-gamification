import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PendingSignoff } from '@pyquest/contract';
import { ConsoleScreen } from './ConsoleScreen';
import { rgb } from '../test-support/rgb';
import { PLAYER_ID } from '../household.ts';

/**
 * The Console's sign-off queue - §6.3, §5.11, artboard `docs/design/pyquest/Console.dc.html`.
 *
 * The gateway is mocked here rather than left on its fixtures, because the two things worth
 * asserting are things a fixture cannot vary: an empty queue, and what the screen *sends* when a
 * sign-off is granted. That the fixtures themselves parse is `gateway.test.ts`'s job, and the
 * screen not reaching past the gateway is `boundary.test.ts`'s.
 */
const { getSignoffs, postSignoff } = vi.hoisted(() => ({
  getSignoffs: vi.fn(),
  postSignoff: vi.fn(),
}));

vi.mock('../gateway/index.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../gateway/index.ts')>()),
  getSignoffs,
  postSignoff,
}));

const daysAgo = (days: number): string => new Date(Date.now() - days * 86_400_000).toISOString();

/** Submitted by the DM seat, so `peer` - the signed-in player - is the one being asked. */
const fromDm: PendingSignoff = {
  attemptId: 'att-8f21c0',
  playerId: 'dm',
  questId: 'a3-the-enchanter',
  questTitle: 'The Enchanter',
  by: 'peer', // the seat awaiting signature, per PendingSignoffSchema
  submittedAt: daysAgo(2),
};

/** The signed-in player's *own* submission. §6.3 forbids signing it, and the queue still shows it. */
const own: PendingSignoff = {
  attemptId: 'att-4c07ab',
  playerId: PLAYER_ID,
  questId: 'a3-the-smelter',
  questTitle: 'The Smelter',
  by: 'dm',
  submittedAt: daysAgo(8),
};

const queue = async (pending: PendingSignoff[]) => {
  getSignoffs.mockResolvedValue(pending);
  const result = render(
    <MemoryRouter>
      <ConsoleScreen />
    </MemoryRouter>,
  );
  await screen.findByRole('heading', { level: 1, name: 'Console' });
  return result;
};

const rowFor = (title: string) => screen.getByRole('listitem', { name: new RegExp(title) });

beforeEach(() => {
  getSignoffs.mockReset();
  postSignoff.mockReset();
});

describe('the sign-off queue', () => {
  it('lists one row per pending sign-off, named by the quest', async () => {
    await queue([fromDm, own]);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(rowFor('The Enchanter')).toBeInTheDocument();
  });

  /**
   * `by` is the seat the quest names, and it is the only thing in the payload that says who is
   * being asked. A queue that does not say it is a list of things to press.
   */
  it('says which seat each sign-off is waiting on', async () => {
    await queue([fromDm, own]);
    expect(within(rowFor('The Enchanter')).getByText('PEER SIGN-OFF')).toBeInTheDocument();
    expect(within(rowFor('The Smelter')).getByText('DM SIGN-OFF')).toBeInTheDocument();
  });

  /** The artboard's `s.when`. Eight days unsigned is the fact the queue exists to surface. */
  it('says how long each has been waiting', async () => {
    await queue([fromDm, own]);
    expect(within(rowFor('The Enchanter')).getByText(/asked 2 days ago/)).toBeInTheDocument();
    expect(within(rowFor('The Smelter')).getByText(/asked 8 days ago/)).toBeInTheDocument();
  });

  /**
   * The artboard's accent per row, lifted rather than rounded: `#5aa860` on the green side and
   * `#d9a441` on the gold. A framework default here is the mutant this catches.
   */
  it('carries the artboard accent on the stripe, one colour per seat', async () => {
    await queue([fromDm, own]);
    expect(rowFor('The Enchanter').style.borderLeftColor).toBe(rgb('#5aa860'));
    expect(rowFor('The Smelter').style.borderLeftColor).toBe(rgb('#d9a441'));
  });

  it('counts what is waiting, in the header', async () => {
    await queue([fromDm, own]);
    expect(screen.getByText('2 waiting on you')).toBeInTheDocument();
  });

  it('says nothing is waiting rather than showing an empty list', async () => {
    await queue([]);
    expect(screen.queryAllByRole('listitem')).toEqual([]);
    expect(screen.getByText(/Nothing is waiting on a sign-off/i)).toBeInTheDocument();
  });
});

describe('a sign-off is a check, not a formality', () => {
  /**
   * §6.3: "a player cannot sign off their own submission". The queue is household-wide on
   * purpose (`PendingSignoffsSchema`), so the row is shown and the button is not - pressing it
   * could only ever earn a 403.
   */
  it('offers no sign-off on the own submission of the caller, and says why', async () => {
    await queue([fromDm, own]);
    const mine = rowFor('The Smelter');

    expect(within(mine).queryByRole('button')).toBeNull();
    expect(within(mine).getByText(/your own submission/i)).toBeInTheDocument();
  });

  it('grants a sign-off as the signed-in player, not as a role', async () => {
    postSignoff.mockResolvedValue({
      granted: true,
      award: { attemptId: 'att-8f21c0', questId: 'a3-the-enchanter', medal: 'cleared', xpAwarded: 36 },
    });
    await queue([fromDm]);

    await userEvent.click(within(rowFor('The Enchanter')).getByRole('button', { name: 'Sign it off' }));

    // `by` is a player id. A client-supplied role is an assertion anyone on the LAN can make.
    expect(postSignoff).toHaveBeenCalledWith('att-8f21c0', { by: PLAYER_ID, granted: true });
  });

  it('reports what the sign-off paid, and to whom', async () => {
    postSignoff.mockResolvedValue({
      granted: true,
      award: { attemptId: 'att-8f21c0', questId: 'a3-the-enchanter', medal: 'cleared', xpAwarded: 36 },
    });
    await queue([fromDm]);

    await userEvent.click(screen.getByRole('button', { name: 'Sign it off' }));

    expect(await screen.findByText('cleared · 36 xp to dm')).toBeInTheDocument();
  });

  /** §5.10: a medal that pays nothing reads as a brag, never as a zero. */
  it('renders a zero payout as a brag', async () => {
    postSignoff.mockResolvedValue({
      granted: true,
      award: { attemptId: 'att-8f21c0', questId: 'a3-the-enchanter', medal: 'cleared', xpAwarded: 0 },
    });
    await queue([fromDm]);

    await userEvent.click(screen.getByRole('button', { name: 'Sign it off' }));

    expect(await screen.findByText('cleared · brag to dm')).toBeInTheDocument();
  });
});

describe('not yet, said in place', () => {
  it('expands the reason in place and covers nothing', async () => {
    await queue([fromDm]);
    await userEvent.click(screen.getByRole('button', { name: 'Not yet — say why' }));

    expect(screen.getByRole('textbox', { name: /why not yet/i })).toBeInTheDocument();
    // "No pop-overs." The Tome's rule is the app's rule; a dialog here would be the mutant.
    expect(screen.queryByRole('dialog')).toBeNull();
    // Nothing is lost: the row it belongs to is still on screen, in full.
    expect(within(rowFor('The Enchanter')).getByRole('button', { name: 'Sign it off' })).toBeInTheDocument();
  });

  /** "Labels never change with state." The trigger reads the same open as it does closed. */
  it('leaves every button label unchanged by opening it', async () => {
    await queue([fromDm, own]);
    const before = screen.getAllByRole('button').map((b) => b.textContent);

    await userEvent.click(screen.getByRole('button', { name: 'Not yet — say why' }));

    const after = screen.getAllByRole('button').map((b) => b.textContent);
    expect(after.slice(0, before.length)).toEqual(before);
  });

  it('sends the note with the refusal', async () => {
    postSignoff.mockResolvedValue({ granted: false, reason: 'go one level deeper' });
    await queue([fromDm]);

    await userEvent.click(screen.getByRole('button', { name: 'Not yet — say why' }));
    await userEvent.type(screen.getByRole('textbox', { name: /why not yet/i }), 'go one level deeper');
    await userEvent.click(screen.getByRole('button', { name: 'Send it back' }));

    expect(postSignoff).toHaveBeenCalledWith('att-8f21c0', {
      by: PLAYER_ID,
      granted: false,
      note: 'go one level deeper',
    });
  });

  /**
   * The API records the refusal and then answers `signoff-denied`, so "it failed" and "he was
   * told no" arrive down the same pipe. The screen must not render a refusal it made on purpose
   * as an error.
   */
  it('shows a refusal as a refusal, not as a failure', async () => {
    postSignoff.mockResolvedValue({ granted: false, reason: 'go one level deeper' });
    await queue([fromDm]);

    await userEvent.click(screen.getByRole('button', { name: 'Not yet — say why' }));
    await userEvent.type(screen.getByRole('textbox', { name: /why not yet/i }), 'go one level deeper');
    await userEvent.click(screen.getByRole('button', { name: 'Send it back' }));

    expect(await screen.findByText(/sent back · go one level deeper/i)).toBeInTheDocument();
    expect(screen.queryByText(/could not/i)).toBeNull();
  });

  it('reports a request that actually failed, rather than swallowing it', async () => {
    postSignoff.mockRejectedValue(new Error('/api/signoffs/att-8f21c0 answered 500'));
    await queue([fromDm]);

    await userEvent.click(screen.getByRole('button', { name: 'Sign it off' }));

    expect(await screen.findByText(/answered 500/)).toBeInTheDocument();
  });
});
