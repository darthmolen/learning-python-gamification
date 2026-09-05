import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AsSignedIn } from '../test-support/session.tsx';
import { QuestScreen } from '../screens/QuestScreen';
import type { WorkerLike } from './useRunner.ts';

/**
 * What he holds, after the verdict rather than before it.
 *
 * The screen read the medals once, when the page loaded, and never asked again — so a passing
 * Submit turned the verdict green and left Cleared sitting there unearned, on the one screen
 * whose job is to say what the work was worth. `awardMedal` runs server-side on the verdict, so
 * the answer is only knowable by asking.
 *
 * The mock is here rather than in `quest-screen.test.tsx` so it reaches one file. No fixture
 * quest is both `hidden-tests` and unearned — `a3-inventory-lists` already holds Cleared — so a
 * test built on the fixtures could not tell a refreshed screen from a stale one.
 */

const UNEARNED = {
  id: 'a3-inventory-lists',
  title: 'The Inventory',
  kind: 'quest' as const,
  area: 3,
  dc: 10,
  concepts: [{ id: 'list', label: 'list', definition: 'An ordered collection.' }],
  requires: [],
  status: 'available' as const,
  brief: '# The Inventory\n',
  medalsHeld: [],
  medalSlots: [{ medal: 'cleared' as const, effectiveDC: 10, xp: 20 }],
  verifier: { type: 'hidden-tests' as const },
  starter: 'x = 0\n',
};

/** The same quest after the runner passed it: Cleared held, and nothing left to offer. */
const EARNED = { ...UNEARNED, status: 'cleared' as const, medalsHeld: ['cleared' as const], medalSlots: [] };

const getQuest = vi.fn();

vi.mock('../gateway/index.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../gateway/index.ts')>()),
  getQuest: (...args: unknown[]) => getQuest(...args),
}));

const fakeWorker = (): WorkerLike => ({
  onmessage: null,
  onerror: null,
  postMessage: () => {},
  terminate: () => {},
});

beforeEach(() => {
  getQuest.mockReset();
  // First the page load, then the refresh the verdict triggers.
  getQuest.mockResolvedValueOnce(UNEARNED).mockResolvedValue(EARNED);
});

const renderQuest = async () => {
  const result = render(
    <AsSignedIn>
      <MemoryRouter initialEntries={['/area/3/quest/a3-inventory-lists']}>
        <Routes>
          <Route
            path="/area/:areaId/quest/:questId"
            element={<QuestScreen makeWorker={() => fakeWorker()} pollMs={0} />}
          />
        </Routes>
      </MemoryRouter>
    </AsSignedIn>,
  );
  await screen.findByRole('button', { name: 'Run' });
  return result;
};

describe('the medals, after a passing submit', () => {
  it('lights up Cleared without being reloaded', async () => {
    const { container } = await renderQuest();

    // It starts unearned, or the assertion at the end proves nothing.
    expect(screen.getByRole('img', { name: 'cleared: not earned' })).toBeInTheDocument();

    const content = container.querySelector('.cm-content') as HTMLElement;
    await userEvent.click(content);
    await userEvent.type(content, 'x = 1');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled());
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(screen.getByRole('status', { name: 'Submit' })).toHaveTextContent('Submit · passed');
    });

    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'cleared: earned' })).toBeInTheDocument();
    });
    expect(within(screen.getByRole('group', { name: 'Medals' })).getByText('earned')).toBeInTheDocument();
  });

  /**
   * The reason this is not a `useResource` refetch. That hook sets `loading` when it re-runs,
   * which takes `Awaiting` back to its placeholder and unmounts the editor — with his code in it.
   * §6.8 spends a paragraph on that cost for the Tome; paying it to refresh a medal would be the
   * same mistake wearing a better excuse.
   */
  it('leaves the editor and everything he typed in it alone', async () => {
    const { container } = await renderQuest();

    const content = container.querySelector('.cm-content') as HTMLElement;
    await userEvent.click(content);
    await userEvent.type(content, 'inventory');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled());

    const before = screen.getByRole('group', { name: 'Python editor' });
    const typed = before.textContent;

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'cleared: earned' })).toBeInTheDocument();
    });

    /*
     * The same node, still carrying the same text. Compared against what was there rather than
     * against a literal: CodeMirror owns a contenteditable and `userEvent.type` puts the
     * characters in in an order jsdom does not reproduce faithfully. What matters is that the
     * refresh changed none of it, and identity is the sharper way to say so — a remount would
     * hand back a different element holding the starter.
     */
    const after = screen.getByRole('group', { name: 'Python editor' });
    expect(after).toBe(before);
    expect(after.textContent).toBe(typed);
    expect(after.textContent).not.toBe(UNEARNED.starter);
  });

  /** A quest he has not passed must not ask again — the medals cannot have changed. */
  it('does not re-read the quest when nothing was submitted', async () => {
    await renderQuest();
    expect(getQuest).toHaveBeenCalledTimes(1);
  });
});
