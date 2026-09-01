import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Account } from '@pyquest/contract';
import { AsSignedIn } from '../test-support/session.tsx';
import { ConsoleScreen } from './ConsoleScreen';

/**
 * The Console's account panel — §6.8's second job.
 *
 * **The visibility test is the one that matters most**, and it is a screen test rather than an
 * api one on purpose. The api already refuses a player who is not the DM, and `auth.test.ts`
 * proves it per route. This proves the other half: that a player is never *offered* a control
 * whose only possible answer is 403. Offering it would be the screen lying about what it can do,
 * which is the rule the sign-off buttons already follow for a submission of your own.
 */

const { getSignoffs, getRoster, createPlayer, resetPassword, setRole } = vi.hoisted(() => ({
  getSignoffs: vi.fn(),
  getRoster: vi.fn(),
  createPlayer: vi.fn(),
  resetPassword: vi.fn(),
  setRole: vi.fn(),
}));

vi.mock('../gateway/index.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../gateway/index.ts')>()),
  getSignoffs,
  getRoster,
  createPlayer,
  resetPassword,
  setRole,
}));

const DM: Account = {
  id: '5eed0000-0000-4000-8000-000000000002',
  handle: 'dm',
  displayName: 'The DM',
  roles: ['dm', 'player'],
};

const LEARNER: Account = {
  id: '5eed0000-0000-4000-8000-000000000001',
  handle: 'peer',
  displayName: 'The Peer',
  roles: ['player'],
};

const consoleAs = async (account: Account) => {
  const result = render(
    <AsSignedIn account={account}>
      <MemoryRouter>
        <ConsoleScreen />
      </MemoryRouter>
    </AsSignedIn>,
  );
  await screen.findByRole('heading', { level: 1, name: 'Console' });
  return result;
};

beforeEach(() => {
  vi.clearAllMocks();
  getSignoffs.mockResolvedValue([]);
  getRoster.mockResolvedValue([DM, LEARNER]);
});

describe('who the panel is for', () => {
  it('shows the household to the DM', async () => {
    await consoleAs(DM);
    expect(await screen.findByRole('region', { name: 'Accounts' })).toBeInTheDocument();
    expect(screen.getByText('The Peer')).toBeInTheDocument();
  });

  /**
   * A player must not be offered a control that can only answer 403.
   *
   * The api refuses regardless — this is about not asking. It also must not *fetch* the roster:
   * a request that is guaranteed to 403 is a failed resource the screen would then have to
   * explain, on a screen where nothing is wrong.
   */
  it('shows nothing of it to a player, and does not even ask for the roster', async () => {
    await consoleAs(LEARNER);
    expect(screen.queryByRole('region', { name: 'Accounts' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add somebody/i })).not.toBeInTheDocument();
    expect(getRoster).not.toHaveBeenCalled();
  });
});

describe('the three acts', () => {
  it('adds a player, and never offers to make one a DM on the way in', async () => {
    createPlayer.mockResolvedValue({ ...LEARNER, handle: 'grace' });
    await consoleAs(DM);

    await userEvent.click(await screen.findByRole('button', { name: /add somebody/i }));
    await userEvent.type(screen.getByLabelText('Handle'), 'grace');
    await userEvent.type(screen.getByLabelText('Display name'), 'Grace');
    await userEvent.type(screen.getByLabelText('Password'), 'a good one');

    /* No control grants the seat here. It arrives by bootstrap or by promotion, deliberately. */
    expect(screen.queryByLabelText(/dm/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /add them/i }));
    await waitFor(() =>
      expect(createPlayer).toHaveBeenCalledWith({
        handle: 'grace',
        displayName: 'Grace',
        password: 'a good one',
      }),
    );
  });

  /** A taken handle is its own sentence — "failed" sends the DM looking for a fault. */
  it('says a handle is taken rather than reporting a failure', async () => {
    const { HandleTaken } = await import('../gateway/index.ts');
    createPlayer.mockRejectedValue(new HandleTaken('ada'));
    await consoleAs(DM);

    await userEvent.click(await screen.findByRole('button', { name: /add somebody/i }));
    await userEvent.type(screen.getByLabelText('Handle'), 'ada');
    await userEvent.type(screen.getByLabelText('Display name'), 'Ada');
    await userEvent.type(screen.getByLabelText('Password'), 'x');
    await userEvent.click(screen.getByRole('button', { name: /add them/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/already somebody's handle/i);
  });

  /**
   * The reset says it signs them out **before** the button, not after.
   *
   * Somebody is about to be logged out of a laptop in another room. Learning that afterwards is
   * how a password reset becomes a mystery on a Saturday morning.
   */
  it('warns that a reset signs that player out, before it is pressed', async () => {
    await consoleAs(DM);
    const rows = await screen.findAllByRole('button', { name: /reset password/i });
    await userEvent.click(rows[1] as HTMLElement);

    expect(screen.getByText(/signs them out wherever they are/i)).toBeInTheDocument();
  });

  it('resets a password and says who was signed out', async () => {
    resetPassword.mockResolvedValue(undefined);
    await consoleAs(DM);

    const rows = await screen.findAllByRole('button', { name: /reset password/i });
    await userEvent.click(rows[1] as HTMLElement);
    await userEvent.type(screen.getByLabelText(/a new password for peer/i), 'a new one');
    await userEvent.click(screen.getByRole('button', { name: /set it/i }));

    await waitFor(() => expect(resetPassword).toHaveBeenCalledWith(LEARNER.id, 'a new one'));
    expect(await screen.findByRole('status')).toHaveTextContent(/signed out/i);
  });

  it('promotes a player, and offers to remove the seat from somebody who holds it', async () => {
    setRole.mockResolvedValue(['dm', 'player']);
    await consoleAs(DM);

    expect(await screen.findByRole('button', { name: 'Remove DM' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Make DM' }));
    await waitFor(() => expect(setRole).toHaveBeenCalledWith(LEARNER.id, 'dm', true));
  });

  /**
   * The api refuses a DM removing their own seat and sends a sentence explaining what to do
   * instead. Rendering "forbidden" would throw away the only useful part of the answer.
   */
  it('renders the refusal sentence when the DM tries to demote themselves', async () => {
    setRole.mockRejectedValue(
      new Error('you cannot take the DM seat away from yourself — promote somebody else first'),
    );
    await consoleAs(DM);

    await userEvent.click(await screen.findByRole('button', { name: 'Remove DM' }));
    expect(await screen.findByRole('status')).toHaveTextContent(/promote somebody else first/i);
  });
});
